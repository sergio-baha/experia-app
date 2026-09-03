import React from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { clearIdleActivity } from '../lib/idleTimeout.js'
// =============================================
// EXPERIA — State Store & Data (v12)
// =============================================

const createExpStore = (init) => {
  let state = { ...init }; const subs = new Set();
  return {
    get: () => state,
    set: (partial) => {
      state = { ...state, ...(typeof partial === 'function' ? partial(state) : partial) };
      subs.forEach(fn => fn(state));
    },
    sub: (fn) => { subs.add(fn); return () => subs.delete(fn); }
  };
};
const useStore = (sel) => {
  const selRef = React.useRef(sel);
  selRef.current = sel;
  return React.useSyncExternalStore(
    (onChange) => XS.sub(() => onChange()),
    () => selRef.current(XS.get()),
  );
};


// --- Areas --- (colores alineados con CEINFES Brandbook)
const AREAS = [
  { id:'lectura',      name:'Lectura Crítica',           icon:'📖', color:'#EC671A', bg:'#FEF0E6' }, // Naranja Evolución
  { id:'ciudadanas',   name:'Competencias Ciudadanas',   icon:'🏛️', color:'#5E4F9C', bg:'#EDEAF7' }, // Morado Formación
  { id:'ingles',       name:'Inglés',                    icon:'🌎', color:'#3A5BA7', bg:'#EBF0FA' }, // Azul Pensamiento
  { id:'matematicas',  name:'Matemáticas',               icon:'📐', color:'#2D9070', bg:'#E8F6F1' }, // Verde Desarrollo (oscurecido para legibilidad)
  { id:'ciencias',     name:'Ciencias Naturales',        icon:'🔬', color:'#024B4E', bg:'#E0EEED' }, // Verde Transformación
];

const BADGES = {
  explorer:{id:'explorer',name:'Explorador DCE',icon:'🧭',desc:'Completaste la introducción'},
  empathist:{id:'empathist',name:'Empático Educativo',icon:'💛',desc:'Dominaste la empatía educativa'},
  designer:{id:'designer',name:'Diseñador Experiencial',icon:'✏️',desc:'Completaste diseño instruccional'},
  innovator:{id:'innovator',name:'Innovador Pedagógico',icon:'🚀',desc:'Innovación pedagógica completada'},
  master:{id:'master',name:'Maestro DCE',icon:'👑',desc:'Completaste toda la formación'},
  challenger:{id:'challenger',name:'Retador',icon:'⚡',desc:'Completaste tu primer reto'},
  speedster:{id:'speedster',name:'Veloz',icon:'⏱️',desc:'Reto avanzado completado'},
  builder:{id:'builder',name:'Constructor',icon:'🏗️',desc:'Creaste tu producto final'},
  companero:{id:'companero',name:'Voz de la Comunidad',icon:'💬',desc:'Participaste en el foro educativo'},
};
const LEVELS = [0,100,250,500,800,1200,1800,2500,3500];
const RUBRIC_CRITERIA = [
  { key:'pertinencia', label:'Pertinencia Pedagógica', desc:'¿La entrega es pertinente al área?' },
  { key:'calidad', label:'Calidad de la Pregunta', desc:'¿La pregunta está bien formulada?' },
  { key:'alineacion', label:'Alineación con el Área', desc:'¿Contenidos alineados con estándares del área?' },
  { key:'completitud', label:'Completitud de la Rejilla', desc:'¿La rejilla contiene todos los campos?' },
];

// ==========================================
// MODULE DEFINITIONS
// ==========================================

// --- Shared Modules (everyone) ---
const SHARED_MODULES = [
  { id:'mod1', type:'lesson', area:null, title:'Introducción al DCE', subtitle:'Módulo 1',
    desc:'Fundamentos del Diseño Centrado en Evidencias y su relevancia educativa.',
    task:'Lee todo el contenido del módulo. Cuando hayas avanzado más del 85% de la lectura, aparecerá el botón "Completar lección" para ganar 100 XP y desbloquear el primer reto.',
    xp:100, badge:'explorer', req:[], pos:{x:42,y:0}, side:'right',
    content:[
      {type:'intro',title:'¿Qué es el Diseño Centrado en Evidencias?',text:'El DCE sitúa la experiencia del estudiante como eje central del proceso educativo, creando momentos de aprendizaje significativos y transformadores.'},
      {type:'callout',icon:'💡',title:'Principio Fundamental',text:'Los estudiantes no solo aprenden contenidos — viven experiencias. La calidad de esas experiencias determina la profundidad del aprendizaje.'},
      {type:'concepts',title:'Pilares del DCE',items:[
        {t:'Empatía',d:'Comprender las necesidades, emociones y contextos de los estudiantes.'},
        {t:'Co-creación',d:'Involucrar a los estudiantes como co-diseñadores de sus experiencias.'},
        {t:'Iteración',d:'Diseñar, probar, reflexionar y mejorar continuamente.'},
        {t:'Reflexión',d:'Crear espacios para dar significado a las experiencias.'},
      ]},
      {type:'text',title:'Orígenes del DCE',text:'El DCE integra el aprendizaje experiencial de John Dewey, el Design Thinking de IDEO, y la pedagogía humanista en un marco práctico para docentes del siglo XXI.'},
      {type:'video',title:'Video introductorio: DCE en acción',
        desc:'Mira este video antes de continuar con el ejemplo práctico.',
        url:'https://www.youtube.com/watch?v=n2itLW4yp4o'},
      {type:'embed',title:'Recurso interactivo: Explora el DCE',
        desc:'Recorre esta presentación interactiva para reforzar los conceptos vistos.',
        url:'https://view.genially.com/6a4bdec552b0cf887466e451'},
      {type:'compare',title:'Ejemplo Práctico — Clase de Historia',label:'Revolución Industrial',
        trad:'El docente expone los hechos con diapositivas y los estudiantes toman notas.',
        dce:'Los estudiantes recrean un taller de la época, simulan roles, debaten condiciones laborales y reflexionan sobre su impacto actual.'},
    ]
  },
  { id:'ch1', type:'challenge', ctype:'dragdrop', area:null, title:'Evaluación: Introducción al DCE', subtitle:'Reto',
    desc:'Ordena las fases del DCE correctamente.', xp:150, badge:'challenger', req:['mod1'], pos:{x:62,y:1}, side:'left',
    task:'Arrastra las 5 fases del DCE y colócalas en el orden correcto: Empatizar → Definir → Idear → Prototipar → Evaluar. Haz clic en "Verificar orden" cuando estés listo.' },
  { id:'mod2', type:'lesson', area:null, title:'Empatía Educativa', subtitle:'Módulo 2',
    desc:'Técnicas para comprender las experiencias y emociones de los estudiantes.',
    task:'Lee el módulo completo sobre las 3 dimensiones de la empatía (cognitiva, emocional, contextual) y el Mapa de Empatía. Desplázate hasta el final para habilitar el botón de completar.',
    xp:120, badge:'empathist', req:['ch1'], pos:{x:36,y:2}, side:'right',
    content:[
      {type:'intro',title:'La Empatía como Competencia Docente',text:'La empatía educativa permite comprender y conectar con las experiencias y perspectivas de los estudiantes para diseñar desde esa comprensión.'},
      {type:'video',title:'Video: La empatía en el aula',
        desc:'Mira este video para profundizar en la empatía educativa.',
        url:'https://www.youtube.com/watch?v=inC0xQV7eak'},
      {type:'concepts',title:'Dimensiones de la Empatía',items:[
        {t:'Cognitiva',d:'Entender cómo piensan los estudiantes y sus modelos mentales.'},
        {t:'Emocional',d:'Conectar con las emociones durante el aprendizaje.'},
        {t:'Contextual',d:'Comprender el contexto de vida y circunstancias de cada estudiante.'},
      ]},
      {type:'callout',icon:'🗺️',title:'Mapa de Empatía',text:'Organiza lo que sabemos del estudiante en cuatro cuadrantes: piensa, siente, dice y hace.'},
    ]
  },
  { id:'ch2', type:'challenge', ctype:'empathy', area:null, title:'Mapa de Empatía Interactivo', subtitle:'Reto',
    desc:'Construye un mapa de empatía para un estudiante tipo.', xp:180, req:['mod2'], pos:{x:66,y:3}, side:'left',
    task:'Arrastra las 8 tarjetas al cuadrante correcto del Mapa de Empatía: Piensa, Siente, Dice o Hace. Coloca todas las tarjetas antes de hacer clic en "Verificar mapa".' },
];

// --- Area-specific content ---
const AREA_CONTENT = {
  lectura: {
    m3:{title:'DCE en Lectura Crítica',desc:'Diseña experiencias de lectura crítica usando el DCE.',
      content:[
        {type:'intro',title:'Lectura como Experiencia',text:'La lectura crítica no es solo decodificar texto — es vivir una experiencia cognitiva y emocional. El DCE transforma la clase de lectura en un espacio donde los estudiantes interactúan con textos de forma significativa.'},
        {type:'concepts',title:'Estrategias DCE para Lectura',items:[
          {t:'Lectura inmersiva',d:'Crear contextos que sumerjan al estudiante en el mundo del texto.'},
          {t:'Diálogo textual',d:'Facilitar conversaciones genuinas entre el lector y el texto.'},
          {t:'Análisis experiencial',d:'Conectar los textos con experiencias vividas por los estudiantes.'},
        ]},
        {type:'callout',icon:'📖',title:'Clave',text:'Pregúntate: ¿qué experiencia quiero que mis estudiantes vivan al leer este texto? No solo qué deben aprender.'},
      ]},
    m4:{title:'Evaluación Experiencial en Lectura',desc:'Métodos de evaluación experiencial para lectura crítica.',
      content:[
        {type:'intro',title:'Evaluar la Experiencia Lectora',text:'La evaluación en lectura crítica bajo el DCE va más allá de la comprensión literal. Evalúa la relación del estudiante con el texto y su capacidad de análisis crítico.'},
        {type:'concepts',title:'Instrumentos de Evaluación',items:[
          {t:'Diario de lectura reflexivo',d:'El estudiante registra sus reacciones, preguntas y conexiones con cada texto.'},
          {t:'Debate argumentativo',d:'Evaluación oral donde el estudiante defiende interpretaciones con evidencia textual.'},
          {t:'Portfolio de análisis',d:'Colección de análisis que muestra la evolución del pensamiento crítico.'},
        ]},
      ]},
    simContext:'una clase de lectura crítica sobre análisis de noticias para 10° grado',
    matchPairs:[
      {id:1,concept:'Inferencia',def:'Deducir información implícita del texto',color:'#E8732C'},
      {id:2,concept:'Propósito del autor',def:'Intención comunicativa detrás del texto',color:'#7B3FA0'},
      {id:3,concept:'Argumento',def:'Afirmación respaldada con evidencia textual',color:'#3B82F6'},
      {id:4,concept:'Sesgo',def:'Perspectiva parcial que influye en la información',color:'#10B981'},
      {id:5,concept:'Intertextualidad',def:'Relación entre diferentes textos y contextos',color:'#F59E0B'},
      {id:6,concept:'Contexto',def:'Circunstancias históricas y sociales de un texto',color:'#EC4899'},
    ],
  },
  ciudadanas: {
    m3:{title:'DCE en Competencias Ciudadanas',desc:'Diseña experiencias de formación ciudadana.',
      content:[
        {type:'intro',title:'Ciudadanía como Experiencia',text:'Las competencias ciudadanas se desarrollan viviendo experiencias democráticas, no memorizando conceptos. El DCE transforma el aula en un laboratorio de convivencia.'},
        {type:'concepts',title:'Estrategias DCE Ciudadanas',items:[
          {t:'Dilemas éticos',d:'Plantear situaciones reales que requieran toma de decisiones éticas.'},
          {t:'Simulación democrática',d:'Crear experiencias de participación, debate y consenso.'},
          {t:'Proyectos comunitarios',d:'Conectar el aprendizaje con acciones en la comunidad real.'},
        ]},
      ]},
    m4:{title:'Evaluación en Competencias Ciudadanas',desc:'Evaluar competencias ciudadanas de forma experiencial.',
      content:[
        {type:'intro',title:'Evaluar la Ciudadanía Activa',text:'La evaluación ciudadana observa cómo el estudiante actúa en situaciones que requieren empatía, pensamiento crítico y participación.'},
        {type:'concepts',title:'Instrumentos',items:[
          {t:'Portafolio ciudadano',d:'Evidencia de acciones ciudadanas y reflexión ética.'},
          {t:'Autoevaluación ética',d:'El estudiante analiza sus propias decisiones y su impacto.'},
        ]},
      ]},
    simContext:'un taller de resolución de conflictos en una comunidad escolar diversa',
    matchPairs:[
      {id:1,concept:'Participación',def:'Involucrarse activamente en decisiones colectivas',color:'#E8732C'},
      {id:2,concept:'Pluralidad',def:'Reconocer y valorar la diversidad de perspectivas',color:'#7B3FA0'},
      {id:3,concept:'Convivencia',def:'Construir relaciones respetuosas en comunidad',color:'#3B82F6'},
      {id:4,concept:'Pensamiento crítico',def:'Cuestionar y analizar situaciones sociales',color:'#10B981'},
      {id:5,concept:'Derechos humanos',def:'Garantías fundamentales de toda persona',color:'#F59E0B'},
      {id:6,concept:'Responsabilidad social',def:'Compromiso con el bienestar colectivo',color:'#EC4899'},
    ],
  },
  ingles: {
    m3:{title:'DCE en la Enseñanza del Inglés',desc:'Diseña experiencias inmersivas de aprendizaje del inglés.',
      content:[
        {type:'intro',title:'English as Experience',text:'Aprender inglés no es memorizar gramática — es vivir experiencias comunicativas auténticas. El DCE crea contextos donde el idioma se usa con propósito real.'},
        {type:'concepts',title:'Estrategias DCE para Inglés',items:[
          {t:'Inmersión contextual',d:'Crear escenarios donde el inglés sea medio, no fin.'},
          {t:'Storytelling',d:'Usar narrativas para contextualizar estructuras lingüísticas.'},
          {t:'Role-play comunicativo',d:'Simulaciones de situaciones reales que requieren inglés.'},
        ]},
      ]},
    m4:{title:'Innovación en English Teaching',desc:'Métodos innovadores para la enseñanza del inglés con DCE.',
      content:[
        {type:'intro',title:'Innovar en la Clase de Inglés',text:'La innovación en la enseñanza del inglés integra tecnología, cultura y experiencias multisensoriales para un aprendizaje significativo.'},
        {type:'concepts',title:'Técnicas Innovadoras',items:[
          {t:'Podcast estudiantil',d:'Los estudiantes crean contenido en inglés sobre temas que les interesan.'},
          {t:'Cultural exchange',d:'Conexiones con hablantes nativos para experiencias auténticas.'},
          {t:'Gamified reading',d:'Lectura gamificada con retos y misiones en inglés.'},
        ]},
      ]},
    simContext:'una actividad de conversación en inglés para estudiantes de nivel intermedio',
    matchPairs:[
      {id:1,concept:'Fluency',def:'Capacidad de comunicarse con fluidez y naturalidad',color:'#E8732C'},
      {id:2,concept:'Scaffolding',def:'Apoyo gradual que se retira a medida que el estudiante avanza',color:'#7B3FA0'},
      {id:3,concept:'Authentic input',def:'Material lingüístico real, no artificial',color:'#3B82F6'},
      {id:4,concept:'Output',def:'Producción activa del idioma por el estudiante',color:'#10B981'},
      {id:5,concept:'Communicative competence',def:'Usar el idioma de forma efectiva en contexto',color:'#F59E0B'},
      {id:6,concept:'Task-based learning',def:'Aprender el idioma realizando tareas significativas',color:'#EC4899'},
    ],
  },
  matematicas: {
    m3:{title:'DCE en Matemáticas',desc:'Diseña experiencias de aprendizaje matemático significativas.',
      content:[
        {type:'intro',title:'Matemáticas como Experiencia',text:'Las matemáticas cobran sentido cuando se viven, no cuando se memorizan. El DCE crea situaciones donde el razonamiento matemático emerge de problemas auténticos.'},
        {type:'concepts',title:'Estrategias DCE para Matemáticas',items:[
          {t:'Problemas auténticos',d:'Plantear situaciones reales que requieran pensamiento matemático.'},
          {t:'Manipulación concreta',d:'Usar materiales tangibles antes de la abstracción.'},
          {t:'Modelación matemática',d:'Conectar modelos abstractos con fenómenos observables.'},
        ]},
      ]},
    m4:{title:'Evaluación Experiencial Matemática',desc:'Evaluar competencias matemáticas de forma experiencial.',
      content:[
        {type:'intro',title:'Evaluar el Pensamiento Matemático',text:'La evaluación experiencial en matemáticas observa procesos de razonamiento, no solo resultados correctos.'},
        {type:'concepts',title:'Instrumentos',items:[
          {t:'Resolución de problemas abiertos',d:'Problemas con múltiples caminos y soluciones posibles.'},
          {t:'Exposición de estrategias',d:'El estudiante explica su razonamiento paso a paso.'},
          {t:'Proyecto de modelación',d:'Aplicar matemáticas a un fenómeno real y presentar el modelo.'},
        ]},
      ]},
    simContext:'una clase de geometría experiencial para 9° grado usando diseño de espacios reales',
    matchPairs:[
      {id:1,concept:'Razonamiento lógico',def:'Proceso ordenado de deducción e inferencia',color:'#E8732C'},
      {id:2,concept:'Modelación',def:'Representar situaciones reales con herramientas matemáticas',color:'#7B3FA0'},
      {id:3,concept:'Resolución de problemas',def:'Encontrar estrategias para situaciones desconocidas',color:'#3B82F6'},
      {id:4,concept:'Pensamiento variacional',def:'Comprender el cambio y las relaciones entre cantidades',color:'#10B981'},
      {id:5,concept:'Comunicación matemática',def:'Expresar ideas matemáticas con claridad y precisión',color:'#F59E0B'},
      {id:6,concept:'Pensamiento numérico',def:'Comprensión profunda de números y operaciones',color:'#EC4899'},
    ],
  },
  ciencias: {
    m3:{title:'DCE en Ciencias Naturales',desc:'Diseña experiencias de indagación científica.',
      content:[
        {type:'intro',title:'Ciencia como Experiencia',text:'La ciencia se aprende investigando, no leyendo sobre investigaciones. El DCE crea laboratorios de indagación donde los estudiantes son científicos activos.'},
        {type:'concepts',title:'Estrategias DCE para Ciencias',items:[
          {t:'Indagación guiada',d:'Facilitar preguntas que conduzcan a investigación genuina.'},
          {t:'Experimentos auténticos',d:'Diseñar experimentos con variables reales y resultados inciertos.'},
          {t:'Observación de campo',d:'Conectar la ciencia con fenómenos naturales observables.'},
        ]},
      ]},
    m4:{title:'Laboratorio Experiencial de Ciencias',desc:'Crear laboratorios experienciales de ciencias naturales.',
      content:[
        {type:'intro',title:'Reinventar el Laboratorio',text:'El laboratorio experiencial no sigue protocolos rígidos — plantea problemas abiertos donde los estudiantes diseñan sus propios experimentos.'},
        {type:'concepts',title:'Formatos de Laboratorio',items:[
          {t:'Lab de diseño experimental',d:'Los estudiantes crean hipótesis y diseñan procedimientos propios.'},
          {t:'Estación de observación',d:'Espacios de observación prolongada de fenómenos naturales.'},
          {t:'Feria de ciencia experiencial',d:'Presentación pública de investigaciones con demostración.'},
        ]},
      ]},
    simContext:'un laboratorio de biología experimental sobre ecosistemas para 8° grado',
    matchPairs:[
      {id:1,concept:'Hipótesis',def:'Explicación tentativa que se puede verificar experimentalmente',color:'#E8732C'},
      {id:2,concept:'Variable',def:'Factor que puede cambiar en un experimento',color:'#7B3FA0'},
      {id:3,concept:'Método científico',def:'Proceso sistemático de investigación y validación',color:'#3B82F6'},
      {id:4,concept:'Ecosistema',def:'Sistema de interacciones entre organismos y su entorno',color:'#10B981'},
      {id:5,concept:'Indagación',def:'Proceso de exploración guiado por preguntas',color:'#F59E0B'},
      {id:6,concept:'Evidencia',def:'Datos observables que respaldan una conclusión',color:'#EC4899'},
    ],
  },
};

