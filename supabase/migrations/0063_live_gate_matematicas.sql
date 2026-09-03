-- ============================================================
-- 0063_live_gate_matematicas.sql
-- Bloquea la ruta de "Sala de Escape - Matematicas" para que un estudiante
-- no pueda avanzar por su cuenta hasta que su profesor haya dado con él/ella
-- al menos una Clase en Vivo Guiada de ese curso. Antes de esa primera
-- clase ve el mapa (la estructura de la ruta) pero no puede abrir ni
-- completar ningún módulo. Después de la primera clase, la ruta queda
-- libre para siempre (no se vuelve a bloquear entre clases).
--
-- Alcance deliberado: SOLO este curso (base + su fork). El resto de la
-- plataforma sigue con ruta libre — se agrega una columna nueva en vez de
-- una regla global para no afectar ningún otro curso existente.
--
-- EJECUTAR en Supabase SQL Editor (Dashboard > SQL Editor).
-- ============================================================

-- ── 1. Columna nueva en courses (default false: no afecta a nadie más) ──────
alter table public.courses
  add column if not exists requires_live_to_start boolean not null default false;

-- ── 2. Activar el candado en el curso base Y en el fork "— mi versión" ──────
-- (un fork no hereda cambios de columna del padre automáticamente, así que
-- se marcan ambos por id explícito — confirmados por consulta directa).
update public.courses
   set requires_live_to_start = true
 where id in (
   '2bb289f1-45c6-47c3-a8fb-55b38f2e2e9b', -- Sala de Escape - Matematicas (base)
   '88136e1a-4564-45bd-b514-0ad6690b182c'  -- Sala de Escape - Matematicas — mi versión (fork Ceinfes)
 );

-- ── 3. RPC: ¿este estudiante ya completó alguna Clase en Vivo de este curso? ─
-- SECURITY DEFINER porque live_participants.user_id NO es legible por la
-- tabla directamente para el cliente (column-privileges, migración 0029) —
-- este RPC solo expone un booleano, nunca las columnas protegidas.
create or replace function public.has_completed_live_session(p_course_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.live_participants lp
      join public.live_sessions ls on ls.id = lp.session_id
     where lp.user_id = auth.uid()
       and ls.course_id = p_course_id
       and ls.status = 'ended'
  );
$$;

grant execute on function public.has_completed_live_session(uuid) to authenticated;
