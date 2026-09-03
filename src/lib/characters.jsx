import React from 'react'
// =============================================================================
// EXPERIA — Registro central de personajes por tema inmersivo
// -----------------------------------------------------------------------------
// Fuente única de verdad para los personajes guía. Cada tema mapea a UN
// personaje con: avatar SVG, paleta/animaciones (ui) y diálogos por contexto.
//
// Para conectar un personaje real más adelante: reemplaza su `Avatar` y/o sus
// `lines`. Un tema sin entrada aquí simplemente no muestra personaje (la UI
// degrada con gracia). Si falta una línea para un contexto, cae a `idle`.
//
// Contextos de interacción (eventos a los que el personaje reacciona):
//   idle           — saludo / línea por defecto al aparecer
//   lessonIntro    — al abrir una lección
//   correct        — el estudiante acertó un reto
//   wrong          — el estudiante falló un reto
//   moduleComplete — completó un módulo (lección o reto)
//   routeComplete  — completó toda la ruta del curso
// =============================================================================

export const CHARACTER_CONTEXTS = ['idle', 'lessonIntro', 'correct', 'wrong', 'moduleComplete', 'routeComplete']

// Guiones de conversación entre el tutor y el AVATAR del estudiante (ver
// avatarKit.jsx). Solo se usan si la persona ya creó su avatar; si no, el tutor
// habla solo con sus `lines` de siempre.
//   who  → 'tutor' | 'student'
//   exp  → expresión del avatar en ese turno (idle | happy | sad | wow)
//   {nombre} se reemplaza por el alias del avatar o el primer nombre real.
// Un contexto puede tener UN guión —[{who,text}, …]— o VARIOS —[[…], […]]—;
// en ese caso getDialogue elige uno al azar, para que los momentos frecuentes
// no suenen siempre igual.
//
// Momentos:
//   welcome       — primera entrada al curso ya con avatar creado
//   comeback      — vuelve tras 3 días o más sin entrar
//   avatarCreated — acaba de crear su avatar
//   rankUp        — subió de rango (armadura nueva)
//   milestone     — cada 3 módulos completados
//   perfect       — reto resuelto sin un solo error
//   badge         — ganó una insignia
//   struggle      — dos fallos seguidos en el mismo reto
//   routeComplete — al terminar la ruta
//   liveStart     — entra al lobby de la Clase en Vivo Guiada
//   liveEnd       — podio de la Clase en Vivo Guiada
export const DIALOGUE_CONTEXTS = [
  'welcome', 'comeback', 'avatarCreated', 'rankUp', 'milestone', 'perfect',
  'badge', 'struggle', 'routeComplete', 'liveStart', 'liveEnd',
]

// ─── Avatares SVG inline (sin dependencias externas) ─────────────────────────

const VeraAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="26" cy="26" r="26" fill="#1C1A16"/>
    <ellipse cx="26" cy="18" rx="13" ry="3.5" fill="#2A2420"/>
    <rect x="17" y="10" width="18" height="10" rx="4" fill="#2A2420"/>
    <rect x="14" y="17" width="24" height="3" rx="1.5" fill="#3A3028"/>
    <ellipse cx="26" cy="30" rx="9" ry="10" fill="#C8956A"/>
    <path d="M17 28 Q26 20 35 28" fill="#1A1208"/>
    <ellipse cx="22.5" cy="29" rx="1.8" ry="2" fill="#1A1208"/>
    <ellipse cx="29.5" cy="29" rx="1.8" ry="2" fill="#1A1208"/>
    <circle cx="23" cy="28.5" r=".6" fill="white" opacity=".7"/>
    <circle cx="30" cy="28.5" r=".6" fill="white" opacity=".7"/>
    <ellipse cx="26" cy="32" rx="1.2" ry=".8" fill="#A87050" opacity=".6"/>
    <path d="M23 35 Q26 36.5 29 35" stroke="#A87050" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <circle cx="38" cy="40" r="4.5" stroke="#D4A017" strokeWidth="1.8" fill="none" opacity=".9"/>
    <line x1="41.5" y1="43.5" x2="44" y2="46" stroke="#D4A017" strokeWidth="2" strokeLinecap="round" opacity=".9"/>
    <path d="M18 40 Q22 38 26 42 Q30 38 34 40 Q32 48 26 50 Q20 48 18 40Z" fill="#2A2420"/>
    <path d="M22 40 L26 44 L30 40" stroke="#3A3028" strokeWidth=".8" fill="none"/>
  </svg>
)

const RexAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="26" cy="26" r="26" fill="#1C1A16"/>
    <ellipse cx="13" cy="22" rx="5" ry="9" fill="#8B6914" transform="rotate(-15 13 22)"/>
    <ellipse cx="39" cy="22" rx="5" ry="9" fill="#8B6914" transform="rotate(15 39 22)"/>
    <ellipse cx="13" cy="22" rx="3" ry="6.5" fill="#C4924A" opacity=".5" transform="rotate(-15 13 22)"/>
    <ellipse cx="39" cy="22" rx="3" ry="6.5" fill="#C4924A" opacity=".5" transform="rotate(15 39 22)"/>
    <ellipse cx="26" cy="30" rx="12" ry="11" fill="#C4924A"/>
    <ellipse cx="26" cy="35" rx="6" ry="4.5" fill="#D4A86A"/>
    <ellipse cx="21" cy="27" rx="3" ry="3.2" fill="#1A1208"/>
    <ellipse cx="31" cy="27" rx="3" ry="3.2" fill="#1A1208"/>
    <circle cx="22" cy="26" r="1" fill="white" opacity=".8"/>
    <circle cx="32" cy="26" r="1" fill="white" opacity=".8"/>
    <ellipse cx="26" cy="32" rx="2.5" ry="1.8" fill="#1A1208"/>
    <path d="M23 35 Q26 38 29 35" stroke="#8B5A2A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <rect x="23.5" y="39" width="5" height="8" rx="2" fill="#8B1A1A"/>
    <polygon points="26,39 23.5,42 28.5,42" fill="#C0392B"/>
    <rect x="33" y="36" width="8" height="10" rx="2" fill="#2A2420" transform="rotate(10 33 36)"/>
  </svg>
)

const ProfAxiomaAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="26" cy="26" r="26" fill="#0d150d"/>
    <path d="M15 20 C14 11 18 5 21 7 C21 13 20 17 19 19" fill="#2d3a10"/>
    <path d="M37 20 C38 11 34 5 31 7 C31 13 32 17 33 19" fill="#2d3a10"/>
    <path d="M21 9 C24 4 28 4 31 9" fill="#3a4a12"/>
    <path d="M17 15 C19 8 22 5 24 7" fill="#3a4a12"/>
    <path d="M35 15 C33 8 30 5 28 7" fill="#3a4a12"/>
    <ellipse cx="26" cy="30" rx="10" ry="11" fill="#c89060"/>
    <ellipse cx="26" cy="20.5" rx="10" ry="5.5" fill="#2d3a10"/>
    <circle cx="21.5" cy="28.5" r="4" stroke="#f0a500" strokeWidth="1.5" fill="rgba(240,165,0,.06)"/>
    <circle cx="30.5" cy="28.5" r="4" stroke="#f0a500" strokeWidth="1.5" fill="rgba(240,165,0,.06)"/>
    <line x1="25.5" y1="28.5" x2="26.5" y2="28.5" stroke="#f0a500" strokeWidth="1.1"/>
    <line x1="17.5" y1="27.5" x2="15.5" y2="26.5" stroke="#f0a500" strokeWidth="1.1"/>
    <line x1="34.5" y1="27.5" x2="36.5" y2="26.5" stroke="#f0a500" strokeWidth="1.1"/>
    <circle cx="21.5" cy="28.5" r="1.8" fill="#1a0a05"/>
    <circle cx="30.5" cy="28.5" r="1.8" fill="#1a0a05"/>
    <circle cx="22" cy="28" r=".55" fill="white" opacity=".8"/>
    <circle cx="31" cy="28" r=".55" fill="white" opacity=".8"/>
    <ellipse cx="26" cy="32" rx="1.1" ry=".75" fill="#a07050" opacity=".5"/>
    <path d="M21.5 35.5 Q26 39.5 30.5 35.5" stroke="#a07050" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <polygon points="22.5,40 26,43 22.5,46" fill="#c0a000"/>
    <polygon points="29.5,40 26,43 29.5,46" fill="#c0a000"/>
    <circle cx="26" cy="43" r="2" fill="#f0a500"/>
    <circle cx="40" cy="37.5" r="3.5" stroke="#f0a500" strokeWidth="1.5" fill="none" opacity=".85"/>
    <line x1="43" y1="37.5" x2="48" y2="37.5" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" opacity=".85"/>
    <line x1="46" y1="37.5" x2="46" y2="40" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" opacity=".85"/>
    <line x1="48" y1="37.5" x2="48" y2="40" stroke="#f0a500" strokeWidth="1.5" strokeLinecap="round" opacity=".85"/>
  </svg>
)

const DraNexusAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="26" cy="26" r="26" fill="#04080f"/>
    <path d="M14 44 Q18 38 26 42 Q34 38 38 44 Q36 52 26 52 Q16 52 14 44Z" fill="#e8fff4"/>
    <path d="M22 38 L26 42 L30 38" stroke="#a0f0c0" strokeWidth=".8" fill="none"/>
    <ellipse cx="26" cy="20" rx="12" ry="9" fill="#0a1a08"/>
    <path d="M14 18 C12 8 16 3 19 5 C17 12 16 17 15 20" fill="#0a1a08"/>
    <path d="M38 18 C40 8 36 3 33 5 C35 12 36 17 37 20" fill="#0a1a08"/>
    <circle cx="13" cy="11" r="4" stroke="#0a1a08" strokeWidth="3" fill="none"/>
    <circle cx="26" cy="5"  r="4" stroke="#132210" strokeWidth="3" fill="none"/>
    <circle cx="39" cy="11" r="4" stroke="#0a1a08" strokeWidth="3" fill="none"/>
    <circle cx="18" cy="5"  r="3" stroke="#132210" strokeWidth="2.5" fill="none"/>
    <circle cx="34" cy="5"  r="3" stroke="#132210" strokeWidth="2.5" fill="none"/>
    <ellipse cx="26" cy="30" rx="9" ry="10" fill="#d4a86a"/>
    <rect x="16" y="24.5" width="9" height="7.5" rx="4" stroke="#00d4ff" strokeWidth="1.6" fill="rgba(0,212,255,.1)"/>
    <rect x="27" y="24.5" width="9" height="7.5" rx="4" stroke="#00d4ff" strokeWidth="1.6" fill="rgba(0,212,255,.1)"/>
    <line x1="25" y1="28.2" x2="27" y2="28.2" stroke="#00d4ff" strokeWidth="1.2"/>
    <line x1="16" y1="27"   x2="13.5" y2="26"  stroke="#00d4ff" strokeWidth="1.2"/>
    <line x1="36" y1="27"   x2="38.5" y2="26"  stroke="#00d4ff" strokeWidth="1.2"/>
    <ellipse cx="20.5" cy="28.2" rx="2" ry="2" fill="#1a0a05"/>
    <ellipse cx="31.5" cy="28.2" rx="2" ry="2" fill="#1a0a05"/>
    <circle cx="21.2" cy="27.5" r=".6" fill="white" opacity=".9"/>
    <circle cx="32.2" cy="27.5" r=".6" fill="white" opacity=".9"/>
    <ellipse cx="26" cy="32" rx="1.1" ry=".75" fill="#a07050" opacity=".5"/>
    <path d="M21 36 Q26 40 31 36" stroke="#a07050" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
    <rect x="37" y="28" width="6" height="14" rx="3" fill="#001a08"/>
    <rect x="38" y="35" width="4" height="7.5" rx="2" fill="#00ff88"/>
    <rect x="37" y="28" width="6" height="3.5" rx="1.5" fill="#e8fff4"/>
    <circle cx="40" cy="37" r="1.2" fill="rgba(255,255,255,.5)"/>
    <ellipse cx="40.5" cy="39.5" rx=".8" ry="2.8" fill="rgba(0,255,136,.45)"/>
    <circle cx="40" cy="40" r="6" fill="rgba(0,255,136,.07)"/>
  </svg>
)

const ProfKronosAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="26" cy="26" r="26" fill="#03050e"/>
    <circle cx="8"  cy="8"  r=".8" fill="#c9a227" opacity=".6"/>
    <circle cx="44" cy="6"  r=".6" fill="#5b8dd9" opacity=".5"/>
    <circle cx="46" cy="40" r=".7" fill="#a855f7" opacity=".4"/>
    <circle cx="5"  cy="38" r=".5" fill="#c9a227" opacity=".3"/>
    <rect x="18" y="5" width="16" height="13" rx="2" fill="#0e0c30"/>
    <rect x="14" y="17" width="24" height="3.5" rx="1.5" fill="#181648"/>
    <circle cx="34" cy="12" r="4.5" stroke="#c9a227" strokeWidth="1.2" fill="none" opacity=".8"/>
    <circle cx="34" cy="12" r="2" fill="#c9a227" opacity=".5"/>
    <path d="M14 21 C11 13 13 6 16 8 C15 14 14 18 14 21" fill="#d8d0f0"/>
    <path d="M38 21 C41 13 39 6 36 8 C37 14 38 18 38 21" fill="#d8d0f0"/>
    <ellipse cx="26" cy="31" rx="9.5" ry="10" fill="#c8a070"/>
    <circle cx="21" cy="29.5" r="4.5" stroke="#5b8dd9" strokeWidth="1.6" fill="rgba(91,141,217,.1)"/>
    <circle cx="31" cy="29.5" r="4.5" stroke="#5b8dd9" strokeWidth="1.6" fill="rgba(91,141,217,.1)"/>
    <line x1="25.5" y1="29.5" x2="26.5" y2="29.5" stroke="#5b8dd9" strokeWidth="1.2"/>
    <ellipse cx="21" cy="29.5" rx="2" ry="2" fill="#150d25"/>
    <ellipse cx="31" cy="29.5" rx="2" ry="2" fill="#150d25"/>
    <circle cx="21.6" cy="29"   r=".65" fill="white" opacity=".9"/>
    <circle cx="31.6" cy="29"   r=".65" fill="white" opacity=".9"/>
    <path d="M21.5 36 Q26 38.5 30.5 36" stroke="#d8d0f0" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
    <circle cx="38.5" cy="37" r="5.5" stroke="#c9a227" strokeWidth="1.4" fill="#06041a"/>
    <line x1="38.5" y1="37" x2="38.5" y2="33"   stroke="#c9a227" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="38.5" y1="37" x2="41"   y2="38.5"  stroke="#5b8dd9" strokeWidth=".9" strokeLinecap="round"/>
    <circle cx="38.5" cy="37" r=".9" fill="#c9a227"/>
  </svg>
)

// Placeholder neutro para temas cuyo personaje real aún no se diseña.
const PlaceholderAvatar = () => (
  <svg viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
    <circle cx="26" cy="26" r="26" fill="#2a2a35"/>
    <circle cx="26" cy="21" r="8" fill="#4a4a5a"/>
    <path d="M12 44 Q26 32 40 44 Q40 52 26 52 Q12 52 12 44Z" fill="#4a4a5a"/>
    <text x="26" y="30" textAnchor="middle" fontSize="14" fill="#8a8a9a" fontFamily="sans-serif">?</text>
  </svg>
)

// ─── Arte de cuerpo entero (ilustraciones en /public/tutores) ────────────────
// Cada PNG mide 1920×1080 con el personaje recortado a la izquierda y el resto
// transparente. En vez de recortar los archivos, guardamos aquí el recuadro útil
// en FRACCIONES de la imagen y el componente lo encuadra por CSS:
//   body → figura completa (la que entra por el lado de la pantalla)
//   head → primer plano de la cara (la insignia circular flotante)
// Si algún día se reemplaza el arte, basta recalcular estos cuatro números.
const ART = {
  detective: {
    src: '/tutores/tutor-lenguaje.png',
    body: { x: .0094, y: .0046, w: .3740, h: .9898 },
    head: { x: .1286, y: .010, w: .1125, h: .200 },
  },
  'escape-room': {
    src: '/tutores/tutor-matematicas.png',
    body: { x: .0094, y: .0046, w: .3187, h: .9898 },
    head: { x: .0500, y: .024, w: .1125, h: .200 },
  },
  lab: {
    src: '/tutores/tutor-ciencias-naturales.png',
    body: { x: .0094, y: .0046, w: .1891, h: .9898 },
    head: { x: .0450, y: .010, w: .1125, h: .200 },
  },
  'time-travel': {
    src: '/tutores/tutor-ciencias-sociales.png',
    body: { x: .0094, y: .0046, w: .1568, h: .9898 },
    head: { x: .0188, y: .025, w: .1125, h: .200 },
  },
}

