// =============================================
// EXPERIA — Banco de actividades para la Clase en Vivo
// Fuente: "GUÍA VISUAL DE PAUSAS ACTIVAS FÍSICAS" y "GUÍA VISUAL DE
// ROMPEHIELOS" (CEINFES, oct 2026). 15 + 15 actividades de 10 minutos.
//
// Lo usa la sección de lección `{type:'activity'}` (lesson.jsx):
//   · `bank: 'ambas'`    → módulo 1 (apertura): el profesor elige entre
//                          físicas y rompehielos.
//   · `bank: 'fisicas'`  → módulo 5 (pausa activa): solo físicas.
//   · `activityId`       → la actividad por defecto de la ruta.
// En la Clase en Vivo el profesor puede cambiarla (LiveHost.jsx) y los
// estudiantes ven la elegida — ver §8 de CLAUDE.md.
//
// Las imágenes viven en public/actividades/ (JPEG, excluidas del precaché).
// Aquí va solo lo que el estudiante necesita para ejecutar la actividad: el
// texto completo de la guía sigue en el .docx original.
// =============================================

export const ACTIVITY_BANKS = {
  fisicas:     { id: 'fisicas',     label: 'Pausas activas físicas', icon: '🤸' },
  rompehielos: { id: 'rompehielos', label: 'Rompehielos',            icon: '🎲' },
  // No es un banco: rotula la actividad que crea el profesor (ver CUSTOM_ID).
  propia:      { id: 'propia',      label: 'Actividad propia',       icon: '✏️' },
}

// Qué bancos ofrece cada valor de `section.bank`.
export const BANK_SCOPES = {
  ambas:       ['fisicas', 'rompehielos'],
  fisicas:     ['fisicas'],
  rompehielos: ['rompehielos'],
}

const img = (file) => `/actividades/${file}.jpg`

