// ── Recomendaciones y tareas del informe final — MODO CLON (piloto, §13) ────
// Cruza cada pregunta de la tabla de efectividad con la rejilla académica
// (`rejillaTareas.json`, generada del Excel "Tareas y recomendaciones" por
// `scripts/build-rejilla.mjs`) y la reparte en dos módulos del informe:
//
//   · RECOMENDACIONES → preguntas cuyo P.E.P. quedó POR DEBAJO de la
//     efectividad de la sesión. Es lo que el docente debe reforzar.
//   · TAREAS          → preguntas cuyo P.E.P. quedó por ENCIMA (o igual). Es
//     lo que el grupo ya domina y puede llevarse como trabajo autónomo.
//
// ⚠️ El umbral es la EFECTIVIDAD DE LA SESIÓN (`sessionEffectiveness`), no la
// del momento: el informe es de la sesión completa y las dos listas tienen que
// medirse contra la misma vara. Un empate exacto cuenta como tarea — está en el
// nivel del grupo, no por debajo.
//
// ⚠️ Funciones PURAS, igual que `effectiveness.js`: no importan React ni
// Supabase y no calculan efectividad (eso ya lo hizo `effectiveness.js`; aquí
// solo se leen sus resultados).

import { SECTIONS } from './effectiveness.js'

// Una rejilla por materia (~60–75 KB cada una), cada una en su propio chunk:
// se carga aparte y solo cuando el docente abre la tabla de efectividad. Se
// cachea la promesa por materia: la página puede pedirla varias veces (cambio
// de grupo, de registro) sin volver a bajar el chunk.
const REJILLAS = {
  quimica:  () => import('./rejillaTareas.json'),
  sociales: () => import('./rejillaSociales.json'),
}
const _rejillas = {}
export const loadRejilla = (materia = 'quimica') => {
  const load = REJILLAS[materia]
  if (!load) return Promise.resolve(null)
  if (!_rejillas[materia]) {
    _rejillas[materia] = load()
      .then(m => m.default || m)
      .catch(e => { delete _rejillas[materia]; throw e })
  }
  return _rejillas[materia]
}

// Número de unidad a partir del nombre que el tutor le puso en su plan
// ("UNIDAD 3", "Unidad 3. Estequiometría", "3. Gases"…). Se cruza por NÚMERO y
// no por texto porque el título del plan es libre y casi nunca coincide letra a
// letra con el de la rejilla. Si el tutor no numeró la unidad, se cae a su
// POSICIÓN en el plan (`fallback`, 1-based): el orden del array ES el orden de
// trabajo del libro (§13), así que la unidad n-ésima del plan es la unidad n.
export function unidadDe(unitLabel, fallback = null) {
  const m = String(unitLabel || '').match(/\d+/)
  const n = m ? parseInt(m[0], 10) : null
  return Number.isFinite(n) && n > 0 ? n : (fallback || null)
}

// ⚠️ Cada grupo usa la rejilla de SU materia: cruzar un grupo de Sociales con
// la de Química le imprimía componentes y textos de Química. `clone_groups` no
// tiene columna de materia, así que se lee del NOMBRE del grupo ("Décimo A -
// Sociales - ZCS"). Sin materia en el nombre ("ONCE", "Décimo A - JM") se
// asume Química, que es como nació el piloto. Una materia sin rejilla cargada
// (Matemáticas, Lectura…) devuelve null: el informe lista las preguntas igual,
// sin textos.
export function materiaDeGrupo(groupName) {
  const s = String(groupName || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (/quimica/.test(s)) return 'quimica'
  if (/sociales|ciudadan/.test(s)) return 'sociales'
  if (/matem|lectura|lenguaje|ingles|biolog|fisica|filosof|historia|geograf/.test(s)) return null
  return 'quimica'
}

// Filas de la rejilla de una unidad, indexadas por `momento|n` para el cruce.
function indexar(rejilla, unidad) {
  const map = new Map()
  if (!rejilla || !unidad) return map
  ;(rejilla.filas || []).forEach(f => {
    if (f.u !== unidad) return
    map.set(`${f.s}|${f.n}`, {
      eje: rejilla.ejes?.[f.e] || '',
      componente: rejilla.componentes?.[f.m] || '',
      categoria: f.c || '',
      dificultad: f.d || '',
      recomendacion: rejilla.recomendaciones?.[f.r] || '',
      tarea: f.t || '',
    })
  })
  return map
}

// Arma los dos módulos del informe final.
//   rejilla  — lo que devuelve loadRejilla() (o null si aún no cargó / falló)
//   result   — lo que devuelve sessionEffectiveness(sections)
//   unidad   — número de unidad (unidadDe)
//
// Devuelve siempre las dos listas; `sinFicha` cuenta las preguntas que la
// rejilla no tiene (p. ej. el docente agregó una pregunta 16 donde la rejilla
// llega a 15). Esas preguntas SÍ salen en su lista, con la ficha vacía: son
// parte del desempeño de la sesión aunque no tengan texto académico asociado.
export function buildRecomendacionesYTareas(rejilla, result, unidad) {
  const umbral = result?.efectividadSesion ?? null
  const fichas = indexar(rejilla, unidad)

  const recomendaciones = []
  const tareas = []
  let sinFicha = 0

  SECTIONS.forEach(({ key, label }) => {
    const sec = result?.[key]
    if (!sec?.tieneDatos) return
    sec.rows.forEach(({ q, st }) => {
      if (q.aplicada === false || st.pep == null) return
      const ficha = fichas.get(`${key}|${q.n}`) || null
      if (!ficha) sinFicha++
      const item = {
        momento: key,
        momentoLabel: label,
        n: q.n,
        pep: st.pep,
        valor: st.valor,
        aciertos: st.aciertos,
        total: sec.total,
        eje: ficha?.eje || '',
        componente: ficha?.componente || '',
        categoria: ficha?.categoria || '',
        dificultad: ficha?.dificultad || '',
        texto: '',
      }
      if (umbral != null && st.pep < umbral) {
        recomendaciones.push({ ...item, texto: ficha?.recomendacion || '' })
      } else {
        tareas.push({ ...item, texto: ficha?.tarea || '' })
      }
    })
  })

  // Dentro de cada módulo: primero lo más urgente / lo más consolidado. En
  // recomendaciones sube lo de menor P.E.P.; en tareas, lo de mayor.
  recomendaciones.sort((a, b) => a.pep - b.pep)
  tareas.sort((a, b) => b.pep - a.pep)

  return {
    unidad,
    umbral,
    recomendaciones,
    tareas,
    sinFicha,
    // Sin unidad no hay con qué cruzar: la UI avisa que falta elegirla en vez
    // de imprimir dos listas de textos vacíos.
    hayRejilla: fichas.size > 0,
  }
}
