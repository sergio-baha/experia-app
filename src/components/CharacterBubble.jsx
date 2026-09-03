import React from 'react'
import { useStore, nav, selectActiveCourseTheme, calcLevel } from '../store/store.jsx'
import { getCharacter, getCharacterLine, getDialogue, cropAspect, cropStyle } from '../lib/characters.jsx'
import { rankFromLevel, avatarDisplayName, normalizeAvatar } from '../lib/avatarKit.jsx'
import { AvatarBody } from '../lib/avatarBody.jsx'

// =============================================================================
// CharacterFloat — tutor de cuerpo entero que ENTRA POR EL LADO de la pantalla
// -----------------------------------------------------------------------------
// Data-driven desde src/lib/characters.jsx: la ilustración (public/tutores),
// el lado, la paleta de efectos y los diálogos vienen del registro por tema.
//
// Dos modos:
//   · MONÓLOGO — el tutor irrumpe y dice una frase (saludo, acierto, error…).
//   · CONVERSACIÓN — si el estudiante ya creó su avatar, en ciertos momentos
//     entra también su personaje por el lado OPUESTO y se turnan la palabra.
//     Momentos: bienvenida al curso, cada 3 módulos, dos fallos seguidos y fin
//     de ruta. Sin avatar, todo degrada al monólogo de siempre.
//
// Se monta una sola vez de forma global (app.jsx → CourseAmbient). Si el curso
// no tiene tema, o el tema no tiene personaje/arte en el registro, no renderiza.
// =============================================================================

const ENTER_MS = 950   // duración de la entrada (sincronizada con xch-in)
const LEAVE_MS = 620   // duración de la salida  (sincronizada con xch-out)
const BUBBLE_MS = 620  // cuándo aparece el globo, ya casi aterrizado

const MILESTONE_EVERY = 3   // módulos completados entre conversaciones de hito
const WELCOME_KEY = 'experia:char-welcome:'
const VISIT_KEY   = 'experia:char-visit:'   // última visita al curso (ms)
const RANK_KEY    = 'experia:char-rank:'    // último rango visto en el curso
const COMEBACK_DAYS = 3                     // días sin entrar para el saludo de regreso

const readLS = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const writeLS = (k, v) => { try { localStorage.setItem(k, v) } catch { /* incógnito */ } }

// Cuánto dura un turno en pantalla, según lo que hay que leer.
const readMs = (text) => Math.min(9000, Math.max(3200, 1600 + (text?.length || 0) * 52))

// Partículas flotantes: se calculan una vez, no en cada render.
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  left: `${6 + (i * 37) % 88}%`,
  size: 3 + ((i * 7) % 5),
  delay: `${(i * 0.47) % 5.2}s`,
  dur: `${4.2 + ((i * 3) % 5) * 0.6}s`,
  drift: `${((i % 5) - 2) * 14}px`,
  alt: i % 3 === 0,
}))

// Estelas de velocidad que acompañan la irrupción.
const STREAKS = [
  { top: '18%', w: '62%', delay: '0s',    h: 3 },
  { top: '31%', w: '96%', delay: '.06s',  h: 2 },
  { top: '46%', w: '74%', delay: '.02s',  h: 4 },
  { top: '63%', w: '110%', delay: '.1s',  h: 2 },
  { top: '78%', w: '58%', delay: '.14s',  h: 3 },
]

// Máquina de escribir: revela el texto carácter a carácter.
const useTypewriter = (text, active) => {
  const [shown, setShown] = React.useState('')
  React.useEffect(() => {
    if (!text || !active) { setShown(text || ''); return }
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, 17)
    return () => clearInterval(id)
  }, [text, active])
  return shown
}

const Bubble = ({ name, text, typed, onClose, cta }) => (
  <div className="xch-bubble" key={text}>
    <div className="xch-bubble-glint" />
    <div className="xch-name">{name}</div>
    <div className="xch-line">“{typed}”<i className="xch-caret" /></div>
    {cta}
    {onClose && <button className="xch-close" onClick={onClose} aria-label="Cerrar">×</button>}
  </div>
)