const FISICAS = [
  {
    id: 'fis-01', title: 'Estiramiento cérvico-especial', format: 'Individual',
    goal: 'Movilizar cuello, hombros, torso, muñecas y dedos, acompañado de respiración.',
    steps: [
      { time: 'Min 0–3', title: 'Inclinación lateral del cuello', text: 'Sentado, espalda recta y pies apoyados. Inclina lentamente la cabeza a la derecha, vuelve al centro y luego a la izquierda. Mantén 15 segundos por lado, 3 repeticiones. Suave, sin rebotes.' },
      { time: 'Min 3–6', title: 'Hombros y torso', text: 'Círculos con los hombros hacia atrás. Luego inclina el torso hacia adelante extendiendo los brazos y regresa despacio.' },
      { time: 'Min 6–10', title: 'Muñecas, dedos y respiración', text: 'Moviliza muñecas, abre y cierra los dedos. Respiración diafragmática: inhala 4 s, retén 4 s, exhala 6 s.' },
    ],
  },
  {
    id: 'fis-02', title: 'Tracción espinal en parejas', format: 'Parejas',
    goal: 'Generar movilidad suave de la columna y apertura de la zona pectoral.',
    steps: [
      { time: 'Min 0–2', title: 'Posición inicial', text: 'De pie, espalda con espalda. Entrelacen los brazos a la altura de los codos con postura estable, sin tirones.' },
      { time: 'Min 2–6', title: 'Flexión alternada de rodillas', text: 'Flexionen las rodillas de forma alternada sin perder el contacto de espaldas. Movimiento controlado, sin levantar peso.' },
      { time: 'Min 6–10', title: 'Apertura de pectorales', text: 'Palmas juntas lateralmente y empuje suave, sin movimientos bruscos.' },
    ],
  },
  {
    id: 'fis-03', title: 'Coordinación hemisférica', format: 'Individual',
    goal: 'Trabajar coordinación y atención entre movimientos de distintos segmentos del cuerpo.',
    steps: [
      { time: 'Min 0–3', title: 'Manos alternadas', text: 'Mano derecha con el pulgar arriba 👍 y la izquierda con el gesto contrario. Cambia rápido las posiciones y sigue alternando 🔄.' },
      { time: 'Min 3–7', title: 'Mano y pie', text: 'Dibuja un círculo en el aire con el pie derecho ⭕ mientras haces un cuadrado con la mano derecha ⬜. Intenta sostener ambos a la vez.' },
      { time: 'Min 7–10', title: 'Sacudida corporal', text: 'Sacude suavemente brazos y piernas para liberar la tensión y termina con movimientos tranquilos 🧘.' },
    ],
  },
  {
    id: 'fis-04', title: 'Cardio en pupitre sin ruido', format: 'Individual',
    goal: 'Activar el cuerpo sin generar ruido ni interferir con la dinámica del aula.',
    steps: [
      { time: 'Min 0–3', title: 'Marcha silenciosa', text: 'De pie junto a la silla, marcha en el mismo lugar elevando las rodillas. 30 segundos × 3 series, controlado y silencioso.' },
      { time: 'Min 3–7', title: 'Sentadillas suaves', text: 'Frente a la silla, baja lentamente hasta rozar el asiento y sube. 12 repeticiones × 2 series.' },
      { time: 'Min 7–10', title: 'Estiramiento de cuádriceps', text: 'De pie, lleva una pierna atrás y sujeta el empeine. Cambia de lado, sin rebotes.' },
    ],
  },
  {
    id: 'fis-05', title: 'Empuje e isometría guiada', format: 'Parejas',
    goal: 'Activar brazos, hombros y espalda alta mediante resistencia controlada.',
    steps: [
      { time: 'Min 0–2', title: 'Preparación', text: 'Frente a frente, palmas contra las del compañero, en posición estable.' },
      { time: 'Min 2–6', title: 'Empuje isométrico', text: 'Empujen suave y continuo con cerca del 50 % de la fuerza, sin desplazarse. 15 segundos × 4 repeticiones.' },
      { time: 'Min 6–10', title: 'Estiramiento cruzado de escápulas', text: 'Cruza los brazos delante del cuerpo (“abrazo personal”) y luego llévalos atrás cómodamente, sin dolor.' },
    ],
  },
  {
    id: 'fis-06', title: 'Activación de tobillo y gemelos', format: 'Individual',
    goal: 'Activar tobillos y músculos de la pantorrilla.',
    steps: [
      { time: 'Min 0–3', title: 'Elevación de talones', text: 'De pie, apoyado en el respaldo de la silla, sube a las puntas de los pies y baja lento. 20 repeticiones.' },
      { time: 'Min 3–7', title: 'Elevación de puntas', text: 'Talones apoyados, sube las puntas de los pies. 15 repeticiones. Luego círculos suaves con los tobillos 🔄.' },
      { time: 'Min 7–10', title: 'Estiramiento de gemelos', text: 'Una pierna atrás con el talón pegado al suelo y la delantera un poco flexionada. Cambia de pierna.' },
    ],
  },
  {
    id: 'fis-07', title: 'El puente de torsión', format: 'Parejas',
    goal: 'Favorecer la movilidad rotacional del tronco.',
    steps: [
      { time: 'Min 0–3', title: 'Rotación en pareja', text: 'Sentados de lado, uno frente al otro, con la cadera estable. Giren el tronco hacia atrás 🔄 e intenten tocar las palmas del compañero.' },
      { time: 'Min 3–7', title: 'Repeticiones laterales', text: '10 rotaciones a la derecha y 10 a la izquierda, cadera fija, cada una controlada.' },
      { time: 'Min 7–10', title: 'Flexión lateral', text: 'Un brazo sobre la cabeza, inclina el tronco al lado contrario y vuelve. 10 por lado.' },
    ],
  },
  {
    id: 'fis-08', title: 'Gimnasia ocular y visual', format: 'Individual',
    goal: 'Mover la vista y alternar el enfoque como pausa frente a tareas de atención visual.',
    steps: [
      { time: 'Min 0–3', title: 'Direcciones', text: 'Sentado y sin mover la cabeza, mira al techo ⬆️, al suelo ⬇️, a la derecha ➡️ y a la izquierda ⬅️. 10 ciclos.' },
      { time: 'Min 3–7', title: 'Cerca y lejos', text: 'Sostén un lápiz ✏️ a 10 cm de la nariz y mira la punta; luego mira un punto lejano (ventana, árbol) 🌄. Alterna.' },
      { time: 'Min 7–10', title: 'Palming', text: 'Frota las palmas, cierra los ojos y cúbrelos con las manos ahuecadas, sin presionar. Relájate. 10 ciclos.' },
    ],
  },
  {
    id: 'fis-09', title: 'Secuencia “Saludo al aula”', format: 'Individual',
    goal: 'Movilizar todo el cuerpo mediante una secuencia progresiva.',
    steps: [
      { time: 'Min 0–3', title: 'Elevación y flexión', text: 'De pie, sube los brazos inhalando profundo; luego flexiona el tronco hacia adelante llevando las manos a los pies y regresa despacio.' },
      { time: 'Min 3–7', title: 'Zancadas laterales', text: 'Zancada corta a un lado, vuelve al centro y repite al otro, espalda recta. 8 por lado.' },
      { time: 'Min 7–10', title: 'Posición de estrella', text: 'Abre brazos y piernas como una estrella ⭐ y mantén 5 segundos. Descansa. 3 veces.' },
    ],
  },
  {
    id: 'fis-10', title: 'Resistencia manual cruzada', format: 'Parejas',
    goal: 'Activar hombros y espalda mediante resistencia manual controlada.',
    steps: [
      { time: 'Min 0–3', title: 'Primer trabajo de resistencia', text: 'A sujeta suavemente las muñecas de B; B intenta abrir los brazos despacio mientras A ofrece resistencia controlada. Sin tirones.' },
      { time: 'Min 3–6', title: 'Cambio de roles 🔄', text: 'Intercambien los papeles: quien resistía ahora hace el movimiento.' },
      { time: 'Min 6–10', title: 'Estiramiento de tríceps', text: 'Un brazo sobre la cabeza, dobla el codo llevando la mano a la espalda y acompaña con la otra mano. Cambia de brazo.' },
    ],
  },
  {
    id: 'fis-11', title: 'Percusión corporal y ritmo', format: 'Individual',
    goal: 'Estimular coordinación, ritmo, atención y activación corporal.',
    steps: [
      { time: 'Min 0–3', title: 'Patrón de percusión', text: '2 palmadas en los muslos, 1 aplauso 👏 y 1 chasquido de dedos 👌. Repite la secuencia.' },
      { time: 'Min 3–7', title: 'Sube la velocidad 🚀', text: 'De pie y erguido, acelera el patrón en 4 niveles de velocidad.' },
      { time: 'Min 7–10', title: 'Desaceleración 🐢', text: 'Baja la velocidad poco a poco hasta movimientos tranquilos y termina con respiración profunda.' },
    ],
  },
  {
    id: 'fis-12', title: 'Postura de la montaña y eje', format: 'Individual',
    goal: 'Trabajar conciencia corporal, alineación y equilibrio.',
    steps: [
      { time: 'Min 0–3', title: 'Alineación corporal', text: 'Pies firmes en el suelo y postura erguida. Alinea tobillos → rodillas → pelvis → hombros, con la cabeza alineada.' },
      { time: 'Min 3–7', title: 'Equilibrio', text: 'Ojos cerrados, eleva una pierna y mantén 20 segundos. Cambia. ⚠️ Solo en un lugar estable; si cuesta con los ojos cerrados, hazlo con apoyo.' },
      { time: 'Min 7–10', title: 'Asentamiento', text: 'Apoya ambos pies, siente las plantas en el suelo, sacude las manos y relaja brazos y hombros.' },
    ],
  },
  {
    id: 'fis-13', title: 'Sentadilla de pared (isometría)', format: 'Individual o parejas',
    goal: 'Activar las piernas mediante una posición isométrica controlada.',
    steps: [
      { time: 'Posición', title: 'Silla invisible 🪑', text: 'Espalda apoyada en la pared y rodillas a 90° 📐.' },
      { time: 'Series', title: '30 s × 3', text: 'Sostén 30 segundos, 3 series ⏱️.' },
      { time: 'Parejas', title: 'Ánimo mutuo 🤝', text: 'En parejas se animan a mantener la postura. Variante grupal: quien se mueva o se separe de la pared sale del juego y se sienta con las piernas estiradas en su sitio.' },
    ],
  },
  {
    id: 'fis-14', title: 'Movilidad articular completa', format: 'Individual',
    goal: 'Movilizar progresivamente las principales articulaciones.',
    steps: [
      { time: '5 min', title: 'De abajo hacia arriba', text: 'Círculos continuos 🔄, 1 minuto cada uno: tobillos → rodillas → cadera → hombros → muñecas.' },
      { time: '5 min', title: 'De arriba hacia abajo', text: 'Repite la secuencia en orden inverso: muñecas → hombros → cadera → rodillas → tobillos.' },
    ],
  },
  {
    id: 'fis-15', title: 'Despresurización lumbar', format: 'Individual',
    goal: 'Favorecer la relajación del tronco y un retorno controlado.',
    steps: [
      { time: 'Posición', title: 'Flexión del torso', text: 'Sentado, rodillas abiertas 🦵🦵, inclina lentamente el torso hacia adelante dejando caer brazos y cabeza. 5 repeticiones.' },
      { time: '2 min', title: 'Relajación', text: 'Brazos y cabeza colgando entre las piernas, respirando tranquilo ⏱️. Sin movimientos bruscos.' },
      { time: 'Retorno', title: 'Vértebra por vértebra', text: 'Incorpórate despacio, enrollando la columna de forma gradual hasta la posición inicial.' },
    ],
  },
].map((a, i) => ({ ...a, bank: 'fisicas', num: i + 1, duration: '10 min', image: img(`fisica-${String(i + 1).padStart(2, '0')}`) }))

