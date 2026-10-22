import React from 'react'
import { Confetti, RichText, QuestionText, useMobile } from './ui.jsx'
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
// repetido pregunta por pregunta, y podio al final. El ranking parcial va
// debajo del revelado/explicación (oct 2026), no como fase propia: la fase
// `leaderboard` se quitó en sep 2026 porque competía con la explicación.
// Compartido entre la página pública del estudiante (LivePlay.jsx) y la
// Clase en Vivo Guiada (GuidedClassView.jsx). Sirve tanto para quiz
// (con respuesta correcta y puntaje) como para poll/encuesta (sin
// respuesta correcta: muestra distribución en vivo en vez de acierto/error).
// =============================================

export const OPT_COLORS = ['#E8732C', '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EF4444']

// Opciones con imagen (gráficas, tablas): fondo blanco fijo, porque las
// imágenes vienen dibujadas sobre blanco y los temas de curso son oscuros.
export const OptionImage = ({ src, maxHeight = 170 }) => src ? (
  <img src={src} alt="" style={{ display: 'block', maxWidth: '100%', maxHeight, objectFit: 'contain',
    borderRadius: 8, background: '#fff', padding: 4 }} />
) : null
// Con imágenes, las opciones van en rejilla: 2 columnas si caben, 1 en celular.
export const optionsLayout = (optionImages, gap) => (optionImages || []).some(Boolean)
  ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap }
  : { display: 'flex', flexDirection: 'column', gap }
export const cardStyle = { background: 'var(--white)', borderRadius: 20, padding: '24px 22px', boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)' }
// En celular la tarjeta pierde margen interno para que el texto use el ancho.
const cardMobile = { ...cardStyle, borderRadius: 16, padding: '16px 14px' }

// Mientras la pregunta está abierta el puntaje ya cambió en el servidor (se
// suma al enviar), así que mostrarlo en vivo adelantaría si acertaste. Se
// congela la lista hasta el revelado — mismo criterio que el sonido.
export const useFrozenParts = (parts, frozen) => {
  const ref = React.useRef(parts)
  if (!frozen || !ref.current?.length) ref.current = parts
  return ref.current
}

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

export const Ranking = ({ list, meId, offset = 0 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {list.map((p, j) => {
      const i = j + offset
      const mine = p.id === meId
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
      return (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
          background: mine ? 'var(--orange-bg)' : 'var(--bg)', border: mine ? '1.5px solid var(--orange)' : '1px solid var(--border)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, minWidth: 26 }}>{medal}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 600, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre} {p.apellido || ''}{mine ? ' (tú)' : ''}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--orange)' }}>{p.score}</span>
        </div>
      )
    })}
  </div>
)

