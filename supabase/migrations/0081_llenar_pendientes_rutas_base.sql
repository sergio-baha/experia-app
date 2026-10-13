-- ============================================================
-- 0081_llenar_pendientes_rutas_base.sql
-- Los módulos de apertura (1) y pausa activa (5) —y la estructura Saber (2)—
-- de la RUTA BASE de cada asignatura seguían diciendo "Pendiente".
--
-- Por qué: 0064–0067 llenaron esos módulos solo en UNA copia por colegio de
-- cada asignatura ("… — mi versión"), y 0069 convirtió esos bancos en el
-- banco de actividades nuevo también solo ahí. La ruta base —que es la que
-- ve un colegio sin versión propia, como CEINFES— quedó con los avisos
-- "Pendiente".
--
-- Qué hace, por familia de curso (curso base + todas sus copias):
--   - Busca módulos tipo lección que todavía tengan una sección titulada
--     "Pendiente".
--   - Si en la MISMA familia hay un módulo tipo lección con el MISMO título
--     que ya está lleno (sin "Pendiente"), le copia su `content` completo.
--     Se cruza por título y no por "order": 0070 renumeró Matemáticas.
--     Si hay varios llenos, toma el modificado más recientemente.
--   - Si no hay de dónde copiar, no toca nada y lo informa.
-- No toca las rondas (módulos 4 y 6 ya son retos), ni nada que no diga
-- "Pendiente": una edición manual del tutor se respeta.
-- Avisa los cursos con borrador sin publicar (publicarlo devolvería el
-- "Pendiente").
--
-- Idempotente. EJECUTAR en Supabase SQL Editor.
-- ============================================================

drop table if exists _0081_estado;
create temp table _0081_estado (estado text, curso text, modulo text, detalle text);

drop table if exists _0081_familia;
create temp table _0081_familia as
with recursive fam as (
  select id, id as raiz from public.courses where parent_course_id is null
  union all
  select c.id, fam.raiz from public.courses c join fam on c.parent_course_id = fam.id
)
select id, raiz from fam;

do $$
declare
  r record; src record;
begin
  for r in
    select m.id, m.title, m."order", c.name as curso, f.raiz
      from public.course_modules m
      join public.courses c on c.id = m.course_id
      join _0081_familia f on f.id = m.course_id
     where m.type = 'lesson'
       and m.content @> '[{"title":"Pendiente"}]'::jsonb
     order by c.name, m."order"
  loop
    select sm.content, sc.name as curso into src
      from public.course_modules sm
      join public.courses sc on sc.id = sm.course_id
      join _0081_familia sf on sf.id = sm.course_id
     where sf.raiz = r.raiz
       and sm.id <> r.id
       and sm.type = 'lesson'
       and sm.title = r.title
       and not sm.content @> '[{"title":"Pendiente"}]'::jsonb
     order by sm.updated_at desc
     limit 1;

    if src.content is null then
      insert into _0081_estado values ('SIN FUENTE', r.curso, r."order" || '. ' || r.title,
        'Ningún curso de la misma familia tiene este módulo lleno. No se cambió.');
    else
      update public.course_modules set content = src.content, updated_at = now() where id = r.id;
      insert into _0081_estado values ('LLENADO', r.curso, r."order" || '. ' || r.title,
        'Contenido copiado de "' || src.curso || '".');
    end if;
    src := null;
  end loop;

  insert into _0081_estado
  select 'BORRADOR PENDIENTE', c.name, '—',
         'Tiene un borrador sin publicar en el editor de ruta: descartarlo antes de publicar, o volverá el "Pendiente".'
    from public.courses c
   where c.draft_modules is not null
     and c.draft_modules::text like '%"Pendiente"%';
end $$;

select estado, curso, modulo, detalle from _0081_estado order by estado, curso, modulo;
