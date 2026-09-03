import React from 'react'
import { useStore, dbModToAppMod, resolveCourseForStudent } from '../store/store.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { Btn, Confetti, RichText } from '../components/ui.jsx'
import { LessonBody } from './lesson.jsx'
import {
  createLiveSession, liveGotoModule, liveCompleteModuleForParticipants,
  liveSetPhase, liveGoto, liveEnd, saveLiveClosingNotes,
  fetchSession, fetchParticipants, fetchAnswerCounts,
  subscribeSession, subscribeParticipants, unsubscribe,
} from '../lib/liveClient.js'
import { primeAudio, isMuted, toggleMute, sStart, sReveal, sPodium } from '../lib/sound.js'
// =============================================
// EXPERIA — Clase en Vivo Guiada · Profesor (control)
// El profesor recorre TODA la ruta del curso (lección, encuesta, quiz) y los
// estudiantes conectados ven exactamente el mismo módulo, en el mismo momento.
// =============================================

const PROD_BASE = 'https://experia-app.pages.dev'
const OPT_COLORS = ['#E8732C', '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EF4444']
const HOST_KEY = 'experia:live-host'
const TYPE_LABEL = { lesson: '📖 Lección', challenge: '🎯 Reto', evaluation: '🎯 Evaluación', final_delivery: '🏁 Entrega final' }

// Impresión del informe de cierre: igual patrón que el acta de cierre y la
// tabla de efectividad (§12/§13 de CLAUDE.md) — solo el documento sale en
// la hoja, el resto de la pantalla se oculta con `@media print`.
const LIVE_REPORT_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    #live-report-print, #live-report-print * { visibility: visible !important; }
    #live-report-print {
      position: absolute; left: 0; top: 0; width: 100%; padding: 0 24px;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
    }
    .no-print { display: none !important; }
  }
