import React from 'react'
import { supabase } from './supabaseClient.js'
// =============================================
// EXPERIA — Modo Aula en Vivo (cliente)
// Envoltorios de las RPC + suscripciones realtime de Supabase.
// =============================================

// --- Profesor ---
// Crea el "cascarón" de una clase en vivo para un curso completo (sin módulo
// aún) — el profesor entra al primer módulo llamando aparte a liveGotoModule.
export const createLiveSession = async ({ courseId, title }) => {
  const { data, error } = await supabase.rpc('create_live_session', {
    p_course_id: courseId || null, p_title: title || null,
  })
  if (error) throw error
  return data
}
// Mueve el puntero de módulo actual dentro de la ruta del curso (lección,
// encuesta, quiz interactivo, o pass-through para lo no sincrónico).
export const liveGotoModule = async ({ session, moduleId, defaultTime = 20 }) => {
  const { data, error } = await supabase.rpc('live_goto_module', {
    p_session: session, p_module_id: moduleId, p_default_time: defaultTime,
  })
  if (error) throw error
  return data
}
// Otorga XP/completado a los participantes conectados por el módulo que se deja atrás.
export const liveCompleteModuleForParticipants = async ({ session, moduleId }) => {
  const { error } = await supabase.rpc('live_complete_module_for_participants', {
    p_session: session, p_module_id: moduleId,
  })
  if (error) throw error
}
export const liveSetPhase = (session, phase) => supabase.rpc('live_set_phase', { p_session: session, p_phase: phase })
export const liveGoto     = (session, index) => supabase.rpc('live_goto',     { p_session: session, p_index: index })
export const liveEnd      = (session)        => supabase.rpc('live_end',      { p_session: session })
// Informe de cierre: comentarios generales del profesor sobre la sesión ya
// finalizada. Escritura directa (no RPC) — la policy `ls_host_all` de 0022
// ya permite al host actualizar su propia fila de live_sessions.
export const saveLiveClosingNotes = async (sessionId, notes) => {
  const { data, error } = await supabase.from('live_sessions')
    .update({ closing_notes: notes }).eq('id', sessionId).select().single()
  if (error) throw error
  return data
}

// --- Estudiante ---
export const joinLiveSession = async ({ code, nombre, apellido, correo, salon }) => {
  const { data, error } = await supabase.rpc('join_live_session', {
    p_code: code, p_nombre: nombre, p_apellido: apellido || null, p_correo: correo || null, p_salon: salon || null,
  })
  if (error) throw error
  return data
}
// Unirse a la sesión guiada activa de un curso como estudiante logueado (sin
// PIN; nombre/correo se autocompletan desde el perfil en el servidor).
export const joinLiveSessionForCourse = async (courseId) => {
  const { data, error } = await supabase.rpc('join_live_session_for_course', { p_course_id: courseId })
  if (error) throw error
  return data
}
export const submitLiveAnswer = async ({ session, participant, index, answer, token }) => {
  const { data, error } = await supabase.rpc('submit_live_answer', {
    p_session: session, p_participant: participant, p_index: index, p_answer: answer,
    p_token: token || null,
  })
  if (error) throw error
  return data
}

// --- Lectura ---
export const fetchSession = async (id) => {
  const { data } = await supabase.from('live_sessions').select('*').eq('id', id).single()
  return data
}
export const fetchSessionByCode = async (code) => {
  const { data } = await supabase.from('live_sessions').select('id,code,status,title')
    .eq('code', code).neq('status', 'ended').order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data
}
// Una clase en vivo no dura más de una jornada. Si el profesor cierra el panel
// sin finalizarla, la sesión se queda "activa" en la BD PARA SIEMPRE y todos los
// estudiantes del curso seguirían viendo la invitación para unirse aunque no
// haya clase. Por eso se ignoran las sesiones más viejas que esto: es la red de
// seguridad del lado del cliente, además del botón de finalizar del panel.
export const GUIDED_MAX_AGE_HOURS = 8

// Sesión guiada activa de un curso (para el banner de invitación / vista del
// estudiante). live_sessions tiene lectura pública, no requiere RPC.
export const fetchActiveSessionForCourse = async (courseId) => {
  const since = new Date(Date.now() - GUIDED_MAX_AGE_HOURS * 3600 * 1000).toISOString()
  const { data } = await supabase.from('live_sessions').select('*')
    .eq('course_id', courseId).neq('status', 'ended')
    .gte('created_at', since)
    .order('created_at', { ascending: false }).limit(1).maybeSingle()
  return data
}
// Solo columnas públicas del leaderboard. correo/user_id/claim_token NO son
// legibles por la tabla (column-privileges, migración 0029); pedirlos daría
// permission denied. El host puede recuperar el roster completo vía live_roster.
export const fetchParticipants = async (sessionId) => {
  const { data } = await supabase.from('live_participants')
    .select('id,session_id,nombre,apellido,salon,score,streak,joined_at,last_seen')
    .eq('session_id', sessionId).order('score', { ascending: false }).order('joined_at', { ascending: true })
  return data || []
}
// ¿Este estudiante ya estuvo en una Clase en Vivo Guiada de este curso que ya
// terminó? RPC (0063) porque live_participants.user_id no es legible por la
// tabla directo (column-privileges, 0029) — usado por el candado de
// "requires_live_to_start" (ver selectRequiresLiveToStart en store.jsx).
export const hasCompletedLiveSession = async (courseId) => {
  const { data, error } = await supabase.rpc('has_completed_live_session', { p_course_id: courseId })
  if (error) throw error
  return !!data
}
export const fetchAnswerCounts = async (sessionId, index, numOptions) => {
  const { data } = await supabase.from('live_answers').select('answer_index')
    .eq('session_id', sessionId).eq('question_index', index)
  const counts = Array(numOptions).fill(0)
  ;(data || []).forEach(r => { if (r.answer_index >= 0 && r.answer_index < numOptions) counts[r.answer_index]++ })
  return counts
}