// --- Generate area-specific modules ---
const makeAreaModules = (areaId) => {
  const ac = AREA_CONTENT[areaId]; if(!ac) return [];
  const area = AREAS.find(a => a.id === areaId);
  return [
    { id:`mod3_${areaId}`, type:'lesson', area:areaId, title:ac.m3.title, subtitle:'Módulo 3',
      desc:ac.m3.desc, xp:140, badge:'designer', req:['ch2'],
      task:'Lee cómo se aplica el DCE en tu área de formación. Explora las estrategias y ejemplos del módulo. Desplázate hasta el final para habilitar el botón de completar.',
      pos:{x:38,y:4}, side:'right', content:ac.m3.content },
    { id:`ch3_${areaId}`, type:'challenge', ctype:'simulation', area:areaId,
      title:'Simulación: '+ac.m3.title.replace('DCE en ',''), subtitle:'Reto',
      desc:'Toma decisiones pedagógicas en '+area.name+'.',
      task:'Recorre el árbol de decisiones pedagógicas. Hay 2 o 3 decisiones encadenadas. Elige la opción que mejor aplique el enfoque DCE en cada situación del escenario.',
      xp:200, req:[`mod3_${areaId}`], pos:{x:60,y:5}, side:'left',
      simContext: ac.simContext },
    { id:`mod4_${areaId}`, type:'lesson', area:areaId, title:ac.m4.title, subtitle:'Módulo 4',
      desc:ac.m4.desc, xp:140, badge:'innovator', req:[`ch3_${areaId}`],
      task:'Estudia los instrumentos de evaluación experiencial para tu área. Lee todo el contenido y completa la lección para desbloquear el último reto antes de la evaluación final.',
      pos:{x:34,y:6}, side:'right', content:ac.m4.content },
    { id:`ch4_${areaId}`, type:'challenge', ctype:'matching', area:areaId,
      title:'Conecta Conceptos: '+area.name, subtitle:'Reto',
      desc:'Conecta cada concepto con su definición correcta.',
      task:'Haz clic en un concepto (columna izquierda) y luego en su definición correcta (columna derecha) para emparejarlos. Debes conectar los 6 pares correctamente para completar el reto.',
      xp:200, badge:'speedster', req:[`mod4_${areaId}`], pos:{x:64,y:7}, side:'left',
      matchPairs: ac.matchPairs },
    { id:`final_${areaId}`, type:'evaluation', ctype:'designlab', area:areaId,
      title:'Lab DCE: '+area.name, subtitle:'Evaluación Final',
      desc:'Diseña una experiencia de aprendizaje para '+area.name+'.',
      task:'Diseña una experiencia de aprendizaje DCE completa respondiendo 5 preguntas (una por cada fase: Empatizar, Definir, Idear, Prototipar, Evaluar). Tus elecciones determinan tu nivel de alineación con el DCE.',
      xp:300, badge:'master', req:[`ch4_${areaId}`], pos:{x:50,y:8}, side:'center' },
  ];
};

// Build full module list
const ALL_MODULES = [...SHARED_MODULES];
AREAS.forEach(a => ALL_MODULES.push(...makeAreaModules(a.id)));
const MODULE_MAP = new Map(ALL_MODULES.map(m => [m.id, m]));

const getStudentModules = (areaId) => ALL_MODULES.filter(m => !m.area || m.area === areaId);
// Alcance del módulo dentro de una ruta:
//   transversales (m.area == null) → se muestran en TODAS las áreas
//   específicos    (m.area === areaId) → solo en esa área
const TRANSVERSAL_AREA = 'transversal';
const getTransversalModules = () => ALL_MODULES.filter(m => !m.area);
const getAreaOnlyModules   = (areaId) => ALL_MODULES.filter(m => m.area === areaId);
// Base de un alcance (pestaña) del editor de ruta
const getScopeModules = (scopeId) =>
  scopeId === TRANSVERSAL_AREA ? getTransversalModules() : getAreaOnlyModules(scopeId);

// Convierte una fila de course_modules (BD) al formato de módulo que usa la app
const dbModToAppMod = (row) => ({
  id:            row.id,
  type:          row.type,
  ctype:         row.challenge_type || null,
  title:         row.title,
  subtitle:      row.subtitle || '',
  desc:          row.description || '',
  xp:            row.xp || 100,
  req:           row.requirements || [],
  badge:         null,
  area:          null,
  pos:           { x: 50, y: row.order || 0 },
  side:          'right',
  task:          '',
  content:       row.content || [],
  attachments:   row.attachments || [],
  extras:        [],
  characterLine: row.character_line || null,
  isDbModule:    true,
  requiresPresenceCode: row.requires_presence_code || false,
  availableFrom:  row.available_from || null,
  availableUntil: row.available_until || null,
  // datos de reto
  ...(row.challenge_data?.dragItems    ? { dragItems:    row.challenge_data.dragItems }    : {}),
  ...(row.challenge_data?.empathyCards ? { empathyCards: row.challenge_data.empathyCards } : {}),
  ...(row.challenge_data?.matchPairs   ? { matchPairs:   row.challenge_data.matchPairs }   : {}),
  ...(row.challenge_data?.simContext   ? { simContext:   row.challenge_data.simContext }    : {}),
  ...(row.challenge_data?.questions    ? { questions:    row.challenge_data.questions }     : {}),
  ...(row.challenge_data?.statements   ? { statements:   row.challenge_data.statements }    : {}),
  ...(row.challenge_data?.blanks       ? { blanks:       row.challenge_data.blanks }        : {}),
  ...(row.challenge_data?.passage      ? { passage:      row.challenge_data.passage }       : {}),
  ...(row.challenge_data?.correctMessage   ? { correctMessage:   row.challenge_data.correctMessage }   : {}),
  ...(row.challenge_data?.incorrectMessage ? { incorrectMessage: row.challenge_data.incorrectMessage } : {}),
  // Mensaje final del quiz según resultado (aprobó/no aprobó) — configurable por el tutor
  ...(row.challenge_data?.passingScore != null ? { passingScore: row.challenge_data.passingScore } : {}),
  ...(row.challenge_data?.maxAttempts  != null ? { maxAttempts:  row.challenge_data.maxAttempts }  : {}),
  ...(row.challenge_data?.passMessage      ? { passMessage:      row.challenge_data.passMessage }      : {}),
  ...(row.challenge_data?.failMessage      ? { failMessage:      row.challenge_data.failMessage }      : {}),
});

// Convierte filas de course_modules (ya ordenadas por "order") en los módulos
// que consume el mapa, aplicando el filtro de área y el layout zigzag de nodos.
// ÚNICA fuente de esa transformación — antes vivía copiada en loadCourseModules,
// switchCourse y loadStudentSession, y las copias tendían a divergir.
const dbRowsToCourseModules = (rows, areaId = null) => {
  const filtered = areaId
    ? (rows || []).filter(row => !row.area_id || row.area_id === areaId)
    : (rows || []);
  return filtered.map((row, i) => {
    const mod = dbModToAppMod(row);
    mod.pos  = { x: i % 2 === 0 ? 38 : 62, y: row.order || i };
    mod.side = i % 2 === 0 ? 'right' : 'left';
    return mod;
  });
};

// Curso "base" listable para estudiantes/admin: activo y NO fork. Las copias por
// colegio (parent_course_id != null) se resuelven de forma transparente al cargar
// módulos y NUNCA se ofrecen como cursos seleccionables ni asignables.
const isBaseCourse = (c) => !!c && c.is_active && !c.parent_course_id;

// Selector del tema inmersivo del curso activo (para useStore). Compartido por
// CourseAmbient y CharacterBubble para no duplicar la lógica de resolución.
const selectActiveCourseTheme = (s) =>
  (s.courses || []).find(c => c.id === s.enrolledCourseId)?.theme || null;

// ¿El curso que el estudiante realmente ve (fork si existe, si no el
// matriculado) exige haber estado en una Clase en Vivo Guiada antes de poder
// avanzar por su cuenta? Ver `requires_live_to_start` (0063) — por diseño
// es un candado por-curso, no una regla global: la inmensa mayoría de los
// cursos no tiene esta columna en `true` y su ruta sigue libre como siempre.
const selectRequiresLiveToStart = (s) => {
  const id = s.effectiveCourseId || s.enrolledCourseId;
  return !!(s.courses || []).find(c => c.id === id)?.requires_live_to_start;
};

// findModule se define aquí pero accede a XS de forma lazy (XS se define más adelante)
// Funciona porque JS evalúa el cuerpo de la función solo cuando se llama, no cuando se declara
function findModule(id) {
  try {
    const st = typeof XS !== 'undefined' ? XS.get() : null;
    const dbMod = (st?.courseModules || []).find(m => m.id === id);
    if (dbMod) return dbMod;
  } catch (_) {}
  return MODULE_MAP.get(id);
}

// --- Helpers ---
const calcLevel = xp => { let l=1; for(let i=1;i<LEVELS.length;i++){if(xp>=LEVELS[i])l=i+1;else break;} return l; };
const xpForNext = xp => LEVELS[calcLevel(xp)] || xp;
const xpProgress = xp => { const l=calcLevel(xp),p=LEVELS[l-1]||0,n=LEVELS[l]||xp; return n===p?1:(xp-p)/(n-p); };
// ¿Este nodo está bloqueado porque un módulo ANTERIOR en el orden exige código
// presencial y el estudiante aún no lo desbloqueó (ni completó — completarlo
// implica haberlo desbloqueado)? Cierra el hueco de cuando los módulos no forman
// una cadena estricta de requisitos (p. ej. todos dependen solo del primero) y el
// gateado se podía saltar. El módulo gateado NO se bloquea a sí mismo (debe poder
// abrirse para ingresar el código).
const isBlockedByPresence = (id, done, areaId, modulesOverride, unlockedPresence = []) => {
  const mods = modulesOverride || getStudentModules(areaId);
  const myIdx = mods.findIndex(x => x.id === id);
  if (myIdx < 0) return false;
  return mods.some((x, i) =>
    i < myIdx && x.requiresPresenceCode && !unlockedPresence.includes(x.id) && !done.includes(x.id)
  );
};

// modulesOverride: si se pasa, se usa en vez de getStudentModules (para módulos de BD)
// unlockedPresence: ids de módulos que el estudiante ya desbloqueó con el código
// presencial (para bloquear "de ahí en adelante" — ver isBlockedByPresence).
const nodeStatus = (id, done, areaId, modulesOverride, unlockedPresence = []) => {
  const mods = modulesOverride || getStudentModules(areaId);
  const m = mods.find(x => x.id === id) || findModule(id);
  if (!m) return 'locked';
  if (done.includes(id)) return 'completed';

  if (isBlockedByPresence(id, done, areaId, mods, unlockedPresence)) return 'locked';

  // Requisitos: los explícitos del módulo o, por defecto, el módulo ANTERIOR en
  // el orden. Se usa la lista COMPLETA (incluida la entrega final), así la entrega
  // es un paso más de la cadena: un módulo que va DESPUÉS de ella la exige como
  // prerrequisito (la entrega es bloqueante, igual que cualquier otro módulo).
  // La entrega ya no exige "todos los módulos completos" ni se salta la cadena.
  const idx = mods.findIndex(x => x.id === id);
  const prev = idx > 0 ? mods[idx - 1] : null;
  const req = (m.req && m.req.length) ? m.req : (prev ? [prev.id] : []);
  return req.every(r => done.includes(r)) ? 'available' : 'locked';
};
const progressPct = (done, areaId, modulesOverride) => {
  if (!Array.isArray(done)) return 0;
  const mods = modulesOverride || getStudentModules(areaId);
  return mods.length === 0 ? 0 : Math.round((done.filter(d => mods.find(m => m.id === d)).length / mods.length) * 100);
};
const isRouteComplete = (done, areaId, modulesOverride) => {
  const mods = modulesOverride || getStudentModules(areaId);
  return mods.every(m => done.includes(m.id));
};
const gradeTotal = g => g ? Object.values(g).reduce((a,b)=>a+b,0) : 0;
const gradeMax = () => RUBRIC_CRITERIA.length * 5;

// --- Instituciones (seed) ---
const INITIAL_INSTITUTIONS = [
  { id:'inst_1', name:'IED San Francisco',                logo:null },
  { id:'inst_2', name:'Colegio Nacional Simón Bolívar',   logo:null },
  { id:'inst_3', name:'Liceo Los Andes',                  logo:null },
];

// --- Data limpia: sin registros previos ---
const MOCK_SUBMISSIONS = [];
const MOCK_ATTEMPTS = [];

