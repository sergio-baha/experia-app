-- ============================================================
-- 0082_versiones_de_ruta.sql
-- Biblioteca de versiones de ruta (página "Versiones de ruta", §16 de
-- CLAUDE.md): el tutor ve todas las versiones de un curso —la ruta base, la
-- de cada colegio y las plantillas—, les pone una nota ("jornada única",
-- "grupos grandes"…), las previsualiza, las usa en otro colegio y guarda
-- plantillas reutilizables.
--
--   1. courses.version_note — para qué sirve esa versión (texto libre).
--   2. courses.is_template  — PLANTILLA: una ruta guardada con nombre propio
--      que no pertenece a ningún colegio. Es una fila de courses como un fork
--      (parent_course_id = curso base) pero con institution_id NULL, así que
--      ningún estudiante la recibe nunca: la resolución del estudiante
--      (loadStudentSession / resolveCourseForStudent) busca por colegio.
--   3. RLS: el tutor crea, edita y borra SUS plantillas (y sus módulos). Leer
--      las de los demás ya lo permite 0041 (forks activos para instructores).
--
-- Aditiva e idempotente. EJECUTAR en Supabase SQL Editor.
-- ============================================================

alter table public.courses add column if not exists version_note text;
alter table public.courses add column if not exists is_template boolean not null default false;

-- Una plantilla siempre cuelga de un curso base y no tiene colegio.
do $$ begin
  alter table public.courses add constraint courses_template_shape
    check (not is_template or (parent_course_id is not null and institution_id is null));
exception when duplicate_object then null; end $$;

-- ── Plantillas: el tutor maneja las suyas ───────────────────────────────
drop policy if exists "instructors manage own templates" on public.courses;
create policy "instructors manage own templates"
  on public.courses for all
  using (public.is_instructor() and is_template and owner_id = auth.uid())
  with check (public.is_instructor() and is_template and owner_id = auth.uid()
              and parent_course_id is not null and institution_id is null);

drop policy if exists "instructors manage own template modules" on public.course_modules;
create policy "instructors manage own template modules"
  on public.course_modules for all
  using (public.is_instructor() and course_id in (
    select c.id from public.courses c where c.is_template and c.owner_id = auth.uid()))
  with check (public.is_instructor() and course_id in (
    select c.id from public.courses c where c.is_template and c.owner_id = auth.uid()));

select 'APLICADA' as estado,
       (select count(*) from public.courses where parent_course_id is not null and not is_template) as versiones_de_colegio,
       (select count(*) from public.courses where is_template) as plantillas;
