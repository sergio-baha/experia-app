// Genera, desde scripts/data/grupos_jm.mjs:
//   scripts/out/docentes_jm.xlsx   → para Admin → Usuarios → carga masiva
//   scripts/grupos_jm.sql          → grupos + alumnos + plan (gráfica de ejes)
//
//   node scripts/build-grupos-jm.mjs
//
// La gráfica de cada grupo = promedio del % por eje de los estudiantes que
// presentaron (los ausentes no cuentan). Se redondea a un decimal.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'
import { EJES, DOCENTES, GRUPOS, COLEGIO, LIBRO_DEFAULT } from './data/grupos_jm.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const STORAGE_PUBLIC = LIBRO_DEFAULT.url.replace(/lesson-files\/.*$/, '')
const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`)
// Contraseña temporal de las cuentas nuevas: se pasa por entorno, nunca en el repo.
//   PowerShell: $env:PASS_TEMPORAL='...'; node scripts/build-grupos-jm.mjs
const PASS_TEMPORAL = process.env.PASS_TEMPORAL
if (!PASS_TEMPORAL) throw new Error('Falta la variable de entorno PASS_TEMPORAL')

// ── Validaciones ────────────────────────────────────────────────────────────
for (const g of GRUPOS) {
  if (!DOCENTES.some(d => d.key === (g.docente || g.key))) throw new Error(`${g.key}: sin docente`)
  const docs = new Set(g.alumnos.map(a => a[0]))
  if (docs.size !== g.alumnos.length) throw new Error(`${g.key}: documentos repetidos`)
  g.ejes.forEach((r, i) => { if (r.length !== EJES.length) throw new Error(`${g.key} fila ${i}: ${r.length} ejes`) })
  if (g.ejes.length > g.alumnos.length) throw new Error(`${g.key}: más resultados que alumnos`)
}

const promedios = (filas) => EJES.map((_, j) =>
  Math.round(filas.reduce((s, r) => s + r[j], 0) / filas.length * 10) / 10)

// ── Excel de docentes ──────────────────────────────────────────────────────
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
const ws = XLSX.utils.aoa_to_sheet([
  ['Nombre', 'Email', 'Contraseña', 'Rol', 'Área', 'Institución'],
  ...DOCENTES.map(d => [d.nombre, d.email, PASS_TEMPORAL, 'student', 'ciencias', '']),  // la carga masiva exige área
])
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Docentes')
XLSX.writeFile(wb, path.join(here, 'out', 'docentes_jm.xlsx'))

// ── SQL ────────────────────────────────────────────────────────────────────
const out = []
out.push(`-- ============================================================
-- GENERADO por scripts/build-grupos-jm.mjs — no editar a mano.
-- Grupos del Colegio Molinos y Marrueco JM (piloto clon, producto sustituto).
--
-- Crea también las cuentas de los docentes si no existen. No hace falta
-- la carga masiva de Excel.
-- Requiere 0068_clone_plan_book_url.sql ya corrida.
--
-- Qué hace (idempotente: se puede volver a correr tras cambiar los datos):
--   0. Crea el colegio nuevo (si no existe) y le habilita los cursos del modelo.
--   1. Toma como MODELO al docente del grupo "ONCE": los docentes nuevos
--      quedan con acceso a sus mismos cursos. Colegio y modo clon se asignan
--      después en Admin → Usuarios (la base solo deja cambiarlos a un admin).
--   2. Crea/actualiza un grupo por docente y REEMPLAZA su listado de alumnos.
--   3. Plan de cada grupo: copia unidades, libro e indicaciones del plan de
--      ONCE (solo si el grupo aún no tiene plan propio) y SIEMPRE pone la
--      gráfica de ejes con los resultados de ese grupo.
-- Todo en una transacción: si algo falla, no queda nada a medias.
-- ============================================================
begin;

do $$ begin
  if not exists (select 1 from _modelo) then
    raise exception 'No se encontró el grupo modelo "ONCE".';
  end if;
end $$;
`)

// 0. Cuentas (auth). Mismo resultado que la carga masiva de AdminUsers: el
// trigger handle_new_user crea el perfil. Idempotente: si el correo ya existe,
// no se toca. Los tokens van como '' (no NULL): GoTrue falla al iniciar sesión
// si están en NULL.
out.push(`-- ── 0. Cuentas de los docentes (se omiten las que ya existen) ──`)
out.push(`do $$
declare r record; v_id uuid;
begin
  for r in select * from (values
${DOCENTES.map(d => `    (${q(d.email.toLowerCase())}, ${q(d.nombre)})`).join(',\n')}
  ) as t(email, nombre) loop
    if exists (select 1 from auth.users where lower(email) = r.email) then continue; end if;
    v_id := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                            confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', r.email,
            extensions.crypt(${q(PASS_TEMPORAL)}, extensions.gen_salt('bf')), now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('name', r.nombre, 'role', 'student', 'area', 'ciencias'),
            now(), now(), '', '', '', '');
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub', v_id::text, 'email', r.email, 'email_verified', true),
            'email', now(), now(), now());
  end loop;