const ROMPEHIELOS = [
  {
    id: 'rom-01', title: 'Dos verdades y un mito flash', format: 'Parejas',
    goal: 'Conocerse entre compañeros, generar curiosidad y conversaciones rápidas.',
    steps: [
      { time: 'Min 0–3', title: 'Escribir', text: 'Cada estudiante escribe en un papel 2 datos reales y 1 inventado sobre sí mismo (gustos, experiencias, habilidades). Ej.: “Me gusta cocinar, he viajado a otras ciudades y sé tocar cinco instrumentos”.' },
      { time: 'Min 3–8', title: 'Entrevista', text: 'En parejas intercambian papeles. Cada uno tiene 2,5 minutos para descubrir cuál es el mito preguntando: ¿cuándo?, ¿por qué?, ¿dónde?, ¿cómo aprendiste? Luego cambian de rol.' },
      { time: 'Min 8–10', title: 'Revelación', text: 'El grupo comparte los 3 datos más sorprendentes que encontró.' },
    ],
    outcome: 'Descubrir aspectos interesantes de los compañeros y puntos de conexión.',
  },
  {
    id: 'rom-02', title: 'El superpoder oculto', format: 'Individual',
    goal: 'Reconocer habilidades personales no académicas y valorar las capacidades de cada uno.',
    steps: [
      { time: 'Min 0–3', title: 'Mi insignia', text: 'Cada estudiante dibuja en una tarjeta la insignia de su “superpoder no académico”: escuchar, cocinar, dibujar, bailar, ayudar, contar historias, hacer reír…' },
      { time: 'Min 3–7', title: 'Galería de superpoderes', text: 'Con la tarjeta en el pecho, saludan a 4 compañeros: “Hola, soy ___ y mi superpoder es ___”.' },
      { time: 'Min 7–10', title: 'Tres poderes', text: 'El docente elige 3 poderes al azar; quienes los tengan cuentan por qué es un superpoder, cómo lo desarrollaron y cuándo lo usan.' },
    ],
    outcome: 'Reconocer fortalezas personales y conversar con compañeros con los que se interactúa poco.',
  },
  {
    id: 'rom-03', title: 'Mímica del objeto imposible', format: 'Parejas',
    goal: 'Desarrollar comunicación no verbal, expresión corporal, observación e interpretación.',
    steps: [
      { time: 'Min 0–2', title: 'Recibir el rol', text: 'Cada pareja recibe una situación imposible (ej.: “persona usando una sombrilla de alambre durante una tormenta”) y la entiende antes de representarla.' },
      { time: 'Min 2–7', title: 'Primera ronda', text: '5 parejas representan su escena SIN hablar —gestos, movimientos y expresiones— mientras el resto intenta adivinar.' },
      { time: 'Min 7–10', title: 'Segunda ronda y cierre', text: 'Otras 5 parejas. Cierre: ¿qué ayudó a entender el mensaje sin palabras?' },
    ],
    outcome: 'Comprender la importancia de los gestos y la comunicación corporal.',
  },
  {
    id: 'rom-04', title: 'Usos alternativos exprés', format: 'Individual',
    goal: 'Estimular creatividad y pensamiento divergente: muchos usos para un mismo objeto.',
    steps: [
      { time: 'Min 0–2', title: 'El objeto', text: 'El docente muestra un objeto cotidiano (clip, lápiz, regla…) y el grupo piensa usos distintos al habitual.' },
      { time: 'Min 2–6', title: 'Generación individual', text: 'Cada estudiante escribe en su cuaderno la mayor cantidad de usos no convencionales: construcción, arte, juegos, medición… Se buscan ideas originales, no “correctas”.' },
      { time: 'Min 6–10', title: 'Ráfaga de respuestas', text: 'Ronda rápida: varios estudiantes comparten su uso más creativo. Regla: no repetir una respuesta ya dicha.' },
    ],
    outcome: 'Estimular fluidez, flexibilidad y originalidad en la generación de ideas.',
  },
  {
    id: 'rom-05', title: 'Entrevista de 180 segundos', format: 'Parejas',
    goal: 'Promover interacción entre quienes casi no se hablan y practicar escucha y presentación.',
    steps: [
      { time: 'Min 0–1', title: 'Formar parejas', text: 'Cada uno busca al compañero con el que menos ha hablado.' },
      { time: 'Min 1–4', title: 'A entrevista a B', text: 'Con 3 preguntas guía que proyecta el docente.' },
      { time: 'Min 4–7', title: 'Cambio de roles', text: 'Ahora B entrevista a A.' },
      { time: 'Min 7–10', title: 'Presentaciones', text: 'El docente elige 3 parejas al azar: cada uno presenta a su compañero en 30 segundos, destacando algo interesante que descubrió.' },
    ],
    outcome: 'Fortalecer escucha, empatía, expresión oral y conocimiento entre compañeros.',
  },
  {
    id: 'rom-06', title: 'Mi vida en 3 emoji-iconos', format: 'Individual',
    goal: 'Presentarse de forma sencilla y creativa mediante imágenes.',
    steps: [
      { time: 'Min 0–3', title: 'Dibujar', text: 'Cada estudiante dibuja 3 emojis simples: su estado actual, un gusto y un pasatiempo. No hace falta que sean dibujos complejos.' },
      { time: 'Min 3–7', title: 'Búsqueda de coincidencias', text: 'Todos muestran su hoja a la vez y, en silencio, buscan 2 personas con iconos parecidos.' },
      { time: 'Min 7–10', title: 'Comentario', text: 'Comparten las coincidencias: qué emoji coincidió, qué significa para ellos y por qué lo eligieron.' },
    ],
    outcome: 'Descubrir intereses compartidos y generar nuevas conexiones.',
  },
  {
    id: 'rom-07', title: 'El dibujo a ciegas', format: 'Parejas',
    goal: 'Fortalecer la comunicación efectiva: describir con precisión e interpretar instrucciones.',
    steps: [
      { time: 'Min 0–2', title: 'Espalda con espalda', text: 'A recibe una figura geométrica abstracta; B no debe verla.' },
      { time: 'Min 2–6', title: 'Describir y dibujar', text: 'A la describe con palabras e indicaciones espaciales; B la dibuja en su libreta sin verla.' },
      { time: 'Min 6–8', title: 'Comparación', text: 'Ponen lado a lado la figura original y el dibujo, y comparan las diferencias con humor.' },
      { time: 'Min 8–10', title: 'Cierre', text: 'Reflexión breve: ¿qué hace que una comunicación sea efectiva?' },
    ],
    outcome: 'Comprender que comunicar bien exige precisión, escucha y verificación.',
  },
  {
    id: 'rom-08', title: 'Pregunta inusual en la espalda', format: 'Grupal',
    goal: 'Romper la rutina y generar conversaciones espontáneas y divertidas.',
    steps: [
      { time: 'Min 0–2', title: 'La nota', text: 'El docente pega en la espalda de cada estudiante una nota con una pregunta inusual (ej.: “¿Prefieres volar o ser invisible?”). Nadie ve la suya.' },
      { time: 'Min 2–7', title: 'Interacción', text: 'Circulan por el aula, leen la pregunta de otros compañeros y les responden en voz baja al oído.' },
      { time: 'Min 7–10', title: 'Descubrimiento', text: 'Cada uno retira su nota y comparte la respuesta más graciosa o inesperada que escuchó.' },
    ],
    outcome: 'Favorecer la espontaneidad, el humor positivo y la interacción.',
  },
  {
    id: 'rom-09', title: 'La paradoja del dilema', format: 'Parejas',
    goal: 'Desarrollar argumentación, negociación, escucha y toma de decisiones.',
    steps: [
      { time: 'Min 0–2', title: 'El dilema', text: 'El docente plantea un dilema (ej.: “¿Preferirías viajar al pasado o al futuro?”) y cada uno decide su postura.' },
      { time: 'Min 2–6', title: 'Negociación en parejas', text: 'Explican sus razones y escuchan al otro: “Yo creo que…”, “Pero si…”, “No estoy de acuerdo porque…”.' },
      { time: 'Min 6–10', title: 'Votación y defensa', text: 'Votación a mano alzada; luego algunas parejas defienden su postura en 1 minuto.' },
    ],
    outcome: 'Argumentar y entender que distintas personas llegan a conclusiones distintas.',
  },
  {
    id: 'rom-10', title: 'La micro-historia dual', format: 'Parejas',
    goal: 'Estimular creatividad, escritura colaborativa y escucha.',
    steps: [
      { time: 'Min 0–2', title: 'Preparación', text: 'En pareja, una sola hoja y dos bolígrafos.' },
      { time: 'Min 2–6', title: 'Construir la historia', text: 'Escriben por turnos: cada persona escribe UNA palabra y pasa el turno. No pueden hablar.' },
      { time: 'Min 6–8', title: 'Lectura', text: 'Leen en voz baja la historia completa y comprueban si tiene sentido.' },
      { time: 'Min 8–10', title: 'Socialización', text: '3 parejas leen su microcuento en voz alta.' },
    ],
    outcome: 'Experimentar cómo la creatividad colectiva produce resultados inesperados.',
  },
  {
    id: 'rom-11', title: 'Mapa de afinidades en 4 esquinas', format: 'Grupal',
    goal: 'Identificar intereses comunes y formar pequeños grupos de conversación.',
    steps: [
      { time: 'Min 0–2', title: 'Preparación', text: 'Cada esquina del aula representa un interés: ⚽ Deportes, 🎵 Música, 🎨 Arte, 💻 Tecnología.' },
      { time: 'Min 2–5', title: 'Elección', text: 'Cada estudiante camina a la esquina de su interés favorito.' },
      { time: 'Min 5–8', title: 'Conversación', text: 'En cada esquina conversan con un compañero: por qué eligieron esa categoría y qué experiencia han tenido.' },
      { time: 'Min 8–10', title: 'Regreso', text: 'Todos vuelven a sus pupitres con energía y conexión renovadas.' },
    ],
    outcome: 'Identificar afinidades y generar nuevas conexiones.',
  },
  {
    id: 'rom-12', title: 'Conversación muda y gestual', format: 'Parejas',
    goal: 'Desarrollar comunicación no verbal, expresión corporal e interpretación.',
    steps: [
      { time: 'Min 0–2', title: 'La regla', text: 'En parejas. 🚫 No se puede hablar: solo gestos y expresiones corporales.' },
      { time: 'Min 2–7', title: 'Comunicación gestual', text: 'Cada uno le cuenta al otro qué comió, qué hizo y qué vivió el fin de semana (🍝 comer, 😴 dormir, 🏀 jugar). El compañero interpreta.' },
      { time: 'Min 7–10', title: 'Verificación', text: 'Se habilita la voz y comprueban qué tanto entendieron.' },
    ],
    outcome: 'Comprender las posibilidades y los límites de comunicarse sin palabras.',
  },
  {
    id: 'rom-13', title: 'Escultura con 1 objeto', format: 'Parejas',
    goal: 'Estimular creatividad, cooperación y pensamiento de diseño con objetos cotidianos.',
    steps: [
      { time: '1 min', title: 'Preparación', text: 'Cada estudiante elige 1 objeto de su cartuchera: ✏️ lápiz, goma, 📏 regla, sacapuntas.' },
      { time: '5 min', title: 'Creación', text: 'En parejas combinan sus objetos para imaginar un “invento futurista” (4 min) y le ponen nombre y función (1 min).' },
      { time: '4 min', title: 'Exposición y cierre', text: 'Cada pareja presenta su invento al compañero de al lado en 30 s; votación rápida del más creativo; cierre: “¿Qué hizo que esta idea fuera diferente?”.' },
    ],
    outcome: 'Transformar objetos cotidianos mediante imaginación y creatividad colaborativa.',
  },
  {
    id: 'rom-14', title: 'El espejo simétrico', format: 'Parejas',
    goal: 'Trabajar atención, coordinación, sincronización y confianza entre compañeros.',
    steps: [
      { time: 'Min 0–2', title: 'Preparación', text: 'Frente a frente: uno es el “espejo” y el otro dirige los movimientos.' },
      { time: 'Min 2–4', title: 'Primera ronda', text: 'Quien dirige mueve lentamente brazos, manos y torso; el espejo lo imita exactamente como un reflejo.' },
      { time: 'Min 4–6', title: 'Cambio de rol', text: 'Ahora dirige el otro durante 2 minutos.' },
      { time: 'Min 6–10', title: 'Cierre', text: 'Movimientos suaves y una breve conversación sobre la experiencia.' },
    ],
    outcome: 'Fortalecer la atención hacia el otro y la precisión al seguir movimientos.',
  },
  {
    id: 'rom-15', title: 'Carta del futuro exprés', format: 'Individual',
    goal: 'Promover reflexión personal y compromiso con metas futuras.',
    steps: [
      { time: '2 min', title: 'Explicación', text: 'El docente explica el proceso.' },
      { time: '5 min', title: 'Escritura', text: 'Cada estudiante escribe 3 líneas a su “yo del final del año”, empezando con “Hoy me propongo…”, y la relee para verificar que el propósito sea claro.' },
      { time: '1 min', title: 'Compromiso 🤝✉️', text: 'Guarda la carta en su libreta para revisarla más adelante.' },
      { time: '2 min', title: 'Reflexión', text: '¿Qué quiero lograr? ¿Qué puedo empezar a hacer? ¿Cómo quiero verme al finalizar el año?' },
    ],
    outcome: 'Convertir una reflexión breve en un compromiso personal que se pueda retomar.',
  },
].map((a, i) => ({ ...a, bank: 'rompehielos', num: i + 1, duration: '10 min', image: img(`rompehielo-${String(i + 1).padStart(2, '0')}`) }))

