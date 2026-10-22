import React from 'react'
import { dbModToAppMod } from '../store/store.jsx'
import { RichText, QuestionText } from './ui.jsx'
import { LessonSection, isTutorOnlySection } from '../pages/lesson.jsx'
import { LivePassage, OptionImage, OPT_COLORS } from './LiveQuestionView.jsx'
import { LIVE_TIME_OPTIONS } from '../lib/liveClient.js'
import { isQuestionRound, BANK_AREAS, ROUND_LABELS } from '../lib/questionBankMeta.js'

// =============================================
// EXPERIA — Clase en Vivo · Modo presentación del profesor
// Pantalla completa para proyectar, como un PowerPoint: escenario oscuro, una
// "diapositiva" grande a la vez y una barra inferior con ◀ / ▶ (o las flechas
// del teclado, Espacio, AvPág — sirve el control remoto de presentaciones).
// - Lección: cada sección es una diapositiva (más una portada). Las secciones
//   "Solo docente" no se proyectan: van en las notas (📝, tecla N).
//   El estudiante sigue viendo la lección completa en su dispositivo.
// - Ronda/quiz: ▶ hace el paso que toca — comenzar, mostrar resultados, ver
//   explicación, siguiente pregunta — y al final pasa al siguiente módulo.
// Los colores del escenario son literales (no variables): es una proyección y
// no debe cambiar con el modo oscuro ni el acento. Las diapositivas de lección
// sí usan las variables, porque reusan LessonSection tal cual.
// =============================================

const STAGE_BG = 'radial-gradient(1200px 600px at 10% -10%, rgba(236,103,26,.22), transparent 60%), radial-gradient(900px 500px at 110% 110%, rgba(124,58,237,.25), transparent 60%), #0E0F1A'
const BAR_BTN = {
  border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer',
  borderRadius: 10, padding: '8px 12px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font)', whiteSpace: 'nowrap',
}
const TYPE_ICON = { lesson: '📖', challenge: '🎯', evaluation: '🎯', final_delivery: '🏁', closing_record: '📋' }