const DEF = {
  isLoggedIn: false, user: null, page: 'landing', nodeId: null,
  xp: 0, completed: [], badges: [], notifications: [], selectedArea: null,
  submissions: [], challengeAttempts: [], studentMessages: [],
  accounts: [], institutions: INITIAL_INSTITUTIONS, cohorts: [],
  charReaction: null,       // { context, ts } — dispara reacción del personaje del tema
  routeConfigs: {},
  namedRoutes: [],
  instructorInstitutions: [],
  // Multi-curso
  courses: [],              // [{ id, name, description, cover_image, color, is_active }]
  institutionCourses: [],   // [{ id, institution_id, course_id, is_active, expires_at }] expires_at null = indefinido
  userCourses: [],          // [{ id, user_id, course_id, is_active }] acceso por usuario
  courseModules: [],        // módulos del curso activo (ya convertidos con dbModToAppMod)
  enrolledCourseId: null,   // id del curso activo del estudiante (matrícula/course_progress)
  effectiveCourseId: null,  // id del curso que realmente se ve (el fork del colegio si existe; si no, igual a enrolledCourseId)
  allEnrollments: [],       // todos los cursos en los que está inscrito el estudiante
  unlockedPresenceModules: [], // ids de módulos con requires_presence_code que este estudiante ya desbloqueó
  quizAttempts: [],         // [{ module_id, attempts, passed }] intentos de retos quiz del estudiante actual
  coursesLoaded: false,     // true cuando courses + userCourses ya se cargaron (evita parpadeo en el guard de selección de curso)
  workshopAccess: [],       // [{ id, student_id, course_id, enabled }] habilitación del taller/producto final por estudiante (tutor)
};
export const XS = createExpStore(DEF);

// --- Actions ---
const nav = (page, nodeId) => {
  XS.set({ page, nodeId: nodeId || null });
  const { user } = XS.get();
  if (user?.id && user.role === 'student') {
    supabase.from('profiles').update({
      last_seen: new Date().toISOString(),
      current_module: nodeId || page,
    }).eq('id', user.id)
      .then(() => {})
      .catch(err => console.error('[nav] profile update:', err));
  }
};

// --- Hash routing ligero ---
// Sincroniza page/nodeId con location.hash (#/pagina/nodo) sin librería de
// router: habilita el botón atrás del navegador y deep links compartibles.
// Páginas accesibles sin sesión (deep links públicos)
const PUBLIC_PAGES = ['cert', 'live'];
const hashFor = (page, nodeId) => '#/' + page + (nodeId ? '/' + encodeURIComponent(nodeId) : '');
const parseHash = () => {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (!h) return null;
  const [page, nodeId] = h.split('/');
  return page ? { page, nodeId: nodeId ? decodeURIComponent(nodeId) : null } : null;
};
let hashSelfUpdate = false;
// Estado → URL (cubre nav(), login y guards, todos pasan por XS.set)
XS.sub(s => {
  if (!s.isLoggedIn && !PUBLIC_PAGES.includes(s.page)) return;
  const target = hashFor(s.page, s.nodeId);
  if (window.location.hash !== target) {
    hashSelfUpdate = true;
    window.location.hash = target;
  }
});
// URL → estado (botón atrás/adelante o edición manual del hash)
window.addEventListener('hashchange', () => {
  if (hashSelfUpdate) { hashSelfUpdate = false; return; }
  const r = parseHash();
  const s = XS.get();
  if (!r) return;
  if (!s.isLoggedIn && !PUBLIC_PAGES.includes(r.page)) return;
  if (r.page === s.page && (r.nodeId || null) === (s.nodeId || null)) return;
  XS.set({ page: r.page, nodeId: r.nodeId });
});
// Deep link inicial: se captura al cargar (la suscripción de arriba sobrescribe
// el hash apenas el login hace XS.set, así que hay que guardarlo antes).
// Páginas inválidas para el rol caen al default seguro de renderPage.
let initialRoute = parseHash();
const applyInitialHash = () => {
  const r = initialRoute;
  initialRoute = null; // un solo uso
  const s = XS.get();
  if (!r || !s.isLoggedIn) return;
  if (r.page === s.page && (r.nodeId || null) === (s.nodeId || null)) return;
  XS.set({ page: r.page, nodeId: r.nodeId });
};

// Deep links públicos (cert/live): visibles sin sesión. Se aplican al cargar,
// independientemente del login (restoreSession no corre para usuarios anónimos).
// No consumimos initialRoute: si el usuario SÍ tiene sesión, applyInitialHash lo
// re-aplica después de restoreSession (que reescribe page al default del rol).
if (initialRoute && PUBLIC_PAGES.includes(initialRoute.page)) {
  XS.set({ page: initialRoute.page, nodeId: initialRoute.nodeId });
}

const doLogout = () => {
  const wasLoggedIn = XS.get().isLoggedIn;
  XS.set({
    isLoggedIn: false, user: null, page: 'landing', nodeId: null,
    xp: 0, completed: [], badges: [], notifications: [], selectedArea: null,
    enrolledCourseId: null, allEnrollments: [], courseModules: [], coursesLoaded: false,
    unlockedPresenceModules: [],
  });
  // Limpia el hash sin crear entrada de historial (evita deep links huérfanos)
  history.replaceState(null, '', window.location.pathname + window.location.search);
  clearIdleActivity();
  if (wasLoggedIn) supabase.auth.signOut();
};
const selectArea = (areaId) => {
  if (!AREAS.find(a => a.id === areaId)) return;
  const { user } = XS.get();
  XS.set({ selectedArea: areaId, page: 'map' });
  if (user?.id) {
    supabase.from('profiles').update({ area: areaId }).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('selectArea:', error); });
  }
};
const changeArea = (areaId) => {
  if (!AREAS.find(a => a.id === areaId)) return;
  const { user } = XS.get();
  XS.set({ selectedArea: areaId });
  if (user?.id) {
    supabase.from('profiles').update({ area: areaId }).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('changeArea:', error); });
  }
};
// Devuelve { badge } con la insignia GANADA en esta llamada (o null), para que
// quien lo llama pueda elegir la reacción del personaje: el momento "insignia
// nueva" tiene conversación propia y pisa al genérico de módulo completado.
const completeNode = (id) => {
  const s = XS.get();
  if (s.completed.includes(id)) return null;
  const m = findModule(id);
  if (!m) return null;
  const nxp = s.xp + (m.xp || 100), nc = [...s.completed, id], nb = [...s.badges];
  const wonBadge = m.badge && !nb.includes(m.badge) ? m.badge : null;
  if (wonBadge) nb.push(wonBadge);
  const notifs = [...s.notifications, { type:'xp', amount:m.xp || 100, id:Date.now() }];
  if (m.badge && !s.badges.includes(m.badge)) notifs.push({ type:'badge', bid:m.badge, id:Date.now()+1 });
  XS.set({ xp:nxp, completed:nc, badges:nb, notifications:notifs }); // optimista: la UI reacciona de inmediato
  if (s.user?.id) {
    if (s.enrolledCourseId) {
      // Atómico en el servidor (0035): agrega ESTE módulo sin sobrescribir
      // completed[]/xp con el arreglo calculado en el cliente — así una
      // pestaña vieja con estado desactualizado no puede pisar avances
      // hechos en otra sesión (causa raíz de progreso corrupto ya visto).
      supabase.rpc('complete_course_module', {
        p_course_id: s.enrolledCourseId, p_module_id: id, p_xp: m.xp || 100, p_badge: m.badge || null,
      }).then(({ data, error }) => {
        if (error) { console.error('completeNode course_progress:', error); return; }
        // Reconcilia con la verdad del servidor (por si otra pestaña ya había avanzado más).
        if (data) {
          XS.set({ xp: data.xp, completed: data.completed, badges: data.badges });
          maybeIssueCourseCertificate(XS.get(), data.completed);
        }
      });
    } else {
      // Legacy: escribe en progress
      supabase.from('progress')
        .update({ xp:nxp, completed:nc, badges:nb, updated_at:new Date().toISOString() })
        .eq('user_id', s.user.id)
        .then(({ error }) => { if (error) console.error('completeNode progress:', error); });
    }
  }
  return { badge: wonBadge };
};
// Código presencial: el estudiante canjea el código que el profe generó/dijo en
// clase. La validación real (¿el código coincide y sigue vigente?) ocurre en el
// servidor (redeem_presence_code, security definer) — acá solo reconciliamos el
// estado local si el servidor confirma el desbloqueo.
const redeemPresenceCode = async (moduleId, code) => {
  const { data, error } = await supabase.rpc('redeem_presence_code', { p_module_id: moduleId, p_code: code });
  if (error) throw error;
  if (data === true) {
    const s = XS.get();
    const patch = {};
    if (!s.unlockedPresenceModules.includes(moduleId)) {
      patch.unlockedPresenceModules = [...s.unlockedPresenceModules, moduleId];
    }
    // El servidor nos había mandado este módulo con content/challenge_data
    // vacíos mientras estaba bloqueado (0040) — hay que refrescarlo para
    // traer el contenido real ahora que el desbloqueo ya quedó registrado.
    const courseId = s.effectiveCourseId || s.enrolledCourseId;
    if (courseId) {
      const { data: modulesData, error: modErr } = await supabase.rpc('get_course_modules_for_student', { p_course_id: courseId });
      if (modErr) console.error('redeemPresenceCode refresh:', modErr);
      else patch.courseModules = dbRowsToCourseModules(modulesData, s.selectedArea);
    }
    if (Object.keys(patch).length) XS.set(patch);
  }
  return !!data;
};
// Instructor: genera un código nuevo para un módulo (invalida el anterior).
// Solo instructor/admin puede llamarlo (lo valida generate_presence_code en el servidor).
const generatePresenceCode = async (moduleId) => {
  const { data, error } = await supabase.rpc('generate_presence_code', { p_module_id: moduleId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row; // { code, expires_at }
};
// ── Intentos de retos quiz (puntaje mínimo + límite de intentos) ──────────
// Registra un intento del estudiante en un quiz (servidor incrementa el conteo).
// Devuelve { attempts, passed } con el estado nuevo, y refresca el store.
const recordQuizAttempt = async (moduleId, passed, score, maxScore) => {
  if (_previewMode) return null;
  const { data, error } = await supabase.rpc('record_quiz_attempt', {
    p_module_id: moduleId, p_passed: !!passed, p_score: score ?? null, p_max: maxScore ?? null,
  });
  if (error) { console.error('recordQuizAttempt:', error); return null; }
  const row = Array.isArray(data) ? data[0] : data;
  if (row) {
    XS.set(s => {
      const others = (s.quizAttempts || []).filter(a => a.module_id !== moduleId);
      return { quizAttempts: [...others, { module_id: moduleId, attempts: row.attempts, passed: row.passed }] };
    });
  }
  return row;
};

// Guarda el detalle por ítem de un intento de quiz. `quiz_attempts` conserva
// el agregado (contador, aprobado y mejor puntaje); esta tabla habilita el
// análisis de distractores y la evolución entre intentos.
const recordQuizAttemptAnswers = async (moduleId, attemptNo, questions, answers) => {
  if (_previewMode || !attemptNo) return;
  const s = XS.get();
  const courseId = s.effectiveCourseId || s.enrolledCourseId || null;
  const rows = (questions || []).map((q, itemIndex) => ({
    user_id: s.user.id,
    module_id: moduleId,
    course_id: courseId,
    attempt_no: attemptNo,
    item_id: String(q.id || `legacy-${itemIndex}-${q.question || ''}`),
    item_index: itemIndex,
    chosen: answers?.[itemIndex] ?? null,
    correct: answers?.[itemIndex] === q.correct,
  }));
  if (!rows.length) return;
  const { error } = await supabase.from('quiz_attempt_answers').insert(rows);
  if (error) console.error('recordQuizAttemptAnswers:', error);
};
// Instructor: reinicia los intentos de un estudiante en un reto quiz.
const resetQuizAttempts = async (userId, moduleId) => {
  const { error } = await supabase.rpc('reset_quiz_attempts', { p_user_id: userId, p_module_id: moduleId });
  if (error) { console.error('resetQuizAttempts:', error); return { error: error.message }; }
  return { ok: true };
};
// Instructor: carga los intentos de quiz de un estudiante puntual (su panel).
const loadStudentQuizAttempts = async (userId) => {
  const { data, error } = await supabase.from('quiz_attempts')
    .select('module_id, attempts, passed').eq('user_id', userId);
  if (error) { console.error('loadStudentQuizAttempts:', error); return []; }
  return data || [];
};

// ── Análisis de ítems (instructor) ────────────────────────────────────────
// La agregación ocurre en la base (0049): trae solo el resultado y siempre con
// el tamaño de la muestra, en vez de calcular en el navegador sobre las 300
// filas truncadas que carga sessionData.
const fetchAnalyticsModules = async (courseId) => {
  if (!courseId) return { rows: [] };
  const { data, error } = await supabase.rpc('analytics_course_modules', { p_course_id: courseId });
  if (error) { console.error('fetchAnalyticsModules:', error); return { rows: [], error: error.message }; }
  return { rows: data || [] };
};
// minN: bajo ese número de estudiantes la discriminación es ruido y la RPC
// devuelve null en vez de un número sin sentido.
const fetchItemAnalysis = async (moduleId, minN = 10) => {
  if (!moduleId) return { rows: [] };
  const { data, error } = await supabase.rpc('item_analysis', { p_module_id: moduleId, p_min_n: minN });
  if (error) { console.error('fetchItemAnalysis:', error); return { rows: [], error: error.message }; }
  return { rows: data || [] };
};
const fetchRawAnswers = async (moduleId) => {
  if (!moduleId) return { rows: [] };
  const { data, error } = await supabase.rpc('analytics_raw_answers', { p_module_id: moduleId });
  if (error) { console.error('fetchRawAnswers:', error); return { rows: [], error: error.message }; }
  return { rows: data || [] };
};

// ── Acta de cierre (módulo `closing_record`) ──────────────────────────────
// El listado lo carga el admin por Excel; el tutor confirma asistencia y cierra
// el acta. "Grupo" = curso + colegio, así que todo va acotado por institución.

// Listado del grupo. Si el curso es un fork por colegio, cae al listado del
// curso padre: el admin normalmente lo carga sobre el curso original.
const loadCourseRoster = async (courseId, institutionId, parentCourseId = null) => {
  const ids = [courseId, parentCourseId].filter(Boolean);
  if (!ids.length) return { rows: [] };
  let q = supabase.from('course_roster').select('*').in('course_id', ids).order('sort_order');
  const { data, error } = await q;
  if (error) { console.error('loadCourseRoster:', error); return { rows: [], error: error.message }; }
  const all = data || [];
  // Preferir el listado más específico que exista: mismo curso + mismo colegio.
  const byScope = (cid, iid) => all.filter(r => r.course_id === cid && (r.institution_id || null) === (iid || null));
  const rows = byScope(courseId, institutionId).length ? byScope(courseId, institutionId)
    : byScope(parentCourseId, institutionId).length ? byScope(parentCourseId, institutionId)
    : byScope(courseId, null).length ? byScope(courseId, null)
    : byScope(parentCourseId, null);
  return { rows };
};

// Admin: reemplaza el listado de ese curso/colegio por el del Excel.
const saveCourseRoster = async (courseId, institutionId, people) => {
  const s = XS.get();
  const del = supabase.from('course_roster').delete().eq('course_id', courseId);
  const { error: de } = institutionId ? await del.eq('institution_id', institutionId) : await del.is('institution_id', null);
  if (de) { console.error('saveCourseRoster/delete:', de); return { error: de.message }; }
  if (!people.length) return { ok: true, count: 0 };
  const rows = people.map((p, i) => ({
    course_id: courseId, institution_id: institutionId || null,
    full_name: p.full_name, document: p.document || null, email: p.email || null,
    extra: p.extra || {}, sort_order: i, uploaded_by: s.user?.id || null,
  }));
  const { error } = await supabase.from('course_roster').insert(rows);
  if (error) { console.error('saveCourseRoster:', error); return { error: error.message }; }
  return { ok: true, count: rows.length };
};

// Lectura del estudiante: solo actas ya CERRADAS (la RLS de 0050 no le deja ver
// borradores). Si el curso es compartido por varios colegios puede haber un acta
// por colegio; se prefiere la del suyo.
const loadFinalClosingRecord = async (moduleId, institutionId) => {
  if (!moduleId) return { record: null };
  const { data, error } = await supabase.from('closing_records')
    .select('*').eq('module_id', moduleId).eq('status', 'final');
  if (error) { console.error('loadFinalClosingRecord:', error); return { record: null, error: error.message }; }
  const rows = data || [];
  const mine = rows.find(r => (r.institution_id || null) === (institutionId || null));
  return { record: mine || rows[0] || null };
};

const loadClosingRecord = async (moduleId, institutionId) => {
  let q = supabase.from('closing_records').select('*').eq('module_id', moduleId);
  const { data, error } = institutionId ? await q.eq('institution_id', institutionId) : await q.is('institution_id', null);
  if (error) { console.error('loadClosingRecord:', error); return { record: null, error: error.message }; }
  return { record: (data || [])[0] || null };
};

// Guarda borrador o cierra el acta. Al cerrar, `entries` queda como snapshot:
// recargar el Excel después NO altera un acta ya firmada.
const saveClosingRecord = async (record, finalize = false) => {
  const s = XS.get();
  const payload = {
    module_id: record.moduleId, course_id: record.courseId,
    institution_id: record.institutionId || null,
    instructor_id: s.user?.id || null,
    session_date: record.sessionDate || null,
    place: record.place || null,
    general_comments: record.generalComments || null,
    entries: record.entries || [],
    status: finalize ? 'final' : 'draft',
    finalized_at: finalize ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = record.id
    ? await supabase.from('closing_records').update(payload).eq('id', record.id).select().single()
    : await supabase.from('closing_records').insert(payload).select().single();
  if (error) { console.error('saveClosingRecord:', error); return { error: error.message }; }
  return { record: data };
};

// ─────────────────────────────────────────────────────────────────────────────
// MODO CLON — piloto TEMPORAL (migración 0051)
//
// "Rol clon" NO es un rol de base de datos: es la variante de interfaz
// `profiles.ui_variant = 'clone'`. El usuario sigue siendo student o instructor
// y conserva exactamente sus permisos; lo único distinto es lo que ve.
// Ver §13 de CLAUDE.md. Al desmontar el piloto, esta sección se borra entera.
//
// Recordatorio de dominio: el "estudiante" es un DOCENTE en formación. Aquí ese
// docente registra la asistencia y la efectividad de SUS alumnos de colegio.
// ─────────────────────────────────────────────────────────────────────────────

const isCloneUser = (u) => u?.uiVariant === 'clone';
const selectIsClone       = (s) => isCloneUser(s.user);
const selectIsCloneStudent = (s) => isCloneUser(s.user) && s.user?.role === 'student';
const selectIsCloneTutor   = (s) => isCloneUser(s.user) && s.user?.role === 'instructor';

// Páginas exclusivas del piloto (se usan para saltarse los guards de curso:
// el docente clon debe poder entrar a asistencia/efectividad aunque todavía no
// tenga una matrícula resuelta).
const CLONE_PAGES = ['clone-attendance', 'clone-effectiveness', 'clone-groups'];

// Admin: activa/desactiva el modo clon de una cuenta.
const setAccountUiVariant = async (id, variant) => {
  const { user } = XS.get();
  if (user?.role !== 'admin') return { error: 'Solo un administrador puede cambiar esto' };
  XS.set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, ui_variant: variant } : a) }));
  const { error } = await supabase.from('profiles').update({ ui_variant: variant }).eq('id', id);
  if (error) {
    console.error('setAccountUiVariant:', error);
    // Revertir el optimismo: la columna puede no existir si falta correr 0051.
    XS.set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, ui_variant: variant ? null : 'clone' } : a) }));
    return { error: error.message };
  }
  return { ok: true };
};

