import React from 'react'
import { Confetti, RichText } from './ui.jsx'
import {
  submitLiveAnswer, fetchSession, fetchParticipants, fetchAnswerCounts,
  subscribeSession, subscribeParticipants, unsubscribe,
} from '../lib/liveClient.js'
import { sCorrect, sWrong, sTick, sPodium } from '../lib/sound.js'
import { reactCharacter } from '../store/store.jsx'

// El avatar del estudiante (kit de DiceBear, ~250 KB) va en su propio chunk y
// solo se descarga cuando hay avatar que mostrar — es decir, en la Clase en Vivo
// Guiada. La página pública del PIN no pasa `avatar` y nunca lo carga.
const LiveAvatar = React.lazy(() => import('./LiveAvatar.jsx'))
const MyAvatar = ({ cfg, size, expression }) => (cfg
  ? <React.Suspense fallback={null}><LiveAvatar cfg={cfg} size={size} expression={expression} /></React.Suspense>
  : null)
// =============================================
// EXPERIA — Modo Aula en Vivo: ciclo de pregunta/revelado/explicación,
// repetido pregunta por pregunta, y podio al final (sep 2026: se quitó la
// tabla de posiciones intermedia — el ranking solo se muestra en el podio,
// para no repartir la atención entre competir y entender cada pregunta).
// Compartido entre la página pública del estudiante (LivePlay.jsx) y la
// Clase en Vivo Guiada (GuidedClassView.jsx). Sirve tanto para quiz
// (con respuesta correcta y puntaje) como para poll/encuesta (sin
// respuesta correcta: muestra distribución en vivo en vez de acierto/error).
// =============================================

export const OPT_COLORS = ['#E8732C', '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EF4444']
export const cardStyle = { background: 'var(--white)', borderRadius: 20, padding: '24px 22px', boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)' }

export const Countdown = ({ startedAt, limit }) => {
  const [left, setLeft] = React.useState(limit)
  const lastTick = React.useRef(null)
  React.useEffect(() => {
    if (!startedAt) return
    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000
      const l = Math.max(0, Math.ceil(limit - elapsed))
      setLeft(l)
      if (l > 0 && l <= 5 && lastTick.current !== l) { lastTick.current = l; sTick() }
    }
    tick(); const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [startedAt, limit])
  const pct = Math.max(0, Math.min(100, (left / limit) * 100))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', borderRadius: 6, transition: 'width .25s linear',
          background: left <= 5 ? 'var(--error)' : 'var(--orange)' }} />
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color: left <= 5 ? 'var(--error)' : 'var(--dark)', minWidth: 28, textAlign: 'right' }}>{left}</span>
    </div>
  )
}

export const Ranking = ({ list, meId }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {list.map((p, i) => {
      const mine = p.id === meId
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      return (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
          background: mine ? 'var(--orange-bg)' : 'var(--bg)', border: mine ? '1.5px solid var(--orange)' : '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, minWidth: 26 }}>{medal}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{p.nombre} {p.apellido || ''}{mine ? ' (tú)' : ''}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>{p.score}</span>
        </div>
      )
    })}
  </div>
)