export const ACTIVITIES = [...FISICAS, ...ROMPEHIELOS]

const BY_ID = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]))

export const getActivity = (id) => BY_ID[id] || null

export const activitiesForScope = (scope) =>
  ACTIVITIES.filter(a => (BANK_SCOPES[scope] || BANK_SCOPES.ambas).includes(a.bank))

// ── Actividad propia ─────────────────────────────────────────────────────────
// Si el profesor no quiere una del banco, crea la suya. Dos lugares:
//   · en la ruta (editor): `section.custom = {...}` + `activityId: 'custom'`,
//     y queda como la actividad por defecto de ese módulo;
//   · solo para una clase en vivo: la elección es `{ custom: {...} }` en vez
//     de un id (live_sessions.activity_choices / profiles.activity_prefs).
// Misma forma que una del banco (title, format, duration, goal, steps,
// outcome), con imagen opcional.
export const CUSTOM_ID = 'custom'

export const normalizeCustom = (c) => {
  if (!c || !String(c.title || '').trim()) return null
  const t = (v) => String(v || '').trim()
  return {
    id: CUSTOM_ID, bank: 'propia', title: t(c.title), format: t(c.format),
    duration: t(c.duration) || '10 min', goal: t(c.goal), outcome: t(c.outcome), image: t(c.image),
    steps: (c.steps || []).map(s => ({ time: t(s.time), title: t(s.title), text: t(s.text) }))
      .filter(s => s.title || s.text),
  }
}

// Actividad que se muestra para una sección `{type:'activity'}`:
//   1. la elegida en la clase en vivo (del banco de la sección, o propia);
//   2. la por defecto de la ruta (del banco, o la propia de la sección);
//   3. la primera del banco.
// Nunca devuelve null con un banco válido — el estudiante siempre ve algo.
export const resolveActivity = (section, choice) => {
  const scope = BANK_SCOPES[section?.bank] ? section.bank : 'ambas'
  const allowed = BANK_SCOPES[scope]
  const pick = (id) => { const a = getActivity(id); return a && allowed.includes(a.bank) ? a : null }
  const custom = normalizeCustom(section?.custom)
  const chosen = choice && typeof choice === 'object' ? normalizeCustom(choice.custom)
    : choice === CUSTOM_ID ? custom : pick(choice)
  return chosen
    || (section?.activityId === CUSTOM_ID ? custom : pick(section?.activityId))
    || activitiesForScope(scope)[0] || null
}
