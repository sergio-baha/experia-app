// =============================================================================
// EXPERIA — Guion estándar de sesión para Aula en Vivo (cursos temáticos)
// -----------------------------------------------------------------------------
// Rundown fijo de 2h10 (7 bloques) que TODOS los tutores de las 4 rutas
// inmersivas siguen en el mismo orden y con los mismos tiempos. Lo único que
// cambia por tema es el nombre con el que se anuncia cada bloque y la frase
// de apertura — coherente con la historia que el estudiante ya conoce por
// characters.jsx. Un curso sin tema (courses.theme null) simplemente no
// muestra este guion.
// =============================================================================

export const RUNDOWN_TOTAL_MIN = 130 // 2h10

// Bloques compartidos: duración, ventana de reloj acumulada, tipo pedagógico
// y contenido genérico (igual para las 4 rutas). `pending` marca bloques que
// dependen de bancos de actividades/preguntas aún no cargados a la plataforma.
export const RUNDOWN_BLOCKS = [
  {
    id: 'A', minutes: 10, start: '00:00', end: '00:10', kind: 'Activación',
    pending: 'Banco de actividades rompehielo',
    generic: 'Actividad rompehielo — cognitiva o física, a elección del tutor.',
    notes: [
      'Elige la dinámica según la energía con la que llega el grupo: cognitiva si necesitan enfocarse, física si llegan dispersos.',
      'Debe ser corta y de instrucciones simples: el grupo apenas está entrando.',
    ],
  },
  {
    id: 'B', minutes: 15, start: '00:10', end: '00:25', kind: 'Encuadre',
    pending: 'Documento estandarizado por asignatura',
    generic: 'Explicación de la estructura de la Prueba Saber — contenido estandarizado por asignatura.',
    notes: [
      'Se apoya en el material único del área, distribuido aparte de este guion.',
      'Objetivo del bloque: que el grupo reconozca secciones, tipos de pregunta y forma de puntuar antes de practicar.',
    ],
  },
  {
    id: 'C', minutes: 10, start: '00:25', end: '00:35', kind: 'Diagnóstico',
    pending: null,
    generic: 'Lectura y análisis de resultados previos — institucionales, de simulacro o de la Prueba Saber del año anterior.',
    notes: [
      'Lleva datos reales del grupo o la institución: movilizan más que un ejemplo genérico.',
      'Cierra el bloque con una pregunta abierta al grupo sobre lo que esos resultados dicen de ellos.',
    ],
  },
  {
    id: 'D', minutes: 35, start: '00:35', end: '01:10', kind: 'Práctica',
    pending: 'Banco de preguntas',
    generic: 'Preguntas de nivel medio-alto con retroalimentación inmediata — sugerido 10 a 12 preguntas del banco.',
    notes: [
      'Retroalimenta cada pregunta o cada bloque corto: no acumules toda la retro para el final.',
      'Ritmo sugerido: cerca de 3 minutos por pregunta, entre responder y retroalimentar.',
    ],
  },
  {
    id: 'E', minutes: 10, start: '01:10', end: '01:20', kind: 'Activación',
    pending: 'Banco de actividades (solo físicas)',
    generic: 'Actividad de reactivación — del banco, trae únicamente las que impliquen movimiento.',
    notes: [
      'A esta altura la atención decae: prioriza movimiento real, no otro ejercicio de escritorio.',
      'Sirve de puente antes del bloque más largo y exigente de la sesión.',
    ],
  },
  {
    id: 'F', minutes: 40, start: '01:20', end: '02:00', kind: 'Práctica',
    pending: 'Banco de preguntas',
    generic: 'Preguntas de nivel alto con retroalimentación — sugerido 8 a 12 preguntas del banco.',
    notes: [
      'Es el bloque más largo de toda la sesión: resérvalo para cuando el grupo ya calentó motores en el bloque anterior.',
      'Misma retroalimentación inmediata que en la ronda anterior.',
    ],
  },
  {
    id: 'G', minutes: 10, start: '02:00', end: '02:10', kind: 'Cierre',
    pending: null,
    generic: 'Cierre reflexivo — sin guion fijo, lo gestiona cada tutor.',
    notes: [
      'Ajusta el enfoque según lo que observaste en el grupo durante la sesión: no hay una fórmula única.',
      'Es un buen momento para nombrar avances puntuales de estudiantes concretos.',
    ],
  },
]