export const CharacterFloat = () => {
  const theme = useStore(selectActiveCourseTheme)
  const reaction = useStore(s => s.charReaction)
  const user = useStore(s => s.user)
  const xp = useStore(s => s.xp)
  const completedCount = useStore(s => (s.completed || []).length)
  const courseId = useStore(s => s.enrolledCourseId)
  const char = theme ? getCharacter(theme) : null

  const avatarCfg = user?.avatarConfig ? normalizeAvatar(user.avatarConfig) : null
  const rank = rankFromLevel(calcLevel(xp || 0))
  const myName = avatarDisplayName(avatarCfg, user?.name)

  const [line, setLine] = React.useState(null)
  const [mood, setMood] = React.useState('idle')
  const [phase, setPhase] = React.useState('away')   // away | in | on | out
  const [bubble, setBubble] = React.useState(false)
  const [script, setScript] = React.useState(null)   // [{who,text,exp}] en conversación
  const [turn, setTurn] = React.useState(0)
  const [invite, setInvite] = React.useState(false)  // invitación a crear el avatar

  const timers = React.useRef([])
  const phaseRef = React.useRef('away')
  const wrongStreak = React.useRef(0)

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)) }
  const go = (p) => { phaseRef.current = p; setPhase(p) }

  const dismiss = React.useCallback(() => {
    clearTimers()
    setBubble(false)
    if (phaseRef.current === 'away') return
    go('out')
    later(() => { go('away'); setScript(null); setTurn(0); setInvite(false) }, LEAVE_MS)
  }, [])

  // Pone al tutor (y al avatar si hay guión) en escena.
  const enter = React.useCallback((afterEnter) => {
    if (phaseRef.current === 'on') { afterEnter(); return }
    setBubble(false)
    go('in')
    later(() => { setBubble(true); afterEnter() }, BUBBLE_MS)
    later(() => go('on'), ENTER_MS)
  }, [])

  // --- Monólogo ---
  const speak = React.useCallback((context, forced) => {
    const text = forced || getCharacterLine(theme, context)
    if (!text) return
    clearTimers()
    setScript(null); setTurn(0); setInvite(false)
    setLine(text)
    setMood(context === 'wrong' ? 'wrong'
      : context === 'correct' ? 'correct'
      : (context === 'moduleComplete' || context === 'routeComplete') ? 'cheer'
      : 'idle')
    enter(() => {})
    // Las líneas guionadas (getCharacterLine) son cortas y 12s les sobra; una
    // explicación de quiz en Aula en Vivo (`forced`) puede traer varios
    // párrafos (500-2200 caracteres) — el typewriter tipea a 17ms/carácter
    // (ver useTypewriter), así que el tope sube a 45s para que alcance a
    // terminar de escribirse antes de que el globo se retire solo, incluso
    // en la explicación más larga.
    const cap = forced ? 45000 : 12000
    later(dismiss, Math.min(cap, Math.max(5200, 2600 + text.length * 55)))
  }, [theme, dismiss, enter])

  // --- Conversación por turnos ---
  const converse = React.useCallback((dialogueContext) => {
    const s = getDialogue(theme, dialogueContext, myName)
    if (!s) return false
    clearTimers()
    setInvite(false)
    setScript(s); setTurn(0)
    setLine(s[0].text)
    setMood(dialogueContext === 'struggle' ? 'idle' : 'cheer')
    enter(() => {})

    // Encadena los turnos; al terminar el último, ambos se retiran.
    let acc = BUBBLE_MS
    s.forEach((t, i) => {
      if (i === 0) return
      acc += readMs(s[i - 1].text)
      later(() => { setTurn(i); setLine(t.text) }, acc)
    })
    later(dismiss, acc + readMs(s[s.length - 1].text))
    return true
  }, [theme, myName, dismiss, enter])

  // --- Invitación única a crear el avatar ---
  const inviteToCreate = React.useCallback(() => {
    clearTimers()
    setScript(null); setTurn(0)
    setInvite(true)
    setMood('idle')
    setLine('Antes de empezar, ponle cara a quien va a recorrer esto conmigo. Créate un avatar.')
    enter(() => {})
    later(dismiss, 13000)
  }, [dismiss, enter])

  // Saludo al entrar a un curso con tema (o al cambiar de curso).
  React.useEffect(() => {
    clearTimers()
    go('away'); setBubble(false); setLine(null); setScript(null); setInvite(false)
    wrongStreak.current = 0
    if (!char?.art) return

    const id = courseId || theme
    const welcomeKey = WELCOME_KEY + id
    const visitKey = VISIT_KEY + id
    const seen = readLS(welcomeKey) === '1'
    const last = Number(readLS(visitKey)) || 0
    const daysAway = last ? (Date.now() - last) / 86400000 : 0
    writeLS(visitKey, String(Date.now()))
    // El rango de referencia se fija en la primera visita, para no disparar un
    // "subiste de rango" solo por abrir el curso con progreso previo.
    if (readLS(RANK_KEY + id) === null) writeLS(RANK_KEY + id, String(rank))

    later(() => {
      if (!avatarCfg) { inviteToCreate(); return }        // aún no tiene avatar
      if (!seen) {
        writeLS(welcomeKey, '1')
        if (converse('welcome')) return                    // presentación mutua
      }
      if (daysAway >= COMEBACK_DAYS && converse('comeback')) return
      speak('idle')
    }, 1100)
    return clearTimers
  }, [theme, courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subida de rango: la armadura cambió, el tutor lo celebra. Se compara contra
  // el último rango visto EN ESTE CURSO (el rango depende del XP del curso).
  React.useEffect(() => {
    if (!char?.art || !avatarCfg) return
    const key = RANK_KEY + (courseId || theme)
    const prev = Number(readLS(key))
    if (!prev) { writeLS(key, String(rank)); return }
    if (rank > prev) {
      writeLS(key, String(rank))
      later(() => converse('rankUp'), 900)
    } else if (rank < prev) {
      writeLS(key, String(rank))   // cambió de curso: solo re-sincroniza
    }
  }, [rank, courseId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reacción a un evento del estudiante (correct/wrong/moduleComplete/…).
  React.useEffect(() => {
    if (!char?.art || !reaction) return
    const ctx = reaction.context

    // Racha de errores: dos seguidos en el mismo reto → conversación de ánimo.
    if (ctx === 'wrong') wrongStreak.current += 1
    else if (ctx === 'correct') wrongStreak.current = 0

    if (avatarCfg && !reaction.line) {
      // Cualquier contexto que tenga guión propio se juega como conversación
      // (routeComplete, liveEnd…). Los demás caen a monólogo salvo los dos
      // casos que dependen de un contador o una racha.
      if (converse(ctx)) return
      if (ctx === 'wrong' && wrongStreak.current >= 2 && converse('struggle')) {
        wrongStreak.current = 0
        return
      }
      if (ctx === 'moduleComplete' && completedCount > 0
        && completedCount % MILESTONE_EVERY === 0 && converse('milestone')) return
    }
    speak(ctx, reaction.line)
  }, [reaction?.ts]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => clearTimers, [])

  const typed = useTypewriter(line, bubble)

  if (!char?.art) return null
  const { ui, fx, art, side, flip } = char
  const onStage = phase !== 'away'
  const otherSide = side === 'left' ? 'right' : 'left'
  const current = script ? script[turn] : null
  const studentTurn = current?.who === 'student'
  // Cuando el avatar escucha (monólogo o turno del tutor) reacciona con la cara
  // al ánimo del momento, aunque no diga nada.
  const listeningExp = mood === 'wrong' ? 'sad' : mood === 'correct' || mood === 'cheer' ? 'happy' : 'idle'

  const vars = {
    '--xch-accent': fx.accent,
    '--xch-accent2': fx.accent2,
    '--xch-aura': fx.aura,
    '--xch-glow': fx.glow,
    '--xch-card': ui.bgCard,
    '--xch-border': ui.borderCard,
    '--xch-name': ui.nameColor,
    '--xch-text': ui.textColor,
    '--xch-ratio': cropAspect(art.body).toFixed(4),
  }

  // La silueta y el barrido de luz se recortan con la propia figura usando
  // mask-image: así los efectos "se pegan" al personaje y no a un rectángulo.
  const maskLayer = {
    ...cropStyle(art.body),
    aspectRatio: '1920 / 1080',
    WebkitMaskImage: `url("${art.src}")`,
    maskImage: `url("${art.src}")`,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  }

  return (
    <>
      {onStage && (
        <div className="xch-root" style={vars}
          data-side={side} data-phase={phase} data-mood={mood} data-fx={fx.entrance}>

          <div className="xch-aura" />
          <div className="xch-floor" />
          <div className="xch-ring xch-ring-1" />
          <div className="xch-ring xch-ring-2" />

          <div className="xch-streaks">
            {STREAKS.map((s, i) => (
              <i key={i} style={{ top: s.top, width: s.w, height: s.h, animationDelay: s.delay }} />
            ))}
          </div>

          <div className="xch-stage">
            {/* .xch-flip lleva el reflejo; .xch-figure lleva las animaciones de
                respiración/reacción, que también usan transform */}
            <div className="xch-flip" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
              <div className="xch-figure">
                <img className="xch-art" src={art.src} alt={char.name} draggable="false"
                  style={cropStyle(art.body)} />

                {/* destello blanco de la silueta al aterrizar */}
                <div className="xch-silhouette" style={maskLayer} />

                {/* barrido de luz sobre la figura (recortado a su silueta) */}
                <div className="xch-shine" style={maskLayer}><span /></div>

                {/* líneas de escaneo holográfico — tema laboratorio */}
                {fx.entrance === 'scan' && <div className="xch-scan" style={maskLayer} />}
              </div>
            </div>
          </div>

          <div className="xch-sparks">
            {SPARKS.map((s, i) => (
              <i key={i} style={{
                left: s.left, width: s.size, height: s.size,
                animationDelay: s.delay, animationDuration: s.dur,
                '--xch-drift': s.drift,
                background: s.alt ? 'var(--xch-accent2)' : 'var(--xch-accent)',
              }} />
            ))}
          </div>

          {/* zona sensible al clic, solo sobre la figura visible */}
          <button className="xch-hit" onClick={dismiss} aria-label={`Despedir a ${char.name}`} />

          {/* El globo del tutor calla mientras habla el avatar */}
          {bubble && line && !studentTurn && (
            <Bubble name={char.name} text={line} typed={typed} onClose={dismiss}
              cta={invite ? (
                <button className="xch-cta" onClick={() => { dismiss(); nav('profile', 'avatar') }}>
                  Crear mi avatar
                </button>
              ) : null} />
          )}
        </div>
      )}

      {/* El avatar del estudiante entra por el lado opuesto SIEMPRE que el tutor
          esté en escena: en conversación se turnan la palabra, y en monólogo
          acompaña en silencio reaccionando con la expresión. */}
      {onStage && avatarCfg && (
        // --xch-ratio se pisa DESPUÉS de vars: el del tutor viene del recorte de
        // su ilustración y aquí manda el lienzo del cuerpo (200×280).
        <div className="xch-root xch-root-student" style={{ ...vars, '--xch-ratio': '0.714' }}
          data-side={otherSide} data-phase={phase}>
          <div className="xch-aura" />
          <div className="xch-floor" />
          <div className="xch-stage">
            <div className="xch-figure">
              <div className="xch-body">
                <AvatarBody cfg={avatarCfg} rank={rank} fill
                  expression={studentTurn ? (current.exp || 'idle') : listeningExp} />
              </div>
            </div>
          </div>
          {bubble && studentTurn && (
            <Bubble name={myName} text={line} typed={typed} onClose={dismiss} />
          )}
        </div>
      )}

      {/* Insignia en reposo: la cara del tutor, siempre a mano */}
      <button
        className="xch-badge" style={{ ...vars, opacity: onStage ? 0 : 1, pointerEvents: onStage ? 'none' : 'auto' }}
        data-side={side}
        onClick={() => speak('idle')}
        title={`${char.name} — clic para escuchar`}
        aria-label={`${char.name} — clic para escuchar`}
      >
        <img src={art.src} alt="" draggable="false" style={cropStyle(art.head)} />
        <i className="xch-badge-ring" />
      </button>
    </>
  )
}

export default CharacterFloat
