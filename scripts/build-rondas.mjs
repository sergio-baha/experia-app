// Genera supabase/migrations/0075_rondas_banco_preguntas.sql a partir del
// banco de preguntas (src/lib/questionBank.json): las preguntas
// predeterminadas de la primera ronda (módulo 4) y la ronda final (módulo 6)
// de cada asignatura van COPIADAS en la migración.
//
//   node scripts/build-rondas.mjs
//
// El banco a su vez lo arma scripts/banco-preguntas/curate.py desde los Word
// del equipo académico (ver scripts/banco-preguntas/README.md).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { bankToModuleQuestion } from '../src/lib/questionBankMeta.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/lib/questionBank.json'), 'utf8'))
const byId = Object.fromEntries(bank.questions.map(q => [q.id, q]))

// Cómo se encuentra cada asignatura en la BD: por una copia por colegio ya
// conocida (0062/0065/0067) o, para los cursos que creó 0073, por nombre.
const FAMILIAS = [
  { area: 'matematicas', label: 'Matemáticas',  ref: "'88136e1a-4564-45bd-b514-0ad6690b182c'::uuid" },
  { area: 'lectura',     label: 'Lenguaje',     ref: "'d4aa2014-aa49-46d1-8ac3-7e5842fc8dc1'::uuid" },
  { area: 'biologia',    label: 'Biología',     ref: "'4d2af3cd-767e-4e14-a364-23fd596ada10'::uuid" },
  { area: 'fisica',      label: 'Física',       nombre: 'Ciencias Naturales — Física' },
  { area: 'quimica',     label: 'Química',      nombre: 'Ciencias Naturales — Química' },
]

const ronda = (area, n) => {
  const ids = bank.defaults[area][`r${n}`]
  return {
    bank: area, bankRound: n,
    // Una ronda en vivo no frena la ruta: sin puntaje mínimo.
    passingScore: 0,
    questions: ids.map(id => bankToModuleQuestion(byId[id], bank)),
  }
}

const dollar = (tag, obj) => {
  const s = JSON.stringify(obj)
  if (s.includes(`$${tag}$`)) throw new Error('etiqueta $ en el contenido')
  return `$${tag}$${s}$${tag}$::jsonb`
}

const familias = FAMILIAS.map(f => {
  const base = f.ref
    ? `(select coalesce(parent_course_id, id) from public.courses where id = ${f.ref})`
    : `(select id from public.courses where parent_course_id is null and name like '%${f.nombre}' order by created_at limit 1)`
  return `    ('${f.area}', '${f.label}', ${base},
      ${dollar(f.area.slice(0, 3) + '1', ronda(f.area, 1))},
      ${dollar(f.area.slice(0, 3) + '2', ronda(f.area, 2))})`
}).join(',\n')

const resumen = FAMILIAS.map(f => {
  const d = bank.defaults[f.area]
  return `--   ${f.label.padEnd(12)} primera ronda ${String(d.r1.length).padStart(2)} · ronda final ${String(d.r2.length).padStart(2)} · banco ${bank.questions.filter(q => q.area === f.area).length}`
}).join('\n')