// Grupos visibles: la RLS ya decide (el docente ve los suyos; el tutor los de
// sus colegios), así que aquí no se filtra por rol.
const loadCloneGroups = async () => {
  const { data, error } = await supabase.from('clone_groups')
    .select('*').eq('is_active', true).order('name');
  if (error) { console.error('loadCloneGroups:', error); return { groups: [], error: error.message }; }
  return { groups: data || [] };
};

const saveCloneGroup = async (g) => {
  const s = XS.get();
  const payload = {
    name: (g.name || '').trim(),
    grade: g.grade?.trim() || null,
    teacher_id: g.teacherId,
    institution_id: g.institutionId || null,
    course_id: g.courseId || null,
  };
  if (!payload.name)       return { error: 'El grupo necesita un nombre' };
  if (!payload.teacher_id) return { error: 'Elige el docente responsable del grupo' };
  const { data, error } = g.id
    ? await supabase.from('clone_groups').update(payload).eq('id', g.id).select().single()
    : await supabase.from('clone_groups').insert({ ...payload, created_by: s.user?.id || null }).select().single();
  if (error) { console.error('saveCloneGroup:', error); return { error: error.message }; }
  return { group: data };
};

const deleteCloneGroup = async (id) => {
  const { error } = await supabase.from('clone_groups').delete().eq('id', id);
  if (error) { console.error('deleteCloneGroup:', error); return { error: error.message }; }
  return { ok: true };
};

const loadCloneGroupStudents = async (groupId) => {
  if (!groupId) return { rows: [] };
  const { data, error } = await supabase.from('clone_group_students')
    .select('*').eq('group_id', groupId).order('sort_order');
  if (error) { console.error('loadCloneGroupStudents:', error); return { rows: [], error: error.message }; }
  return { rows: data || [] };
};

// Tutor: reemplaza el listado del grupo por el del Excel (mismo criterio que
// saveCourseRoster). Un acta ya diligenciada no cambia: guarda su propio
// snapshot en `entries`.
const saveCloneGroupStudents = async (groupId, people) => {
  const { error: de } = await supabase.from('clone_group_students').delete().eq('group_id', groupId);
  if (de) { console.error('saveCloneGroupStudents/delete:', de); return { error: de.message }; }
  if (!people.length) return { ok: true, count: 0 };
  const rows = people.map((p, i) => ({
    group_id: groupId, full_name: p.full_name,
    document: p.document || null, email: p.email || null,
    extra: p.extra || {}, sort_order: i,
  }));
  const { error } = await supabase.from('clone_group_students').insert(rows);
  if (error) { console.error('saveCloneGroupStudents:', error); return { error: error.message }; }
  return { ok: true, count: rows.length };
};

const loadCloneAttendance = async (groupId) => {
  if (!groupId) return { rows: [] };
  const { data, error } = await supabase.from('clone_attendance')
    .select('*').eq('group_id', groupId).order('session_date', { ascending: false });
  if (error) { console.error('loadCloneAttendance:', error); return { rows: [], error: error.message }; }
  return { rows: data || [] };
};

// `entries` queda como snapshot del listado al diligenciar. Cerrar el acta
// (finalize) la congela: el trigger de 0051 rechaza updates posteriores.
const saveCloneAttendance = async (rec, finalize = false) => {
  const s = XS.get();
  const payload = {
    group_id: rec.groupId, teacher_id: s.user?.id || null,
    session_date: rec.sessionDate || new Date().toISOString().slice(0, 10),
    topic: rec.topic || null, place: rec.place || null, notes: rec.notes || null,
    entries: rec.entries || [],
    status: finalize ? 'final' : 'draft',
    finalized_at: finalize ? new Date().toISOString() : null,
  };
  const { data, error } = rec.id
    ? await supabase.from('clone_attendance').update(payload).eq('id', rec.id).select().single()
    : await supabase.from('clone_attendance').insert(payload).select().single();
  if (error) {
    console.error('saveCloneAttendance:', error);
    // El índice único (group_id, session_date) impide dos actas del mismo día.
    return { error: error.code === '23505'
      ? 'Ya existe un acta de asistencia de este grupo para esa fecha.'
      : error.message };
  }
  return { record: data };
};

const loadCloneEffectiveness = async (groupId) => {
  if (!groupId) return { rows: [] };
  const { data, error } = await supabase.from('clone_effectiveness')
    .select('*').eq('group_id', groupId).order('session_date', { ascending: false });
  if (error) { console.error('loadCloneEffectiveness:', error); return { rows: [], error: error.message }; }
  return { rows: data || [] };
};

// `sections` = lo capturado, `summary` = lo calculado. El summary lo arma quien
// llama con buildSummary() de lib/effectiveness.js — se recomputa en CADA
// guardado, nunca se edita a mano.
const saveCloneEffectiveness = async (rec, finalize = false) => {
  const s = XS.get();
  const payload = {
    group_id: rec.groupId, teacher_id: s.user?.id || null,
    attendance_id: rec.attendanceId || null,
    session_date: rec.sessionDate || new Date().toISOString().slice(0, 10),
    title: rec.title || null,
    // Unidad del plan (0054): SNAPSHOT, no referencia — el informe imprime estos
    // datos y no deben cambiar si el tutor recarga el plan. Ver la migración.
    unit_label: rec.unitLabel?.trim() || null,
    unit: rec.unit && rec.unit.title ? {
      title: rec.unit.title,
      ejes: rec.unit.ejes || [],
      notes: rec.unit.notes || null,
      coverage: rec.unit.coverage ?? null,
      priority: rec.unit.priority ?? null,
      level: rec.unit.level || null,
    } : {},
    sections: rec.sections || {},
    summary: rec.summary || {},
    status: finalize ? 'final' : 'draft',
    finalized_at: finalize ? new Date().toISOString() : null,
  };
  const { data, error } = rec.id
    ? await supabase.from('clone_effectiveness').update(payload).eq('id', rec.id).select().single()
    : await supabase.from('clone_effectiveness').insert(payload).select().single();
  if (error) { console.error('saveCloneEffectiveness:', error); return { error: error.message }; }
  return { record: data };
};

// ── Plan de unidades del libro (módulo `clone_dashboard`, 0052) ────────────
// Lo define el TUTOR por grupo y el docente lo consulta de solo lectura en su
// ruta. Cuelga del grupo, no del módulo: cada docente lleva su propio ritmo con
// sus alumnos. La RLS de 0052 ya impide que el docente escriba.
const loadCloneUnitPlan = async (groupId) => {
  if (!groupId) return { plan: null };
  const { data, error } = await supabase.from('clone_unit_plans')
    .select('*').eq('group_id', groupId).maybeSingle();
  if (error) { console.error('loadCloneUnitPlan:', error); return { plan: null, error: error.message }; }
  return { plan: data || null };
};

// Un plan por grupo (índice único): upsert por group_id, así el tutor puede
// volver a guardar sin preocuparse de si ya existía.
const saveCloneUnitPlan = async (plan) => {
  const s = XS.get();
  // coverage/priority se guardan en PORCENTAJE (27.6 = 27,6 %) o null. Se
  // normalizan aquí y no en la UI para que el Excel y el formulario dejen
  // siempre la misma forma en la BD.
  const num = (v) => {
    const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(',', '.'));
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
  };
  const units = (plan.units || [])
    .map(u => ({
      title: (u.title || '').trim(),
      ejes: (u.ejes || []).map(e => (e || '').trim()).filter(Boolean),
      notes: (u.notes || '').trim() || null,
      coverage: num(u.coverage),
      priority: num(u.priority),
      level: (u.level || '').trim() || null,
    }))
    .filter(u => u.title);
  // Gráfica de ejes transversales (0053). `color` se guarda como SLOT (1..8) de
  // la paleta, no como hex: así el modo oscuro usa su propio paso y recalibrar
  // la paleta no obliga a reescribir los planes guardados.
  const bars = (plan.chart?.bars || [])
    .map(b => ({
      label: (b.label || '').trim(),
      value: Math.min(100, Math.max(0, num(b.value) ?? 0)),
      color: Math.min(8, Math.max(1, parseInt(b.color, 10) || 1)),
    }))
    .filter(b => b.label);
  const chart = {
    title: plan.chart?.title?.trim() || null,
    bars,
  };
  const payload = {
    group_id: plan.groupId,
    book_title: plan.bookTitle?.trim() || null,
    intro: plan.intro?.trim() || null,
    units,
    chart,
    updated_by: s.user?.id || null,
  };
  const { data, error } = await supabase.from('clone_unit_plans')
    .upsert(payload, { onConflict: 'group_id' }).select().single();
  if (error) { console.error('saveCloneUnitPlan:', error); return { error: error.message }; }
  return { plan: data, count: units.length };
};

const deleteCloneEffectiveness = async (id) => {
  const { error } = await supabase.from('clone_effectiveness').delete().eq('id', id);
  if (error) { console.error('deleteCloneEffectiveness:', error); return { error: error.message }; }
  return { ok: true };
};

// Modo vista previa (instructor): cuando está activo, los retos se renderizan
// tal cual los ve el estudiante pero NADA se persiste ni afecta al progreso real.
let _previewMode = false;
const setPreviewMode = (v) => { _previewMode = !!v; };

const recordAttempt = (challengeId, questions, score, maxScore) => {
  if (_previewMode) return; // vista previa: no se registra ningún intento
  const s = XS.get();
  const courseId = s.effectiveCourseId || s.enrolledCourseId || null;
  const isCourseModule = s.courseModules.some(m => m.id === challengeId);
  const previousAttempts = s.challengeAttempts.filter(a =>
    a.studentEmail === s.user.email && a.challengeId === challengeId &&
    (a.courseId || null) === courseId
  );
  const attemptNo = previousAttempts.length + 1;
  const att = { id:'att_'+Date.now(), studentEmail:s.user.email, studentName:s.user.name,
    challengeId, courseId, moduleId:isCourseModule ? challengeId : null, attemptNo,
    area:s.selectedArea, questions, score, maxScore,
    date:new Date().toISOString().split('T')[0] };
  XS.set({ challengeAttempts:[...s.challengeAttempts, att] });
  supabase.from('challenge_attempts').insert({
    student_id: s.user.id, challenge_id: challengeId, area: s.selectedArea,
    course_id: courseId, module_id: isCourseModule ? challengeId : null,
    questions, score, max_score: maxScore,
  }).then(({ error }) => { if (error) console.error('recordAttempt:', error); });
  // El personaje del tema reacciona al desempeño: perfecto (sin un solo error)
  // tiene conversación propia; acierto si ≥60%.
  const ratio = maxScore > 0 ? score / maxScore : 0;
  reactCharacter(ratio >= 1 ? 'perfect' : ratio >= 0.6 ? 'correct' : 'wrong');
};

const submitProduct = (rejillaName, preguntaName, rejillaData, preguntaData) => {
  const s = XS.get();
  const tempId = 'sub_' + Date.now();
  const sub = { id:tempId, studentName:s.user.name, studentEmail:s.user.email,
    studentInstitution:'', area:s.selectedArea,
    rejillaName, preguntaName, rejillaData:rejillaData||null, preguntaData:preguntaData||null,
    date:new Date().toISOString().split('T')[0], grade:null, feedback:'', status:'pending' };
  XS.set({ submissions:[...s.submissions, sub] });
  supabase.from('submissions').insert({
    student_id: s.user.id, area: s.selectedArea,
    rejilla_name: rejillaName, rejilla_data: rejillaData,
    pregunta_name: preguntaName, pregunta_data: preguntaData,
    status: 'pending',
  }).select().single().then(({ data, error }) => {
    if (error) { console.error('submitProduct:', error); return; }
    XS.set(st => ({ submissions: st.submissions.map(su => su.id === tempId ? { ...su, id: data.id } : su) }));
  });
};

const gradeSubmission = (subId, grade, feedback) => {
  XS.set(s => {
    const sub = s.submissions.find(su => su.id === subId);
    const newMsg = sub ? {
      id: 'msg_' + Date.now(), toEmail: sub.studentEmail, type: 'graded',
      grade, feedback, date: new Date().toISOString().split('T')[0], read: false, submissionId: subId,
    } : null;
    return {
      submissions: s.submissions.map(su => su.id === subId ? { ...su, grade, feedback, status: 'graded' } : su),
      studentMessages: newMsg ? [...(s.studentMessages || []), newMsg] : (s.studentMessages || []),
    };
  });
  supabase.from('submissions').update({ grade, feedback, status:'graded' }).eq('id', subId)
    .then(({ error }) => { if (error) console.error('gradeSubmission:', error); });
};

