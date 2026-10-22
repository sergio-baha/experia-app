import React from 'react'
import { useStore, selectActiveCourseTheme } from '../store/store.jsx'
import { LiveQuestionView, LiveScoreBar } from './LiveQuestionView.jsx'
import { useLiveParticipants } from '../lib/liveClient.js'
import { useMobile } from './ui.jsx'
import { LessonBody } from '../pages/lesson.jsx'
import { getCharacter } from '../lib/characters.jsx'
import { LiveSequence } from './LiveSequence.jsx'

// El tutor del curso temático. La vista guiada se renderiza FUERA del shell
// normal (app.jsx retorna antes de montar <CourseAmbient/>), así que hay que
// montarlo aquí a mano o el personaje no aparecería durante la clase en vivo.
const CharacterFloat = React.lazy(() => import('./CharacterBubble.jsx'))

// Envoltorio de layout de la vista guiada (ocupa toda la pantalla, sin
// sidebar/header — el profesor controla el avance, el estudiante no navega).
// GuidedClassView se renderiza fuera del shell normal (directo bajo #root,
// que en styles.css tiene height:100% + overflow:hidden), así que la altura
// debe ser fija (100vh, NO minHeight) para que overflowY:auto scrollee aquí
// en vez de que el contenido se recorte contra #root sin poder bajar.
// `wide`: módulos con diapositivas (estructura de la Prueba Saber) se ven
// a casi todo el ancho para que el texto de las imágenes se lea en clase.
// La barra de la secuencia didáctica llega por contexto (y no como prop)
// porque LiveQuestionView recibe Shell como `Wrap` y lo usa en cada pantalla:
// así todas muestran en qué paso va la clase sin tocar ese componente, que
// también sirve a la página pública del PIN (allí no hay ruta que mostrar).
const SequenceCtx = React.createContext(null)
const Shell = ({ children, wide }) => {
  const sequence = React.useContext(SequenceCtx)
  const isMobile = useMobile()
  return (
    <div style={{ height: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--bg)' }}>
      <div style={{ maxWidth: wide ? 1180 : 820, margin: '0 auto', padding: isMobile ? '12px 10px 96px' : '28px 20px 60px' }}>
        {sequence}
        {children}
      </div>
    </div>
  )
}

// Envuelve cualquier pantalla de la clase con el tutor del curso (si el curso
// tiene tema). El personaje va en position:fixed, así que no altera el layout.
const WithTutor = ({ children }) => {
  const theme = useStore(selectActiveCourseTheme)
  return (
    <>
      {children}
      {theme && <React.Suspense fallback={null}><CharacterFloat /></React.Suspense>}
    </>
  )
}

const LiveBadge = () => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, maxWidth: '100%',
    background: 'var(--orange-bg)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, marginBottom: 16 }}>
    <span style={{ animation: 'glow 2s ease infinite' }}>🔴</span> Clase en vivo — tu profesor controla el avance
  </div>
)

// Vista de la Clase en Vivo Guiada para el estudiante: reemplaza por completo
// la navegación normal (map/lesson/challenge) mientras está unido a una sesión
// activa. Renderiza el mismo módulo que ve el profesor en cada momento.
const GuidedClassViewInner = ({ guided }) => {
  const { session, participant } = guided
  const courseModules = useStore(s => s.courseModules) || []
  const currentMod = courseModules.find(m => m.id === session?.module_id)
  // A diferencia de la página pública del PIN, aquí el estudiante SÍ tiene
  // sesión: su avatar lo acompaña en el lobby, al responder, en el revelado
  // (reacciona con la expresión) y en el podio.
  const avatar = useStore(s => s.user?.avatarConfig) || null
  // Si el curso tiene tutor, la pista la dice el personaje (no va como texto
  // en la tarjeta). La página pública del PIN no lo pasa: allí no hay tutor.
  const theme = useStore(selectActiveCourseTheme)
  const ch = theme ? getCharacter(theme) : null
  const tutor = ch?.art ? { name: ch.name } : null

  // Mismo orden que la ruta (y que la barra del profesor)
  const orderedMods = React.useMemo(
    () => [...courseModules].sort((a, b) => (a.pos?.y ?? 0) - (b.pos?.y ?? 0)),
    [courseModules])

  // Una sola suscripción a los participantes: la usan la barra de puntaje
  // (visible en TODAS las pantallas de la clase) y la vista de preguntas.
  const parts = useLiveParticipants(participant?.session_id)

  if (!session || !participant) return null
  const isRound = currentMod?.type === 'challenge' && (currentMod.ctype === 'quiz' || currentMod.ctype === 'poll')
  const stepIdx = orderedMods.findIndex(m => m.id === session.module_id)
  const progress = isRound && session.total_questions && session.phase !== 'lobby'
    ? { value: `${Math.min(session.current_index + 1, session.total_questions)}/${session.total_questions}`, label: 'Pregunta' }
    : stepIdx >= 0 ? { value: `${stepIdx + 1}/${orderedMods.length}`, label: 'Paso' } : null
  const sequence = session.status === 'ended' ? null : (
    <>
      <LiveSequence modules={orderedMods} currentId={session.module_id} />
      <LiveScoreBar parts={parts} meId={participant.id} phase={session.phase} progress={progress} />
    </>
  )
  return <SequenceCtx.Provider value={sequence}>{renderStep(session, participant, currentMod, avatar, tutor, parts)}</SequenceCtx.Provider>
}

const renderStep = (session, participant, currentMod, avatar, tutor, parts) => {

  // Sesión finalizada: LiveQuestionView muestra el podio con confeti; app.jsx
  // detecta status==='ended' y saca al estudiante de vuelta al mapa normal.
  if (session.status === 'ended') {
    return <LiveQuestionView participant={participant} Wrap={Shell} avatar={avatar} parts={parts} scoreBar={false} />
  }

  // Módulo interactivo (quiz o encuesta en vivo): reusa el ciclo ya construido.
  if (currentMod?.type === 'challenge' && (currentMod.ctype === 'quiz' || currentMod.ctype === 'poll')) {
    return <LiveQuestionView participant={participant} Wrap={Shell} avatar={avatar} moduleQuestions={currentMod.questions} tutor={tutor}
      parts={parts} scoreBar={false} />
  }

  // Lección de lectura: mismo contenido que ve el profesor, en modo solo-lectura.
  if (currentMod?.type === 'lesson') {
    return (
      <Shell wide={(currentMod.content || []).some(s => s.type === 'slides')}>
        <LiveBadge />
        <LessonBody mod={currentMod} activityChoice={session.activity_choices?.[currentMod.id]} />
      </Shell>
    );
  }

  // Cualquier otro caso (aún sin módulo asignado, entrega final, u otro tipo
  // de reto no sincrónico): pantalla de espera — el profesor sigue en un
  // momento; este contenido no requiere participación en vivo.
  return (
    <Shell>
      <LiveBadge />
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)' }}>
          {currentMod?.title || 'Esperando a que tu profesor comience'}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
          {currentMod ? 'Este contenido no es sincrónico — tu profesor continuará en un momento.' : 'Un momento, tu profesor está iniciando la clase…'}
        </p>
      </div>
    </Shell>
  );
}

const GuidedClassView = ({ guided }) => (
  <WithTutor><GuidedClassViewInner guided={guided} /></WithTutor>
)

export default GuidedClassView