// ─── Registro: tema → personaje ──────────────────────────────────────────────
// `ui` controla la presentación de CharacterFloat (colores/animaciones por tema).
// `art` + `side` + `fx` controlan la aparición de cuerpo entero por el lado de
// la pantalla (ver CharacterBubble.jsx). `flip` refleja la figura para que
// siempre gesticule hacia el centro de la pantalla.
// ⚠️ Los cuatro tutores van a la DERECHA (`side: 'right'`) y el avatar del
// estudiante entra por la izquierda: la posición es fija para que el estudiante
// siempre sepa dónde mirar. `flip: true` en todos porque las ilustraciones
// gesticulan hacia la derecha y, pegadas al borde derecho, apuntarían fuera de
// la pantalla. Si algún día se cambia el lado, hay que invertir también `flip`.
// `lines` define las frases por contexto (string o array → se elige una al azar).

export const CHARACTERS_BY_THEME = {
  detective: {
    id: 'vera',
    name: 'INSPECTORA VERA CLÍO',
    Avatar: VeraAvatar,
    art: ART.detective, side: 'right', flip: true,
    fx: {
      accent: '#D4A017', accent2: '#EDE8DC',
      aura: 'rgba(212,160,23,.34)', glow: 'rgba(212,160,23,.55)',
      entrance: 'flash',
    },
    ui: {
      bgCard: '#1C1A16', borderCard: 'rgba(212,160,23,.3)',
      nameColor: '#D4A017', textColor: '#EDE8DC',
      bgAvatar: '#1C1A16', borderActive: '#D4A017', borderIdle: 'rgba(212,160,23,.4)',
      glow: '0 0 16px rgba(212,160,23,.5)', glowIdle: '0 4px 16px rgba(0,0,0,.7)',
      animAvatar: 'det-idle-vera 3s ease-in-out infinite',
      dotBg: '#D4A017', dotBorder: '#0A0A0F', dotAnim: 'det-pulse-amber 1.5s ease-in-out infinite',
      revealAnim: 'det-reveal .35s ease both',
    },
    lines: {
      idle: 'El caso está abierto, detective. Cada palabra es una pista. Lee con cuidado.',
      lessonIntro: 'Nuevo expediente sobre la mesa. Observa cada detalle antes de concluir.',
      correct: ['Caso resuelto. Tu deducción fue impecable.', 'Eso es ojo de detective. Bien hecho.'],
      wrong: ['La pista no cuadra. Vuelve a revisar la evidencia, no te apresures.', 'Todo detective se equivoca. Lee de nuevo entre líneas.'],
      moduleComplete: 'Expediente archivado. Pasemos al siguiente caso.',
      routeComplete: 'Has cerrado todos los casos. Eres un detective del texto de verdad.',
    },
    dialogues: {
      welcome: [
        { who: 'tutor', text: 'Así que tú eres {nombre}. Necesito a alguien con ojo fino para este caso.' },
        { who: 'student', text: '¿Y por dónde se empieza a resolver un texto?', exp: 'wow' },
        { who: 'tutor', text: 'Por donde empieza todo buen detective: leyendo lo que nadie más se detuvo a leer.' },
      ],
      comeback: [
        { who: 'tutor', text: 'Volviste, {nombre}. El expediente llevaba días abierto sobre mi escritorio.' },
        { who: 'student', text: 'Se me atravesó la vida, inspectora.', exp: 'sad' },
        { who: 'tutor', text: 'A todos nos pasa. Los casos esperan. Retomemos.' },
      ],
      avatarCreated: [
        { who: 'tutor', text: 'Así que esta es tu cara oficial. Va derecho al archivo.' },
        { who: 'student', text: '¿Salgo bien en la ficha?', exp: 'wow' },
        { who: 'tutor', text: 'Sales creíble. En este oficio eso vale más que salir guapo.' },
      ],
      rankUp: [
        { who: 'tutor', text: 'Mira ese uniforme nuevo, {nombre}. Ya no eres el novato de la comisaría.' },
        { who: 'student', text: '¿Se nota mucho?', exp: 'wow' },
        { who: 'tutor', text: 'Se nota en cómo miras la evidencia. Eso no se disfraza.' },
      ],
      perfect: [
        { who: 'tutor', text: 'Ni un solo error, {nombre}. Eso ya no es suerte.' },
        { who: 'student', text: 'Leí dos veces antes de responder.', exp: 'happy' },
        { who: 'tutor', text: 'Ese es exactamente el método. Anótalo.' },
      ],
      badge: [
        { who: 'tutor', text: 'Condecoración nueva para tu expediente, {nombre}.' },
        { who: 'student', text: '¿Y esto por qué?', exp: 'wow' },
        { who: 'tutor', text: 'Por lo que acabas de resolver. Llévala.' },
      ],
      liveStart: [
        { who: 'tutor', text: 'Sala llena y el reloj corriendo, {nombre}.' },
        { who: 'student', text: '¿Y si me equivoco delante de todos?', exp: 'wow' },
        { who: 'tutor', text: 'Entonces habrá testigos de que lo intentaste. Respira y lee.' },
      ],
      milestone: [
        [
          { who: 'tutor', text: 'Tres expedientes cerrados, {nombre}. Ya no eres novato.' },
          { who: 'student', text: 'Empiezo a ver las pistas antes de que me las señalen.', exp: 'happy' },
        ],
        [
          { who: 'student', text: 'Van varios casos seguidos, inspectora.', exp: 'happy' },
          { who: 'tutor', text: 'Y ninguno se te ha caído. Eso en mi oficio se llama racha.' },
        ],
      ],
      struggle: [
        [
          { who: 'student', text: 'Se me escapa algo… y no doy con qué.', exp: 'sad' },
          { who: 'tutor', text: 'Le pasa a todo investigador. Vuelve al texto: la respuesta ya estaba escrita.' },
        ],
        [
          { who: 'student', text: 'Dos veces seguidas. Me estoy enredando.', exp: 'sad' },
          { who: 'tutor', text: 'Entonces deja de correr. Un buen detective relee antes de acusar.' },
        ],
      ],
      routeComplete: [
        { who: 'tutor', text: 'Caso cerrado, {nombre}. Y no lo resolví yo.' },
        { who: 'student', text: 'Ahora leo distinto. Y mis estudiantes también lo van a notar.', exp: 'happy' },
        { who: 'tutor', text: 'Esa era la investigación de verdad. Buen trabajo, colega.' },
      ],
      liveEnd: [
        { who: 'tutor', text: 'Se cierra la sala de interrogatorios. Buen pulso, {nombre}.' },
        { who: 'student', text: '¡Con la clase entera mirando! Eso pone nervioso a cualquiera.', exp: 'wow' },
        { who: 'tutor', text: 'Y aun así dedujiste. Eso es oficio.' },
      ],
    },
  },
  'escape-room': {
    id: 'axioma',
    name: 'PROF. AXIOMA',
    Avatar: ProfAxiomaAvatar,
    art: ART['escape-room'], side: 'right', flip: true,
    fx: {
      accent: '#f0a500', accent2: '#ff6b35',
      aura: 'rgba(240,165,0,.32)', glow: 'rgba(240,165,0,.55)',
      entrance: 'spark',
    },
    ui: {
      bgCard: 'rgba(10,18,10,.96)', borderCard: 'rgba(240,165,0,.3)',
      nameColor: '#f0a500', textColor: '#d8ccaa',
      bgAvatar: '#0d150d', borderActive: '#f0a500', borderIdle: 'rgba(240,165,0,.4)',
      glow: '0 0 16px rgba(240,165,0,.5)', glowIdle: '0 4px 16px rgba(0,0,0,.7)',
      animAvatar: 'er-idle-prof 3.5s ease-in-out infinite',
      dotBg: '#f0a500', dotBorder: '#080e08', dotAnim: 'er-pulse-amber 1.5s ease-in-out infinite',
      revealAnim: 'er-reveal .35s ease both',
    },
    lines: {
      idle: '¡Resuelve el acertijo y la puerta se abrirá! Cada concepto es una clave.',
      lessonIntro: 'Una sala nueva, un candado nuevo. Lee bien: la clave está en el razonamiento.',
      correct: ['¡Clic! La cerradura cede. Brillante deducción.', '¡Una puerta menos! Vas dominando los acertijos.'],
      wrong: ['El candado no cede. Revisa tu lógica e inténtalo otra vez.', 'Casi. Un error en la secuencia y la puerta se queda cerrada. Reintenta.'],
      moduleComplete: 'Sala superada. La siguiente puerta te espera.',
      routeComplete: '¡Has escapado de todas las salas! Dominas el pensamiento matemático.',
    },
    dialogues: {
      welcome: [
        { who: 'tutor', text: '{nombre}, estás encerrado conmigo en esta sala. La buena noticia: hay salida.' },
        { who: 'student', text: '¿Y si me equivoco al abrir el candado?', exp: 'wow' },
        { who: 'tutor', text: 'Entonces aprendes cómo NO se abre. Eso también es matemática.' },
      ],
      comeback: [
        { who: 'tutor', text: 'Volviste, {nombre}. La sala seguía cerrada, esperándote.' },
        { who: 'student', text: 'Perdí el hilo unos días.', exp: 'sad' },
        { who: 'tutor', text: 'Los candados no caducan. Empecemos otra vez.' },
      ],
      avatarCreated: [
        { who: 'tutor', text: 'Ya tienes con quién resolver esto, {nombre}.' },
        { who: 'student', text: 'Somos dos contra los candados.', exp: 'happy' },
        { who: 'tutor', text: 'Tres. Yo también cuento, aunque no abra puertas.' },
      ],
      rankUp: [
        { who: 'tutor', text: 'Equipo nuevo, {nombre}. Te lo ganaste abriendo puertas.' },
        { who: 'student', text: '¿Ya no soy el que se quedaba atascado en la primera sala?', exp: 'wow' },
        { who: 'tutor', text: 'Ese fue hace varias salas. Mírate ahora.' },
      ],
      perfect: [
        { who: 'tutor', text: 'Todos los candados a la primera. Impecable, {nombre}.' },
        { who: 'student', text: 'Ya no adivino: calculo.', exp: 'happy' },
        { who: 'tutor', text: 'Esa frase vale más que el puntaje.' },
      ],
      badge: [
        { who: 'tutor', text: 'Una llave nueva para tu llavero, {nombre}.' },
        { who: 'student', text: '¿Y esta qué abre?', exp: 'wow' },
        { who: 'tutor', text: 'La confianza. Que es la puerta más dura de todas.' },
      ],
      liveStart: [
        { who: 'tutor', text: 'Contrarreloj y con toda la clase mirando, {nombre}.' },
        { who: 'student', text: 'El pulso se me acelera.', exp: 'wow' },
        { who: 'tutor', text: 'Úsalo. La prisa bien llevada también piensa.' },
      ],
      milestone: [
        [
          { who: 'tutor', text: 'Tres salas abiertas, {nombre}. Ya le tomaste el ritmo a los candados.' },
          { who: 'student', text: 'Ya no adivino: ahora razono el camino.', exp: 'happy' },
        ],
        [
          { who: 'student', text: 'Otra puerta que cede, profesor.', exp: 'happy' },
          { who: 'tutor', text: 'Y cada vez tardas menos. Eso es el método haciendo su trabajo.' },
        ],
      ],
      struggle: [
        [
          { who: 'student', text: 'Este candado no cede por más vueltas que le doy.', exp: 'sad' },
          { who: 'tutor', text: 'Deja de forzarlo. Devuélvete un paso y revisa el razonamiento: ahí está la clave.' },
        ],
        [
          { who: 'student', text: 'Dos intentos y nada. Me trabé.', exp: 'sad' },
          { who: 'tutor', text: 'Trabarse es parte del acertijo. Cambia el ángulo, no la fuerza.' },
        ],
      ],
      routeComplete: [
        { who: 'tutor', text: '¡La última puerta, {nombre}! ¿Sales tú o salgo yo?' },
        { who: 'student', text: 'Salimos los dos. Y me llevo el método para mi aula.', exp: 'happy' },
        { who: 'tutor', text: 'Eso vale más que cualquier llave. ¡Vamos!' },
      ],
      liveEnd: [
        { who: 'tutor', text: 'Se acabó el cronómetro, {nombre}. Contrarreloj y con público.' },
        { who: 'student', text: 'Pensar rápido es otra cosa muy distinta.', exp: 'wow' },
        { who: 'tutor', text: 'Por eso se practica. Hoy lo hiciste.' },
      ],
    },
  },
  lab: {
    id: 'nexus',
    name: 'DRA. NEXUS',
    Avatar: DraNexusAvatar,
    art: ART.lab, side: 'right', flip: true,
    fx: {
      accent: '#00ff88', accent2: '#00d4ff',
      aura: 'rgba(0,255,136,.30)', glow: 'rgba(0,212,255,.5)',
      entrance: 'scan',
    },
    ui: {
      bgCard: 'rgba(4,12,10,.97)', borderCard: 'rgba(0,255,136,.3)',
      nameColor: '#00ff88', textColor: '#c0f0d8',
      bgAvatar: '#04080f', borderActive: '#00ff88', borderIdle: 'rgba(0,255,136,.4)',
      glow: '0 0 16px rgba(0,255,136,.6)', glowIdle: '0 4px 16px rgba(0,0,0,.8)',
      animAvatar: 'lab-idle-nexus 3s ease-in-out infinite',
      dotBg: '#00ff88', dotBorder: '#04080f', dotAnim: 'lab-pulse-green 1.5s ease-in-out infinite',
      revealAnim: 'lab-reveal .35s ease both',
    },
    lines: {
      idle: 'Observar, preguntar, experimentar y concluir. Ese ciclo es la clave de toda la ciencia.',
      lessonIntro: 'Nuevo experimento en marcha. Mantén la mente abierta y registra todo.',
      correct: ['¡Hipótesis confirmada! Tu razonamiento científico es sólido.', '¡Resultado positivo! La evidencia te dio la razón.'],
      wrong: ['Los datos no confirman tu hipótesis. En ciencia eso también enseña: revisa e inténtalo.', 'Un experimento fallido es un dato más. Ajusta tu variable y vuelve a probar.'],
      moduleComplete: 'Experimento documentado. Avancemos al siguiente.',
      routeComplete: 'Has completado todos los experimentos. Eres científica de aula de pleno derecho.',
    },
    dialogues: {
      welcome: [
        { who: 'tutor', text: 'Bienvenido al laboratorio, {nombre}. Aquí nadie tiene la razón: la tienen los datos.' },
        { who: 'student', text: '¿Y si mi hipótesis resulta equivocada?', exp: 'wow' },
        { who: 'tutor', text: 'Entonces habrás aprendido algo. Eso es exactamente el método.' },
      ],
      comeback: [
        { who: 'tutor', text: 'El laboratorio te esperaba, {nombre}. Los cultivos aguantaron.' },
        { who: 'student', text: 'Volví. Se me acumuló el trabajo.', exp: 'sad' },
        { who: 'tutor', text: 'La ciencia es paciente. Retomemos donde quedó la bitácora.' },
      ],
      avatarCreated: [
        { who: 'tutor', text: 'Sujeto de estudio identificado: tú, {nombre}.' },
        { who: 'student', text: '¿Yo soy el experimento?', exp: 'wow' },
        { who: 'tutor', text: 'Aprender también se observa. Empecemos.' },
      ],
      rankUp: [
        { who: 'tutor', text: 'Bata nueva, {nombre}. Ya no eres asistente de laboratorio.' },
        { who: 'student', text: '¿Y ahora qué me toca?', exp: 'wow' },
        { who: 'tutor', text: 'Diseñar tus propios experimentos. Que es lo difícil.' },
      ],
      perfect: [
        { who: 'tutor', text: 'Cero desviaciones, {nombre}. Resultado limpio.' },
        { who: 'student', text: 'Revisé cada dato antes de responder.', exp: 'happy' },
        { who: 'tutor', text: 'Eso se llama rigor. Que quede en la bitácora.' },
      ],
      badge: [
        { who: 'tutor', text: 'Reconocimiento nuevo para tu hoja de vida científica.' },
        { who: 'student', text: '¿Tan formal suena?', exp: 'wow' },
        { who: 'tutor', text: 'El mérito se registra, {nombre}. Acéptalo.' },
      ],
      liveStart: [
        { who: 'tutor', text: 'Experimento colectivo, {nombre}: todo el grupo midiendo a la vez.' },
        { who: 'student', text: '¿Y si mi dato desentona?', exp: 'wow' },
        { who: 'tutor', text: 'Entonces será el más interesante de todos. Adelante.' },
      ],
      milestone: [
        [
          { who: 'tutor', text: 'Tres experimentos registrados, {nombre}. Tu bitácora ya dice mucho.' },
          { who: 'student', text: 'Ahora observo antes de concluir.', exp: 'happy' },
        ],
        [
          { who: 'student', text: 'Otra serie completa, doctora.', exp: 'happy' },
          { who: 'tutor', text: 'Y con datos consistentes. Eso no se improvisa.' },
        ],
      ],
      struggle: [
        [
          { who: 'student', text: 'Los datos no me están dando lo que esperaba.', exp: 'sad' },
          { who: 'tutor', text: 'Perfecto: eso es un hallazgo, no un fracaso. Ajusta una variable y repite.' },
        ],
        [
          { who: 'student', text: 'Dos intentos fallidos seguidos.', exp: 'sad' },
          { who: 'tutor', text: 'Dos datos, entonces. Ningún experimento sale a la primera, {nombre}.' },
        ],
      ],
      routeComplete: [
        { who: 'tutor', text: 'Última anotación en la bitácora, {nombre}. ¿Qué concluyes?' },
        { who: 'student', text: 'Que la ciencia no se enseña: se hace con los estudiantes.', exp: 'happy' },
        { who: 'tutor', text: 'Hipótesis confirmada. Bienvenida al gremio, colega.' },
      ],
      liveEnd: [
        { who: 'tutor', text: 'Experimento colectivo terminado. Datos recogidos, {nombre}.' },
        { who: 'student', text: 'Con todo el grupo respondiendo a la vez la cosa cambia.', exp: 'wow' },
        { who: 'tutor', text: 'Eso también es evidencia. Anótalo.' },
      ],
    },
  },
  'time-travel': {
    id: 'kronos',
    name: 'PROF. KRONOS',
    Avatar: ProfKronosAvatar,
    art: ART['time-travel'], side: 'right', flip: true,
    fx: {
      accent: '#c9a227', accent2: '#5b8dd9',
      aura: 'rgba(91,141,217,.32)', glow: 'rgba(201,162,39,.5)',
      entrance: 'warp',
    },
    ui: {
      bgCard: 'rgba(3,5,20,.97)', borderCard: 'rgba(201,162,39,.3)',
      nameColor: '#c9a227', textColor: '#d4c8e8',
      bgAvatar: '#03050e', borderActive: '#c9a227', borderIdle: 'rgba(201,162,39,.4)',
      glow: '0 0 16px rgba(201,162,39,.55), 0 0 32px rgba(91,141,217,.2)', glowIdle: '0 4px 16px rgba(0,0,0,.9)',
      animAvatar: 'tt-idle-kronos 4s ease-in-out infinite',
      dotBg: '#c9a227', dotBorder: '#03050e', dotAnim: 'tt-pulse-gold 1.5s ease-in-out infinite',
      revealAnim: 'tt-reveal-char .35s ease both',
    },
    lines: {
      idle: 'El presente es solo un instante. El pasado y el futuro esperan a quien sabe observar con ojo crítico.',
      lessonIntro: 'El portal se abre a una nueva época. Observa el contexto antes de juzgar.',
      correct: ['¡La línea del tiempo se alinea! Pensaste como un verdadero historiador.', '¡Exacto! Conectaste pasado y presente con maestría.'],
      wrong: ['Esa decisión altera la historia. Reconsidera la evidencia y vuelve a intentarlo.', 'El tiempo se enreda. Revisa las causas y consecuencias otra vez.'],
      moduleComplete: 'Época recorrida. El portal te lleva a la siguiente.',
      routeComplete: 'Has viajado por todas las épocas. Tu mirada histórica ya transformó tu aula.',
    },
    dialogues: {
      welcome: [
        { who: 'tutor', text: 'El portal te reconoce, {nombre}. Vas a caminar por épocas que ya no existen.' },
        { who: 'student', text: '¿Puedo cambiar algo de lo que pasó?', exp: 'wow' },
        { who: 'tutor', text: 'No. Pero puedes cambiar cómo se entiende. Que no es poco.' },
      ],
      comeback: [
        { who: 'tutor', text: 'El portal reconoció tu huella, {nombre}. Aquí han pasado días.' },
        { who: 'student', text: '¿Cuántos exactamente?', exp: 'sad' },
        { who: 'tutor', text: 'Los suficientes para extrañarte. Sigamos.' },
      ],
      avatarCreated: [
        { who: 'tutor', text: 'Ya tienes figura propia en la línea del tiempo, {nombre}.' },
        { who: 'student', text: '¿Y eso para qué sirve?', exp: 'wow' },
        { who: 'tutor', text: 'La historia solo recuerda a quien tiene rostro.' },
      ],
      rankUp: [
        { who: 'tutor', text: 'Tu atuendo cambió de época, {nombre}. Es el viaje que llevas encima.' },
        { who: 'student', text: 'No me había dado cuenta.', exp: 'wow' },
        { who: 'tutor', text: 'Nadie se da cuenta mientras viaja. Solo al mirar atrás.' },
      ],
      perfect: [
        { who: 'tutor', text: 'Ni una fecha fuera de lugar, {nombre}.' },
        { who: 'student', text: 'Ordené las causas antes de responder.', exp: 'happy' },
        { who: 'tutor', text: 'Así se lee la historia. No de memoria: de raíz.' },
      ],
      badge: [
        { who: 'tutor', text: 'Otra marca en tu bitácora de viaje, {nombre}.' },
        { who: 'student', text: '¿Se van acumulando?', exp: 'wow' },
        { who: 'tutor', text: 'Como las épocas. Y pesan igual.' },
      ],
      liveStart: [
        { who: 'tutor', text: 'Viaje en grupo, {nombre}. Todos a la misma época, al mismo tiempo.' },
        { who: 'student', text: '¿Llegaremos todos juntos?', exp: 'wow' },
        { who: 'tutor', text: 'Cada quien verá algo distinto. De eso se trata.' },
      ],
      milestone: [
        [
          { who: 'tutor', text: 'Tres épocas recorridas, {nombre}. La línea del tiempo te va conociendo.' },
          { who: 'student', text: 'Ya no veo fechas sueltas: veo causas y consecuencias.', exp: 'happy' },
        ],
        [
          { who: 'student', text: 'Otra época cerrada, profesor.', exp: 'happy' },
          { who: 'tutor', text: 'Y sin juzgarla desde hoy. Eso cuesta años.' },
        ],
      ],
      struggle: [
        [
          { who: 'student', text: 'Estoy juzgando esta época con los ojos de hoy, ¿cierto?', exp: 'sad' },
          { who: 'tutor', text: 'Exacto, y por eso se te enreda. Vuelve al contexto y decide otra vez.' },
        ],
        [
          { who: 'student', text: 'Dos veces me equivoqué en lo mismo.', exp: 'sad' },
          { who: 'tutor', text: 'La historia también se repite hasta que alguien la entiende. Reintenta.' },
        ],
      ],
      routeComplete: [
        { who: 'tutor', text: 'Fin del viaje, {nombre}. Te devuelvo a tu presente.' },
        { who: 'student', text: 'Al mismo presente no: ahora sé de dónde viene todo.', exp: 'happy' },
        { who: 'tutor', text: 'Esa es la única máquina del tiempo que existe. Llévala a tu aula.' },
      ],
      liveEnd: [
        { who: 'tutor', text: 'El portal se cierra, {nombre}. Viajaron todos juntos esta vez.' },
        { who: 'student', text: 'Y cada quien vio la época a su manera.', exp: 'wow' },
        { who: 'tutor', text: 'Ahí está la historia: nunca se lee igual dos veces.' },
      ],
    },
  },
}