const returnSubmission = (subId, returnNotes, instrRejillaName, instrRejillaData, instrPreguntaName, instrPreguntaData) => {
  XS.set(s => {
    const sub = s.submissions.find(su => su.id === subId);
    const newMsg = { id:'msg_'+Date.now(), toEmail:sub?.studentEmail, type:'return',
      returnNotes, date:new Date().toISOString().split('T')[0], read:false, submissionId:subId };
    return {
      submissions: s.submissions.map(su => su.id===subId ? {
        ...su, status:'returned', returnCount:(su.returnCount||0)+1, returnNotes,
        grade:null, feedback:'',
        instrRejillaName:instrRejillaName||null, instrRejillaData:instrRejillaData||null,
        instrPreguntaName:instrPreguntaName||null, instrPreguntaData:instrPreguntaData||null,
      } : su),
      studentMessages: [...(s.studentMessages||[]), newMsg],
    };
  });
  const currentSub = XS.get().submissions.find(su => su.id === subId);
  supabase.from('submissions').update({
    status:'returned', return_notes:returnNotes,
    return_count: (currentSub?.returnCount || 0), grade:null, feedback:'',
    instr_rejilla_name:instrRejillaName||null, instr_rejilla_data:instrRejillaData||null,
    instr_pregunta_name:instrPreguntaName||null, instr_pregunta_data:instrPreguntaData||null,
  }).eq('id', subId).then(({ error }) => { if (error) console.error('returnSubmission:', error); });
};

// Corregir una devolución YA hecha: cambia las notas y los archivos adjuntos
// sin gastar una devolución. Solo tiene sentido mientras `status === 'returned'`
// (el estudiante aún no ha reenviado; al reenviar vuelve a 'pending').
//
// La diferencia con `returnSubmission` es lo que NO toca: ni `return_count`, ni
// `status`. El tope de 2 devoluciones existe para acotar cuántas veces se le
// pide al estudiante que rehaga el trabajo — no para castigar al tutor que
// escribió mal una indicación o adjuntó el archivo equivocado.
const updateReturnCorrection = (subId, returnNotes, instrRejillaName, instrRejillaData, instrPreguntaName, instrPreguntaData) => {
  XS.set(s => ({
    submissions: s.submissions.map(su => su.id === subId ? {
      ...su, returnNotes,
      instrRejillaName: instrRejillaName || null, instrRejillaData: instrRejillaData || null,
      instrPreguntaName: instrPreguntaName || null, instrPreguntaData: instrPreguntaData || null,
    } : su),
    // El aviso en pantalla del tutor se actualiza en vez de duplicarse: dos
    // mensajes de devolución para la misma entrega se contradirían.
    studentMessages: (s.studentMessages || []).map(m =>
      m.submissionId === subId && m.type === 'return' ? { ...m, returnNotes } : m),
  }));
  supabase.from('submissions').update({
    return_notes: returnNotes,
    instr_rejilla_name: instrRejillaName || null, instr_rejilla_data: instrRejillaData || null,
    instr_pregunta_name: instrPreguntaName || null, instr_pregunta_data: instrPreguntaData || null,
  }).eq('id', subId).then(({ error }) => { if (error) console.error('updateReturnCorrection:', error); });
};

const approveSubmission = (subId, grade, feedback) => {
  XS.set(s => {
    const sub = s.submissions.find(su => su.id === subId);
    const newMsg = sub ? {
      id: 'msg_' + Date.now(), toEmail: sub.studentEmail, type: 'approved',
      grade, feedback, date: new Date().toISOString().split('T')[0], read: false, submissionId: subId,
    } : null;
    return {
      submissions: s.submissions.map(su => su.id === subId ? { ...su, grade, feedback, status: 'approved' } : su),
      studentMessages: newMsg ? [...(s.studentMessages || []), newMsg] : (s.studentMessages || []),
    };
  });
  supabase.from('submissions').update({ grade, feedback, status:'approved' }).eq('id', subId)
    .then(({ error }) => { if (error) console.error('approveSubmission:', error); });
};

const resubmitProduct = (subId, rejillaName, preguntaName, rejillaData, preguntaData) => {
  XS.set(s => ({
    submissions: s.submissions.map(sub => {
      if (sub.id !== subId) return sub;
      const historyEntry = { rejillaName:sub.rejillaName, rejillaData:sub.rejillaData,
        preguntaName:sub.preguntaName, preguntaData:sub.preguntaData,
        date:sub.date, version:(sub.history||[]).length+1 };
      return { ...sub, rejillaName, preguntaName, rejillaData, preguntaData,
        status:'pending', date:new Date().toISOString().split('T')[0],
        history:[...(sub.history||[]), historyEntry] };
    })
  }));
  // Leer historial actual, luego actualizar
  supabase.from('submissions').select('history, rejilla_name, rejilla_data, pregunta_name, pregunta_data, created_at')
    .eq('id', subId).single().then(({ data, error }) => {
      if (error) { console.error('resubmitProduct read:', error); return; }
      const historyEntry = {
        rejilla_name:data.rejilla_name, rejilla_data:data.rejilla_data,
        pregunta_name:data.pregunta_name, pregunta_data:data.pregunta_data,
        date:data.created_at?.split('T')[0], version:(data.history?.length||0)+1,
      };
      supabase.from('submissions').update({
        rejilla_name:rejillaName, rejilla_data:rejillaData,
        pregunta_name:preguntaName, pregunta_data:preguntaData,
        status:'pending', grade:null, feedback:'',
        history:[...(data.history||[]), historyEntry],
      }).eq('id', subId).then(({ error:e }) => { if (e) console.error('resubmitProduct update:', e); });
    });
};
const resetStudentProgress = async (userId, userEmail) => {
  const { data, error } = await supabase.functions.invoke('reset-student-progress', {
    body: { userId },
  });
  if (error) {
    console.error('resetStudentProgress:', error);
    let msg = error.message || 'Error al reiniciar el progreso';
    // La Edge Function devuelve el detalle en el cuerpo cuando responde no-2xx
    try { const body = await error.context?.json?.(); if (body?.error) msg = body.error; } catch (_) {}
    return { error: msg };
  }
  if (data?.error) { console.error('resetStudentProgress:', data.error); return { error: data.error }; }
  XS.set(s => ({
    submissions: s.submissions.filter(su => su.studentEmail !== userEmail),
    challengeAttempts: s.challengeAttempts.filter(a => a.studentEmail !== userEmail),
  }));
  return { ok: true };
};

// ---- Route Config ----
// Clave en routeConfigs: `${area}__${institutionId || 'global'}`
const routeKey = (area, institutionId) => `${area}__${institutionId || 'global'}`;

const loadRouteConfigs = async () => {
  const { data, error } = await supabase.from('route_configs').select('*');
  if (error) { console.error('loadRouteConfigs:', error); return; }
  const configs = {};
  const namedRoutes = [];
  (data || []).forEach(row => {
    const key = routeKey(row.area, row.institution_id);
    configs[key] = { modules: row.modules || [], customModules: row.custom_modules || [] };
    namedRoutes.push({
      id: row.id, name: row.name || row.area, area: row.area,
      institution_id: row.institution_id || null,
      modules: row.modules || [], customModules: row.custom_modules || [],
    });
  });
  XS.set({ routeConfigs: configs, namedRoutes });
};

// Guarda una ruta para un área + colegio específico (institution_id null = global)
const saveRouteConfig = async (area, modules, customModules, name, institutionId, existingId) => {
  const instId = institutionId || null;
  const key = routeKey(area, instId);
  XS.set(s => ({ routeConfigs: { ...s.routeConfigs, [key]: { modules, customModules } } }));
  const payload = {
    area, modules, custom_modules: customModules,
    updated_at: new Date().toISOString(),
    name: name || area,
    institution_id: instId,
  };
  let error;
  if (existingId) {
    ({ error } = await supabase.from('route_configs').update(payload).eq('id', existingId));
  } else {
    ({ error } = await supabase.from('route_configs')
      .upsert(payload, { onConflict: 'area,institution_id' }));
  }
  if (error) { console.error('saveRouteConfig:', error); return; }
  await loadRouteConfigs();
};

// ---- Instructor Institutions ----
const loadInstructorInstitutions = async () => {
  const { data, error } = await supabase.from('instructor_institutions').select('*');
  if (error) { console.error('loadInstructorInstitutions:', error); return; }
  XS.set({ instructorInstitutions: data || [] });
};

const assignInstructorInstitution = async (instructorId, institutionId) => {
  const { error } = await supabase.from('instructor_institutions')
    .insert({ instructor_id: instructorId, institution_id: institutionId });
  if (error) { console.error('assignInstructorInstitution:', error); return; }
  await loadInstructorInstitutions();
};

const removeInstructorInstitution = async (instructorId, institutionId) => {
  const { error } = await supabase.from('instructor_institutions')
    .delete().eq('instructor_id', instructorId).eq('institution_id', institutionId);
  if (error) { console.error('removeInstructorInstitution:', error); return; }
  await loadInstructorInstitutions();
};

const assignRouteToInstitution = async (routeId, institutionId) => {
  const { error } = await supabase.from('route_configs')
    .update({ institution_id: institutionId || null }).eq('id', routeId);
  if (error) { console.error('assignRouteToInstitution:', error); return; }
  await loadRouteConfigs();
};

// Aplica la config (overrides, orden, activos, custom) de UN alcance a sus módulos base
const applyScopeConfig = (baseMods, config, areaForCustom) => {
  const configMap = {};
  (config?.modules || []).forEach(mc => { configMap[mc.id] = mc; });

  const sorted = [...baseMods]
    .sort((a, b) => (configMap[a.id]?.order ?? 999) - (configMap[b.id]?.order ?? 999))
    .filter(m => configMap[m.id] ? configMap[m.id].enabled !== false : true)
    .map(m => ({
      ...m,
      ...(configMap[m.id]?.override || {}),
      extras: configMap[m.id]?.extras || [],
    }));

  (config?.customModules || [])
    .filter(cm => cm.enabled !== false)
    .forEach(cm => {
      const isChallenge = cm.type === 'challenge';
      const mod = {
        id: cm.id,
        type: cm.type || 'lesson',
        ctype: cm.ctype || null,
        title: cm.title,
        subtitle: isChallenge ? 'Reto' : 'Módulo adicional',
        desc: cm.desc || '', xp: cm.xp || 50, req: [], area: areaForCustom,
        content: cm.content || [],
        questions: cm.questions || [],
        isCustom: true, badge: null,
        pos: { x: 50, y: cm.order || 0 }, side: 'right',
        task: cm.task || '', extras: [],
      };
      const insertAt = sorted.findIndex(m => (configMap[m.id]?.order ?? 999) > (cm.order ?? 999));
      if (insertAt === -1) sorted.push(mod); else sorted.splice(insertAt, 0, mod);
    });

  return sorted;
};

// Ruta del estudiante = módulos TRANSVERSALES (config transversal) + módulos del ÁREA (config de área).
// La entrega final siempre queda al final.
const getRouteModules = (areaId, routeConfigs, institutionId) => {
  const transConfig = routeConfigs?.[routeKey(TRANSVERSAL_AREA, institutionId)]
    || routeConfigs?.[routeKey(TRANSVERSAL_AREA, null)];
  const areaConfig = routeConfigs?.[routeKey(areaId, institutionId)]
    || routeConfigs?.[routeKey(areaId, null)];

  // Sin ninguna config → ruta por defecto (transversal + área), como antes
  if (!transConfig && !areaConfig) return getStudentModules(areaId);

  const transMods = applyScopeConfig(getTransversalModules(), transConfig, null);
  const areaMods  = applyScopeConfig(getAreaOnlyModules(areaId), areaConfig, areaId);

  const all = [...transMods, ...areaMods];
  const finals = all.filter(m => m.type === 'final_delivery');
  const rest   = all.filter(m => m.type !== 'final_delivery');
  return [...rest, ...finals];
};

const findModuleInConfig = (id) => {
  const configs = XS.get().routeConfigs;
  for (const area of Object.keys(configs)) {
    const found = (configs[area].customModules || []).find(m => m.id === id);
    if (found) return {
      id: found.id,
      type: found.type || 'lesson',
      ctype: found.ctype || null,
      title: found.title,
      subtitle: found.type === 'challenge' ? 'Reto' : 'Módulo adicional',
      desc: found.desc || '',
      xp: found.xp || 50,
      req: [],
      content: found.content || [],
      questions: found.questions || [],
      isCustom: true,
      task: found.task || '',
      extras: [],
    };
  }
  return null;
};

const updateAvatar = (url) => {
  const { user } = XS.get();
  XS.set(s => ({
    user: s.user ? { ...s.user, avatar: url } : null,
    accounts: s.accounts.map(a => a.id === s.user?.id ? { ...a, avatar: url } : a),
  }));
  if (user?.id) {
    supabase.from('profiles').update({ avatar: url }).eq('id', user.id)
      .then(({ error }) => { if (error) console.error('updateAvatar:', error); });
  }
};
// --- Avatar del estudiante para los cursos temáticos (migración 0046) --------
// Vive en profiles.avatar_config, NO en la matrícula: la misma persona conserva
// su avatar en todos sus cursos. `updateAvatar` (arriba) es otra cosa: la foto
// de perfil institucional en Storage. Conviven sin pisarse.

// Cursos con tema inmersivo a los que este estudiante tiene acceso activo.
// Mismo criterio que el switcher del mapa: user_courses activo + curso base
// (los forks por colegio son reemplazos transparentes, nunca cursos aparte).
// ⚠️ Devuelve un array NUEVO en cada llamada: no pasarlo a useStore (con
// useSyncExternalStore una referencia nueva por lectura hace bucle). Para la UI,
// derivarlo con useMemo desde courses/userCourses, o usar selectHasThemedCourse
// que sí devuelve un booleano.
const selectThemedCourses = (s) => {
  const activeAccess = new Set(
    (s.userCourses || []).filter(uc => uc.user_id === s.user?.id && uc.is_active).map(uc => uc.course_id)
  );
  return (s.courses || []).filter(c =>
    !!c.theme && isBaseCourse(c) && (activeAccess.has(c.id) || c.id === s.enrolledCourseId)
  );
};

// ¿Habilitar la pestaña "Mi avatar"? Solo estudiantes con al menos un curso
// temático a la vista. Sin esto el perfil se comporta exactamente como antes.
const selectHasThemedCourse = (s) =>
  s.user?.role === 'student' && selectThemedCourses(s).length > 0;

const selectAvatarConfig = (s) => s.user?.avatarConfig || null;

const saveAvatarConfig = (cfg) => {
  const { user } = XS.get();
  if (!user?.id) return Promise.resolve({ error: null });
  XS.set(s => ({ user: s.user ? { ...s.user, avatarConfig: cfg } : null }));
  return supabase.from('profiles').update({ avatar_config: cfg }).eq('id', user.id)
    .then(({ error }) => {
      if (error) console.error('saveAvatarConfig:', error);
      return { error };
    });
};

const dismissNotif = id => XS.set(s=>({notifications:s.notifications.filter(n=>n.id!==id)}));
const dismissStudentMessage = (msgId) => XS.set(s=>({studentMessages:(s.studentMessages||[]).map(m=>m.id===msgId?{...m,read:true}:m)}));

const changeAccountArea = (email, newArea) => {
  XS.set(s => ({ accounts: s.accounts.map(a => a.email === email ? { ...a, area: newArea } : a) }));
  supabase.from('profiles').update({ area: newArea }).eq('email', email)
    .then(({ error }) => { if (error) console.error('changeAccountArea:', error); });
};

// Reasigna el colegio de una cuenta ya creada. `institutionName` es el nombre
// visible; se resuelve a institution_id para persistir en profiles.
const changeAccountInstitution = (email, institutionName) => {
  const { user, institutions } = XS.get();
  if (user?.role !== 'admin') return;
  const instByName = {};
  (institutions || []).forEach(i => { instByName[i.name.toLowerCase().trim()] = i.id; });
  const institution_id = instByName[(institutionName || '').toLowerCase().trim()] || null;
  XS.set(s => ({ accounts: s.accounts.map(a => a.email === email
    ? { ...a, institution: institutionName || '', institution_id } : a) }));
  supabase.from('profiles').update({ institution_id }).eq('email', email)
    .then(({ error }) => { if (error) console.error('changeAccountInstitution:', error); });
};

// Activa/desactiva una cuenta. Inactiva bloquea el inicio de sesión del usuario.
const setAccountActive = (id, active) => {
  const { user } = XS.get();
  if (user?.role !== 'admin') return;
  XS.set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, is_active: active } : a) }));
  supabase.from('profiles').update({ is_active: active }).eq('id', id)
    .then(({ error }) => { if (error) console.error('setAccountActive:', error); });
};