const sql = `-- ============================================================
-- 0075_rondas_banco_preguntas.sql
-- GENERADO por scripts/build-rondas.mjs — no editar a mano: cambia el banco
-- (src/lib/questionBank.json) y vuelve a correr el script.
--
-- Módulos 4 (primera ronda) y 6 (ronda final) de las rutas de 7 módulos:
-- pasan a ser rondas de preguntas que la Clase en Vivo sincroniza una a una
-- (tipo Kahoot). Por dentro son un reto 'quiz' — es lo único que el modo en
-- vivo sabe recorrer pregunta a pregunta —, pero conservan su id, título,
-- orden, XP y progreso, y el mapa los sigue rotulando como MÓDULO
-- (challenge_data.bank, ver src/lib/questionBankMeta.js).
--
-- Preguntas predeterminadas (el tutor las cambia desde el editor de ruta,
-- eligiendo del banco):
${resumen}
--   Ciencias Sociales: aún no hay preguntas → sus módulos 4 y 6 no se tocan.
--
-- Qué hace:
--   1. _snapshot_module_questions: la clase en vivo ahora también lleva a los
--      estudiantes el texto de lectura (passage), la pista del tutor (hint) y
--      la segunda parte del enunciado (questionAfter). La respuesta correcta
--      sigue SOLO en live_session_keys, igual que antes.
--   2. En cada curso de esas asignaturas (curso base + copias por colegio)
--      convierte los módulos de "order" 4 y 6 SOLO si siguen sin contenido
--      propio: dicen "Pendiente" o traen el banco viejo en texto (0064).
--      Si un tutor ya los editó a mano, NO se tocan (lo informa).
--
-- Idempotente: lo ya convertido se informa como "YA APLICADA".
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

-- ── 1. Snapshot de preguntas con texto de lectura y pista ───────────────
create or replace function public._snapshot_module_questions(p_module_id uuid, p_default_time int default 20)
returns jsonb
language plpgsql set search_path = public as $$
declare
  v_questions jsonb;
  v_snapshot  jsonb := '[]'::jsonb;
  v_keys      jsonb := '[]'::jsonb;
  q jsonb;
begin
  select challenge_data->'questions' into v_questions from public.course_modules where id = p_module_id;

  for q in select value from jsonb_array_elements(coalesce(v_questions, '[]'::jsonb)) as t(value) loop
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'question',      q->>'question',
      'questionAfter', q->>'questionAfter',
      'options',       coalesce(q->'options', '[]'::jsonb),
      'image',         q->>'image',
      'imageHeight',   q->'imageHeight',
      'passage',       q->'passage',
      'hint',          q->>'hint',
      'time_limit_s',  coalesce(nullif(q->>'timeLimit','')::int, p_default_time)
    )));
    v_keys := v_keys || jsonb_build_array(jsonb_build_object(
      'correct',          (q->>'correct')::int,
      'points',           coalesce(nullif(q->>'points','')::int, 1000),
      'time_limit_s',     coalesce(nullif(q->>'timeLimit','')::int, p_default_time),
      'explanation',      q->>'explanation',
      'explanationImage', q->>'explanationImage'
    ));
  end loop;

  return jsonb_build_object('snapshot', v_snapshot, 'keys', v_keys);
end; $$;
revoke execute on function public._snapshot_module_questions(uuid, int) from public;

-- ── 2. Rondas predeterminadas ───────────────────────────────────────────
drop table if exists _0075_estado;
create temp table _0075_estado (paso int, asignatura text, estado text, detalle text);

do $$
declare
  f record; c record; m record;
  v_ronda int; v_cd jsonb; v_mod_ronda text;
begin
  for f in
    select * from (values
${familias}
    ) as t(area, label, base_id, r1, r2)
  loop
    if f.base_id is null then
      insert into _0075_estado values (1, f.label, 'CURSO NO ENCONTRADO', 'No existe en esta base de datos: no se cambió nada.');
      continue;
    end if;

    for c in
      select id, name, draft_modules is not null as has_draft from public.courses
       where id = f.base_id or parent_course_id = f.base_id
       order by parent_course_id nulls first, name
    loop
      -- Un borrador sin publicar en el editor de ruta trae los módulos 4 y 6
      -- VIEJOS: si el tutor lo publica, deshace esta migración en su colegio.
      if c.has_draft then
        insert into _0075_estado values (3, f.label, 'BORRADOR PENDIENTE',
          c.name || ': tiene un borrador sin publicar en el editor de ruta. Que el tutor lo descarte (o importe la ruta base) antes de publicar, o volverán los módulos 4 y 6 anteriores.');
      end if;
      foreach v_ronda in array array[4, 6] loop
        v_cd := case when v_ronda = 4 then f.r1 else f.r2 end;
        v_mod_ronda := case when v_ronda = 4 then 'primera ronda' else 'ronda final' end;
        select * into m from public.course_modules where course_id = c.id and "order" = v_ronda;

        if m.id is null then
          insert into _0075_estado values (2, f.label, 'SIN MÓDULO ' || v_ronda, c.name || ': la ruta no tiene módulo en la posición ' || v_ronda || '.');
        elsif m.type = 'challenge' and m.challenge_data ? 'bank' then
          insert into _0075_estado values (2, f.label, 'YA APLICADA', c.name || ' · ' || m.title || ' (' || v_mod_ronda || ')');
        elsif m.type = 'lesson'
          and (m.content @> '[{"title":"Pendiente"}]'::jsonb or m.content::text like '%Banco de preguntas%') then
          update public.course_modules
             set type = 'challenge',
                 challenge_type = 'quiz',
                 challenge_data = v_cd,
                 -- Se conserva la guía del bloque (frase de apertura, cómo
                 -- ejecutarlo); se retira el marcador "Pendiente" y el banco
                 -- viejo en texto, que ahora vive como preguntas reales.
                 content = coalesce((
                   select jsonb_agg(e order by i)
                     from jsonb_array_elements(m.content) with ordinality as t(e, i)
                    where coalesce(e->>'title', '') <> 'Pendiente'
                      and coalesce(e->>'title', '') not like 'Banco de preguntas%'
                 ), '[]'::jsonb),
                 updated_at = now()
           where id = m.id;
          insert into _0075_estado values (2, f.label, 'APLICADA',
            format('%s · %s (%s): %s preguntas.', c.name, m.title, v_mod_ronda, jsonb_array_length(v_cd->'questions')));
        else
          insert into _0075_estado values (2, f.label, 'NO TOCADO',
            format('%s · %s (%s): ya tiene contenido propio (%s). Cárgale preguntas desde el editor de ruta.', c.name, m.title, v_mod_ronda, m.type));
        end if;
      end loop;
    end loop;
  end loop;
end $$;

select asignatura, estado, detalle from _0075_estado order by paso, asignatura, estado, detalle;
`