// Escala del contenido de lección según el ancho: en un proyector 1080p el
// texto de LessonSection (pensado para leer de cerca) se ve pequeño.
const useStageScale = () => {
  const calc = () => (window.innerWidth >= 1700 ? 1.35 : window.innerWidth >= 1300 ? 1.2 : 1)
  const [scale, setScale] = React.useState(calc)
  React.useEffect(() => {
    const on = () => setScale(calc())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return scale
}

// Segundos que le quedan a la pregunta abierta (hora del servidor).
const useSecondsLeft = (startedAt, limit, active) => {
  const [left, setLeft] = React.useState(limit)
  React.useEffect(() => {
    if (!active || !startedAt) { setLeft(limit); return }
    const tick = () => setLeft(Math.max(0, Math.ceil(limit - (Date.now() - new Date(startedAt).getTime()) / 1000)))
    tick(); const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [startedAt, limit, active])
  return left
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const TimerRing = ({ left, limit, size = 92 }) => {
  const r = size / 2 - 6, c = 2 * Math.PI * r
  const pct = limit ? left / limit : 0
  const color = left <= 10 ? '#EF4444' : left <= 30 ? '#F59E0B' : '#10B981'
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,.15)" strokeWidth="8" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .25s linear, stroke .3s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.26, fontWeight: 900, color: left <= 10 ? '#FCA5A5' : '#fff' }}>
        {left > 0 ? fmt(left) : '⏰'}
      </div>
    </div>
  )
}

// Podio animado top-3 (orden visual: 2º, 1º, 3º). Lo usa también el panel.
export const Podium = ({ top, dark = false }) => {
  const slots = [
    { p: top[1], place: 2, h: 70, medal: '🥈', color: '#C0C7D1' },
    { p: top[0], place: 1, h: 100, medal: '🥇', color: '#F4C430' },
    { p: top[2], place: 3, h: 50, medal: '🥉', color: '#CD7F32' },
  ]
  const k = dark ? 1.6 : 1
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 * k, margin: '8px 0 22px' }}>
      {slots.map((s, i) => s.p ? (
        <div key={i} style={{ flex: 1, maxWidth: 150 * k, textAlign: 'center', animation: `fadeUp .5s ${i * 140}ms ease both` }}>
          <div style={{ fontSize: 30 * k }}>{s.medal}</div>
          <div style={{ fontSize: 13 * k, fontWeight: 700, color: dark ? '#fff' : 'var(--dark)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.p.nombre}</div>
          <div style={{ fontSize: 13 * k, fontWeight: 800, color: dark ? '#FDBA74' : 'var(--orange)' }}>{s.p.score} pts</div>
          <div style={{ height: s.h * k, borderRadius: '10px 10px 0 0', marginTop: 6,
            background: s.color,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 6,
            color: 'rgba(0,0,0,.45)', fontWeight: 900, fontSize: 18 * k }}>{s.place}</div>
        </div>
      ) : <div key={i} style={{ flex: 1, maxWidth: 150 * k }} />)}
    </div>
  )
}

const DarkRanking = ({ parts, limit = 10 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {parts.slice(0, limit).map((p, i) => (
      <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12,
        background: i < 3 ? 'rgba(236,103,26,.18)' : 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
        <span style={{ fontSize: 18, fontWeight: 800, minWidth: 34 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.nombre} {p.apellido || ''}
        </span>
        <span style={{ fontSize: 17, fontWeight: 900, color: '#FDBA74' }}>{p.score}</span>
      </div>
    ))}
    {parts.length === 0 && <p style={{ opacity: .7, textAlign: 'center' }}>Aún no hay participantes.</p>}
  </div>
)

// Diapositiva "papel": fondo de la app (respeta el tema) sobre el escenario.
const Paper = ({ children, scale = 1, center = false }) => (
  <div style={{ width: '100%', maxWidth: 1400, height: '100%', overflowY: 'auto', borderRadius: 22, background: 'var(--white)',
    color: 'var(--text)', boxShadow: '0 30px 80px rgba(0,0,0,.45)', animation: 'fadeIn .35s ease' }}>
    <div style={{ zoom: scale, padding: 'clamp(20px, 3vw, 44px) clamp(18px, 4vw, 56px)', minHeight: center ? '100%' : undefined,
      display: center ? 'flex' : 'block', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
      {children}
    </div>
  </div>
)

export const LivePresentation = ({
  session, moduleList, parts, counts, busy, view, actions,
  qSeconds, onTimeChange, muted, onToggleMute, activityChooser, onClose,
}) => {
  const { currentIdx, currentModule, isInteractive, isPoll, isLastModule, phase, idx, total,
    question, options, optionImages, correct, hasExplanation, explanation } = view
  const ended = session.status === 'ended'
  const isLesson = currentModule?.type === 'lesson'
  const scale = useStageScale()

  const [slide, setSlide] = React.useState(0)
  const [showRanking, setShowRanking] = React.useState(false)
  const [showNotes, setShowNotes] = React.useState(false)
  const [showActivity, setShowActivity] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const toLast = React.useRef(false)

  const appMod = React.useMemo(() => (currentModule ? dbModToAppMod(currentModule) : null), [currentModule])
  const { slides, notes } = React.useMemo(() => {
    if (!isLesson) return { slides: [], notes: [] }
    const all = (currentModule.content || []).filter(s => s.type !== 'pagebreak')
    return {
      slides: [{ kind: 'title' }, ...all.filter(s => !isTutorOnlySection(s)).map(sec => ({ kind: 'section', sec }))],
      notes: all.filter(isTutorOnlySection),
    }
  }, [currentModule, isLesson])

  // Al cambiar de módulo: primera diapositiva, o la última si se llegó con ◀.
  React.useEffect(() => {
    setSlide(toLast.current ? Math.max(0, slides.length - 1) : 0)
    toLast.current = false
    setShowActivity(false)
  }, [currentModule?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const answered = counts.reduce((a, b) => a + b, 0)
  const limit = question?.time_limit_s || qSeconds
  const left = useSecondsLeft(session.question_started_at, limit, phase === 'question' && isInteractive)

  const fire = async (fn) => {
    if (pending || busy) return
    setPending(true)
    try { await fn() } finally { setPending(false) }
  }
  const finish = () => {
    if (window.confirm('¿Finalizar la clase en vivo? Los estudiantes verán el podio final.')) fire(actions.finish)
  }
  const nextModule = () => (isLastModule ? finish() : fire(() => actions.gotoModule(currentIdx + 1)))

  // Lo que hace ▶ en cada momento, con su rótulo.
  const nextStep = (() => {
    if (ended) return null
    if (!isInteractive) {
      if (isLesson && slide < slides.length - 1) return { label: 'Siguiente', run: () => setSlide(s => s + 1) }
      return { label: isLastModule ? 'Finalizar clase 🏁' : 'Siguiente módulo', run: nextModule }
    }
    if (phase === 'lobby') {
      if (!total) return { label: isLastModule ? 'Finalizar clase 🏁' : 'Siguiente módulo', run: nextModule }
      return { label: `Comenzar ${isPoll ? 'encuesta' : isQuestionRound(currentModule) ? 'ronda' : 'quiz'}`, run: () => fire(actions.start) }
    }
    if (phase === 'question') return { label: `Mostrar resultados (${answered}/${parts.length})`, run: () => fire(actions.reveal) }
    if (phase === 'reveal' && hasExplanation) return { label: 'Ver explicación 💡', run: () => fire(actions.explain) }
    const lastQ = idx >= total - 1
    if (lastQ && isLastModule) return { label: 'Finalizar clase 🏁', run: finish }
    return { label: lastQ ? 'Siguiente módulo' : 'Siguiente pregunta', run: () => fire(actions.advance) }
  })()

  const canPrev = !ended && ((isLesson && slide > 0) || ((!isInteractive || phase === 'lobby') && currentIdx > 0))
  const prev = () => {
    if (!canPrev) return
    if (isLesson && slide > 0) return setSlide(s => s - 1)
    toLast.current = true
    fire(() => actions.gotoModule(currentIdx - 1))
  }

  // Teclado y control remoto de presentaciones (envían flechas / AvPág).
  const keyRef = React.useRef({})
  keyRef.current = { nextStep, prev, notes }
  React.useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag) || e.target?.isContentEditable) return
      if (e.altKey || e.ctrlKey || e.metaKey) return
      const k = e.key
      if (k === 'ArrowRight' || k === 'PageDown' || ((k === ' ' || k === 'Enter') && tag !== 'button')) {
        e.preventDefault(); keyRef.current.nextStep?.run()
      } else if (k === 'ArrowLeft' || k === 'PageUp') {
        e.preventDefault(); keyRef.current.prev()
      } else if (k === 'r' || k === 'R') setShowRanking(v => !v)
      else if ((k === 'n' || k === 'N') && keyRef.current.notes.length) setShowNotes(v => !v)
      else if (k === 'Escape' && !document.fullscreenElement) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const [fullscreen, setFullscreen] = React.useState(!!document.fullscreenElement)
  React.useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', on)
    return () => document.removeEventListener('fullscreenchange', on)
  }, [])
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  // ---------- Contenido de la diapositiva ----------
  const renderLesson = () => {
    const s = slides[slide]
    if (!s) return null
    if (s.kind === 'title') return (
      <div style={{ width: '100%', maxWidth: 1400, height: '100%', borderRadius: 22, background: 'linear-gradient(135deg, #EC671A 0%, #7C3AED 100%)',
        boxShadow: '0 30px 80px rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(24px, 6vw, 96px)', boxSizing: 'border-box', animation: 'fadeIn .35s ease', overflow: 'auto' }}>
        <div style={{ fontSize: 'clamp(13px, 1.3vw, 20px)', fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', opacity: .8 }}>
          Paso {currentIdx + 1} de {moduleList.length}{appMod?.subtitle ? ` · ${appMod.subtitle}` : ''}
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5.2vw, 84px)', fontWeight: 900, lineHeight: 1.05, margin: '14px 0 18px', color: '#fff' }}>
          {currentModule.title}
        </h1>
        {appMod?.desc && <p style={{ fontSize: 'clamp(16px, 1.8vw, 28px)', lineHeight: 1.45, opacity: .9, maxWidth: 1000, margin: 0 }}>{appMod.desc}</p>}
        {appMod?.task && (
          <div style={{ marginTop: 28, padding: '16px 20px', borderRadius: 16, background: 'rgba(0,0,0,.22)', maxWidth: 1000,
            fontSize: 'clamp(15px, 1.5vw, 22px)', lineHeight: 1.5 }}>📋 {appMod.task}</div>
        )}
      </div>
    )
    return (
      <Paper scale={scale}>
        <LessonSection key={slide} section={s.sec} index={slide - 1}
          activityChoice={session.activity_choices?.[currentModule.id]} />
      </Paper>
    )
  }

  const renderLobby = () => {
    const cd = currentModule.challenge_data || {}
    const area = BANK_AREAS[cd.bank]
    return (
      <div style={{ textAlign: 'center', maxWidth: 1100, animation: 'fadeUp .4s ease both' }}>
        <div style={{ fontSize: 'clamp(48px, 7vw, 110px)' }}>{isPoll ? '📊' : '🎮'}</div>
        <div style={{ fontSize: 'clamp(13px, 1.3vw, 20px)', fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: '#FDBA74' }}>
          {isQuestionRound(currentModule) ? (ROUND_LABELS[cd.bankRound] || 'Ronda de preguntas') : isPoll ? 'Encuesta' : 'Quiz'}
          {area ? ` · ${area.icon} ${area.label}` : ''}
        </div>
        <h1 style={{ fontSize: 'clamp(30px, 4.6vw, 72px)', fontWeight: 900, margin: '10px 0 16px', lineHeight: 1.1 }}>{currentModule.title}</h1>
        <p style={{ fontSize: 'clamp(16px, 1.8vw, 28px)', opacity: .85, margin: 0 }}>
          {total} pregunta{total !== 1 ? 's' : ''} · {fmt(qSeconds)} min por pregunta
        </p>
        <div style={{ display: 'inline-flex', gap: 14, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ padding: '14px 26px', borderRadius: 16, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
            <div style={{ fontSize: 12, opacity: .7, fontWeight: 700, letterSpacing: 1.5 }}>PIN</div>
            <div style={{ fontSize: 'clamp(26px, 3vw, 46px)', fontWeight: 900, letterSpacing: 6 }}>{session.code}</div>
          </div>
          <div style={{ padding: '14px 26px', borderRadius: 16, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
            <div style={{ fontSize: 12, opacity: .7, fontWeight: 700, letterSpacing: 1.5 }}>CONECTADOS</div>
            <div style={{ fontSize: 'clamp(26px, 3vw, 46px)', fontWeight: 900 }}>{parts.length}</div>
          </div>
        </div>
        <p style={{ marginTop: 26, opacity: .6, fontSize: 15 }}>Presiona ▶ o la flecha → para comenzar</p>
      </div>
    )
  }

  const renderQuestion = () => {
    const reveal = phase !== 'question'
    const passage = question?.passage
    const optionTiles = (
      <div style={{ display: 'grid', gridTemplateColumns: options.length > 2 || (optionImages || []).some(Boolean) ? 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))' : '1fr',
        gap: 'clamp(8px, 1vw, 16px)' }}>
        {options.map((opt, i) => {
          const isCorrect = correct === i
          const n = counts[i] || 0
          const pct = answered > 0 ? Math.round((n / answered) * 100) : 0
          const dim = reveal && !isPoll && !isCorrect
          return (
            <div key={i} style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 14,
              padding: phase === 'explanation' ? '10px 16px' : 'clamp(12px, 1.4vw, 22px) clamp(14px, 1.6vw, 24px)', borderRadius: 16,
              background: OPT_COLORS[i % OPT_COLORS.length], color: '#fff', opacity: dim ? .38 : 1,
              outline: reveal && isCorrect ? '4px solid #fff' : 'none', outlineOffset: -4,
              boxShadow: reveal && isCorrect ? '0 0 0 4px #10B981, 0 12px 30px rgba(16,185,129,.35)' : '0 8px 24px rgba(0,0,0,.3)',
              transition: 'opacity .4s, box-shadow .4s' }}>
              {reveal && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%', background: 'rgba(0,0,0,.18)', transition: 'width .5s' }} />}
              <span style={{ position: 'relative', width: 'clamp(30px, 2.6vw, 44px)', height: 'clamp(30px, 2.6vw, 44px)', borderRadius: 10,
                background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontWeight: 900, fontSize: 'clamp(15px, 1.4vw, 22px)' }}>{String.fromCharCode(65 + i)}</span>
              <span style={{ position: 'relative', flex: 1, minWidth: 0, fontSize: phase === 'explanation' ? 'clamp(14px, 1.2vw, 18px)' : 'clamp(16px, 1.6vw, 26px)',
                fontWeight: 700, lineHeight: 1.3, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <OptionImage src={optionImages?.[i]} maxHeight={phase === 'explanation' ? 90 : 170} />
                {opt && <RichText>{opt}</RichText>}
              </span>
              {reveal && (
                <span style={{ position: 'relative', fontSize: 'clamp(14px, 1.3vw, 20px)', fontWeight: 900, whiteSpace: 'nowrap' }}>
                  {!isPoll && isCorrect && '✓ '}{n} · {pct}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
    const header = (
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 'clamp(10px, 1.4vw, 20px)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(12px, 1.1vw, 16px)', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#FDBA74' }}>
            Pregunta {idx + 1} de {total}{reveal ? (phase === 'explanation' ? ' · Explicación' : ' · Resultados') : ''}
          </div>
          <div style={{ marginTop: 8, height: 8, borderRadius: 6, background: 'rgba(255,255,255,.12)', overflow: 'hidden', maxWidth: 520 }}>
            <div style={{ height: '100%', width: `${parts.length ? Math.min(100, (answered / parts.length) * 100) : 0}%`, background: '#10B981', transition: 'width .4s' }} />
          </div>
          <div style={{ fontSize: 13, opacity: .75, marginTop: 4 }}>{answered} de {parts.length} respondieron</div>
        </div>
        {phase === 'question' && <TimerRing left={left} limit={limit} size={scale > 1 ? 104 : 86} />}
      </div>
    )
    const questionCard = (
      <div style={{ background: '#fff', color: '#1A1A2E', borderRadius: 18, padding: 'clamp(14px, 1.8vw, 28px) clamp(16px, 2vw, 32px)',
        marginBottom: 'clamp(10px, 1.4vw, 20px)', boxShadow: '0 20px 50px rgba(0,0,0,.35)' }}>
        {question?.image && <img src={question.image} alt="" style={{ display: 'block', margin: '0 auto 12px', maxWidth: '100%', maxHeight: '28vh', objectFit: 'contain', borderRadius: 10 }} />}
        <QuestionText as="h2" style={{ fontSize: phase === 'explanation' ? 'clamp(17px, 1.6vw, 24px)' : 'clamp(20px, 2.3vw, 36px)', fontWeight: 800, lineHeight: 1.3, margin: 0 }}>
          {question?.question}
        </QuestionText>
        {question?.questionAfter && (
          <RichText as="h2" style={{ fontSize: 'clamp(20px, 2.3vw, 36px)', fontWeight: 800, lineHeight: 1.3, margin: '10px 0 0' }}>{question.questionAfter}</RichText>
        )}
      </div>
    )
    const explanationCard = phase === 'explanation' && explanation && (
      <div style={{ marginTop: 'clamp(10px, 1.4vw, 20px)', background: '#fff', color: '#1A1A2E', borderRadius: 18, padding: 'clamp(14px, 1.8vw, 26px)',
        borderLeft: '8px solid #7C3AED', boxShadow: '0 20px 50px rgba(0,0,0,.35)', animation: 'fadeUp .4s ease both' }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: '#7C3AED', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>💡 Explicación</div>
        <RichText as="p" style={{ fontSize: 'clamp(15px, 1.5vw, 24px)', lineHeight: 1.6, margin: 0 }}>{explanation}</RichText>
      </div>
    )
    return (
      <div style={{ width: '100%', maxWidth: 1500, height: '100%', overflowY: 'auto', animation: 'fadeIn .3s ease' }}>
        {header}
        {passage ? (
          <div style={{ display: 'flex', gap: 'clamp(12px, 1.6vw, 24px)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '1 1 380px', minWidth: 0, background: '#fff', color: '#1A1A2E', borderRadius: 18, padding: 4 }}>
              <LivePassage passage={passage} maxHeight="62vh" />
            </div>
            <div style={{ flex: '1.3 1 460px', minWidth: 0 }}>{questionCard}{optionTiles}{explanationCard}</div>
          </div>
        ) : <>{questionCard}{optionTiles}{explanationCard}</>}
      </div>
    )
  }

  const renderOther = () => (
    <div style={{ textAlign: 'center', maxWidth: 900 }}>
      <div style={{ fontSize: 72 }}>⏭️</div>
      <h1 style={{ fontSize: 'clamp(26px, 3.4vw, 54px)', fontWeight: 900, margin: '10px 0' }}>{currentModule?.title}</h1>
      <p style={{ fontSize: 'clamp(15px, 1.5vw, 22px)', opacity: .8 }}>
        Este paso no es sincrónico: tus estudiantes lo resuelven por su cuenta. Presiona ▶ para continuar.
      </p>
    </div>
  )

  const renderEnded = () => (
    <div style={{ width: '100%', maxWidth: 900, textAlign: 'center', overflowY: 'auto', maxHeight: '100%' }}>
      <h1 style={{ fontSize: 'clamp(28px, 3.6vw, 56px)', fontWeight: 900, margin: '0 0 10px' }}>🏆 ¡Clase finalizada!</h1>
      {parts.length > 0 && <Podium top={parts.slice(0, 3)} dark />}
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'left' }}><DarkRanking parts={parts.slice(3)} limit={7} /></div>
    </div>
  )

  const stage = ended ? renderEnded()
    : isLesson ? renderLesson()
    : isInteractive ? (phase === 'lobby' ? renderLobby() : renderQuestion())
    : renderOther()

  const counter = ended ? null
    : isLesson ? `Diapositiva ${slide + 1} de ${slides.length}`
    : isInteractive && phase !== 'lobby' ? `Pregunta ${idx + 1} de ${total}`
    : `Paso ${currentIdx + 1} de ${moduleList.length}`

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, background: STAGE_BG, color: '#fff', display: 'flex',
      flexDirection: 'column', fontFamily: 'var(--font)' }}>
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
          background: 'rgba(239,68,68,.18)', color: '#FCA5A5', fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.4s ease infinite' }} /> EN VIVO
        </span>
        <div style={{ flex: 1, minWidth: 160, overflow: 'hidden' }}>
          <div style={{ fontSize: 12, opacity: .6, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.title || 'Clase en vivo'}</div>
          <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ended ? 'Resultados finales' : `${TYPE_ICON[currentModule?.type] || '📄'} ${currentModule?.title || ''}`}
          </div>
        </div>
        <span style={{ ...BAR_BTN, cursor: 'default', letterSpacing: 2 }} title="PIN para invitados sin cuenta">PIN {session.code}</span>
        <span style={{ ...BAR_BTN, cursor: 'default' }} title="Estudiantes conectados">👥 {parts.length}</span>
        {!ended && (
          <label style={{ ...BAR_BTN, display: 'inline-flex', alignItems: 'center', gap: 6 }} title="Tiempo por pregunta">
            ⏱
            <select value={qSeconds} onChange={e => onTimeChange(Number(e.target.value))}
              style={{ background: 'transparent', color: '#fff', border: 'none', fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              {LIVE_TIME_OPTIONS.map(t => <option key={t} value={t} style={{ color: '#1A1A2E' }}>{fmt(t)} min</option>)}
            </select>
          </label>
        )}
        {activityChooser && !ended && (
          <button style={{ ...BAR_BTN, background: showActivity ? 'rgba(236,103,26,.4)' : BAR_BTN.background }} onClick={() => setShowActivity(v => !v)}>🎲 Actividad</button>
        )}
        {notes.length > 0 && !ended && (
          <button style={{ ...BAR_BTN, background: showNotes ? 'rgba(236,103,26,.4)' : BAR_BTN.background }} onClick={() => setShowNotes(v => !v)} title="Guía del docente (N)">📝 Notas</button>
        )}
        <button style={{ ...BAR_BTN, background: showRanking ? 'rgba(236,103,26,.4)' : BAR_BTN.background }} onClick={() => setShowRanking(v => !v)} title="Ranking (R)">🏆 Ranking</button>
        <button style={BAR_BTN} onClick={onToggleMute} title={muted ? 'Activar sonido' : 'Silenciar'}>{muted ? '🔇' : '🔊'}</button>
        <button style={BAR_BTN} onClick={toggleFullscreen} title="Pantalla completa">{fullscreen ? '🗗' : '⛶'}</button>
        <button style={BAR_BTN} onClick={onClose} title="Volver al panel de control">✕ Panel</button>
      </div>

      {/* Escenario */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px clamp(10px, 2vw, 32px)', position: 'relative' }}>
        {stage}

        {showRanking && (
          <div style={{ position: 'absolute', top: 6, right: 'clamp(10px, 2vw, 32px)', bottom: 6, width: 'min(380px, 90vw)', overflowY: 'auto',
            background: 'rgba(14,15,26,.95)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 18, padding: 18,
            boxShadow: '0 20px 60px rgba(0,0,0,.5)', animation: 'slideR .3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>🏆 Ranking</div>
              <button style={{ ...BAR_BTN, padding: '4px 10px' }} onClick={() => setShowRanking(false)}>✕</button>
            </div>
            <DarkRanking parts={parts} />
          </div>
        )}

        {showActivity && activityChooser && (
          <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 'min(720px, 94vw)', maxHeight: 'calc(100% - 12px)',
            overflowY: 'auto', background: 'var(--bg)', color: 'var(--text)', borderRadius: 18, padding: 14, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
            {activityChooser}
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setShowActivity(false)} style={{ ...BAR_BTN, color: 'var(--text)', borderColor: 'var(--border)', background: 'var(--white)' }}>Cerrar</button>
            </div>
          </div>
        )}

        {showNotes && notes.length > 0 && (
          <div style={{ position: 'absolute', left: 'clamp(10px, 2vw, 32px)', right: 'clamp(10px, 2vw, 32px)', bottom: 6, maxHeight: '45%', overflowY: 'auto',
            background: 'var(--white)', color: 'var(--text)', borderRadius: 18, padding: '6px 22px 14px', boxShadow: '0 -10px 50px rgba(0,0,0,.5)',
            borderTop: '5px solid #EC671A', animation: 'fadeUp .3s ease both' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
              <b style={{ fontSize: 13, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1 }}>📝 Guía del docente · también se ve en la proyección</b>
              <button onClick={() => setShowNotes(false)} style={{ ...BAR_BTN, color: 'var(--text)', borderColor: 'var(--border)', background: 'var(--bg)', padding: '4px 10px' }}>✕</button>
            </div>
            {notes.map((sec, i) => <LessonSection key={i} section={sec} index={i} activityChoice={session.activity_choices?.[currentModule.id]} />)}
          </div>
        )}
      </div>

      {/* Barra inferior: navegación tipo PowerPoint */}
      <div style={{ padding: '10px 18px 14px' }}>
        {isLesson && slides.length > 1 && (
          <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,.12)', marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((slide + 1) / slides.length) * 100}%`, background: '#EC671A', transition: 'width .3s' }} />
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={prev} disabled={!canPrev || pending || busy}
            style={{ ...BAR_BTN, padding: '12px 18px', fontSize: 16, opacity: canPrev ? 1 : .35, cursor: canPrev ? 'pointer' : 'default' }}>
            ◀ Anterior
          </button>

          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {moduleList.map((m, i) => {
                const now = i === currentIdx, done = i < currentIdx
                return (
                  <button key={m.id} title={`${i + 1}. ${m.title}`} disabled={now || ended || busy || pending}
                    onClick={() => { if (window.confirm(`¿Ir al paso ${i + 1}: ${m.title}?`)) fire(() => actions.gotoModule(i)) }}
                    style={{ width: now ? 34 : 26, height: 26, borderRadius: 13, border: 'none', fontFamily: 'var(--font)',
                      fontSize: 11, fontWeight: 900, cursor: now || ended ? 'default' : 'pointer', transition: 'all .3s',
                      background: now ? '#EC671A' : done ? '#10B981' : 'rgba(255,255,255,.14)', color: '#fff' }}>
                    {done ? '✓' : i + 1}
                  </button>
                )
              })}
            </div>
            <div style={{ fontSize: 12, opacity: .65, fontWeight: 600 }}>
              {counter}{counter ? ' · ' : ''}← → para avanzar · R ranking{notes.length ? ' · N notas' : ''}
            </div>
          </div>

          {nextStep ? (
            <button onClick={nextStep.run} disabled={pending || busy}
              style={{ border: 'none', borderRadius: 14, padding: '14px 26px', fontSize: 17, fontWeight: 900, fontFamily: 'var(--font)',
                cursor: pending || busy ? 'wait' : 'pointer', color: '#fff', whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #EC671A, #F59E33)', boxShadow: '0 10px 30px rgba(236,103,26,.45)',
                opacity: pending || busy ? .7 : 1, animation: phase === 'question' && left === 0 && isInteractive ? 'pulse 1.2s ease infinite' : 'none' }}>
              {pending || busy ? 'Un momento…' : `${nextStep.label} ▶`}
            </button>
          ) : (
            <button onClick={onClose} style={{ ...BAR_BTN, padding: '14px 22px', fontSize: 16 }}>📄 Ver informe de cierre</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default LivePresentation