// Título y frase de apertura por bloque, por tema. El tutor (nombre + color)
// se lee de CHARACTERS_BY_THEME (characters.jsx) — no se duplica aquí.
export const RUNDOWN_TRACKS = {
  lab: {
    titles: {
      A: 'Encender el laboratorio', B: 'Protocolo del experimento', C: 'Bitácora de resultados anteriores',
      D: 'Primera ronda de hipótesis', E: 'Pausa activa en el laboratorio', F: 'El experimento a fondo',
      G: 'Conclusiones de la bitácora',
    },
    cues: {
      A: 'Encendamos el laboratorio.',
      B: 'Antes de experimentar, el protocolo del experimento.',
      C: 'Revisemos la bitácora de resultados anteriores.',
      D: 'Primera ronda de hipótesis: midan antes de concluir.',
      E: 'Pausa activa en el laboratorio.',
      F: 'El experimento a fondo. Aquí se prueba todo lo aprendido.',
      G: 'Cerremos la bitácora de hoy.',
    },
  },
  detective: {
    titles: {
      A: 'Apertura del expediente', B: 'El manual del detective', C: 'Casos anteriores',
      D: 'Primera ronda de pistas', E: 'Estirar las piernas', F: 'El gran interrogatorio', G: 'Cierre del caso',
    },
    cues: {
      A: 'Abran el expediente: hoy cada palabra es una pista.',
      B: 'Antes de investigar, aprendamos cómo se arma un caso.',
      C: 'Revisemos los casos que ya investigamos antes de este.',
      D: 'Primera ronda de pistas. Lean con cuidado antes de acusar.',
      E: 'Un detective también estira las piernas antes del interrogatorio.',
      F: 'El gran interrogatorio. Aquí se resuelve el caso.',
      G: 'Cerramos el expediente de hoy.',
    },
  },
  'escape-room': {
    titles: {
      A: 'Encender la sala', B: 'Las reglas del escape', C: 'Bitácora de intentos anteriores',
      D: 'Primera ronda de candados', E: 'Recarga de energía', F: 'Los candados finales', G: '¿Logramos escapar?',
    },
    cues: {
      A: 'Encendamos la sala: el reloj ya empezó a correr.',
      B: 'Antes de los candados, las reglas del escape.',
      C: 'Revisemos la bitácora de intentos anteriores.',
      D: 'Primera ronda de candados. Calculen, no adivinen.',
      E: 'Pausa para recargar energía antes de la sala final.',
      F: 'Los candados finales. La sala más difícil de todas.',
      G: '¿Logramos escapar hoy? Cerremos la sesión.',
    },
  },
  'time-travel': {
    titles: {
      A: 'Activar el portal', B: 'Las reglas del viaje', C: 'La línea de tiempo hasta hoy',
      D: 'Primera época: preguntas', E: 'Recarga temporal', F: 'La época decisiva', G: 'Bitácora del viajero',
    },
    cues: {
      A: 'Activemos el portal.',
      B: 'Antes de viajar, las reglas del viaje en el tiempo.',
      C: 'Revisemos la línea de tiempo hasta hoy.',
      D: 'Primera época: preguntas de nivel medio-alto.',
      E: 'Recarguemos energía temporal antes de la época final.',
      F: 'La época decisiva. Aquí se juega todo.',
      G: 'Cerremos la bitácora del viajero.',
    },
  },
}