// Una migración ya aplicada en Supabase no se reescribe: si el banco cambia
// después, el cambio va en una migración NUEVA (como 0080 para Matemáticas).
// --force las regenera todas (solo para una base que aún no las corrió).
const FORCE = process.argv.includes('--force')
const writeMigration = (file, content) => {
  const out = path.join(ROOT, 'supabase/migrations', file)
  if (fs.existsSync(out) && !FORCE) {
    console.log('Sin cambios', file, '(ya existe; ya aplicada — usa --force para regenerarla)')
    return
  }
  fs.writeFileSync(out, content)
  console.log('Escrito', file, `(${(content.length / 1024).toFixed(0)} KB)`)
}

writeMigration('0075_rondas_banco_preguntas.sql', sql)

// ── 0078: rondas de Ciencias Sociales (llegaron después de aplicar 0075) ──────
// Mismas reglas que 0075, pero recorriendo la familia COMPLETA del curso
// (copias de copias): 0076 enseñó que no basta con base + copias directas.
const soc = { label: 'Ciencias Sociales', ref: "'9e6ddb8b-bcf1-42c0-926b-cc8037cb70b3'::uuid" }
const sql78 = `-- ============================================================
-- 0078_rondas_sociales.sql
-- GENERADO por scripts/build-rondas.mjs — no editar a mano.
--
-- Ciencias Sociales y Competencias Ciudadanas: módulos 4 (primera ronda) y 6
-- (ronda final) pasan a ser rondas de preguntas del banco (igual que 0075 en
-- las otras asignaturas, ver §14 de CLAUDE.md). 49 preguntas en el banco, con
-- DIFICULTAD REAL del documento del equipo académico:
--   primera ronda: ${bank.defaults.sociales.r1.length} preguntas de dificultad baja y media
--   ronda final:   ${bank.defaults.sociales.r2.length} preguntas de dificultad alta
-- Recorre la familia COMPLETA del curso (base, copias por colegio y copias de
-- copias). Solo convierte módulos que siguen "Pendiente" (o con el banco viejo
-- en texto); lo editado a mano se respeta y se informa.
-- Requiere 0075 (snapshot con texto de lectura y pista). Idempotente.
-- EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0078_estado;
create temp table _0078_estado (estado text, curso text, detalle text);

do $$
declare
  v_base uuid := (select coalesce(parent_course_id, id) from public.courses where id = ${soc.ref});
  v_r1 jsonb := ${dollar('soc1', ronda('sociales', 1))};
  v_r2 jsonb := ${dollar('soc2', ronda('sociales', 2))};
  c record; m record; v_ronda int; v_cd jsonb; v_nombre text;
begin
  if v_base is null then
    insert into _0078_estado values ('CURSO NO ENCONTRADO', '—', 'No existe el curso de Ciencias Sociales en esta base de datos.');
    return;
  end if;

  for c in
    with recursive fam as (
      select id from public.courses where id = v_base
      union
      select ch.id from public.courses ch join fam on ch.parent_course_id = fam.id
    )
    select co.id, co.name, co.draft_modules is not null as has_draft
      from public.courses co join fam on fam.id = co.id
     order by co.parent_course_id nulls first, co.name
  loop
    if c.has_draft then
      insert into _0078_estado values ('BORRADOR PENDIENTE', c.name,
        'Tiene un borrador sin publicar en el editor de ruta: descartarlo antes de publicar, o volverán los módulos 4 y 6 anteriores.');
    end if;
    foreach v_ronda in array array[4, 6] loop
      v_cd := case when v_ronda = 4 then v_r1 else v_r2 end;
      v_nombre := case when v_ronda = 4 then 'primera ronda' else 'ronda final' end;
      select * into m from public.course_modules where course_id = c.id and "order" = v_ronda;
      if m.id is null then
        insert into _0078_estado values ('SIN MÓDULO ' || v_ronda, c.name, 'La ruta no tiene módulo en esa posición.');
      elsif m.type = 'challenge' and m.challenge_data ? 'bank' then
        insert into _0078_estado values ('YA APLICADA', c.name, m.title || ' (' || v_nombre || ')');
      elsif m.type = 'lesson'
        and (m.content @> '[{"title":"Pendiente"}]'::jsonb or m.content::text like '%Banco de preguntas%') then
        update public.course_modules
           set type = 'challenge', challenge_type = 'quiz', challenge_data = v_cd,
               content = coalesce((
                 select jsonb_agg(e order by i)
                   from jsonb_array_elements(m.content) with ordinality as t(e, i)
                  where coalesce(e->>'title', '') <> 'Pendiente'
                    and coalesce(e->>'title', '') not like 'Banco de preguntas%'
               ), '[]'::jsonb),
               updated_at = now()
         where id = m.id;
        insert into _0078_estado values ('APLICADA', c.name,
          format('%s (%s): %s preguntas.', m.title, v_nombre, jsonb_array_length(v_cd->'questions')));
      else
        insert into _0078_estado values ('NO TOCADO', c.name,
          format('%s (%s): ya tiene contenido propio (%s). Cárgale preguntas desde el editor de ruta.', m.title, v_nombre, m.type));
      end if;
    end loop;
  end loop;
end $$;

select estado, curso, detalle from _0078_estado order by estado, curso;
`
writeMigration('0078_rondas_sociales.sql', sql78)