end $$;
`)

// C. Colegio nuevo + los mismos cursos habilitados que tiene el docente modelo.
const COLEGIO_ID = `(select id from public.institutions where name = ${q(COLEGIO)})`
out.push(`-- ── C. Colegio nuevo (${COLEGIO}) y sus cursos habilitados ──
insert into public.institutions (name)
select ${q(COLEGIO)}
 where not exists (select 1 from public.institutions where name = ${q(COLEGIO)});

insert into public.institution_courses (institution_id, course_id, is_active)
select ${COLEGIO_ID}, uc.course_id, true
  from public.user_courses uc
 where uc.user_id = (select teacher_id from _modelo) and uc.is_active
   and not exists (select 1 from public.institution_courses ic
                    where ic.institution_id = ${COLEGIO_ID} and ic.course_id = uc.course_id);
`)

// 1. Docentes
out.push(`-- ── 1. Docentes: modo clon + institución + acceso igual al modelo ──`)
const emails = DOCENTES.map(d => q(d.email)).join(', ')
out.push(`do $$
declare v_faltan text;
begin
  select string_agg(e, ', ') into v_faltan
    from unnest(array[${emails}]) e
   where not exists (select 1 from public.profiles p where lower(p.email) = lower(e));
  if v_faltan is not null then
    raise exception 'No se pudieron crear las cuentas: %', v_faltan;
  end if;
end $$;

-- ⚠️ El MODO CLON no se activa aquí: ui_variant e institution_id de un perfil
-- existente solo los cambia un admin con sesión (guard de 0029/0051). Se activa
-- en Admin → Usuarios → menú de cada docente → "Activar modo clon".

insert into public.user_courses (user_id, course_id, is_active)
select p.id, uc.course_id, true
  from public.profiles p
  cross join public.user_courses uc
 where lower(p.email) in (${DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')})
   and uc.user_id = (select teacher_id from _modelo) and uc.is_active
on conflict (user_id, course_id) do update set is_active = true;

insert into public.course_enrollments (student_id, course_id, institution_id)
select p.id, ce.course_id, ce.institution_id
  from public.profiles p
  cross join public.course_enrollments ce
 where lower(p.email) in (${DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')})
   and ce.student_id = (select teacher_id from _modelo)
on conflict (student_id, course_id) do nothing;

-- Progreso vacío (nunca pisa uno existente).
insert into public.course_progress (user_id, course_id, xp, completed, badges)
select p.id, ce.course_id, 0, '{}', '{}'
  from public.profiles p
  cross join public.course_enrollments ce
 where lower(p.email) in (${DOCENTES.map(d => q(d.email.toLowerCase())).join(', ')})
   and ce.student_id = (select teacher_id from _modelo)
on conflict (user_id, course_id) do nothing;
`)

// 2 y 3. Grupos
for (const g of GRUPOS) {
  const d = DOCENTES.find(x => x.key === (g.docente || g.key))
  // Si el grupo trae su informe oficial (`grafica`), manda ese: su cálculo es
  // por respuestas ponderadas, no el promedio simple de estudiantes.
  const vals = g.grafica || promedios(g.ejes)
  // Libro: el de la unidad #1 del grupo. El de la 3 es LIBRO_DEFAULT; los otros
  // se buscan en Storage por nombre (se suben una vez desde la plataforma).
  const top = Number(g.unidades?.[0]?.title.match(/Unidad (\d)/)?.[1])
  const libroUnidad = top && top !== 3 ? top : null
  const bars = EJES.map((label, i) => `jsonb_build_object('label', ${q(label)}, 'value', ${vals[i]}, 'color', ${i + 1})`)
  // Unidades priorizadas del informe del grupo (si las hay) → reemplazan las del plan.
  const unitsSql = g.unidades && `jsonb_build_array(\n${g.unidades.map(u =>
    `      jsonb_build_object('title', ${q(u.title)}, 'ejes', '[]'::jsonb, 'notes', ${q(u.notes)}, 'coverage', null, 'priority', ${u.priority}, 'level', null)`
  ).join(',\n')})`
  out.push(`-- ── ${g.nombre} (${g.alumnos.length} alumnos, ${g.ejes.length} presentaron) ──
-- Gráfica (${g.grafica ? 'informe oficial' : 'PROVISIONAL: promedio simple'}): ${vals.join(' · ')}
-- Unidades: ${g.unidades ? g.unidades.map(u => u.title.split(':')[0]).join(' → ') : 'copiadas de ONCE (provisional)'}
do $$
declare v_teacher uuid; v_group uuid;${libroUnidad ? `
  -- Libro de su unidad #1 (${libroUnidad}): el PDF subido a Storage con ese nombre.
  v_libro text := (select ${q(STORAGE_PUBLIC)} || o.name from storage.objects o
                    where o.bucket_id = 'attachments'
                      and o.name ilike ${q(`%Plata%2024%QU_MICA_UNIDAD_${libroUnidad}.pdf`)}
                    order by o.created_at desc limit 1);` : ''}
begin
  select id into v_teacher from public.profiles where lower(email) = ${q(d.email.toLowerCase())};

  -- Se busca por nombre + docente (no por colegio): así, al mover los grupos
  -- al colegio nuevo, el grupo creado antes se reutiliza en vez de duplicarse.
  select id into v_group from public.clone_groups
   where name = ${q(g.nombre)} and teacher_id = v_teacher;
  if v_group is null then
    insert into public.clone_groups (name, grade, teacher_id, institution_id, course_id, is_active)
    values (${q(g.nombre)}, ${q(g.grado)}, v_teacher,
            ${COLEGIO_ID}, (select course_id from _modelo), true)
    returning id into v_group;
  else
    update public.clone_groups set grade = ${q(g.grado)}, is_active = true,
           institution_id = ${COLEGIO_ID}
     where id = v_group;
  end if;

${g.alumnos.length ? `  delete from public.clone_group_students where group_id = v_group;
  insert into public.clone_group_students (group_id, full_name, document, sort_order) values
${g.alumnos.map((a, i) => `    (v_group, ${q(a[1])}, ${q(a[0])}, ${i})`).join(',\n')};
` : `  -- Sin listado todavía: no se tocan los alumnos que tenga el grupo.
`}
  -- Plan: si el grupo no tiene, parte del de ONCE (unidades, libro, indicaciones).
  insert into public.clone_unit_plans (group_id, book_title, book_url, intro, units, chart)
  select v_group, m.book_title, m.book_url, m.intro, m.units, '{}'::jsonb
    from public.clone_unit_plans m where m.group_id = (select group_id from _modelo)
  on conflict (group_id) do nothing;
  insert into public.clone_unit_plans (group_id) values (v_group)
  on conflict (group_id) do nothing;

  update public.clone_unit_plans set chart = jsonb_build_object(
    'title', 'Desempeño por eje articulador — ${g.nombre.replace(/'/g, "''")}',
    'bars', jsonb_build_array(
      ${bars.join(',\n      ')}))${unitsSql ? `,
       units = ${unitsSql}` : ''},
       -- Libro del grupo (0068). Con \`libro\` propio en los datos se impone;
       -- con el de por defecto solo se pone si el tutor no subió otro.
       book_title = ${g.libro ? q(g.libro.title) : libroUnidad
         ? `case when v_libro is not null then ${q(`SABERES 11 PLATA QUÍMICA UNIDAD ${libroUnidad}`)}
                    when book_url is null then ${q(LIBRO_DEFAULT.title)} else book_title end`
         : `case when book_url is null then ${q(LIBRO_DEFAULT.title)} else book_title end`},
       book_url   = ${g.libro ? q(g.libro.url) : libroUnidad
         ? `coalesce(v_libro, book_url, ${q(LIBRO_DEFAULT.url)})`
         : `coalesce(book_url, ${q(LIBRO_DEFAULT.url)})`}
   where group_id = v_group;
end $$;
`)
}