`

// ---------- Informe de cierre (tras finalizar la clase) ----------
// El profesor puede generar, tras finalizar, un informe con el resultado
// final y agregar comentarios generales de la sesión. Los comentarios se
// guardan en live_sessions.closing_notes (0061); el resto del informe se
// arma con datos que ya existen (participantes/ranking) — no hay tabla nueva.
const ClosingReport = ({ session, parts, onSaved }) => {
  const [open, setOpen]       = React.useState(false)
  const [notes, setNotes]     = React.useState(session.closing_notes || '')
  const [saving, setSaving]   = React.useState(false)
  const [savedAt, setSavedAt] = React.useState(null)

  const save = async () => {
    setSaving(true)
    try {
      const s = await saveLiveClosingNotes(session.id, notes)
      onSaved(s)
      setSavedAt(new Date())
    } catch (e) { alert('Error: ' + (e?.message || e)) }
    finally { setSaving(false) }
  }

  if (!open) return (
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <Btn variant="secondary" onClick={() => setOpen(true)}>📄 Generar informe de cierre</Btn>
    </div>
  )

  const start = session.created_at ? new Date(session.created_at) : null
  const end   = session.ended_at ? new Date(session.ended_at) : null
  const fecha = (end || start)?.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) || '—'
  const rango = start && end
    ? `${start.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`
    : null

  return (
    <div style={{ padding: '20px 24px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 20 }}>
      <style>{LIVE_REPORT_PRINT_CSS}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', margin: 0 }}>Informe de cierre</h2>
        <Btn variant="gradient" size="sm" onClick={() => window.print()}>🖨️ Descargar informe</Btn>
      </div>

      <div id="live-report-print" style={{ background: '#fff', color: '#1a1a2e' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#666', fontWeight: 700 }}>Experia by CEINFES</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>INFORME DE CIERRE — CLASE EN VIVO</h1>
          <div style={{ fontSize: 13, color: '#444' }}>{session.title || 'Sesión sin título'}</div>
        </div>

        <table style={{ width: '100%', fontSize: 12, marginBottom: 20, borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '4px 0', width: 110, color: '#666' }}>Fecha</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{fecha}</td>
              <td style={{ padding: '4px 0', width: 90, color: '#666' }}>Horario</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{rango || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '4px 0', color: '#666' }}>Participantes</td>
              <td style={{ padding: '4px 0', fontWeight: 600 }}>{parts.length}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 8 }}>
          Resultado final
        </div>
        <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', marginBottom: 22 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1a1a2e' }}>
              <th style={{ textAlign: 'left', padding: '6px 4px', width: 30 }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Nombre</th>
              <th style={{ textAlign: 'left', padding: '6px 4px', width: 100 }}>Salón</th>
              <th style={{ textAlign: 'right', padding: '6px 4px', width: 70 }}>Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {parts.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '12px 4px', color: '#888', fontStyle: 'italic' }}>Sin participantes.</td></tr>
            ) : parts.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #e5e5e5' }}>
                <td style={{ padding: '5px 4px', color: '#888' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                <td style={{ padding: '5px 4px' }}>{p.nombre} {p.apellido || ''}</td>
                <td style={{ padding: '5px 4px', color: '#555' }}>{p.salon || '—'}</td>
                <td style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 700 }}>{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 6 }}>
            Comentarios generales de la sesión
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, minHeight: 40 }}>
            {notes || '—'}
          </p>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: 18 }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>
          Comentarios generales de la sesión
        </label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
          placeholder="Desarrollo de la clase, temas a reforzar, incidencias…"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)',
            fontFamily: 'var(--font)', fontSize: 13, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <Btn variant="primary" size="sm" disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar comentarios'}</Btn>
          {savedAt && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Guardado ✓</span>}
        </div>
      </div>
    </div>
  )
}

// ---------- Lanzador: elegir curso ----------
const Launcher = ({ onStarted }) => {
  const user = useStore(s => s.user)
  const courses = useStore(s => s.courses) || []
  const userCourses = useStore(s => s.userCourses) || []

  const allowedIds = new Set(userCourses.filter(uc => uc.user_id === user?.id && uc.is_active).map(uc => uc.course_id))
  const myCourses = courses.filter(c => c.is_active && (allowedIds.size === 0 || allowedIds.has(c.id)))

  const [courseId, setCourseId]         = React.useState('') // lo que el profe elige en el <select>
  const [effectiveId, setEffectiveId]   = React.useState('') // fork del colegio si existe (ver abajo)
  const [moduleList, setModuleList]     = React.useState([])
  const [loading, setLoading]           = React.useState(false)
  const [busy, setBusy]                 = React.useState(false)
  const [err, setErr]                   = React.useState('')

  // El editor de ruta SIEMPRE edita el fork del colegio del profesor, nunca el
  // curso base (ver InstructorRouteEditor.jsx) — así que el contenido real
  // (incluidas preguntas de simulacro agregadas después, como en Sala de Escape
  // - Matemáticas) vive ahí, no en el curso base. Si aquí se consultara
  // `course_modules` con el id base tal cual, la clase en vivo arrancaría con
  // una ruta desactualizada (menos módulos de los que el profe ve en su editor)
  // — por eso se resuelve al fork del colegio ANTES de leer la ruta, con la
  // misma función que ya usan los estudiantes para ver contenido (resolveCourseForStudent).
  React.useEffect(() => {
    if (!courseId) { setModuleList([]); setEffectiveId(''); return }
    let alive = true
    setLoading(true); setErr('')
    resolveCourseForStudent(courseId, user?.institution_id).then(id => {
      if (!alive) return
      setEffectiveId(id)
      return supabase.from('course_modules').select('*').eq('course_id', id).order('"order"')
    }).then(res => {
      if (!alive || !res) return
      const { data, error } = res
      if (error) setErr('No se pudo cargar la ruta: ' + error.message)
      setModuleList(data || [])
      setLoading(false)
    })
    return () => { alive = false }
  }, [courseId, user?.institution_id])

  const start = async () => {
    if (!courseId || !moduleList.length) return
    primeAudio() // desbloquea el audio dentro del gesto de clic
    setBusy(true); setErr('')
    try {
      const courseName = myCourses.find(c => c.id === courseId)?.name || null
      // effectiveId (el fork), no courseId crudo — es el mismo id que usa el
      // estudiante para ver su ruta (ver useGuidedSession en app.jsx), así la
      // sesión, la ruta que lee este panel y lo que el estudiante ve coinciden.
      const session = await createLiveSession({ courseId: effectiveId, title: courseName })
      const started = await liveGotoModule({ session: session.id, moduleId: moduleList[0].id })
      try { sessionStorage.setItem(HOST_KEY, JSON.stringify({ session: started.id, courseId: effectiveId })) } catch (_) {}
      onStarted(started, effectiveId, moduleList)
    } catch (e) { setErr(e.message || 'No se pudo crear la sesión'); setBusy(false) }
  }

  const inp = { padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, width: '100%', boxSizing: 'border-box', background: 'var(--white)' }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40 }}>🎮</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', margin: '8px 0 4px' }}>Clase en Vivo Guiada</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Recorre toda la ruta del curso en vivo — tus estudiantes ven el mismo módulo que tú, a la par.</p>
      </div>

      <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Curso</label>
      <select value={courseId} onChange={e => setCourseId(e.target.value)} style={{ ...inp, marginBottom: 18 }}>
        <option value="">— Elige un curso —</option>
        {myCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      {loading && <p style={{ color: 'var(--muted)', fontSize: 14 }}>Cargando ruta…</p>}
      {!loading && courseId && moduleList.length === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Este curso todavía no tiene módulos. Créalos en el Editor de Ruta.</p>
      )}
      {!loading && moduleList.length > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>{moduleList.length} módulo(s) en la ruta</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {moduleList.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--dark)' }}>
                <span style={{ width: 20, textAlign: 'center', color: 'var(--subtle)', fontWeight: 700 }}>{i + 1}</span>
                <span>{TYPE_LABEL[m.type] || '📄'}</span>
                <span style={{ flex: 1 }}>{m.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {err && <p style={{ fontSize: 13, color: 'var(--error)', marginBottom: 14, fontWeight: 600 }}>{err}</p>}
      <Btn variant="gradient" size="lg" full disabled={!moduleList.length || busy || loading} onClick={start}>
        {busy ? 'Creando…' : '▶ Iniciar clase en vivo'}
      </Btn>
    </div>
  )
}

// ---------- Panel de control ----------
const Control = ({ session: initial, moduleList, onExit }) => {
  const [session, setSession] = React.useState(initial)
  const [parts, setParts]     = React.useState([])
  const [counts, setCounts]   = React.useState([])
  const [muted, setMuted]     = React.useState(isMuted())
  const [busy, setBusyGoto]   = React.useState(false)

  React.useEffect(() => {
    let chS, chP
    const reload = () => fetchParticipants(session.id).then(setParts)
    const resync = () => { fetchSession(session.id).then(s => s && setSession(s)); reload() }
    reload()
    chS = subscribeSession(session.id, s => setSession(s))
    chP = subscribeParticipants(session.id, reload)
    // Red de seguridad si el realtime se cae: re-sincroniza periódicamente y al volver a la pestaña
    const poll = setInterval(resync, 7000)
    const onVis = () => { if (document.visibilityState === 'visible') resync() }
    document.addEventListener('visibilitychange', onVis)
    return () => { unsubscribe(chS); unsubscribe(chP); clearInterval(poll); document.removeEventListener('visibilitychange', onVis) }
  }, [session.id])

  // Sonidos al cambiar de fase
  const prevPhase = React.useRef(session.phase)
  React.useEffect(() => {
    if (session.phase !== prevPhase.current) {
      if (session.phase === 'question') sStart()
      else if (session.phase === 'reveal') sReveal()
      else if (session.phase === 'podium') sPodium()
      prevPhase.current = session.phase
    }
  }, [session.phase, session.current_index])

  const currentIdx    = moduleList.findIndex(m => m.id === session.module_id)
  const currentModule = currentIdx >= 0 ? moduleList[currentIdx] : null
  const isLastModule  = currentIdx === moduleList.length - 1
  const isInteractive = currentModule?.type === 'challenge' && ['quiz', 'poll'].includes(currentModule?.challenge_type)
  const isPoll        = currentModule?.challenge_type === 'poll'

  const idx   = session.current_index
  const total = session.total_questions
  const phase = session.phase
  const localQ = currentModule?.challenge_data?.questions?.[idx]
  const snapQ  = (session.questions || [])[idx] || {}
  const options = localQ?.options || snapQ.options || []
  const correct = isPoll ? null : (localQ ? localQ.correct : session.current_reveal?.correct)
  const hasExplanation = !isPoll && !!(localQ?.explanation || localQ?.explanationImage || session.current_reveal?.explanation)

  // Poll de la distribución de respuestas mientras la pregunta está abierta o revelada
  React.useEffect(() => {
    if (!(phase === 'question' || phase === 'reveal')) return
    let alive = true
    const load = () => fetchAnswerCounts(session.id, idx, options.length || 4).then(c => { if (alive) setCounts(c) })
    load(); const id = setInterval(load, 1500)
    return () => { alive = false; clearInterval(id) }
  }, [session.id, idx, phase, options.length])

  const answeredCount = counts.reduce((a, b) => a + b, 0)

  // Ejecuta una RPC de control y muestra el error si lo hubiera (clave para depurar)
  const run = (promise) => Promise.resolve(promise)
    .then(r => { if (r?.error) alert('Error: ' + r.error.message) })
    .catch(e => alert('Error: ' + (e?.message || e)))

  // Avanza/retrocede al módulo del índice dado en la ruta — otorga XP del
  // módulo que se deja atrás a los participantes conectados.
  const gotoModuleIdx = async (targetIdx) => {
    if (targetIdx < 0 || targetIdx >= moduleList.length || busy) return
    setBusyGoto(true)
    try {
      if (currentModule) await liveCompleteModuleForParticipants({ session: session.id, moduleId: currentModule.id })
      const s = await liveGotoModule({ session: session.id, moduleId: moduleList[targetIdx].id })
      setSession(s)
    } catch (e) { alert('Error: ' + (e?.message || e)) }
    finally { setBusyGoto(false) }
  }

  const finishSession = async () => {
    if (currentModule) await liveCompleteModuleForParticipants({ session: session.id, moduleId: currentModule.id })
    await run(liveEnd(session.id))
  }

  // Finalizar en CUALQUIER momento, no solo al llegar al último módulo. Sin
  // esto, una clase que el profesor abandona a mitad queda activa para siempre
  // y todos los estudiantes del curso siguen viendo la invitación para unirse.
  const endNow = async () => {
    if (!window.confirm(
      '¿Finalizar la clase en vivo?\n\n'
      + 'Los estudiantes conectados verán el podio y volverán a su ruta normal, '
      + 'y dejará de aparecerles la invitación para unirse.'
    )) return
    setBusyGoto(true)
    try { await finishSession() } finally { setBusyGoto(false) }
  }

  // Siguiente pregunta del módulo actual, o siguiente módulo / fin de clase si
  // era la última pregunta. Se llama desde reveal/explanation de cualquier
  // quiz o poll — no hay tabla de posiciones intermedia, el ranking vive
  // solo en el podio final.
  const advanceQuestionOrModule = () => {
    if (idx < total - 1) return run(liveGoto(session.id, idx + 1))
    return isLastModule ? finishSession() : gotoModuleIdx(currentIdx + 1)
  }

  const Big = ({ children, ...p }) => <Btn variant="gradient" size="lg" {...p}>{children}</Btn>

  // ----- Controles según fase del módulo actual -----
  const Controls = () => {
    if (!isInteractive) {
      // Lección, entrega final u otro reto no sincrónico: solo avanzar/finalizar.
      return isLastModule
        ? <Big disabled={busy} onClick={finishSession}>Finalizar clase en vivo 🏁</Big>
        : <Big disabled={busy} onClick={() => gotoModuleIdx(currentIdx + 1)}>Siguiente módulo →</Big>
    }
    if (phase === 'lobby') return <Big disabled={total === 0} onClick={() => run(liveGoto(session.id, 0))}>Comenzar {isPoll ? 'encuesta' : 'quiz'} ▶</Big>
    if (phase === 'question') return <Big onClick={() => run(liveSetPhase(session.id, 'reveal'))}>Mostrar resultados ({answeredCount}/{parts.length})</Big>
    // Sin tabla de posiciones intermedia (ranking solo al final, en el podio):
    // de revelado/explicación se avanza directo a la siguiente pregunta o,
    // si era la última, al siguiente módulo / fin de clase.
    if (phase === 'reveal' || phase === 'explanation') {
      const label = idx < total - 1 ? 'Siguiente pregunta' : isLastModule ? 'Finalizar clase en vivo' : 'Siguiente módulo'
      return (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {phase === 'reveal' && hasExplanation && <Big onClick={() => run(liveSetPhase(session.id, 'explanation'))}>Ver explicación 💡</Big>}
          <Btn variant="primary" size="lg" disabled={busy} onClick={advanceQuestionOrModule}>{label} →</Btn>
        </div>
      )
    }
    return null
  }

  const showQuestion = isInteractive && ['question', 'reveal', 'explanation'].includes(phase)
  const showPodium   = session.status === 'ended'

  const joinUrl = `${PROD_BASE}/#/live/${session.code}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=0&data=${encodeURIComponent(joinUrl)}`
  const flipMute = () => setMuted(toggleMute())

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg)' }}>
      {showPodium && <Confetti />}
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 20px 60px' }}>
        {/* Cabecera: PIN + QR + participantes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderRadius: 18, background: 'var(--gradient)', color: '#fff', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .8, textTransform: 'uppercase', letterSpacing: 1.5 }}>PIN de acceso (unión por invitado)</div>
            <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 6, lineHeight: 1.1 }}>{session.code}</div>
            <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>Tus estudiantes logueados se unen desde el aviso en su mapa.</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 8, lineHeight: 0 }}>
            <img src={qrSrc} alt="QR para unirse" width={110} height={110} style={{ display: 'block', borderRadius: 6 }} />
            <div style={{ fontSize: 10, color: '#6B7280', textAlign: 'center', marginTop: 4, fontWeight: 600 }}>Invitados sin cuenta</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 34, fontWeight: 900 }}>{parts.length}</div>
            <div style={{ fontSize: 12, opacity: .85, marginBottom: 8 }}>conectados</div>
            <button onClick={flipMute} title={muted ? 'Activar sonido' : 'Silenciar'}
              style={{ background: 'rgba(255,255,255,.2)', border: 'none', cursor: 'pointer', color: '#fff',
                borderRadius: 8, padding: '6px 10px', fontSize: 16, fontFamily: 'var(--font)' }}>
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Posición en la ruta */}
        {!showPodium && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <button onClick={() => gotoModuleIdx(currentIdx - 1)} disabled={currentIdx <= 0 || busy} title="Módulo anterior"
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)',
                cursor: currentIdx <= 0 ? 'default' : 'pointer', opacity: currentIdx <= 0 ? .4 : 1, fontSize: 15 }}>←</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                Módulo {currentIdx + 1} de {moduleList.length} · {TYPE_LABEL[currentModule?.type] || ''}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)' }}>{currentModule?.title}</div>
            </div>
            <button onClick={() => gotoModuleIdx(currentIdx + 1)} disabled={isLastModule || busy} title="Módulo siguiente"
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)',
                cursor: isLastModule ? 'default' : 'pointer', opacity: isLastModule ? .4 : 1, fontSize: 15 }}>→</button>
          </div>
        )}

        {/* Módulo no sincrónico: lección (contenido real, igual al del estudiante) u otro reto */}
        {!showPodium && !isInteractive && (
          currentModule?.type === 'lesson' ? (
            <div style={{ padding: '20px 24px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', borderRadius: 10,
                background: 'var(--orange-bg)', color: 'var(--orange)', fontSize: 12, fontWeight: 700 }}>
                📖 Vista previa — esto es lo que están leyendo tus estudiantes ahora mismo
              </div>
              <LessonBody mod={dbModToAppMod(currentModule)} />
            </div>
          ) : (
            <div style={{ padding: '20px 24px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⏭️</div>
              <p style={{ fontSize: 14, color: 'var(--muted)' }}>Este reto no es sincrónico — tus estudiantes lo resuelven por su cuenta cuando quieran. Avanza al siguiente módulo cuando quieras.</p>
            </div>
          )
        )}

        {/* Pregunta actual (vista del profe) */}
        {showQuestion && (
          <div style={{ padding: '20px 24px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              Pregunta {idx + 1} de {total} {phase !== 'question' && '· Resultados'}
            </div>
            {(localQ?.image || snapQ.image) && <img src={localQ?.image || snapQ.image} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 12, marginBottom: 12 }} />}
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 16, lineHeight: 1.35 }}>{localQ?.question || snapQ.question}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map((opt, i) => {
                const isCorrect = correct === i
                const n = counts[i] || 0
                const pct = answeredCount > 0 ? Math.round((n / answeredCount) * 100) : 0
                const reveal = phase !== 'question'
                return (
                  <div key={i} style={{ position: 'relative', overflow: 'hidden', padding: '14px 16px', borderRadius: 12,
                    border: `2px solid ${reveal && isCorrect ? 'var(--success)' : 'var(--border)'}`,
                    background: 'var(--white)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    {reveal && <div style={{ position: 'absolute', inset: 0, width: pct + '%', background: isCorrect ? '#DCFCE7' : 'var(--bg-alt)', transition: 'width .4s', zIndex: 0 }} />}
                    <span style={{ position: 'relative', zIndex: 1, width: 26, height: 26, borderRadius: 7, background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{String.fromCharCode(65 + i)}</span>
                    <span style={{ position: 'relative', zIndex: 1, flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>{opt}{reveal && isCorrect && ' ✓'}</span>
                    {reveal && <span style={{ position: 'relative', zIndex: 1, fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{n} · {pct}%</span>}
                  </div>
                )
              })}
            </div>
            {phase === 'explanation' && (localQ?.explanation || session.current_reveal?.explanation) && (
              <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '3px solid var(--purple)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>💡 Explicación</div>
                {/* RichText, igual que en `challenges.jsx` y en la vista del
                    estudiante: respeta los saltos de línea e interpreta
                    **negrilla** y {{#hex|color}}. Con un <p> plano, un análisis
                    estructurado se aplastaba en un bloque corrido y los
                    asteriscos salían literales — justo lo que el profesor
                    proyecta en pantalla. */}
                <RichText as="p" style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{localQ?.explanation || session.current_reveal?.explanation}</RichText>
              </div>
            )}
          </div>
        )}

        {/* Podio final (fin de la clase en vivo) */}
        {showPodium && (
          <div style={{ padding: '20px 24px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--dark)', marginBottom: 14, textAlign: 'center' }}>🏆 Clase finalizada</h2>
            {parts.length > 0 && <Podium top={parts.slice(0, 3)} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {parts.slice(0, 10).map((p, i) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: i < 3 ? 'var(--orange-bg)' : 'var(--bg)' }}>
                  <span style={{ fontSize: 16, fontWeight: 800, minWidth: 30 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: 'var(--dark)' }}>{p.nombre} {p.apellido || ''}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--orange)' }}>{p.score}</span>
                </div>
              ))}
              {parts.length === 0 && <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Sin participantes.</p>}
            </div>
          </div>
        )}

        {/* Informe de cierre: resultados + comentarios generales de la sesión */}
        {showPodium && <ClosingReport session={session} parts={parts} onSaved={setSession} />}

        {/* Controles del profesor */}
        {!showPodium && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Controls />
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {showPodium ? (
            <Btn variant="secondary" size="lg" onClick={() => { try { sessionStorage.removeItem(HOST_KEY) } catch (_) {} onExit() }}>Nueva clase en vivo</Btn>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <Btn variant="danger" disabled={busy} onClick={endNow}>Finalizar clase en vivo 🏁</Btn>
              <button
                onClick={() => {
                  if (!window.confirm(
                    'Vas a salir del panel SIN finalizar la clase.\n\n'
                    + 'La sesión seguirá activa y tus estudiantes seguirán viendo la invitación '
                    + 'para unirse. Úsalo solo si vas a volver en un momento.'
                  )) return
                  onExit()
                }}
                style={{ background: 'none', border: 'none', color: 'var(--subtle)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font)' }}>
                Salir sin finalizar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Podio animado top-3 (orden visual: 2º, 1º, 3º)
const Podium = ({ top }) => {
  const slots = [
    { p: top[1], place: 2, h: 70, medal: '🥈', color: '#C0C7D1' },
    { p: top[0], place: 1, h: 100, medal: '🥇', color: '#F4C430' },
    { p: top[2], place: 3, h: 50, medal: '🥉', color: '#CD7F32' },
  ]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, margin: '8px 0 22px' }}>
      {slots.map((s, i) => s.p ? (
        <div key={i} style={{ flex: 1, maxWidth: 150, textAlign: 'center', animation: `fadeUp .5s ${i * 140}ms ease both` }}>
          <div style={{ fontSize: 30 }}>{s.medal}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.p.nombre}</div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--orange)' }}>{s.p.score} pts</div>
          <div style={{ height: s.h, borderRadius: '10px 10px 0 0', marginTop: 6,
            background: s.color,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6,
            color: 'rgba(0,0,0,.45)', fontWeight: 900, fontSize: 18 }}>{s.place}</div>
        </div>
      ) : <div key={i} style={{ flex: 1, maxWidth: 150 }} />)}
    </div>
  )
}

const LiveHost = () => {
  const [session, setSession]       = React.useState(null)
  const [moduleList, setModuleList] = React.useState([])
  const [checked, setChecked]       = React.useState(false)

  // Reanuda una sesión activa si el profe recarga la página
  React.useEffect(() => {
    let done = false
    try {
      const raw = sessionStorage.getItem(HOST_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved?.session && saved?.courseId) {
          Promise.all([
            fetchSession(saved.session),
            supabase.from('course_modules').select('*').eq('course_id', saved.courseId).order('"order"'),
          ]).then(([s, { data }]) => {
            if (s && s.status !== 'ended') { setSession(s); setModuleList(data || []) }
            else { try { sessionStorage.removeItem(HOST_KEY) } catch (_) {} }
            setChecked(true)
          })
          done = true
        }
      }
    } catch (_) {}
    if (!done) setChecked(true)
  }, [])

  const exit = () => { try { sessionStorage.removeItem(HOST_KEY) } catch (_) {} setSession(null); setModuleList([]) }

  if (!checked) return null
  if (!session) return <Launcher onStarted={(s, courseId, list) => { setSession(s); setModuleList(list) }} />
  return <Control session={session} moduleList={moduleList} onExit={exit} />
}

export default LiveHost