// ── 0080: Matemáticas cambia de banco (documento de 50 preguntas, oct 2026) ──
// 0075 ya cargó las rondas con el banco anterior (ids "mat-NN"); 0080 cambia
// esas preguntas por las nuevas ("mate-NN"). Reemplaza solo rondas cuyas
// preguntas vienen TODAS del banco anterior; si el tutor agregó preguntas
// propias, no toca nada y lo informa.
const mat = FAMILIAS.find(f => f.area === 'matematicas')
const sql80 = `-- ============================================================
-- 0080_rondas_matematicas_nuevo_banco.sql
-- GENERADO por scripts/build-rondas.mjs — no editar a mano.
--
-- Matemáticas cambia de banco de preguntas: el documento del equipo
-- académico de 50 preguntas (tipo Saber) reemplaza al de 20. Los módulos 4
-- (primera ronda) y 6 (ronda final) cambian sus preguntas por:
--   primera ronda: ${bank.defaults.matematicas.r1.join(', ')}
--   ronda final:   ${bank.defaults.matematicas.r2.join(', ')}
-- (en la ronda va la 4–6 completa en la primera y la 9–13 completa en la
-- final: comparten información y no se parten).
--
-- Qué toca, en la familia COMPLETA del curso (base, copias por colegio y
-- copias de copias):
--   - Ronda cuyas preguntas vienen TODAS del banco anterior (ids "mat-NN",
--     sean las predeterminadas o elegidas por el tutor) → REEMPLAZADA.
--     Solo cambia challenge_data.questions: título, orden, XP, progreso de
--     los estudiantes y la guía del bloque se conservan.
--   - Ronda con preguntas propias del tutor → NO TOCADO (se informa).
--   - Ronda que ya tiene el banco nuevo ("mate-NN") → YA APLICADA.
-- Los ids nuevos son distintos a propósito: el análisis de ítems agrupa por
-- id y no debe mezclar respuestas de preguntas diferentes.
-- Además, la clase en vivo pasa a llevar las imágenes de las OPCIONES
-- (optionImages): las preguntas 12, 33, 42 y 43 tienen gráficas o tablas
-- como opciones de respuesta.
-- Requiere 0075. Idempotente. EJECUTAR en Supabase SQL Editor.
-- ============================================================

-- ── 1. Snapshot de la clase en vivo con imágenes por opción ────────────
-- Igual que en 0075 + 'optionImages'. La respuesta correcta sigue SOLO en
-- live_session_keys.
create or replace function public._snapshot_module_questions(p_module_id uuid, p_default_time int default 20)
returns jsonb
language plpgsql set search_path = public as $$
declare
  v_questions jsonb;
  v_snapshot  jsonb := '[]'::jsonb;
  v_keys      jsonb := '[]'::jsonb;
  q jsonb;
begin
  select challenge_data->'questions' into v_questions from public.course_modules where id = p_module_id;

  for q in select value from jsonb_array_elements(coalesce(v_questions, '[]'::jsonb)) as t(value) loop
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
      'question',      q->>'question',
      'questionAfter', q->>'questionAfter',
      'options',       coalesce(q->'options', '[]'::jsonb),
      'optionImages',  q->'optionImages',
      'image',         q->>'image',
      'imageHeight',   q->'imageHeight',
      'passage',       q->'passage',
      'hint',          q->>'hint',
      'time_limit_s',  coalesce(nullif(q->>'timeLimit','')::int, p_default_time)
    )));
    v_keys := v_keys || jsonb_build_array(jsonb_build_object(
      'correct',          (q->>'correct')::int,
      'points',           coalesce(nullif(q->>'points','')::int, 1000),
      'time_limit_s',     coalesce(nullif(q->>'timeLimit','')::int, p_default_time),
      'explanation',      q->>'explanation',
      'explanationImage', q->>'explanationImage'
    ));
  end loop;

  return jsonb_build_object('snapshot', v_snapshot, 'keys', v_keys);
end; $$;
revoke execute on function public._snapshot_module_questions(uuid, int) from public;

-- ── 2. Preguntas nuevas en las rondas ───────────────────────────────────
drop table if exists _0080_estado;
create temp table _0080_estado (estado text, curso text, detalle text);

do $$
declare
  v_base uuid := (select coalesce(parent_course_id, id) from public.courses where id = ${mat.ref});
  v_r1 jsonb := ${dollar('mat1', ronda('matematicas', 1))};
  v_r2 jsonb := ${dollar('mat2', ronda('matematicas', 2))};
  c record; m record; v_ronda int; v_new jsonb; v_nombre text;
  v_total int; v_viejas int; v_nuevas int;
begin
  if v_base is null then
    insert into _0080_estado values ('CURSO NO ENCONTRADO', '—', 'No existe el curso de Matemáticas en esta base de datos.');
    return;
  end if;

  for c in
    with recursive fam as (
      select id from public.courses where id = v_base
      union
      select ch.id from public.courses ch join fam on ch.parent_course_id = fam.id
    )
    select co.id, co.name, co.draft_modules is not null as has_draft
      from public.courses co join fam on fam.id = co.id
     order by co.parent_course_id nulls first, co.name
  loop
    -- El borrador guarda los módulos con las preguntas VIEJAS: publicarlo
    -- deshace esta migración en ese curso.
    if c.has_draft then
      insert into _0080_estado values ('BORRADOR PENDIENTE', c.name,
        'Tiene un borrador sin publicar en el editor de ruta: descartarlo antes de publicar, o volverán las preguntas anteriores.');
    end if;
    foreach v_ronda in array array[4, 6] loop
      v_new := case when v_ronda = 4 then v_r1 else v_r2 end;
      v_nombre := case when v_ronda = 4 then 'primera ronda' else 'ronda final' end;
      select * into m from public.course_modules where course_id = c.id and "order" = v_ronda;
      if m.id is null then
        insert into _0080_estado values ('SIN MÓDULO ' || v_ronda, c.name, 'La ruta no tiene módulo en esa posición.');
        continue;
      end if;
      if not (m.type = 'challenge' and m.challenge_data->>'bank' = 'matematicas') then
        insert into _0080_estado values ('NO ES RONDA', c.name,
          format('%s (%s): no es una ronda del banco (%s). No se cambió.', m.title, v_nombre, m.type));
        continue;
      end if;
      select count(*),
             count(*) filter (where e->>'id' ~ '^mat-[0-9]{2}$'),
             count(*) filter (where e->>'id' like 'mate-%')
        into v_total, v_viejas, v_nuevas
        from jsonb_array_elements(coalesce(m.challenge_data->'questions', '[]'::jsonb)) as t(e);
      if v_total > 0 and v_nuevas = v_total then
        insert into _0080_estado values ('YA APLICADA', c.name, m.title || ' (' || v_nombre || ')');
      elsif v_viejas = v_total then
        update public.course_modules
           set challenge_data = jsonb_set(m.challenge_data, '{questions}', v_new->'questions'),
               updated_at = now()
         where id = m.id;
        insert into _0080_estado values ('REEMPLAZADA', c.name,
          format('%s (%s): %s preguntas del banco anterior → %s del nuevo.', m.title, v_nombre, v_total, jsonb_array_length(v_new->'questions')));
      else
        insert into _0080_estado values ('NO TOCADO', c.name,
          format('%s (%s): tiene %s preguntas propias del tutor y %s del banco anterior. Cámbialas desde el editor de ruta ("Elegir del banco").',
                 m.title, v_nombre, v_total - v_viejas - v_nuevas, v_viejas));
      end if;
    end loop;
  end loop;
end $$;

select estado, curso, detalle from _0080_estado order by estado, curso;
`
writeMigration('0080_rondas_matematicas_nuevo_banco.sql', sql80)