// Barra del estudiante: sus puntos, su puesto y en qué va la clase, siempre a
// la vista. "Ver ranking" despliega el top 5 (y su fila si no está en él).
export const LiveScoreBar = ({ parts, meId, phase, progress }) => {
  const isMobile = useMobile()
  const [open, setOpen] = React.useState(false)
  const list = useFrozenParts(parts, phase === 'question')
  const rank = list.findIndex(p => p.id === meId) + 1
  const me = rank > 0 ? list[rank - 1] : null
  const stat = (icon, value, label, color) => (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, padding: isMobile ? '8px 8px' : '10px 14px',
      borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
      <span style={{ fontSize: isMobile ? 15 : 20 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{value}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      </div>
    </div>
  )
  return (
    <div style={{ padding: isMobile ? 8 : 12, borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)',
      boxShadow: 'var(--sh-md)', marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: isMobile ? 6 : 10, alignItems: 'stretch' }}>
        {stat('⭐', `${me?.score ?? 0}`, 'Mis puntos', 'var(--orange)')}
        {stat('🏆', rank ? `#${rank}` : '—', list.length ? `Puesto de ${list.length}` : 'Puesto', 'var(--dark)')}
        {progress && stat('📍', progress.value, progress.label, 'var(--dark)')}
      </div>
      {list.length > 0 && (
        <button type="button" onClick={() => setOpen(o => !o)}
          style={{ width: '100%', marginTop: 6, padding: '6px', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700, color: 'var(--orange)' }}>
          {open ? 'Ocultar ranking ▴' : '🏆 Ver ranking de la clase ▾'}
        </button>
      )}
      {open && (
        <div style={{ marginTop: 4, animation: 'fadeUp .3s ease both' }}>
          <Ranking list={list.slice(0, 5)} meId={meId} />
          {me && rank > 5 && (
            <div style={{ marginTop: 8 }}><Ranking list={[me]} meId={meId} offset={rank - 1} /></div>
          )}
          {phase === 'question' && (
            <p style={{ fontSize: 11.5, color: 'var(--subtle)', textAlign: 'center', margin: '8px 0 0' }}>
              Se actualiza cuando el profesor muestre los resultados.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Texto de lectura de la pregunta (rondas del banco, 0075). Va en una caja con
// scroll propio para que las opciones no queden enterradas debajo de un texto
// largo; las imágenes (infografías, caricaturas) se abren en grande con un clic.
export const LivePassage = ({ passage, maxHeight = '42vh' }) => {
  if (!passage) return null
  const { intro, title, paragraphs, images, source } = passage
  return (
    <div style={{ maxHeight, overflowY: 'auto', marginBottom: 14, padding: '14px 16px', borderRadius: 14,
      background: 'var(--bg)', border: '1px solid var(--border)', WebkitOverflowScrolling: 'touch' }}>
      {intro && <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>{intro}</div>}
      {title && <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{title}</div>}
      {(paragraphs || []).map((p, i) => (
        <p key={i} style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.65, margin: '0 0 10px' }}>{p}</p>
      ))}
      {(images || []).map((im, i) => (
        <a key={i} href={im.url} target="_blank" rel="noreferrer" title="Abrir la imagen en grande"
          style={{ display: 'block', marginTop: 6 }}>
          <img src={im.url} alt={im.caption || title || 'Imagen de apoyo'}
            style={{ width: '100%', objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)', background: '#fff' }} />
        </a>
      ))}
      {source && <p style={{ fontSize: 11.5, color: 'var(--subtle)', fontStyle: 'italic', margin: '8px 0 0' }}>{source}</p>}
    </div>
  )
}

// Momento en que el tutor da la pista: entre 5 y 10 s después de abrir la
// pregunta (15 % del tiempo). Antes llegaba a un cuarto o un tercio del tiempo
// y en las lecturas (2–3 min) muchos ya habían respondido: la pista no se veía.
// Compartido con el panel del profesor.
export const hintDelayMs = (limitS) => Math.min(10, Math.max(5, Math.round((limitS || 20) * 0.15))) * 1000

// Lo que dice el tutor al revelar cada pregunta. Varias versiones para que no
// suene siempre igual; {n} = nombre del estudiante.
const CHEERS = [
  '¡Excelente, {n}! Diste en el blanco. 🎯',
  '¡Muy bien, {n}! Esa era la respuesta.',
  '¡Correcto, {n}! Vas con todo, sigue así.',
  '¡Eso es, {n}! Leíste muy bien la pregunta.',
]
const ENCOURAGE = [
  'Casi, {n}. Cada error es una pista para la próxima. 💪',
  'No pasa nada, {n}: mira la explicación y vamos por la siguiente.',
  '¡Ánimo, {n}! La siguiente es tuya.',
  'Tranquila/o, {n}: equivocarse aquí es practicar. ¡Sigue intentándolo!',
]
const TIMEOUT = [
  '¡Se acabó el tiempo, {n}! En la siguiente, confía en tu primera idea. ⏱️',
  'Uy, {n}, el reloj nos ganó. ¡Vamos con toda en la siguiente!',
]
const pick = (list, n) => list[Math.floor(Math.random() * list.length)].replace('{n}', n || 'colega')
const REVEAL_HOLD_MS = 12000

// Pista escrita: SOLO para la página pública del PIN, que no tiene tutor. En
// la Clase en Vivo Guiada la pista la dice el personaje del curso (ver el
// efecto de `hintKey`), no va como texto en la tarjeta.
const HintCard = ({ hint }) => (
  <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: 'var(--orange-bg)',
    borderLeft: '3px solid var(--orange)', animation: 'fadeUp .4s ease both' }}>
    <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>💡 Pista del tutor</div>
    <RichText as="p" style={{ fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.55, margin: 0 }}>{hint}</RichText>
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
// `moduleQuestions`: preguntas del módulo tal como las tiene el estudiante en su
// ruta (solo la Clase en Vivo Guiada lo pasa). Si el snapshot de la sesión no
// trae el texto de lectura o la pista (sesión creada antes de 0075, o snapshot
// incompleto), se completan desde aquí — misma posición, mismo orden.
// `parts` (opcional): participantes ya suscritos por quien llama (la vista
// guiada, que también los usa para la barra de puntaje). Sin ella este
// componente se suscribe por su cuenta — es el caso de la página del PIN.
// `scoreBar`: pinta aquí la barra de puntos/puesto. La vista guiada la apaga
// porque la pone ella misma sobre todas sus pantallas (lecciones incluidas).
export const LiveQuestionView = ({ participant, Wrap, avatar = null, onEnded = null, moduleQuestions = null, tutor = null, parts: partsProp = null, scoreBar = true }) => {
  const Center = Wrap || (({ children }) => <div style={{ maxWidth: 520, margin: '0 auto' }}>{children}</div>)
  const isMobile = useMobile()
  const card = isMobile ? cardMobile : cardStyle
  const [session, setSession]   = React.useState(null)
  const [ownParts, setParts]    = React.useState([])
  const parts = partsProp || ownParts
  const ownsParts = !partsProp
  const [myAnswers, setMy]      = React.useState({})
  const [feedback, setFeedback] = React.useState(null)
  const [sending, setSending]   = React.useState(false)

  React.useEffect(() => {
    let chS, chP
    const reloadP = () => { if (ownsParts) fetchParticipants(participant.session_id).then(setParts) }
    const resync = () => { fetchSession(participant.session_id).then(s => s && setSession(s)); reloadP() }
    resync()
    chS = subscribeSession(participant.session_id, s => setSession(s))
    if (ownsParts) chP = subscribeParticipants(participant.session_id, reloadP)
    const poll = setInterval(resync, 7000)
    const onVis = () => { if (document.visibilityState === 'visible') resync() }
    document.addEventListener('visibilitychange', onVis)
    return () => { unsubscribe(chS); unsubscribe(chP); clearInterval(poll); document.removeEventListener('visibilitychange', onVis) }
  }, [participant.session_id, ownsParts])

  React.useEffect(() => { setFeedback(null) }, [session?.current_index, session?.phase === 'question'])

  // Pista del tutor (rondas del banco): llega sola a un tercio del tiempo. El
  // tutor del curso la dice en su globo y queda escrita en la tarjeta. Se
  // calcula contra question_started_at (hora del servidor), así un estudiante
  // que entra tarde o recarga la ve en el mismo momento que los demás.
  const [hintShown, setHintShown] = React.useState(false)
  const withModuleData = (snap, i) => {
    const mq = moduleQuestions?.[i]
    if (!mq) return snap
    return { ...snap, passage: snap.passage || mq.passage, hint: snap.hint || mq.hint,
      questionAfter: snap.questionAfter || mq.questionAfter, optionImages: snap.optionImages || mq.optionImages }
  }
  const qNow = withModuleData((session?.questions || [])[session?.current_index] || {}, session?.current_index)
  const hintKey = session?.phase === 'question' ? `${session.current_index}|${session.question_started_at}` : null
  React.useEffect(() => {
    setHintShown(false)
    if (!hintKey || !qNow.hint || !session?.question_started_at) return
    const limit = qNow.time_limit_s || session.time_limit_s || 20
    const wait = new Date(session.question_started_at).getTime() + hintDelayMs(limit) - Date.now()
    const show = () => {
      setHintShown(true)
      reactCharacter('idle', '💡 Pista: ' + qNow.hint)
    }
    // Ya pasó el momento (entró tarde, o su reloj va adelantado respecto al
    // del servidor): el tutor la dice YA. Antes aquí solo se marcaba como
    // mostrada y el personaje nunca salía a decirla.
    if (wait <= 0) { show(); return }
    const t = setTimeout(show, wait)
    return () => clearTimeout(t)
  }, [hintKey]) // eslint-disable-line react-hooks/exhaustive-deps

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
        const nombre = (participant.nombre || '').split(' ')[0]
        if (correct !== null && correct !== undefined && mine !== undefined) {
          const ok = mine === correct
          ok ? sCorrect() : sWrong()
          // El tutor del curso sale de cuerpo completo a felicitar o a dar
          // ánimo, y se queda ~12 s (antes ~5 s: se retiraba antes de que el
          // estudiante lo viera). En la página pública del PIN no hay curso
          // activo y reactCharacter no hace nada.
          reactCharacter(ok ? 'correct' : 'wrong', pick(ok ? CHEERS : ENCOURAGE, nombre), REVEAL_HOLD_MS)
        } else if (correct !== null && correct !== undefined) {
          reactCharacter('wrong', pick(TIMEOUT, nombre), REVEAL_HOLD_MS)
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
  const q = withModuleData((session.questions || [])[idx] || {}, idx)
  const options = q.options || []
  const myAns = myAnswers[idx]
  const me = parts.find(p => p.id === participant.id)
  const myRank = parts.findIndex(p => p.id === participant.id) + 1
  const bar = scoreBar && session.status !== 'ended' && (
    <LiveScoreBar parts={parts} meId={participant.id} phase={session.phase}
      progress={session.total_questions ? { value: `${Math.min(idx + 1, session.total_questions)}/${session.total_questions}`, label: 'Pregunta' } : null} />
  )

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
    <Center>{bar}<div style={card}>
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
      <Center><Confetti /><div style={card}>
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
      <Center>{bar}<div style={card}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Pregunta {idx + 1}</div>
        <QuestionText as="h3" style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 14, lineHeight: 1.4 }}>{q.question}</QuestionText>
        {isPoll ? (
          <PollBars sessionId={session.id} index={idx} options={options} myAns={myAns} />
        ) : (
          <div style={optionsLayout(q.optionImages, 8)}>
            {options.map((opt, i) => {
              const isCorrect = i === correct, isMine = i === myAns
              return (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                  border: `2px solid ${isCorrect ? 'var(--success)' : isMine ? 'var(--error)' : 'var(--border)'}`,
                  // El fondo de acierto/error es un tinte CLARO fijo (mint/rojo), a propósito
                  // igual en cualquier tema — así que el texto también debe ser un oscuro fijo.
                  // `var(--dark)` no sirve aquí: los temas de curso la invierten (queda clara,
                  // pensada para su propio fondo oscuro) y sobre este fondo claro se volvía
                  // casi invisible. Solo la opción neutra usa var(--dark)/var(--white), que sí
                  // se invierten juntas de forma consistente en los temas.
                  background: isCorrect ? '#F0FDFA' : isMine ? '#FEF2F2' : 'var(--white)',
                  color: (isCorrect || isMine) ? '#1A1A2E' : 'var(--dark)',
                  display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff',
                    fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <OptionImage src={q.optionImages?.[i]} maxHeight={140} />
                    <RichText>{opt}</RichText>{isCorrect && ' ✓'}{isMine && !isCorrect && ' ✗'}
                  </span>
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
                {wasRight ? `✓ ¡Correcto!${feedback?.points != null ? ` +${feedback.points} pts` : ''}` : '✗ Respuesta incorrecta'}
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
      </div>
      {/* Ranking parcial: va DEBAJO del resultado y la explicación, nunca
          como pantalla aparte, para que no le quite el foco a entender la
          pregunta (por eso se quitó en sep 2026 la fase `leaderboard`). */}
      {!isPoll && parts.length > 0 && (
        <div style={{ ...card, marginTop: 16, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 12 }}>🏆 Ranking de la clase</div>
          <Ranking list={parts.slice(0, 5)} meId={participant.id} />
          {myRank > 5 && (
            <div style={{ marginTop: 10, textAlign: 'center', padding: '10px', borderRadius: 12, background: 'var(--orange-bg)' }}>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tu posición: </span>
              <b style={{ color: 'var(--orange)' }}>#{myRank} · {me?.score || 0} pts</b>
            </div>
          )}
        </div>
      )}
      </Center>
    )
  }

  // phase === 'question'
  const answered = myAns !== undefined
  return (
    <Center>{bar}<div style={card}>
      <Countdown startedAt={session.question_started_at} limit={q.time_limit_s || session.time_limit_s || 20} />
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        Pregunta {idx + 1} de {session.total_questions}
      </div>
      <LivePassage passage={q.passage} />
      {q.image && (
        <a href={q.image} target="_blank" rel="noreferrer" title="Abrir la imagen en grande">
          <img src={q.image} alt="" style={{ width: '100%', maxHeight: q.imageHeight || 260, objectFit: 'contain', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border)', background: '#fff' }} />
        </a>
      )}
      {/* RichText: respeta los saltos de línea (tablas, pasos, ecuaciones) y la
          **negrilla** con que algunas preguntas resaltan palabras del texto. */}
      <QuestionText as="h3" style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'var(--dark)', marginBottom: q.questionAfter ? 8 : 16, lineHeight: 1.4 }}>{q.question}</QuestionText>
      {q.questionAfter && <RichText as="h3" style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'var(--dark)', marginBottom: 16, lineHeight: 1.4 }}>{q.questionAfter}</RichText>}
      {/* La pista la DICE el tutor del curso: el personaje se despliega desde
          su insignia (abajo a la derecha) con la pista en su globo. Solo sin
          tutor (página pública del PIN) queda como tarjeta de texto. */}
      {!tutor && q.hint && hintShown && <HintCard hint={q.hint} />}
      {answered ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          {avatar
            ? <MyAvatar cfg={avatar} size={80} expression="idle" />
            : <div style={{ fontSize: 34 }}>📨</div>}
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginTop: 8 }}>¡Respuesta enviada!</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Espera a que el profesor muestre los resultados.</p>
        </div>
      ) : (
        <div style={optionsLayout(q.optionImages, 10)}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => answer(i)} disabled={sending}
              style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 12, padding: isMobile ? '13px 12px' : '16px', borderRadius: 14, cursor: 'pointer',
                border: 'none', background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff', textAlign: 'left',
                fontFamily: 'var(--font)', fontSize: isMobile ? 15 : 16, fontWeight: 700, boxShadow: 'var(--sh-md)', opacity: sending ? .7 : 1 }}>
              <span style={{ width: 26, height: 26, borderRadius: 7, background: 'rgba(255,255,255,.25)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>{String.fromCharCode(65 + i)}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <OptionImage src={q.optionImages?.[i]} />
                {opt && <RichText style={{ lineHeight: 1.4 }}>{opt}</RichText>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div></Center>
  )
}