// Determina si un perfil tiene el acceso bloqueado (cuenta o institución inactiva).
// Los admin nunca se bloquean (para que no puedan dejarse fuera). Devuelve el
// motivo (string) si está bloqueado, o null si puede acceder.
// `institutions` es opcional: si se pasa la lista ya cargada, evita un fetch extra.
async function getAccessBlockReason(profile, institutions) {
  if (!profile || profile.role === 'admin') return null;
  if (profile.is_active === false)
    return 'Tu cuenta ha sido desactivada. Contacta al administrador.';
  if (profile.institution_id) {
    let inst = (institutions || []).find(i => i.id === profile.institution_id);
    if (!inst) {
      const { data } = await supabase.from('institutions')
        .select('is_active').eq('id', profile.institution_id).single();
      inst = data;
    }
    if (inst && inst.is_active === false)
      return 'El acceso de tu institución ha sido suspendido. Contacta al administrador.';
  }
  return null;
}

const createAccount = (name, email, pass, role, area, institution) => {
  const { user, institutions } = XS.get();
  if (user?.role !== 'admin') return;
  const avatar = name.trim().charAt(0).toUpperCase();
  // Resolver institution_id desde el nombre para enviarlo al edge function
  const instByName = {};
  (institutions || []).forEach(i => { instByName[i.name.toLowerCase().trim()] = i.id; });
  const institution_id = instByName[(institution || '').toLowerCase().trim()] || null;
  XS.set(s => ({ accounts: [...s.accounts, { email:email.trim(), name:name.trim(), avatar, role, area:area||null, institution:institution||'' }] }));
  supabase.functions.invoke('bulk-create-users', {
    body: { users: [{ name: name.trim(), email: email.trim(), pass, role, area: area||null, institution_id }] }
  }).then(({ data, error }) => {
    if (error) console.error('createAccount error:', error);
    else if (data?.results?.[0]?.ok === false) console.error('createAccount failed:', data.results[0].error);
  });
};
const deleteAccount = (email) => {
  const { user } = XS.get();
  if (user?.role !== 'admin') return;
  XS.set(s => ({ accounts: s.accounts.filter(a => a.email !== email) }));
  supabase.functions.invoke('delete-user', { body: { email } })
    .then(({ data, error }) => {
      if (error) console.error('deleteAccount error:', error);
      else if (data?.error) console.error('deleteAccount failed:', data.error);
    });
};

const bulkCreateAccounts = (users) => {
  const { institutions, user } = XS.get();
  if (user?.role !== 'admin') return;
  const instByName = {};
  (institutions || []).forEach(i => { instByName[i.name.toLowerCase().trim()] = i.id; });

  // Optimistic local update
  XS.set(s => {
    const existing = new Set(s.accounts.map(a => a.email));
    const newAccounts = users.filter(u => !existing.has(u.email.trim()))
      .map(u => ({ email:u.email.trim(), pass:u.pass.toString(), name:u.name.trim(),
        avatar:u.name.trim().charAt(0).toUpperCase(), role:u.role||'student', area:u.area||null, institution:u.institution||'' }));
    return { accounts: [...s.accounts, ...newAccounts] };
  });
  // Resolver institution_id antes de llamar al edge function
  const usersWithIds = users.map(u => ({
    ...u,
    institution_id: instByName[(u.institution || '').toLowerCase().trim()] || null,
  }));
  supabase.functions.invoke('bulk-create-users', { body: { users: usersWithIds } })
    .then(({ data, error }) => {
      if (error) console.error('bulkCreate error:', error);
    });
};

const createInstitution = (name) => {
  const tempId = 'inst_' + Date.now();
  XS.set(s => ({ institutions: [...(s.institutions || INITIAL_INSTITUTIONS), { id: tempId, name, logo: null, is_active: true }] }));
  supabase.from('institutions').insert({ name }).select().single().then(({ data, error }) => {
    if (error) { console.error('createInstitution:', error); return; }
    XS.set(s => ({ institutions: (s.institutions || []).map(i => i.id === tempId ? { ...i, id: data.id } : i) }));
  });
};
// Activa/desactiva un colegio. Inactivo bloquea el acceso de todos sus usuarios.
const setInstitutionActive = (id, active) => {
  XS.set(s => ({ institutions: (s.institutions || []).map(i => i.id === id ? { ...i, is_active: active } : i) }));
  supabase.from('institutions').update({ is_active: active }).eq('id', id).then(({ error }) => {
    if (error) console.error('setInstitutionActive:', error);
  });
};
const updateInstitution = (id, name) => {
  XS.set(s => ({ institutions: (s.institutions || []).map(i => i.id === id ? { ...i, name } : i) }));
  supabase.from('institutions').update({ name }).eq('id', id).then(({ error }) => {
    if (error) console.error('updateInstitution:', error);
  });
};
const deleteInstitution = (id) => {
  XS.set(s => ({ institutions: (s.institutions || []).filter(i => i.id !== id) }));
  supabase.from('institutions').delete().eq('id', id).then(({ error }) => {
    if (error) console.error('deleteInstitution:', error);
  });
};

// ---- Módulos de curso para estudiante ----
const loadCourseModules = async (courseId, areaId = null) => {
  if (!courseId) return;
  // RPC en vez de select('*'): oculta content/challenge_data de módulos con
  // código presencial que este estudiante aún no desbloqueó (ver 0040).
  const { data, error } = await supabase.rpc('get_course_modules_for_student', { p_course_id: courseId });
  if (error) { console.error('loadCourseModules:', error); return; }
  XS.set({
    courseModules: dbRowsToCourseModules(data, areaId),
    enrolledCourseId: courseId,
    effectiveCourseId: courseId,
  });
};

const enrollInCourse = async (courseId) => {
  const { user } = XS.get();
  if (!user?.id) return { error: 'No autenticado' };
  const [{ error: e1 }, { error: e2 }, { error: e3 }] = await Promise.all([
    supabase.from('course_enrollments').upsert(
      { student_id: user.id, course_id: courseId, institution_id: null },
      { onConflict: 'student_id,course_id' }
    ),
    supabase.from('course_progress').upsert(
      { user_id: user.id, course_id: courseId, xp: 0, completed: [], badges: [] },
      { onConflict: 'user_id,course_id' }
    ),
    // Acceso y matrícula van siempre juntos (modelo estricto user_courses)
    supabase.from('user_courses').upsert(
      { user_id: user.id, course_id: courseId, is_active: true },
      { onConflict: 'user_id,course_id' }
    ),
  ]);
  if (e1) { console.error('enrollInCourse enrollment:', e1); return { error: e1.message }; }
  if (e2) { console.error('enrollInCourse progress:', e2); return { error: e2.message }; }
  if (e3) console.error('enrollInCourse access:', e3);
  await loadCourseModules(courseId);
  const { data: cp } = await supabase.from('course_progress')
    .select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
  XS.set({ xp: cp?.xp || 0, completed: cp?.completed || [], badges: cp?.badges || [] });
  return { ok: true };
};

// ---- Cursos (multi-ruta) ----
const loadCourses = async () => {
  const [{ data: coursesData }, { data: icData }] = await Promise.all([
    supabase.from('courses').select('*').order('created_at'),
    supabase.from('institution_courses').select('*'),
  ]);
  XS.set({
    courses: coursesData || [],
    institutionCourses: icData || [],
  });
};

// ---- Acceso a cursos por usuario (estricto) ----
// Carga las filas de user_courses visibles según RLS:
// admin/instructor ven todas; un estudiante solo las suyas.
const loadUserCourses = async () => {
  const { data, error } = await supabase.from('user_courses').select('*');
  if (error) { console.error('loadUserCourses:', error); return; }
  XS.set({ userCourses: data || [] });
};

// Otorga (active=true) o revoca (active=false) el acceso de un usuario a un curso.
// Usa upsert con onConflict para no chocar con la restricción UNIQUE cuando la
// fila ya existe en la BD pero no está en el estado local. Devuelve { error }
// para que la UI pueda mostrar el motivo (RLS, etc.) en vez de fallar en silencio.
const setUserCourseAccess = async (userId, courseId, active) => {
  const { userCourses } = XS.get();
  const existing = userCourses.find(uc => uc.user_id === userId && uc.course_id === courseId);
  // Actualización optimista (se revierte si la BD rechaza)
  if (existing) {
    XS.set({ userCourses: userCourses.map(uc => uc.id === existing.id ? { ...uc, is_active: active } : uc) });
  }
  const { data, error } = await supabase.from('user_courses')
    .upsert({ user_id: userId, course_id: courseId, is_active: active }, { onConflict: 'user_id,course_id' })
    .select().single();
  if (error) {
    console.error('setUserCourseAccess:', error);
    await loadUserCourses(); // revierte el optimismo al estado real de la BD
    return { error: error.message };
  }
  // Acceso y matrícula van juntos: al CONCEDER acceso, asegurar matrícula y
  // progreso (sin resetear a quien ya avanzó). Al revocar NO se quita nada.
  if (active) {
    await Promise.all([
      supabase.from('course_enrollments').upsert(
        { student_id: userId, course_id: courseId, institution_id: null },
        { onConflict: 'student_id,course_id', ignoreDuplicates: true }
      ),
      supabase.from('course_progress').upsert(
        { user_id: userId, course_id: courseId, xp: 0, completed: [], badges: [] },
        { onConflict: 'user_id,course_id', ignoreDuplicates: true }
      ),
    ]);
  }
  XS.set(s => {
    const others = (s.userCourses || []).filter(uc => !(uc.user_id === userId && uc.course_id === courseId));
    return { userCourses: [...others, data] };
  });
  return { ok: true };
};

// Otorga/revoca el acceso a UN curso para MUCHOS usuarios a la vez (gestión en masa).
const setUserCourseAccessBulk = async (userIds, courseId, active) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  const rows = ids.map(uid => ({ user_id: uid, course_id: courseId, is_active: active }));
  const { error } = await supabase.from('user_courses')
    .upsert(rows, { onConflict: 'user_id,course_id' });
  if (error) { console.error('setUserCourseAccessBulk:', error); return; }
  // Acceso y matrícula van juntos: al CONCEDER, asegurar matrícula y progreso
  // de todos (sin resetear). Al revocar NO se quita nada.
  if (active) {
    await Promise.all([
      supabase.from('course_enrollments').upsert(
        ids.map(uid => ({ student_id: uid, course_id: courseId, institution_id: null })),
        { onConflict: 'student_id,course_id', ignoreDuplicates: true }
      ),
      supabase.from('course_progress').upsert(
        ids.map(uid => ({ user_id: uid, course_id: courseId, xp: 0, completed: [], badges: [] })),
        { onConflict: 'user_id,course_id', ignoreDuplicates: true }
      ),
    ]);
  }
  await loadUserCourses();
};

// IDs de cursos accesibles para un usuario (acceso estricto)
const allowedCourseIds = (userId) => {
  const { userCourses } = XS.get();
  return new Set(userCourses.filter(uc => uc.user_id === userId && uc.is_active).map(uc => uc.course_id));
};

// ---- Habilitación del taller / producto final por estudiante (tutor) ----
// Carga las filas de workshop_access visibles según RLS: admin/instructor ven
// todas; un estudiante solo la suya.
const loadWorkshopAccess = async () => {
  const { data, error } = await supabase.from('workshop_access').select('*');
  if (error) { console.error('loadWorkshopAccess:', error); return; }
  XS.set({ workshopAccess: data || [] });
};

// ¿Un estudiante tiene habilitado el tramo post-taller (producto final) en un curso?
const isWorkshopEnabled = (userId, courseId) => {
  const { workshopAccess } = XS.get();
  return (workshopAccess || []).some(w => w.student_id === userId && w.course_id === courseId && w.enabled);
};

// Habilita (enabled=true) o bloquea (false) el tramo post-taller de UN estudiante
// en un curso. Actualiza de forma optimista y revierte si la BD lo rechaza (RLS).
const setWorkshopAccess = async (studentId, courseId, enabled) => {
  const { workshopAccess, user } = XS.get();
  const { data, error } = await supabase.from('workshop_access')
    .upsert({ student_id: studentId, course_id: courseId, enabled, granted_by: user?.id || null, updated_at: new Date().toISOString() },
            { onConflict: 'student_id,course_id' })
    .select().single();
  if (error) { console.error('setWorkshopAccess:', error); return { error: error.message }; }
  const others = (workshopAccess || []).filter(w => !(w.student_id === studentId && w.course_id === courseId));
  XS.set({ workshopAccess: [...others, data] });
  return { ok: true };
};

// Habilita/bloquea el taller para MUCHOS estudiantes de un curso a la vez
// (marcar a todos los asistentes al taller de una sola acción).
const setWorkshopAccessBulk = async (studentIds, courseId, enabled) => {
  const ids = [...new Set((studentIds || []).filter(Boolean))];
  if (!ids.length || !courseId) return { ok: true };
  const { user } = XS.get();
  const rows = ids.map(sid => ({ student_id: sid, course_id: courseId, enabled, granted_by: user?.id || null, updated_at: new Date().toISOString() }));
  const { error } = await supabase.from('workshop_access')
    .upsert(rows, { onConflict: 'student_id,course_id' });
  if (error) { console.error('setWorkshopAccessBulk:', error); return { error: error.message }; }
  await loadWorkshopAccess();
  return { ok: true };
};

// Cargas comunes tras autenticar (las usan TANTO el login como la restauración
// de sesión — mantenerlas en un solo lugar evita que los dos flujos diverjan,
// que fue la causa del "login pegado": login.jsx olvidó marcar coursesLoaded).
// coursesLoaded se marca solo cuando courses + userCourses terminan, porque el
// guard de estudiante en app.jsx espera ese flag antes de decidir la ruta.
const loadSessionCatalogs = () => {
  loadRouteConfigs();
  loadWorkshopAccess();
  return Promise.all([loadCourses(), loadUserCourses()])
    .catch(err => console.error('loadCourses/loadUserCourses:', err))
    .finally(() => XS.set({ coursesLoaded: true }));
};

const createCourse = async ({ name, description, color, coverImage, areaId, theme }) => {
  const { data, error } = await supabase.from('courses').insert({
    name, description, color: color || '#E8732C',
    cover_image: coverImage || null, is_active: true,
    area_id: areaId || null,
    theme: theme || null,
  }).select().single();
  if (error) { console.error('createCourse:', error); throw new Error(error.message); }
  await loadCourses();
  return data;
};

const updateCourse = async (id, fields) => {
  const { error } = await supabase.from('courses').update({
    ...fields,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) { console.error('updateCourse:', error); return; }
  await loadCourses();
};

const deleteCourse = async (id) => {
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) { console.error('deleteCourse:', error); return; }
  await loadCourses();
};

// Inscribe automáticamente a TODOS los estudiantes de una institución en un curso:
// otorga acceso (user_courses), crea la matrícula (course_enrollments) y la fila
// de progreso (course_progress, sin sobrescribir si ya existe). Devuelve el conteo.
const autoEnrollInstitutionStudents = async (courseId, institutionId) => {
  const { data: students, error } = await supabase.from('profiles')
    .select('id').eq('role', 'student').eq('institution_id', institutionId);
  if (error) { console.error('autoEnroll fetch students:', error); return { error: error.message }; }
  const ids = (students || []).map(s => s.id);
  if (!ids.length) return { ok: true, count: 0 };

  const [ucRes, ceRes, cpRes] = await Promise.all([
    // Acceso (estricto): asegurar is_active=true aunque ya exista la fila
    supabase.from('user_courses').upsert(
      ids.map(id => ({ user_id: id, course_id: courseId, is_active: true })),
      { onConflict: 'user_id,course_id' }
    ),
    // Matrícula: no tocar si ya existe (preserva institution_id/fecha)
    supabase.from('course_enrollments').upsert(
      ids.map(id => ({ student_id: id, course_id: courseId, institution_id: institutionId })),
      { onConflict: 'student_id,course_id', ignoreDuplicates: true }
    ),
    // Progreso: crear vacío solo si no existe (NUNCA resetear el de quien ya avanzó)
    supabase.from('course_progress').upsert(
      ids.map(id => ({ user_id: id, course_id: courseId, xp: 0, completed: [], badges: [] })),
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    ),
  ]);
  if (ucRes.error) console.error('autoEnroll user_courses:', ucRes.error);
  if (ceRes.error) console.error('autoEnroll course_enrollments:', ceRes.error);
  if (cpRes.error) console.error('autoEnroll course_progress:', cpRes.error);
  return { ok: true, count: ids.length };
};