out.push(`-- Verificación
-- Las dos últimas columnas dicen qué falta hacer en Admin → Usuarios.
select g.name as grupo, p.email as docente, g.grade,
       case when p.institution_id is not distinct from ${COLEGIO_ID}
            then 'ok' else ${q('FALTA: asignar ' + COLEGIO)} end as colegio,
       case when p.ui_variant = 'clone' then 'ok' else 'FALTA: activar modo clon' end as modo_clon,
       (select count(*) from public.clone_group_students s where s.group_id = g.id) as alumnos,
       jsonb_array_length(coalesce(u.units, '[]'::jsonb)) as unidades,
       jsonb_array_length(coalesce(u.chart->'bars', '[]'::jsonb)) as ejes,
       u.units->0->>'title' as unidad_1, u.book_title as libro
  from public.clone_groups g
  join public.profiles p on p.id = g.teacher_id
  left join public.clone_unit_plans u on u.group_id = g.id
 where g.name in (${GRUPOS.map(g => q(g.nombre)).join(', ')})
 order by g.name;

commit;
`)

// El grupo modelo ("ONCE") va como subconsulta en cada uso y no como tabla
// temporal: el SQL Editor de Supabase no conserva una temp table entre
// sentencias ("relation _modelo does not exist").
const MODELO = `(select g.teacher_id, g.institution_id, g.course_id, g.id as group_id
    from public.clone_groups g where g.name ilike 'once' and g.is_active
    order by g.created_at limit 1) _modelo`
fs.writeFileSync(path.join(here, 'grupos_jm.sql'), out.join('\n').replace(/from _modelo\b/g, `from ${MODELO}`))
for (const g of GRUPOS) console.log(g.nombre.padEnd(16), (g.grafica || promedios(g.ejes)).join(' · '), g.grafica ? '(oficial)' : '(provisional)')
console.log('\n→ scripts/grupos_jm.sql\n→ scripts/out/docentes_jm.xlsx')
