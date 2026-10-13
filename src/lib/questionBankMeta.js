// =============================================
// EXPERIA — Banco de preguntas de las rondas en vivo (módulos 4 y 6)
// Lo liviano vive aquí (se importa desde el mapa, el editor y la clase en
// vivo); el banco completo (~200 KB, `questionBank.json`) va en su propio
// chunk y solo se descarga al abrir el editor de una ronda.
//
// Una "ronda" es un módulo de la ruta que por dentro es un reto `quiz`
// (así la Clase en Vivo lo sincroniza pregunta a pregunta, tipo Kahoot),
// pero que para el estudiante sigue siendo un MÓDULO más: el mapa y el
// editor lo rotulan como módulo, no como "reto". Lo marca `challenge_data.bank`.
// =============================================

export const BANK_AREAS = {
  matematicas: { label: 'Matemáticas',     icon: '🔢' },
  lectura:     { label: 'Lectura crítica', icon: '📖' },
  biologia:    { label: 'Biología',        icon: '🧬' },
  quimica:     { label: 'Química',         icon: '⚗️' },
  fisica:      { label: 'Física',          icon: '🧲' },
  sociales:    { label: 'Ciencias Sociales', icon: '🌎' },
}

export const ROUND_LABELS = { 1: 'Primera ronda', 2: 'Ronda final' }

export const DIFFICULTY = {
  facil:   { label: 'Fácil',   bg: '#DCFCE7', fg: '#15803D' },
  media:   { label: 'Media',   bg: '#FEF3C7', fg: '#B45309' },
  dificil: { label: 'Difícil', bg: '#FEE2E2', fg: '#B91C1C' },
}

// ¿Es una ronda de preguntas del banco? (módulo quiz con banco asignado)
export const isQuestionRound = (mod) =>
  !!mod && mod.type === 'challenge' && (mod.ctype || mod.challenge_type) === 'quiz'
  && !!(mod.bank || mod.challenge_data?.bank)

// Tipo con el que se ROTULA el módulo en el mapa y en el editor: una ronda se
// presenta como módulo aunque por dentro sea un quiz.
export const displayType = (mod) => (isQuestionRound(mod) ? 'lesson' : mod?.type)

let bankPromise = null
export const loadQuestionBank = () => {
  if (!bankPromise) bankPromise = import('./questionBank.json').then(m => m.default || m)
  return bankPromise
}

// Pregunta del banco → pregunta del módulo. El texto de lectura (si lo hay)
// viaja COPIADO dentro de la pregunta: el snapshot de la clase en vivo
// (`_snapshot_module_questions`, 0075) solo ve lo que trae cada pregunta.
export const bankToModuleQuestion = (q, bank) => {
  const out = {
    id: q.id, question: q.question, options: [...q.options], correct: q.correct,
    hint: q.hint, difficulty: q.difficulty, timeLimit: q.timeLimit,
  }
  if (q.image) out.image = q.image
  if (q.optionImages) out.optionImages = [...q.optionImages]
  if (q.explanation) out.explanation = q.explanation
  if (q.passageId && bank?.passages?.[q.passageId]) out.passage = bank.passages[q.passageId]
  return out
}