// --- Realtime ---
// Crea el canal SOLO después de tirar cualquier canal viejo con el mismo
// nombre. Sin esto, si un mount anterior no alcanzó a limpiar su canal a
// tiempo (por una navegación rápida entre clases en vivo, o un remount),
// `supabase.channel(mismoNombre)` puede devolver una instancia que el cliente
// ya marcó como suscrita, y el `.on(...)` de la nueva suscripción revienta
// con "cannot add postgres_changes callbacks... after subscribe()" — ese es
// justo el crash que tira al estudiante de vuelta a la ruta anterior.
const freshChannel = (name) => {
  supabase.getChannels()
    .filter(ch => ch.topic === 'realtime:' + name)
    .forEach(ch => supabase.removeChannel(ch))
  return supabase.channel(name)
}
export const subscribeSession = (id, cb) =>
  freshChannel('live-session-' + id)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: `id=eq.${id}` },
        payload => cb(payload.new))
    .subscribe()
export const subscribeParticipants = (sessionId, cb) =>
  freshChannel('live-parts-' + sessionId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_participants', filter: `session_id=eq.${sessionId}` },
        () => cb())
    .subscribe()
// Antes de unirse no hay session id todavía — se escucha por curso. cb() se
// reinvoca en cualquier cambio; quien la use debe re-consultar fetchActiveSessionForCourse.
export const subscribeCourseSessions = (courseId, cb) =>
  freshChannel('live-course-' + courseId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: `course_id=eq.${courseId}` },
        () => cb())
    .subscribe()
export const unsubscribe = (ch) => { if (ch) supabase.removeChannel(ch) }

// --- Hook: sesión guiada del curso del estudiante ---
// Detecta si el profesor tiene una Clase en Vivo Guiada activa para
// `courseId`, expone la sesión (para el banner de invitación) y una acción
// `join()` para unirse con la identidad del estudiante logueado.
const GUIDED_JOINED_KEY = 'experia:guided-joined' // { [courseId]: sessionId } — re-unirse tras recargar

export const useGuidedSession = (courseId) => {
  const [session, setSession]         = React.useState(null)
  const [participant, setParticipant] = React.useState(null)

  const join = React.useCallback(async () => {
    const p = await joinLiveSessionForCourse(courseId)
    setParticipant(p)
    try {
      const raw = JSON.parse(sessionStorage.getItem(GUIDED_JOINED_KEY) || '{}')
      raw[courseId] = p.session_id
      sessionStorage.setItem(GUIDED_JOINED_KEY, JSON.stringify(raw))
    } catch (_) { /* modo incógnito */ }
    return p
  }, [courseId])

  React.useEffect(() => { setSession(null); setParticipant(null) }, [courseId])

  // Antes de unirse: vigila si el curso tiene una clase activa (para el banner
  // de invitación) y reintenta el auto-join si el estudiante ya estaba dentro
  // de ESTA sesión antes de recargar. Se apaga apenas hay `participant` — una
  // vez unido, la sesión puntual la seguimos aparte (ver el efecto de abajo),
  // así no quedan dos polls corriendo a la vez durante la clase.
  React.useEffect(() => {
    if (!courseId || participant) return
    const resync = () => fetchActiveSessionForCourse(courseId).then(s => {
      setSession(s)
      if (s) {
        try {
          const raw = JSON.parse(sessionStorage.getItem(GUIDED_JOINED_KEY) || '{}')
          if (raw[courseId] === s.id) join()
        } catch (_) { /* modo incógnito */ }
      }
    })
    resync()
    const ch = subscribeCourseSessions(courseId, resync)
    // 20s: esto corre en TODO estudiante logueado en un curso, todo el tiempo
    // (no solo durante una clase) — es la red de seguridad del realtime, que
    // ya detecta una clase nueva al instante en el caso normal. 7s aquí era
    // gasto constante sin beneficio real para el 99% del tiempo sin clase.
    const poll = setInterval(resync, 20000)
    return () => { unsubscribe(ch); clearInterval(poll) }
  }, [courseId, participant, join])

  // Ya unido: seguir ESTA sesión por id, SIN excluir 'ended' — a diferencia de
  // fetchActiveSessionForCourse (pensado solo para el banner pre-unión), aquí
  // sí necesitamos ver el 'ended' para que GuidedClassView pinte el podio y
  // app.jsx pueda sacar al estudiante de vuelta al mapa (ver su useEffect del
  // timeout). Sin esto, la sesión desaparece (se vuelve null) apenas termina
  // y el estudiante se queda con pantalla en blanco para siempre.
  React.useEffect(() => {
    if (!participant) return
    let alive = true
    const resync = () => fetchSession(participant.session_id).then(s => { if (alive) setSession(s) })
    resync()
    const ch = subscribeSession(participant.session_id, setSession)
    const poll = setInterval(resync, 7000)
    return () => { alive = false; unsubscribe(ch); clearInterval(poll) }
  }, [participant])

  // Limpia también `session` (no solo `participant`): si quedara la sesión
  // 'ended' puesta, `pendingGuided` en app.jsx (`!!guided.session`) seguiría
  // viendo un valor truthy y el candado de ruta (`RouteLockOverlay`) le
  // seguiría tapando el mapa al estudiante — parecería que "no lo devuelve",
  // aunque GuidedClassView ya lo haya soltado.
  const leave = React.useCallback(() => { setParticipant(null); setSession(null) }, [])

  return { session, isJoined: !!participant, participant, join, leave }
}