// expiresAt: ISO string (vence esa fecha) o null (indefinido). Solo se aplica
// al ASIGNAR (active=true); al desasignar se conserva la fecha ya guardada.
const toggleCourseForInstitution = async (courseId, institutionId, active, expiresAt = null) => {
  const { institutionCourses } = XS.get();
  const existing = institutionCourses.find(
    ic => ic.course_id === courseId && ic.institution_id === institutionId
  );
  const payload = active ? { is_active: true, expires_at: expiresAt || null } : { is_active: false };
  if (existing) {
    await supabase.from('institution_courses')
      .update(payload).eq('id', existing.id);
  } else {
    await supabase.from('institution_courses')
      .insert({ course_id: courseId, institution_id: institutionId, ...payload });
  }
  await loadCourses();
  // Al ASIGNAR (active=true), inscribe automáticamente a todos los estudiantes
  // del colegio. Al desasignar NO se les quita la matrícula ni el progreso
  // (la revocación por vencimiento la hace sync_my_institution_courses, 0030).
  if (active) {
    const res = await autoEnrollInstitutionStudents(courseId, institutionId);
    await loadUserCourses();
    return res;
  }
};

// Cambia solo la fecha de vencimiento de un curso ya habilitado para un colegio
// (sin tocar is_active ni re-disparar auto-inscripción/toast).
const setInstitutionCourseExpiry = async (courseId, institutionId, expiresAt) => {
  const { institutionCourses } = XS.get();
  const existing = institutionCourses.find(
    ic => ic.course_id === courseId && ic.institution_id === institutionId
  );
  if (!existing) return { error: 'El curso no está habilitado para este colegio.' };
  const { error } = await supabase.from('institution_courses')
    .update({ expires_at: expiresAt || null }).eq('id', existing.id);
  if (error) { console.error('setInstitutionCourseExpiry:', error); return { error: error.message }; }
  await loadCourses();
  return { ok: true };
};

// Publica la ruta del instructor a course_modules del curso vinculado.
// Borra todos los módulos del curso (excepto final_delivery) y los reinserta desde la config actual.
const publishRouteToCourse = async (courseId, area, moduleList, customModules) => {
  if (!courseId) return { error: 'Sin curso vinculado' };

  // El alcance transversal se guarda como area_id NULL (visible en todas las áreas)
  const areaIdVal = area === TRANSVERSAL_AREA ? null : area;

  // Solo borra/reemplaza los módulos de este alcance, preservando los demás y final_delivery
  const { data: existing } = await supabase.from('course_modules')
    .select('id, type, area_id').eq('course_id', courseId);
  const toDelete = (existing || [])
    .filter(r => r.type !== 'final_delivery' && (r.area_id ?? null) === areaIdVal)
    .map(r => r.id);
  if (toDelete.length > 0) {
    await supabase.from('course_modules').delete().in('id', toDelete);
  }

  // Construir filas a insertar desde moduleList (módulos base activos)
  const rows = [];
  let order = 1;
  for (const m of moduleList.filter(m => m.enabled !== false)) {
    const challengeData = {};
    if (m.dragItems    || m.override?.dragItems)    challengeData.dragItems    = m.dragItems    || m.override.dragItems;
    if (m.empathyCards || m.override?.empathyCards) challengeData.empathyCards = m.empathyCards || m.override.empathyCards;
    if (m.matchPairs   || m.override?.matchPairs)   challengeData.matchPairs   = m.matchPairs   || m.override.matchPairs;
    if (m.simContext   || m.override?.simContext)    challengeData.simContext   = m.simContext   || m.override.simContext;
    if (m.questions    || m.override?.questions)     challengeData.questions    = m.questions    || m.override.questions;
    if (m.statements   || m.override?.statements)    challengeData.statements   = m.statements   || m.override.statements;
    if (m.blanks       || m.override?.blanks)        challengeData.blanks       = m.blanks       || m.override.blanks;
    if (m.passage      || m.override?.passage)       challengeData.passage      = m.passage      || m.override.passage;
    if (m.correctMessage   || m.override?.correctMessage)   challengeData.correctMessage   = m.correctMessage   || m.override.correctMessage;
    if (m.incorrectMessage || m.override?.incorrectMessage) challengeData.incorrectMessage = m.incorrectMessage || m.override.incorrectMessage;
    if (m.passingScore != null || m.override?.passingScore != null) challengeData.passingScore = m.passingScore ?? m.override.passingScore;
    if (m.passMessage      || m.override?.passMessage)      challengeData.passMessage      = m.passMessage      || m.override.passMessage;
    if (m.failMessage      || m.override?.failMessage)      challengeData.failMessage      = m.failMessage      || m.override.failMessage;
    rows.push({
      course_id: courseId, type: m.type, area_id: areaIdVal,
      title: m.title, subtitle: m.subtitle || '',
      description: m.desc || '',
      xp: m.xp || 100, order: order++, is_enabled: true,
      content: m.content || [],
      challenge_data: challengeData,
      challenge_type: m.ctype || null,
    });
  }
  // Módulos personalizados del instructor
  for (const m of customModules.filter(m => m.enabled !== false && m.type !== 'final_delivery')) {
    const challengeData = {};
    if (m.dragItems)    challengeData.dragItems    = m.dragItems;
    if (m.empathyCards) challengeData.empathyCards = m.empathyCards;
    if (m.matchPairs)   challengeData.matchPairs   = m.matchPairs;
    if (m.simContext)   challengeData.simContext   = m.simContext;
    if (m.questions)    challengeData.questions    = m.questions;
    if (m.statements)   challengeData.statements   = m.statements;
    if (m.blanks)       challengeData.blanks       = m.blanks;
    if (m.passage)      challengeData.passage      = m.passage;
    if (m.correctMessage)   challengeData.correctMessage   = m.correctMessage;
    if (m.incorrectMessage) challengeData.incorrectMessage = m.incorrectMessage;
    if (m.passingScore != null) challengeData.passingScore = m.passingScore;
    if (m.passMessage)      challengeData.passMessage      = m.passMessage;
    if (m.failMessage)      challengeData.failMessage      = m.failMessage;
    rows.push({
      course_id: courseId, type: m.type || 'lesson', area_id: areaIdVal,
      title: m.title, subtitle: m.subtitle || (m.type === 'challenge' ? 'Reto' : 'Módulo'),
      description: m.desc || '',
      xp: m.xp || 100, order: order++, is_enabled: true,
      content: m.content || [],
      challenge_data: challengeData,
      challenge_type: m.ctype || null,
    });
  }

  const { error } = await supabase.from('course_modules').insert(rows);
  if (error) return { error: error.message };

  // Reordenar final_delivery al final
  const { data: fd } = await supabase.from('course_modules')
    .select('id').eq('course_id', courseId).eq('type', 'final_delivery').maybeSingle();
  if (fd) {
    await supabase.from('course_modules').update({ order: order }).eq('id', fd.id);
  }

  return { ok: true, count: rows.length };
};

// ── FORK DE CURSO POR TUTOR + COLEGIO ─────────────────────────────────────
// Dado un courseId (default) y un institutionId, busca si ya existe una copia
// del tutor actual para ese colegio. Si no, la crea clonando el curso y sus
// módulos. Devuelve { id, isNew } con el id de la copia.
//
// sourceCourseId (opcional): de dónde clonar los MÓDULOS. Por defecto es el
// curso base (courseId) — comportamiento de siempre. Si se pasa el id de un
// fork YA EXISTENTE de otro colegio (misma familia: mismo parent_course_id),
// los módulos se copian de ESE fork en vez de partir del curso base, para
// poder reutilizar entre colegios una versión ya editada. name/theme/color
// del curso nuevo siguen viniendo del curso base, nunca del fork origen —
// ver nota "Nombre/tema SIEMPRE del padre" en la memoria del proyecto.
const forkCourseForInstitution = async (courseId, institutionId, sourceCourseId) => {
  const { user } = XS.get();
  if (!user?.id || !courseId || !institutionId) return { error: 'Faltan parámetros' };

  // 1) ¿Ya existe una copia para este colegio? (compartida entre todos los
  // tutores asignados a él, sin importar quién la haya creado — así dos
  // tutores del mismo colegio siempre editan la MISMA ruta que verá el
  // estudiante, en vez de generar copias duplicadas que se pisan entre sí).
  const { data: existing } = await supabase.from('courses')
    .select('id,name')
    .eq('parent_course_id', courseId)
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .maybeSingle();
  if (existing) return { id: existing.id, name: existing.name, isNew: false };

  // 2) Trae el curso default
  const { data: parent, error: pe } = await supabase.from('courses')
    .select('*').eq('id', courseId).single();
  if (pe || !parent) return { error: 'No se encontró el curso original' };

  // 3) Crea la copia
  const { data: copy, error: ce } = await supabase.from('courses').insert({
    name: parent.name + ' — mi versión',
    description: parent.description,
    cover_image: parent.cover_image,
    color: parent.color,
    theme: parent.theme,
    area_id: parent.area_id,
    is_active: true,
    owner_id: user.id,
    parent_course_id: courseId,
    institution_id: institutionId,
  }).select().single();
  if (ce || !copy) return { error: ce?.message || 'No se pudo crear la copia' };

  // 4) Clona los módulos — genera ids nuevos en el cliente y REMAPEA
  // requirements a esos ids nuevos. Sin este remapeo, los prerrequisitos
  // quedan apuntando a los módulos del curso PADRE (que el estudiante nunca
  // ve en el fork), y ningún módulo después del primero puede desbloquearse
  // jamás — el progreso del estudiante nunca podrá contener esos ids viejos.
  // Se clona desde sourceCourseId si se indicó (otro fork ya editado), o del
  // curso base por defecto.
  const cloneFromId = sourceCourseId || courseId;
  const { data: modules } = await supabase.from('course_modules')
    .select('*').eq('course_id', cloneFromId).order('"order"');
  if (modules?.length) {
    const idMap = new Map(); // id en el curso padre -> id nuevo en el fork
    const cloned = modules.map(({ id: oldId, course_id: _cid, created_at: _ca, updated_at: _ua, ...rest }) => {
      const newId = crypto.randomUUID();
      idMap.set(oldId, newId);
      return { ...rest, id: newId, course_id: copy.id };
    });
    cloned.forEach(m => {
      if (m.requirements?.length) m.requirements = m.requirements.map(r => idMap.get(r)).filter(Boolean);
    });
    await supabase.from('course_modules').insert(cloned);
  }

  await loadCourses();
  return { id: copy.id, name: copy.name, isNew: true };
};

// Importa los módulos PUBLICADOS de OTRO curso (típicamente el fork de otro
// colegio) al editor, listos para reemplazar la lista actual. A diferencia de
// loadCourseForEditing, NO conserva referencias `_dbRow` ni los ids originales:
// genera ids de cliente nuevos ('new_…') y REMAPEA requirements a esos ids, para
// que al guardar/publicar se inserten como módulos propios del fork destino (sin
// pisar ni depender de los módulos del colegio de origen). Ignora el borrador del
// origen — copia lo que esa profesora ya PUBLICÓ (lo que ven sus estudiantes).
const loadModulesForImport = async (sourceCourseId) => {
  if (!sourceCourseId) return { error: 'Sin curso de origen', modules: [] };
  const { data, error } = await supabase.from('course_modules')
    .select('*').eq('course_id', sourceCourseId).order('"order"');
  if (error) return { error: error.message, modules: [] };

  const idMap = new Map(); // id en el origen -> id de cliente nuevo
  (data || []).forEach(row => idMap.set(row.id, 'new_' + crypto.randomUUID()));

  const modules = (data || []).map(row => ({
    ...dbModToAppMod(row),
    id: idMap.get(row.id),
    req: (row.requirements || []).map(r => idMap.get(r)).filter(Boolean),
    subtitle: row.subtitle || '',
    desc: row.description || '',
    task: '',
    enabled: row.is_enabled !== false,
    override: null,
    _dbRow: null,   // se insertará como módulo nuevo, no como UPDATE en sitio
    isDbModule: false,
  }));
  return { modules };
};

// Carga los módulos de un curso para edición en el editor de rutas del instructor.
// Devuelve los módulos convertidos al formato del editor (mismo shape que los módulos
// DCE de getScopeModules) para que las acciones de edición existentes sigan funcionando.
//
// Borrador/Publicar: si el curso tiene un borrador pendiente (`courses.draft_modules`,
// migración 0031), se carga ESE (lo que el tutor dejó a medias) en vez de lo publicado
// — así el trabajo en curso no se pierde entre sesiones. `hasDraft` le indica a la UI
// si lo que se ve es un borrador sin publicar o lo que ya ven los estudiantes.
const loadCourseForEditing = async (courseId) => {
  const { data: courseRow } = await supabase.from('courses')
    .select(`name, draft_modules, draft_name, draft_updated_at, draft_certificate,
      certificate_enabled, certificate_title, certificate_achievement_text,
      certificate_signatory_name, certificate_signatory_role, certificate_hours, parent_course_id`)
    .eq('id', courseId).maybeSingle();

  const { courses } = XS.get();
  const publishedCertConfig = getCourseCertConfig(courses, courseRow);

  if (courseRow?.draft_modules) {
    return {
      modules: courseRow.draft_modules,
      customModules: [],
      hasDraft: true,
      draftName: courseRow.draft_name ?? courseRow.name,
      draftUpdatedAt: courseRow.draft_updated_at,
      certConfig: courseRow.draft_certificate || publishedCertConfig,
    };
  }

  const { data, error } = await supabase.from('course_modules')
    .select('*').eq('course_id', courseId).order('"order"');
  if (error) return { error: error.message, modules: [], customModules: [] };

  const standard = [], custom = [];
  (data || []).forEach(row => {
    const mod = {
      ...dbModToAppMod(row),
      // Conserva campos del editor que dbModToAppMod no mapea
      subtitle: row.subtitle || '',
      desc: row.description || '',
      task: '',
      enabled: row.is_enabled !== false,
      override: null,
      _dbRow: row, // referencia para UPDATE en sitio
    };
    // Los módulos personalizados del tutor (creados con el editor) tienen ids no-uuid-fijo
    // pero aquí tratamos TODOS como "módulos reales del curso" — el editor los muestra
    // en la lista principal, sin distinción base/custom.
    standard.push(mod);
  });
  return { modules: standard, customModules: custom, hasDraft: false, certConfig: publishedCertConfig };
};

// Guarda el estado actual del editor como BORRADOR (courses.draft_modules /
// draft_certificate) sin tocar course_modules ni las columnas certificate_* —
// los estudiantes NO ven este cambio hasta que se publique.
const saveCourseDraft = async (courseId, moduleList, courseName, certConfig) => {
  if (!courseId) return { error: 'Sin curso seleccionado' };
  const { error } = await supabase.from('courses').update({
    draft_modules: moduleList,
    draft_name: courseName ?? null,
    draft_certificate: certConfig ?? null,
    draft_updated_at: new Date().toISOString(),
  }).eq('id', courseId);
  if (error) { console.error('saveCourseDraft:', error); return { error: error.message }; }
  return { ok: true };
};

// Descarta el borrador pendiente (vuelve a lo último publicado).
const discardCourseDraft = async (courseId) => {
  if (!courseId) return { error: 'Sin curso seleccionado' };
  const { error } = await supabase.from('courses').update({
    draft_modules: null, draft_name: null, draft_certificate: null, draft_updated_at: null,
  }).eq('id', courseId);
  if (error) { console.error('discardCourseDraft:', error); return { error: error.message }; }
  return { ok: true };
};

// Publica el borrador: aplica moduleList/courseName/certConfig a la BD real
// (course_modules + columnas certificate_*, lo que leen los estudiantes) vía
// saveCourseModules, y limpia el borrador.
const publishCourseModules = async (courseId, moduleList, courseName, certConfig) => {
  const result = await saveCourseModules(courseId, moduleList, courseName, certConfig);
  if (result.error) return result;
  await discardCourseDraft(courseId);
  return result;
};