// ─── API pública ─────────────────────────────────────────────────────────────

// Devuelve el personaje del tema (o null si el tema no tiene uno definido).
export const getCharacter = (theme) => CHARACTERS_BY_THEME[theme] || null

// Relación de aspecto (ancho/alto) del recuadro recortado, en píxeles reales.
export const cropAspect = (c) => (c.w * 1920) / (c.h * 1080)

// Estilos para encuadrar `crop` dentro de un contenedor con esa relación de
// aspecto: la imagen se agranda 1/w veces y se desplaza para que el recuadro
// quede exactamente sobre el contenedor. `left`/`top` en % del contenedor.
export const cropStyle = (c) => ({
  position: 'absolute',
  width: `${100 / c.w}%`,
  left: `${(-100 * c.x) / c.w}%`,
  top: `${(-100 * c.y) / c.h}%`,
  maxWidth: 'none',
})

// Devuelve el guión de conversación de ese momento, con {nombre} ya resuelto.
// null si el tema no tiene guión para ese contexto.
export const getDialogue = (theme, context, nombre = '') => {
  const raw = CHARACTERS_BY_THEME[theme]?.dialogues?.[context]
  if (!Array.isArray(raw) || !raw.length) return null
  // Varias versiones del mismo momento: se elige una al azar.
  const script = Array.isArray(raw[0]) ? raw[Math.floor(Math.random() * raw.length)] : raw
  if (!Array.isArray(script) || !script.length) return null
  return script.map(t => ({ ...t, text: t.text.replace(/\{nombre\}/g, nombre) }))
}

// Resuelve una línea de diálogo para un contexto. Si el contexto no tiene
// línea propia, cae a `idle`. Si el valor es un array, elige una al azar.
export const getCharacterLine = (theme, context = 'idle') => {
  const c = CHARACTERS_BY_THEME[theme]
  if (!c) return null
  const v = c.lines?.[context] ?? c.lines?.idle ?? null
  return Array.isArray(v) ? v[Math.floor(Math.random() * v.length)] : v
}

export { PlaceholderAvatar, RexAvatar }