// Barras de distribución en vivo (encuestas, sin respuesta correcta).
const PollBars = ({ sessionId, index, options, myAns }) => {
  const [counts, setCounts] = React.useState(null)
  React.useEffect(() => {
    let cancel = false
    const load = () => fetchAnswerCounts(sessionId, index, options.length).then(c => { if (!cancel) setCounts(c) })
    load(); const id = setInterval(load, 2000)
    return () => { cancel = true; clearInterval(id) }
  }, [sessionId, index, options.length])
  const total = (counts || []).reduce((a, c) => a + c, 0) || 1
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map((opt, i) => {
        const c = counts?.[i] || 0
        const pct = Math.round((c / total) * 100)
        return (
          <div key={i} style={{ padding: '10px 12px', borderRadius: 12, border: `2px solid ${i === myAns ? 'var(--purple)' : 'var(--border)'}`, background: 'var(--white)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 6 }}>
              <span>{opt}{i === myAns ? ' (tu respuesta)' : ''}</span>
              <span style={{ color: 'var(--muted)' }}>{c} · {pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 6, background: 'var(--bg-alt)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct + '%', borderRadius: 6, background: 'var(--purple)', transition: 'width .3s ease' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Ciclo de pregunta/revelado/explicación/podio ----------
// `avatar`: configuración del avatar del estudiante. Solo la pasa la Clase en
// Vivo Guiada (ahí hay sesión iniciada); en la página pública llega undefined y
// todo se ve exactamente como antes.
// `onEnded`: se dispara UNA sola vez cuando la sesión pasa a 'ended'. Solo la
// usa la página pública del PIN, para devolver al participante a Experia — el
// estudiante logueado ya sale solo (app.jsx llama a `guided.leave` a los 5 s y
// la pantalla vuelve a su ruta).
export const LiveQuestionView = ({ participant, Wrap, avatar = null, onEnded = null }) => {
  const Center = Wrap || (({ children }) => <div style={{ maxWidth: 460, margin: '0 auto' }}>{children}</div>)
  const [session, setSession]   = React.useState(null)
  const [parts, setParts]       = React.useState([])
  const [myAnswers, setMy]      = React.useState({})
  const [feedback, setFeedback] = React.useState(null)
  const [sending, setSending]   = React.useState(false)

  React.useEffect(() => {
    let chS, chP
    const reloadP = () => fetchParticipants(participant.session_id).then(setParts)
    const resync = () => { fetchSession(participant.session_id).then(s => s && setSession(s)); reloadP() }
    resync()
    chS = subscribeSession(participant.session_id, s => setSession(s))
    chP = subscribeParticipants(participant.session_id, reloadP)
    const poll = setInterval(resync, 7000)
    const onVis = () => { if (document.visibilityState === 'visible') resync() }
    document.addEventListener('visibilitychange', onVis)
    return () => { unsubscribe(chS); unsubscribe(chP); clearInterval(poll); document.removeEventListener('visibilitychange', onVis) }
  }, [participant.session_id])

  React.useEffect(() => { setFeedback(null) }, [session?.current_index, session?.phase === 'question'])

  // Fin de la clase → avisar una sola vez. El ref evita que el poll de 7 s y las
  // suscripciones realtime lo disparen en cada refresco de la sesión terminada.
  const avisadoFin = React.useRef(false)
  React.useEffect(() => {
    if (session?.status === 'ended' && !avisadoFin.current) {
      avisadoFin.current = true
      onEnded?.()
    }
  }, [session?.status, onEnded])

  const prevPhase = React.useRef(null)
  React.useEffect(() => {
    if (!session) return
    if (session.phase !== prevPhase.current) {
      if (session.phase === 'reveal') {
        const correct = session.current_reveal?.correct
        const mine = myAnswers[session.current_index]
        if (correct !== null && correct !== undefined && mine !== undefined) {
          const ok = mine === correct
          ok ? sCorrect() : sWrong()
          // El tutor del curso reacciona igual que en la ruta normal. En la
          // página pública del PIN no hay curso activo y reactCharacter no hace
          // nada, así que esto solo se nota en la Clase en Vivo Guiada.
          reactCharacter(ok ? 'correct' : 'wrong')
        }
      } else if (session.phase === 'explanation') {
        // El tutor lee en voz (globo) la explicación de la pregunta — el texto
        // completo sigue apareciendo también en la tarjeta de abajo, esto es
        // un refuerzo, no un reemplazo.
        const text = session.current_reveal?.explanation
        if (text) reactCharacter('idle', text)
      } else if (session.phase === 'podium') {
        sPodium()
        reactCharacter('liveEnd')   // cierre: tutor + avatar conversan
      } else if (session.phase === 'lobby') {
        reactCharacter('liveStart') // el tutor recibe al estudiante en la sala
      }
      prevPhase.current = session.phase
    }
  }, [session?.phase, session?.current_index]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!session) return <Center><p style={{ textAlign: 'center', color: 'var(--muted)' }}>Conectando…</p></Center>

  const idx = session.current_index
  const q = (session.questions || [])[idx] || {}
  const options = q.options || []
  const myAns = myAnswers[idx]
  const me = parts.find(p => p.id === participant.id)
  const myRank = parts.findIndex(p => p.id === participant.id) + 1

  const answer = async (i) => {
    if (myAns !== undefined || sending) return
    setSending(true); setMy(m => ({ ...m, [idx]: i }))
    try {
      const r = await submitLiveAnswer({ session: session.id, participant: participant.id, index: idx, answer: i, token: participant.claim_token })
      setFeedback(r)
    } catch (e) {
      setMy(m => { const n = { ...m }; delete n[idx]; return n })
      setFeedback({ error: e.message })
    } finally { setSending(false) }
  }

  if (session.phase === 'lobby') return (
    <Center><div style={cardStyle}>
      {avatar
        ? <MyAvatar cfg={avatar} size={96} expression="happy" />
        : <div style={{ fontSize: 40, textAlign: 'center' }}>✅</div>}
      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: '10px 0 6px' }}>¡Estás dentro!</h2>
      <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Hola <b>{me?.nombre || participant.nombre}</b>. Espera a que el profesor inicie…</p>
      <p style={{ textAlign: 'center', color: 'var(--subtle)', fontSize: 13, marginTop: 10 }}>{parts.length} participante(s) conectado(s)</p>
    </div></Center>
  )

  if (session.phase === 'podium' || session.status === 'ended') {
    const top = parts.slice(0, 5)
    return (
      <Center><Confetti /><div style={cardStyle}>
        {avatar
          ? <MyAvatar cfg={avatar} size={116} expression={myRank <= 3 ? 'wow' : 'happy'} />
          : <div style={{ fontSize: 44, textAlign: 'center' }}>🏆</div>}
        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 800, color: 'var(--dark)', margin: '8px 0 16px' }}>Resultados finales</h2>
        <Ranking list={top} meId={participant.id} />
        <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', borderRadius: 12, background: 'var(--orange-bg)' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tu posición: </span>
          <b style={{ color: 'var(--orange)' }}>#{myRank} · {me?.score || 0} pts</b>
        </div>
      </div></Center>
    )
  }

  if (session.phase === 'reveal' || session.phase === 'explanation') {
    const correct = session.current_reveal?.correct
    const isPoll = correct === null || correct === undefined
    const wasRight = myAns === correct
    return (
      <Center><div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Pregunta {idx + 1}</div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 14, lineHeight: 1.4 }}>{q.question}</h3>
        {isPoll ? (
          <PollBars sessionId={session.id} index={idx} options={options} myAns={myAns} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {options.map((opt, i) => {
              const isCorrect = i === correct, isMine = i === myAns
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  border: `2px solid ${isCorrect ? 'var(--success)' : isMine ? 'var(--error)' : 'var(--border)'}`,
                  background: isCorrect ? '#F0FDFA' : isMine ? '#FEF2F2' : 'var(--white)', color: 'var(--dark)',
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff',
                    fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{String.fromCharCode(65 + i)}</span>
                  {opt}{isCorrect && ' ✓'}{isMine && !isCorrect && ' ✗'}
                </div>
              )
            })}
          </div>
        )}
        {!isPoll && (myAns === undefined
          ? <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>No respondiste a tiempo.</p>
          : <>
              {/* Tu personaje reacciona al resultado, igual que en el curso */}
              <div style={{ marginTop: 14 }}>
                <MyAvatar cfg={avatar} size={84} expression={wasRight ? 'happy' : 'sad'} />
              </div>
              <p style={{ textAlign: 'center', marginTop: 10, fontSize: 14, fontWeight: 700, color: wasRight ? 'var(--success)' : 'var(--error)' }}>
                {wasRight ? `✓ ¡Correcto! +${feedback?.points ?? ''} pts` : '✗ Respuesta incorrecta'}
              </p>
            </>)}
        {session.phase === 'explanation' && (session.current_reveal?.explanation || session.current_reveal?.explanationImage) && (
          <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '3px solid var(--purple)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>💡 Explicación</div>
            {/* RichText, igual que en `challenges.jsx`: respeta los saltos de
                línea e interpreta **negrilla** y {{#hex|color}}. Con un <p>
                plano, un análisis estructurado se aplastaba en un solo bloque
                y los asteriscos salían literales. */}
            {session.current_reveal.explanation && <RichText as="p" style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{session.current_reveal.explanation}</RichText>}
            {session.current_reveal.explanationImage && <img src={session.current_reveal.explanationImage} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 10, marginTop: 10 }} />}
          </div>
        )}
      </div></Center>
    )
  }

  // phase === 'question'
  const answered = myAns !== undefined
  return (
    <Center><div style={cardStyle}>
      <Countdown startedAt={session.question_started_at} limit={q.time_limit_s || session.time_limit_s || 20} />
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        Pregunta {idx + 1} de {session.total_questions}
      </div>
      {q.image && <img src={q.image} alt="" style={{ width: '100%', maxHeight: q.imageHeight || 220, objectFit: 'contain', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border)' }} />}
      <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--dark)', marginBottom: 16, lineHeight: 1.4 }}>{q.question}</h3>
      {answered ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          {avatar
            ? <MyAvatar cfg={avatar} size={80} expression="idle" />
            : <div style={{ fontSize: 34 }}>📨</div>}
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginTop: 8 }}>¡Respuesta enviada!</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Espera a que el profesor muestre los resultados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => answer(i)} disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderRadius: 14, cursor: 'pointer',
                border: 'none', background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff', textAlign: 'left',
                fontFamily: 'var(--font)', fontSize: 16, fontWeight: 700, boxShadow: 'var(--sh-md)', opacity: sending ? .7 : 1 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,.25)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </button>
          ))}
        </div>
      )}
      {me && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--subtle)', marginTop: 14 }}>Tu puntaje: <b style={{ color: 'var(--orange)' }}>{me.score} pts</b> · #{myRank}</p>}
    </div></Center>
  )
}
