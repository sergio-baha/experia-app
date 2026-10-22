-- =============================================
-- 0083 — Clase en Vivo: el puntaje usa el tiempo por pregunta que fijó el profesor
-- =============================================
-- Oct 2026: el profesor fija un tiempo único por pregunta (2 min por defecto)
-- desde el panel (applyLiveTimeLimit en liveClient.js), que reescribe
-- live_sessions.questions[i].time_limit_s. submit_live_answer calculaba el
-- puntaje con el time_limit_s de live_session_keys (el timeLimit original de la
-- pregunta, p. ej. 60 s): con 120 s en pantalla, quien respondía después del
-- segundo 60 ya recibía el puntaje mínimo.
--
-- Cambio único: v_limit lee primero el tiempo del snapshot de la sesión. Lo
-- escribe solo el host (policy ls_host_all), igual que la llave. El resto de
-- la función es idéntico a 0033.
-- Aditiva e idempotente. Correr manual en el SQL Editor.
-- =============================================

create or replace function public.submit_live_answer(
  p_session uuid, p_participant uuid, p_index int, p_answer int, p_token uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_sess public.live_sessions; v_part public.live_participants;
  v_key jsonb; v_correct int; v_base int; v_limit int;
  v_elapsed numeric; v_frac numeric; v_points int; v_ok boolean; v_existing public.live_answers;
begin
  select * into v_sess from public.live_sessions where id = p_session;
  if v_sess.id is null then raise exception 'Sesión inválida'; end if;
  if v_sess.phase <> 'question' or v_sess.current_index <> p_index then
    raise exception 'La pregunta no está abierta';
  end if;

  select * into v_part from public.live_participants
   where id = p_participant and session_id = p_session;
  if v_part.id is null then raise exception 'Participante inválido'; end if;
  if v_part.claim_token is not null and v_part.claim_token is distinct from p_token then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select * into v_existing from public.live_answers
   where participant_id = p_participant and question_index = p_index;
  if v_existing.id is not null then
    return jsonb_build_object('already', true, 'points', v_existing.points, 'is_correct', v_existing.is_correct);
  end if;

  select answer_key->p_index into v_key from public.live_session_keys where session_id = p_session;
  v_correct := (v_key->>'correct')::int;  -- NULL en encuestas: sin respuesta correcta
  v_base    := coalesce((v_key->>'points')::int, 1000);
  v_limit   := coalesce(nullif(v_sess.questions->p_index->>'time_limit_s','')::int,
                         (v_key->>'time_limit_s')::int, v_sess.time_limit_s, 20);
  v_elapsed := extract(epoch from (now() - coalesce(v_sess.question_started_at, now())));

  if v_correct is null then
    -- Encuesta: se registra la elección, sin calificar ni sumar puntaje.
    v_ok := null;
    v_points := 0;
  else
    v_ok := (p_answer = v_correct);
    if v_ok then
      v_frac   := least(1.0, greatest(0.0, v_elapsed / nullif(v_limit, 0)));
      v_points := round(v_base * (1 - 0.5 * v_frac));
    else
      v_points := 0;
    end if;
  end if;

  insert into public.live_answers(session_id, participant_id, question_index, answer_index, is_correct, response_ms, points)
  values (p_session, p_participant, p_index, p_answer, v_ok, round(v_elapsed * 1000), v_points);

  update public.live_participants
     set score = score + v_points,
         streak = case when v_correct is null then streak  -- encuesta no afecta racha
                       when v_ok then streak + 1 else 0 end,
         last_seen = now()
   where id = p_participant;

  return jsonb_build_object('already', false, 'is_correct', v_ok, 'points', v_points);
end; $$;

grant execute on function public.submit_live_answer(uuid, uuid, int, int, uuid) to anon, authenticated;