// Guarda los cambios del editor sobre un curso real (la copia del tutor).
// Estrategia UPDATE en sitio para los módulos existentes (preserva UUIDs →
// no rompe course_progress.completed[]), INSERT para los nuevos, DELETE para
// los quitados. Devuelve { ok, count } o { error }.
const saveCourseModules = async (courseId, moduleList, courseName, certConfig) => {
  if (!courseId) return { error: 'Sin curso seleccionado' };

  // Renombrar el curso si cambió el nombre
  if (courseName !== undefined) {
    await supabase.from('courses').update({ name: courseName, updated_at: new Date().toISOString() }).eq('id', courseId);
  }

  // Publicar la config del certificado (lo que emitirá issueCourseCertificate)
  if (certConfig !== undefined) {
    await supabase.from('courses').update({
      certificate_enabled: !!certConfig.enabled,
      certificate_title: certConfig.title || null,
      certificate_achievement_text: certConfig.achievementText || null,
      certificate_signatory_name: certConfig.signatoryName || null,
      certificate_signatory_role: certConfig.signatoryRole || null,
      certificate_hours: (certConfig.hours === '' || certConfig.hours == null) ? null : Number(certConfig.hours),
      updated_at: new Date().toISOString(),
    }).eq('id', courseId);
  }

  if (courseName !== undefined || certConfig !== undefined) await loadCourses();

  // IDs existentes en la BD
  const { data: existingRows } = await supabase.from('course_modules')
    .select('id').eq('course_id', courseId);
  const existingIds = new Set((existingRows || []).map(r => r.id));

  const toUpdate = [], toInsert = [], toDeleteIds = [];
  const seen = new Set();

  moduleList.forEach((m, i) => {
    const payload = {
      course_id: courseId,
      title: m.title,
      subtitle: m.subtitle || '',
      description: m.desc || '',
      type: m.type || 'lesson',
      challenge_type: m.ctype || null,
      area_id: m._dbRow?.area_id ?? null,
      character_line: m.characterLine || m._dbRow?.character_line || null,
      requirements: m.req || [],
      xp: m.xp || 100,
      order: i + 1,
      is_enabled: m.enabled !== false,
      requires_presence_code: m.requiresPresenceCode || false,
      available_from:  m.availableFrom  || null,
      available_until: m.availableUntil || null,
      content: m.content || [],
      challenge_data: (() => {
        const cd = {};
        if (m.dragItems)    cd.dragItems    = m.dragItems;
        if (m.empathyCards) cd.empathyCards = m.empathyCards;
        if (m.matchPairs)   cd.matchPairs   = m.matchPairs;
        if (m.simContext)   cd.simContext   = m.simContext;
        if (m.questions)    cd.questions    = m.questions;
        if (m.statements)   cd.statements   = m.statements;
        if (m.blanks)       cd.blanks       = m.blanks;
        if (m.passage)      cd.passage      = m.passage;
        if (m.correctMessage)   cd.correctMessage   = m.correctMessage;
        if (m.incorrectMessage) cd.incorrectMessage = m.incorrectMessage;
        if (m.passingScore != null) cd.passingScore = m.passingScore;
        if (m.maxAttempts != null)  cd.maxAttempts  = m.maxAttempts;
        if (m.passMessage)      cd.passMessage      = m.passMessage;
        if (m.failMessage)      cd.failMessage      = m.failMessage;
        return cd;
      })(),
      updated_at: new Date().toISOString(),
    };

    if (m.id && existingIds.has(m.id)) {
      toUpdate.push({ id: m.id, ...payload });
      seen.add(m.id);
    } else {
      toInsert.push(payload);
    }
  });

  existingIds.forEach(id => { if (!seen.has(id)) toDeleteIds.push(id); });

  const ops = [];
  if (toDeleteIds.length) ops.push(supabase.from('course_modules').delete().in('id', toDeleteIds));
  if (toUpdate.length)   ops.push(...toUpdate.map(({ id, ...rest }) => supabase.from('course_modules').update(rest).eq('id', id)));
  if (toInsert.length)   ops.push(supabase.from('course_modules').insert(toInsert));

  const results = await Promise.all(ops);
  const firstError = results.find(r => r.error)?.error;
  if (firstError) return { error: firstError.message };
  return { ok: true, count: toUpdate.length + toInsert.length };
};

// Dada la matrícula de un estudiante en courseId + su institution_id,
// resuelve qué course_id debe usar: la copia del tutor de su colegio (si existe)
// o el default. Retorna el courseId efectivo.
const resolveCourseForStudent = async (courseId, institutionId) => {
  if (!institutionId || !courseId) return courseId;
  const { data } = await supabase.from('courses')
    .select('id')
    .eq('parent_course_id', courseId)
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .maybeSingle();
  return data?.id || courseId;
};

// Cambia el curso activo del estudiante (multi-inscripción)
// Resuelve si existe una copia del tutor para el colegio del estudiante.
const switchCourse = async (courseId) => {
  const { user, selectedArea, allEnrollments } = XS.get();
  if (!user?.id || !courseId) return;

  // Resolver copia efectiva para el colegio del usuario
  const effectiveCourseId = await resolveCourseForStudent(courseId, user.institution_id);

  // Si el estudiante tiene ACCESO pero aún no MATRÍCULA en este curso
  // (desfase user_courses ↔ course_enrollments), créala antes de entrar
  // para que su progreso se persista correctamente.
  if (!(allEnrollments || []).includes(courseId)) {
    await Promise.all([
      supabase.from('course_enrollments').upsert(
        { student_id: user.id, course_id: courseId, institution_id: null },
        { onConflict: 'student_id,course_id', ignoreDuplicates: true }
      ),
      supabase.from('course_progress').upsert(
        { user_id: user.id, course_id: courseId, xp: 0, completed: [], badges: [] },
        { onConflict: 'user_id,course_id', ignoreDuplicates: true }
      ),
    ]);
    XS.set({ allEnrollments: [...(allEnrollments || []), courseId] });
  }
  // RPC en vez de select('*'): oculta content/challenge_data de módulos con
  // código presencial que este estudiante aún no desbloqueó (ver 0040).
  const { data: modulesData } = await supabase.rpc('get_course_modules_for_student', { p_course_id: effectiveCourseId });
  const courseModules = dbRowsToCourseModules(modulesData, selectedArea);
  const { data: cp } = await supabase.from('course_progress')
    .select('*').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
  XS.set({
    enrolledCourseId: courseId,
    effectiveCourseId,
    courseModules,
    xp: cp?.xp || 0,
    completed: cp?.completed || [],
    badges: cp?.badges || [],
  });
};

// =============================================
// ONBOARDING + FORO
// =============================================

// Persiste xp/badges del estudiante en la tabla que corresponda
// (course_progress si hay curso inscrito, progress en legacy)
const persistStudentXP = (s, fields) => {
  if (!s.user?.id) return;
  const payload = { ...fields, updated_at: new Date().toISOString() };
  if (s.enrolledCourseId) {
    supabase.from('course_progress').update(payload)
      .eq('user_id', s.user.id).eq('course_id', s.enrolledCourseId)
      .then(({ error }) => { if (error) console.error('persistStudentXP course_progress:', error); });
  } else {
    supabase.from('progress').update(payload).eq('user_id', s.user.id)
      .then(({ error }) => { if (error) console.error('persistStudentXP progress:', error); });
  }
};

// El estudiante terminó (o saltó) el modal de bienvenida
const markOnboarded = () => {
  const { user } = XS.get();
  if (!user) return;
  XS.set({ user: { ...user, onboarded: true } });
  supabase.from('profiles').update({ onboarded: true }).eq('id', user.id)
    .then(({ error }) => { if (error) console.error('markOnboarded:', error); });
};

const ONBOARDING_BONUS_XP = 50;
// Bonus de "Primeros pasos": +50 XP una única vez al completar el checklist
const claimOnboardingBonus = () => {
  const s = XS.get();
  if (!s.user || s.user.role !== 'student' || s.user.onboardingBonus) return;
  const nxp = s.xp + ONBOARDING_BONUS_XP;
  XS.set({
    xp: nxp,
    user: { ...s.user, onboardingBonus: true },
    notifications: [...s.notifications, { type: 'xp', amount: ONBOARDING_BONUS_XP, id: Date.now() }],
  });
  persistStudentXP(s, { xp: nxp });
  supabase.from('profiles').update({ onboarding_bonus: true }).eq('id', s.user.id)
    .then(({ error }) => { if (error) console.error('claimOnboardingBonus:', error); });
};

const FORUM_FIRST_XP = 30;
// Primera participación en el foro: XP + insignia (la insignia actúa de flag)
const awardForumParticipation = () => {
  const s = XS.get();
  if (!s.user || s.user.role !== 'student' || s.badges.includes('companero')) return;
  const nxp = s.xp + FORUM_FIRST_XP;
  const nb = [...s.badges, 'companero'];
  XS.set({
    xp: nxp, badges: nb,
    notifications: [...s.notifications,
      { type: 'xp', amount: FORUM_FIRST_XP, id: Date.now() },
      { type: 'badge', bid: 'companero', id: Date.now() + 1 }],
  });
  persistStudentXP(s, { xp: nxp, badges: nb });
};

// Emite o recupera el certificado de un estudiante (idempotente por submission_id)
const issueCertificate = async (submissionId, studentName, areaId, score, maxScore) => {
  const { data: existing } = await supabase
    .from('certificates')
    .select('cert_uuid, issued_at')
    .eq('submission_id', submissionId)
    .maybeSingle();
  if (existing) return existing;

  const { user } = XS.get();
  if (!user) return null;
  const { data, error } = await supabase
    .from('certificates')
    .insert({ user_id: user.id, submission_id: submissionId, student_name: studentName,
              area_id: areaId || null, score, max_score: maxScore })
    .select('cert_uuid, issued_at')
    .single();
  if (error) { console.error('issueCertificate:', error); return null; }
  return data;
};

// ── Certificado de curso (personalizado por el tutor desde el Editor de Ruta) ──
// A diferencia del certificado DCE (Grid.jsx, ligado a una Entrega Final
// calificada), este se emite solo con completar el 100% de los módulos
// habilitados de la ruta — necesario porque no todo curso personalizado tiene
// Entrega Final (ej. MOOCs por video). Ver 0037_course_certificates.sql.
// Copia deliberada de DEFAULT_ACHIEVEMENT_TEXT (components/CertificateCard.jsx):
// el store no debe importar de un componente. Si cambia allá, cambiar aquí.
const DEFAULT_CERT_ACHIEVEMENT_TEXT = 'Por haber concluido de manera satisfactoria el';

// Título mostrado por defecto si el tutor no puso uno propio: el nombre del
// curso ORIGINAL (nunca el nombre interno del fork, que es solo referencia
// del tutor — ver comentario en InstructorRouteEditor.jsx).
const getCourseDisplayName = (courses, courseRow) => {
  if (!courseRow) return '';
  if (courseRow.parent_course_id) {
    const parent = (courses || []).find(c => c.id === courseRow.parent_course_id);
    return parent?.name || courseRow.name || '';
  }
  return courseRow.name || '';
};

// Normaliza las columnas certificate_* de una fila `courses` (o su borrador)
// a la forma que consume el editor y el emisor de certificados.
const getCourseCertConfig = (courses, courseRow) => ({
  enabled: !!courseRow?.certificate_enabled,
  title: courseRow?.certificate_title || '',
  achievementText: courseRow?.certificate_achievement_text || '',
  signatoryName: courseRow?.certificate_signatory_name || '',
  signatoryRole: courseRow?.certificate_signatory_role || '',
  hours: courseRow?.certificate_hours ?? null, // intensidad horaria (num) o null
  _displayName: getCourseDisplayName(courses, courseRow), // fallback de title
});

// Emite o recupera el certificado de curso de un estudiante (idempotente por
// user_id+course_id). El contenido queda "congelado" al emitir: si el tutor
// edita el certificado después, los ya emitidos no cambian retroactivamente.
const issueCourseCertificate = async (courseId, studentName, certConfig) => {
  const { user } = XS.get();
  if (!user?.id || !courseId) return null;

  const { data: existing } = await supabase
    .from('certificates')
    .select('cert_uuid, issued_at')
    .eq('user_id', user.id).eq('course_id', courseId)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('certificates')
    .insert({
      user_id: user.id, course_id: courseId, student_name: studentName,
      course_title: certConfig.title || certConfig._displayName || null,
      achievement_text: certConfig.achievementText || DEFAULT_CERT_ACHIEVEMENT_TEXT,
      signatory_name: certConfig.signatoryName || null,
      signatory_role: certConfig.signatoryRole || null,
      hours: certConfig.hours == null ? null : Number(certConfig.hours),
    })
    .select('cert_uuid, issued_at')
    .single();
  if (error) { console.error('issueCourseCertificate:', error); return null; }
  return data;
};

// Si el estudiante acaba de completar el 100% de su ruta y el curso tiene el
// certificado habilitado, lo emite (no-op si ya existe o si aún falta algo).
// `courseModules`/`done` deben ser los del curso EFECTIVO (fork si aplica),
// que es lo que ya trae el estado tras completar un módulo.
const maybeIssueCourseCertificate = (s, done) => {
  const courseId = s.effectiveCourseId || s.enrolledCourseId;
  if (!courseId || !s.user) return;
  const courseRow = (s.courses || []).find(c => c.id === courseId);
  if (!courseRow?.certificate_enabled) return;
  if (!isRouteComplete(done, s.selectedArea, s.courseModules)) return;
  const certConfig = getCourseCertConfig(s.courses, courseRow);
  issueCourseCertificate(courseId, s.user.name, certConfig);
};

// Devuelve el tema visual del curso en el que está inscrito el estudiante ('detective' | null).
// Versión imperativa del selector selectActiveCourseTheme (misma lógica, fuera de React).
const getActiveCourseTheme = () => selectActiveCourseTheme(XS.get());

// Dispara una reacción contextual del personaje del tema activo (si hay tema).
// El contexto debe ser uno de CHARACTER_CONTEXTS: 'correct' | 'wrong' |
// 'moduleComplete' | 'lessonIntro' | 'routeComplete' | 'idle'.
// CharacterFloat escucha `charReaction` y muestra la frase correspondiente.
const reactCharacter = (context, line) => {
  if (!getActiveCourseTheme()) return;
  XS.set({ charReaction: { context, line: line || null, ts: Date.now() } });
};

export {
  useStore, AREAS, BADGES, LEVELS, RUBRIC_CRITERIA, ALL_MODULES, AREA_CONTENT,
  INITIAL_INSTITUTIONS,
  getStudentModules, getTransversalModules, getAreaOnlyModules, getScopeModules, TRANSVERSAL_AREA, findModule,
  calcLevel, xpForNext, xpProgress, nodeStatus, isBlockedByPresence, progressPct, isRouteComplete, gradeTotal, gradeMax,
  nav, doLogout, selectArea, changeArea, completeNode, recordAttempt,
  redeemPresenceCode, generatePresenceCode,
  recordQuizAttempt, recordQuizAttemptAnswers, resetQuizAttempts, loadStudentQuizAttempts,
  fetchAnalyticsModules, fetchItemAnalysis, fetchRawAnswers,
  loadCourseRoster, saveCourseRoster, loadClosingRecord, saveClosingRecord, loadFinalClosingRecord,
  // Modo clon (piloto temporal, 0051)
  isCloneUser, selectIsClone, selectIsCloneStudent, selectIsCloneTutor, CLONE_PAGES,
  setAccountUiVariant, loadCloneGroups, saveCloneGroup, deleteCloneGroup,
  loadCloneGroupStudents, saveCloneGroupStudents,
  loadCloneAttendance, saveCloneAttendance,
  loadCloneEffectiveness, saveCloneEffectiveness, deleteCloneEffectiveness,
  loadCloneUnitPlan, saveCloneUnitPlan,
  submitProduct, resubmitProduct, gradeSubmission, returnSubmission, updateReturnCorrection, approveSubmission,
  dismissNotif, dismissStudentMessage, updateAvatar, resetStudentProgress,
  saveAvatarConfig, selectAvatarConfig, selectHasThemedCourse, selectThemedCourses,
  loadRouteConfigs, saveRouteConfig, getRouteModules, findModuleInConfig, routeKey,
  loadInstructorInstitutions, assignInstructorInstitution, removeInstructorInstitution,
  assignRouteToInstitution,
  createAccount, deleteAccount, changeAccountArea, changeAccountInstitution, setAccountActive,
  bulkCreateAccounts, createInstitution, updateInstitution, deleteInstitution, setInstitutionActive,
  getAccessBlockReason,
  loadCourses, createCourse, updateCourse, deleteCourse, toggleCourseForInstitution, setInstitutionCourseExpiry,
  loadUserCourses, setUserCourseAccess, setUserCourseAccessBulk, allowedCourseIds,
  loadCourseModules, enrollInCourse, dbModToAppMod, publishRouteToCourse, switchCourse,
  forkCourseForInstitution, loadCourseForEditing, loadModulesForImport, saveCourseModules, resolveCourseForStudent,
  saveCourseDraft, discardCourseDraft, publishCourseModules,
  applyInitialHash, markOnboarded, claimOnboardingBonus, awardForumParticipation,
  hashFor, issueCertificate, getActiveCourseTheme, reactCharacter,
  setPreviewMode,
  loadWorkshopAccess, isWorkshopEnabled, setWorkshopAccess, setWorkshopAccessBulk,
  dbRowsToCourseModules, isBaseCourse, selectActiveCourseTheme, selectRequiresLiveToStart, loadSessionCatalogs,
  getCourseCertConfig, getCourseDisplayName, issueCourseCertificate,
};
