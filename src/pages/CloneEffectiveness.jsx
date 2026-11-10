import React from 'react'
import {
  useStore, loadCloneAttendance, loadCloneEffectiveness, saveCloneEffectiveness,
  deleteCloneEffectiveness, loadCloneUnitPlan,
} from '../store/store.jsx'
import { useMobile, Btn, Skeleton, TrashIc, PlusIc } from '../components/ui.jsx'
import {
  hoy, fmtFecha, inp, lbl, card, useMyCloneGroups, GroupPicker, SinGrupo,
  CloneHead, PRINT_CSS, readSheet, nrmKey, fmtPct1,
  BRAND, PrintDocHeader, PrintSection, PrintDocFooter,
} from '../components/cloneShared.jsx'
import {
  LETTERS, SECTIONS, emptyQuestion, emptySection, sectionStats, sessionEffectiveness,
  buildSummary, normalizeSections, fmtPct, colorEfectividad,
} from '../lib/effectiveness.js'
import {
  loadRejilla, unidadDe, buildRecomendacionesYTareas, materiaDeGrupo,
} from '../lib/tareasRecomendaciones.js'

// ── Tabla de efectividad — MODO CLON (piloto temporal, 0051) ────────────────
// El docente registra, por cada momento de la clase ("Exploro mis competencias"
// y "Desarrollo mis competencias"), cuántos de sus alumnos marcaron cada opción
// de cada pregunta. La plataforma calcula P.E.P., VALOR y la efectividad del
// grupo, y promedia ambos momentos para la efectividad de la sesión.
//
// ⚠️ TODO el cálculo vive en src/lib/effectiveness.js (funciones puras). Esta
// página solo captura y pinta: no reimplementar fórmulas aquí. Lo que se guarda
// en `summary` se recomputa con buildSummary() en cada guardado.
//
// Dos formas de captura, según pidió el piloto: el formulario de abajo, o
// importar el Excel que los docentes ya vienen usando.

const EMPTY = () => ({ exploro: emptySection(5), desarrollo: emptySection(5) })

// ── Resumen de una sección ─────────────────────────────────────────────────
const SectionSummary = ({ label, st }) => (
  <div style={{ ...card, padding: '12px 16px', flex: 1, minWidth: 180 }}>
    <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .8,
      color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
    {!st.tieneDatos ? (
      <div style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>No aplicado</div>
    ) : (
      <>
        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, color: colorEfectividad(st.efectividadGrupo) }}>
          {fmtPct(st.efectividadGrupo)}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
          Efectividad de grupo · {st.aplicadas} pregunta{st.aplicadas !== 1 ? 's' : ''} · {st.total} estudiantes
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-sec)', marginTop: 2 }}>
          Efectividad máxima por estudiante: <strong>{st.efectividadMaxima}</strong>
        </div>
        {st.inconsistencias > 0 && (
          <div style={{ fontSize: 11.5, color: 'var(--error)', marginTop: 5, fontWeight: 600 }}>
            ⚠️ {st.inconsistencias} pregunta{st.inconsistencias !== 1 ? 's' : ''} con conteos que no suman el total
          </div>
        )}
      </>
    )}
  </div>
)

// ── Un módulo del informe final (recomendaciones o tareas) ─────────────────
// Las dos listas se pintan igual y salen impresas: cambian el título, el color
// del filo y de dónde salió el texto (rejilla académica, `tareasRecomendaciones`).
const ModuloFichas = ({ items, color, tint, vacio }) => (
  items.length === 0 ? (
    <p style={{ fontSize: 11.5, color: '#888', fontStyle: 'italic', margin: 0 }}>{vacio}</p>
  ) : items.map((it, i) => (
    <div key={i} style={{ border: `1px solid ${BRAND.line}`, borderLeft: `3px solid ${color}`,
      borderRadius: '0 8px 8px 0', padding: '10px 12px', marginBottom: 8, pageBreakInside: 'avoid' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, fontWeight: 900, color: BRAND.dark }}>
          {it.momentoLabel} · Pregunta {it.n}
        </span>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#fff', background: color,
          padding: '2px 8px', borderRadius: 20 }}>
          P.E.P. {it.pep.toFixed(1)}%
        </span>
        <span style={{ fontSize: 10.5, color: BRAND.gray }}>
          {it.aciertos} de {it.total} acertaron · VALOR {it.valor}
        </span>
      </div>

      {(it.categoria || it.dificultad) && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
          {[it.categoria, it.dificultad].filter(Boolean).map((t, j) => (
            <span key={j} style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: .5, color, background: tint, padding: '2px 7px', borderRadius: 4 }}>{t}</span>
          ))}
        </div>
      )}

      {/* Solo el componente: el eje articulador de la rejilla se quitó del
          informe (sigue disponible en `it.eje` si hiciera falta volver). */}
      {it.componente && (
        <div style={{ fontSize: 11, color: BRAND.gray, marginBottom: 5, lineHeight: 1.45 }}>
          <strong style={{ color: BRAND.purple }}>Componente:</strong> {it.componente}
        </div>
      )}

      {it.texto ? (
        <p style={{ fontSize: 11.5, color: BRAND.dark, margin: 0, lineHeight: 1.6 }}>{it.texto}</p>
      ) : (
        // La rejilla no cubre esta pregunta (p. ej. el docente agregó una más
        // de las que trae el libro). Se lista igual: hace parte del desempeño.
        <p style={{ fontSize: 11, color: '#888', margin: 0, fontStyle: 'italic' }}>
          La rejilla del libro no tiene texto para esta pregunta de la unidad.
        </p>
      )}
    </div>
  ))
)

const CloneEffectivenessPage = () => {
  const user     = useStore(s => s.user)
  const isMobile = useMobile()
  const { groups, group, groupId, setGroupId, loading: loadingGroups, error: groupsError } = useMyCloneGroups()

  const [loading, setLoading] = React.useState(true)
  const [tablas, setTablas]   = React.useState([])
  const [actas, setActas]     = React.useState([])
  const [record, setRecord]   = React.useState(null)

  const [sessionDate, setSessionDate] = React.useState(hoy())
  const [title, setTitle]     = React.useState('')
  // Unidad del libro sobre la que se aplicó la sesión. Las opciones salen del
  // plan que cargó el tutor (0052). Se guardan el TEXTO y una COPIA de los datos
  // de la unidad (ejes, notas, puntajes), nunca un índice (0054).
  const [unitLabel, setUnitLabel] = React.useState('')
  const [unitData, setUnitData]   = React.useState(null)
  const [planUnits, setPlanUnits] = React.useState([])
  const [sections, setSections] = React.useState(EMPTY)
  const [tab, setTab]         = React.useState('exploro')
  const [saving, setSaving]   = React.useState('')
  const [msg, setMsg]         = React.useState('')
  const fileRef = React.useRef(null)

  // Rejilla académica del informe final (recomendaciones y tareas por pregunta).
  // Va aparte del bundle (~60 KB) y su ausencia no rompe nada: sin ella el
  // informe imprime la asistencia y la tabla, y avisa que faltan los textos.
  // La rejilla depende de la materia del grupo (se lee de su nombre).
  const materia = materiaDeGrupo(group?.name)
  const [rejilla, setRejilla] = React.useState(null)
  React.useEffect(() => {
    let alive = true
    setRejilla(null)
    loadRejilla(materia)
      .then(r => { if (alive) setRejilla(r) })
      .catch(e => console.error('loadRejilla:', e))
    return () => { alive = false }
  }, [materia])

  React.useEffect(() => {
    let alive = true
    if (!groupId) { setLoading(false); return }
    setLoading(true)
    ;(async () => {
      const [{ rows }, { rows: acts }, { plan }] = await Promise.all([
        loadCloneEffectiveness(groupId),
        loadCloneAttendance(groupId),
        loadCloneUnitPlan(groupId),
      ])
      if (!alive) return
      setTablas(rows); setActas(acts)
      setPlanUnits((plan?.units || []).filter(u => u?.title))
      abrirNueva(); setLoading(false)
    })()
    return () => { alive = false }
  }, [groupId])

  const abrirNueva = () => {
    setRecord(null); setSessionDate(hoy()); setTitle('')
    setUnitLabel(''); setUnitData(null)
    setSections(EMPTY()); setTab('exploro'); setMsg('')
  }

  const abrirTabla = (t) => {
    setRecord(t)
    setSessionDate(t.session_date || hoy())
    setTitle(t.title || '')
    setUnitLabel(t.unit_label || '')
    // Se prefiere el snapshot guardado. El fallback al plan actual es solo para
    // las tablas registradas antes de que existiera la columna.
    setUnitData(t.unit?.title ? t.unit
      : (planUnits.find(u => u.title === t.unit_label) || null))
    setSections(normalizeSections(t.sections))
    setTab('exploro'); setMsg('')
  }

  const isFinal = record?.status === 'final'
  const canEdit = !isFinal

  // ── Cálculo (única fuente: lib/effectiveness.js) ─────────────────────────
  const result = React.useMemo(() => sessionEffectiveness(sections), [sections])
  const current = React.useMemo(() => sectionStats(sections[tab]), [sections, tab])

  // ── Informe final: recomendaciones y tareas ──────────────────────────────
  // El cruce con la rejilla del libro va por NÚMERO de unidad. Si el tutor no
  // numeró el título, se usa la posición de la unidad en su plan (§13: el orden
  // del array ES el orden de trabajo).
  const unidad = React.useMemo(() => {
    const i = planUnits.findIndex(u => u.title === unitLabel)
    return unidadDe(unitLabel, i >= 0 ? i + 1 : null)
  }, [unitLabel, planUnits])

  const informe = React.useMemo(
    () => buildRecomendacionesYTareas(rejilla, result, unidad),
    [rejilla, result, unidad])

  // ── Edición ──────────────────────────────────────────────────────────────
  const patchSection = (key, patch) =>
    setSections(s => ({ ...s, [key]: { ...s[key], ...patch } }))

  const setTotal = (key, v) =>
    patchSection(key, { total_estudiantes: Math.max(0, parseInt(v, 10) || 0) })

  const setQ = (key, i, field, v) => setSections(s => ({
    ...s,
    [key]: {
      ...s[key],
      questions: s[key].questions.map((q, j) => j !== i ? q : {
        ...q,
        [field]: field === 'correcta' ? String(v).toUpperCase()
               : field === 'aplicada' ? !!v
               : Math.max(0, parseInt(v, 10) || 0),
      }),
    },
  }))

  const addQ = (key) => setSections(s => ({
    ...s,
    [key]: { ...s[key], questions: [...s[key].questions, emptyQuestion(s[key].questions.length + 1)] },
  }))

  const removeQ = (key, i) => setSections(s => ({
    ...s,
    [key]: { ...s[key], questions: s[key].questions.filter((_, j) => j !== i).map((q, j) => ({ ...q, n: j + 1 })) },
  }))

  // Atajo útil: el total de la sección suele ser justo quienes asistieron.
  const ultimaActa = actas[0] || null
  const presentesUltimaActa = (ultimaActa?.entries || []).filter(e => e.present).length
  const usarAsistencia = (key) => setTotal(key, presentesUltimaActa)

  // Acta de asistencia que acompaña al informe. Manda la que quedó vinculada al
  // guardar (`attendance_id`); si no hay, la del mismo día; y como último
  // recurso la más reciente — el informe siempre imprime la fecha del acta, así
  // que nunca se confunde con la de la sesión.
  const acta = React.useMemo(() => {
    if (!actas.length) return null
    return actas.find(a => a.id === record?.attendance_id)
        || actas.find(a => a.session_date === sessionDate)
        || ultimaActa
  }, [actas, record, sessionDate, ultimaActa])

  const actaEntries  = acta?.entries || []
  const actaPresentes = actaEntries.filter(e => e.present).length

  // ── Importar / plantilla ─────────────────────────────────────────────────
  // Columnas: Momento | Pregunta | Correcta | A | B | C | D | Total estudiantes | Aplicada
  // Sin la columna Momento, todas las filas entran al momento que esté abierto.
  const importar = async (file) => {
    setMsg('')
    try {
      const rows = await readSheet(file)
      const next = { exploro: emptySection(0), desarrollo: emptySection(0) }
      let leidas = 0
      rows.forEach(r => {
        const momentoRaw = nrmKey(r['momento'] || r['seccion'] || r['cuestionario'] || '')
        const key = momentoRaw.startsWith('desarrollo') ? 'desarrollo'
                  : momentoRaw.startsWith('exploro')    ? 'exploro'
                  : tab
        const correcta = (r['correcta'] || r['respuesta correcta'] || r['clave'] || '')
          .toString().trim().toUpperCase()
        const tieneConteos = ['a', 'b', 'c', 'd'].some(l => r[l] !== '' && r[l] != null)
        if (!correcta && !tieneConteos) return
        const totalFila = parseInt(r['total estudiantes'] || r['total'] || r['estudiantes'], 10)
        if (Number.isFinite(totalFila) && totalFila > 0 && !next[key].total_estudiantes) {
          next[key].total_estudiantes = totalFila
        }
        const aplicadaRaw = nrmKey(r['aplicada'] ?? r['se aplico'] ?? '')
        next[key].questions.push({
          n: parseInt(r['pregunta'] || r['n'] || r['#'], 10) || next[key].questions.length + 1,
          correcta,
          a: parseInt(r['a'], 10) || 0, b: parseInt(r['b'], 10) || 0,
          c: parseInt(r['c'], 10) || 0, d: parseInt(r['d'], 10) || 0,
          aplicada: !['no', 'n', 'false', '0'].includes(aplicadaRaw),
        })
        leidas++
      })
      if (!leidas) {
        setMsg('⚠️ No se encontró ninguna pregunta. Revisa que el archivo tenga las columnas Correcta y A, B, C, D.')
        return
      }
      // Los totales del archivo mandan; si no vinieron, se conserva lo capturado.
      setSections(s => normalizeSections({
        exploro: {
          total_estudiantes: next.exploro.total_estudiantes || s.exploro.total_estudiantes,
          questions: next.exploro.questions.length ? next.exploro.questions : s.exploro.questions,
        },
        desarrollo: {
          total_estudiantes: next.desarrollo.total_estudiantes || s.desarrollo.total_estudiantes,
          questions: next.desarrollo.questions.length ? next.desarrollo.questions : s.desarrollo.questions,
        },
      }))
      setMsg(`📄 ${leidas} pregunta${leidas !== 1 ? 's' : ''} leída${leidas !== 1 ? 's' : ''} del archivo — aún sin guardar`)
    } catch (e) {
      setMsg('⚠️ ' + (e.message || 'No se pudo leer el archivo'))
    }
  }

  const descargarPlantilla = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet([
      ['Momento', 'Pregunta', 'Correcta', 'A', 'B', 'C', 'D', 'Total estudiantes', 'Aplicada'],
      ['Exploro', 1, 'A', 15, 0, 0, 0, 15, 'Sí'],
      ['Exploro', 2, 'C', 13, 0, 2, 0, 15, 'Sí'],
      ['Desarrollo', 1, 'B', 2, 9, 3, 1, 15, 'Sí'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Efectividad')
    XLSX.writeFile(wb, 'plantilla_tabla_efectividad.xlsx')
  }

  const exportar = async () => {
    const XLSX = await import('xlsx')
    const aoa = []
    // Encabezado de contexto: sin esto, dos exportaciones del mismo grupo en
    // fechas distintas son indistinguibles al abrirlas.
    aoa.push(['Grupo', group?.name || ''], ['Fecha', sessionDate])
    if (unitLabel) aoa.push(['Unidad trabajada', unitLabel])
    if ((unitData?.ejes || []).length) aoa.push(['Ejes articuladores', unitData.ejes.join(', ')])
    if (unitData?.level) aoa.push(['Nivel de la unidad', unitData.level])
    if (title)     aoa.push(['Título / tema', title])
    aoa.push([])
    aoa.push(['Momento', 'Pregunta', 'Correcta', 'A', 'B', 'C', 'D', 'Suma', 'Válida',
      'Aciertos', 'P.E.P.', 'VALOR', 'Aplicada'])
    SECTIONS.forEach(({ key, label }) => {
      const st = sectionStats(sections[key])
      st.rows.forEach(({ q, st: r }) => {
        aoa.push([label, q.n, q.correcta, q.a, q.b, q.c, q.d, r.suma,
          r.esValida ? 'Sí' : 'NO', r.aciertos ?? '', r.pep == null ? '' : Number(r.pep.toFixed(2)),
          r.valor, q.aplicada === false ? 'No' : 'Sí'])
      })
      aoa.push([label, 'Efectividad de grupo', '', '', '', '', '', '', '', '',
        result[key].efectividadGrupo == null ? '' : Number(result[key].efectividadGrupo.toFixed(2)),
        result[key].efectividadMaxima, ''])
      aoa.push([])
    })
    aoa.push(['Efectividad de la sesión', '', '', '', '', '', '', '', '', '',
      result.efectividadSesion == null ? '' : Number(result.efectividadSesion.toFixed(2)), '', ''])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), 'Efectividad')

    // Asistencia y los dos módulos del informe final, cada uno en su hoja: el
    // Excel queda con lo mismo que el PDF.
    if (acta) {
      const asis = [
        ['Acta de asistencia', acta.session_date],
        ['Tema', acta.topic || ''], ['Lugar', acta.place || ''],
        ['Asistieron', actaPresentes], ['En el listado', actaEntries.length],
        [],
        ['#', 'Alumno', 'Documento', 'Asistió', 'Observación'],
        ...actaEntries.map((e, i) => [i + 1, e.name, e.document || '',
          e.present ? 'Sí' : 'No', e.comment || '']),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(asis), 'Asistencia')
    }

    const fichasAoa = (items, col) => [
      ['Momento', 'Pregunta', 'P.E.P.', 'Aciertos', 'Total', 'VALOR',
        'Componente', 'Categoría', 'Dificultad', col],
      ...items.map(it => [it.momentoLabel, it.n, Number(it.pep.toFixed(2)),
        it.aciertos, it.total, it.valor, it.componente, it.categoria,
        it.dificultad, it.texto]),
    ]
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.aoa_to_sheet(fichasAoa(informe.recomendaciones, 'Recomendación')), 'Recomendaciones')
    // El nombre de hoja no admite '?', así que va sin los signos; el
    // encabezado de la columna sí lleva el título completo.
    XLSX.utils.book_append_sheet(wb,
      XLSX.utils.aoa_to_sheet(fichasAoa(informe.tareas, '¿Qué evalúa?')), 'Qué evalúa')

    XLSX.writeFile(wb, `informe_final_${group?.name || 'grupo'}_${sessionDate}.xlsx`)
  }

  // ── Guardar ──────────────────────────────────────────────────────────────
  const persist = async (finalize) => {
    // Regla del spec: el informe necesita al menos uno de los dos cuestionarios.
    if (!result.reportable) {
      setMsg('⚠️ Registra al menos uno de los dos momentos (total de estudiantes y sus preguntas) antes de guardar.')
      return
    }
    if (finalize && result.inconsistencias > 0 && !window.confirm(
      `Hay ${result.inconsistencias} pregunta(s) cuyos conteos no suman el total de estudiantes. ` +
      'Suele ser un error de captura. ¿Cerrar la tabla de todas formas?')) return
    if (finalize && !window.confirm(
      'Al cerrar la tabla queda firmada y ya no podrás editarla. ¿Confirmas?')) return

    setSaving(finalize ? 'final' : 'draft'); setMsg('')
    const { record: saved, error } = await saveCloneEffectiveness({
      id: record?.id, groupId, sessionDate, title, unitLabel, unit: unitData,
      // La misma acta que sale en el informe (prioriza la del día de la sesión).
      attendanceId: acta?.id || null,
      sections,
      summary: buildSummary(sections),
    }, finalize)
    setSaving('')
    if (error) { setMsg('⚠️ ' + error); return }
    setRecord(saved)
    setTablas(prev => [saved, ...prev.filter(t => t.id !== saved.id)]
      .sort((a, b) => (b.session_date || '').localeCompare(a.session_date || '')))
    setMsg(finalize ? '✅ Tabla cerrada' : '💾 Borrador guardado')
  }

  const eliminar = async () => {
    if (!record?.id) return
    if (!window.confirm('¿Eliminar esta tabla de efectividad?')) return
    const { error } = await deleteCloneEffectiveness(record.id)
    if (error) { setMsg('⚠️ ' + error); return }
    setTablas(prev => prev.filter(t => t.id !== record.id))
    abrirNueva()
  }

  if (loadingGroups || loading) return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} h={48} />)}
    </div>
  )

  if (!groups.length) return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? 16 : 24 }}>
      <CloneHead title="Tabla de efectividad" />
      <SinGrupo error={groupsError} />
    </div>
  )

  const th = { fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase',
    letterSpacing: .7, textAlign: 'center', padding: '7px 4px', borderBottom: '1.5px solid var(--border)',
    whiteSpace: 'nowrap' }
  const cellInp = { ...inp, padding: '5px 6px', fontSize: 13, textAlign: 'center', width: 52 }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <style>{PRINT_CSS}</style>

      <CloneHead
        title="Tabla de efectividad"
        subtitle={group ? `${group.name}${group.grade ? ` · ${group.grade}` : ''}` : ''}>
        <GroupPicker groups={groups} groupId={groupId} setGroupId={setGroupId} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {record && <Btn variant="secondary" size="sm" onClick={abrirNueva}>+ Nueva</Btn>}
          <Btn variant="ghost" size="sm" onClick={exportar}>⬇ Exportar Excel</Btn>
          <Btn variant="gradient" size="sm" onClick={() => window.print()}>🖨️ Descargar informe final</Btn>
        </div>
      </CloneHead>

      {msg && (
        <p className="no-print" style={{ fontSize: 13, fontWeight: 600, marginBottom: 14,
          color: msg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)' }}>{msg}</p>
      )}

      {/* ── Tablas guardadas ── */}
      {tablas.length > 0 && (
        <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
          <span style={{ ...lbl, marginBottom: 0 }}>Registros</span>
          {tablas.map(t => {
            const activo = record?.id === t.id
            return (
              <button key={t.id} onClick={() => abrirTabla(t)}
                title={t.unit_label || t.title || ''}
                style={{ padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)',
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                  border: activo ? '1.5px solid var(--orange)' : '1.5px solid var(--border)',
                  background: activo ? 'var(--orange-bg)' : 'var(--white)',
                  color: activo ? 'var(--orange)' : 'var(--text-sec)' }}>
                {t.session_date} {t.status === 'final' ? '🔒' : '✏️'}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Datos de la sesión ── */}
      {canEdit && (
        <div className="no-print" style={{ display: 'grid', gap: 12, marginBottom: 18,
          gridTemplateColumns: isMobile ? '1fr' : '170px 1fr auto' }}>
          <div>
            <label style={lbl}>Fecha de la sesión</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Título / tema</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ej. Sesión 3 — Competencias ciudadanas" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>📤 Importar Excel</Btn>
            <Btn variant="ghost" size="sm" onClick={descargarPlantilla}>⬇ Plantilla</Btn>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = '' }} />
          </div>
        </div>
      )}

      {/* ── Unidad trabajada ── */}
      {/* Botones y no un <select>: son pocas unidades, el docente las reconoce
          por su nombre y así ve de una el plan completo mientras elige. Volver a
          pulsar la unidad activa la deselecciona (el campo es opcional). */}
      {canEdit && (
        <div className="no-print" style={{ marginBottom: 18 }}>
          <label style={lbl}>Unidad del libro trabajada</label>
          {planUnits.length > 0 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {planUnits.map((u, i) => {
                const active = unitLabel === u.title
                return (
                  <button key={i} type="button"
                    onClick={() => {
                      setUnitLabel(active ? '' : u.title)
                      setUnitData(active ? null : u)
                    }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                      padding: '7px 12px', borderRadius: 20, fontFamily: 'var(--font)', fontSize: 12.5,
                      fontWeight: 700, transition: 'all .15s',
                      background: active ? 'var(--orange)' : 'var(--white)',
                      color: active ? '#fff' : 'var(--text-sec)',
                      border: `1.5px solid ${active ? 'var(--orange)' : 'var(--border)'}` }}>
                    <span style={{ opacity: active ? .85 : .6, fontWeight: 900 }}>{i + 1}</span>
                    {u.title}
                  </button>
                )
              })}
            </div>
          ) : (
            // Sin plan cargado por el tutor, el docente igual puede escribirla:
            // el piloto no puede quedar bloqueado por algo que no depende de él.
            <>
              <input value={unitLabel} onChange={e => setUnitLabel(e.target.value)}
                placeholder="Ej. Unidad 3. Estequiometría y gases" style={inp} />
              <p style={{ fontSize: 11, color: 'var(--subtle)', margin: '5px 0 0' }}>
                Tu tutor aún no ha cargado el plan de unidades; escríbela a mano.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Resumen en vivo ── */}
      <div className="no-print" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <SectionSummary label="Exploro mis competencias" st={result.exploro} />
        <SectionSummary label="Desarrollo mis competencias" st={result.desarrollo} />
        <div style={{ ...card, padding: '12px 16px', flex: 1, minWidth: 180,
          background: 'var(--orange-bg)', borderColor: 'var(--orange-pale, var(--border))' }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: .8,
            color: 'var(--orange)', marginBottom: 6 }}>Efectividad de la sesión</div>
          <div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.1,
            color: colorEfectividad(result.efectividadSesion) }}>
            {fmtPct(result.efectividadSesion)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-sec)', marginTop: 4 }}>
            {result.seccionesAplicadas === 2 ? 'Promedio de los dos momentos'
              : result.seccionesAplicadas === 1 ? 'Un solo momento aplicado'
              : 'Registra al menos un momento'}
          </div>
        </div>
      </div>

      {/* ── Captura por momento ── */}
      {canEdit && (
        <>
          <div className="no-print" style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => setTab(s.key)}
                style={{ padding: '8px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)',
                  fontSize: 13, fontWeight: 700, border: 'none',
                  background: tab === s.key ? 'var(--orange)' : 'var(--bg-alt)',
                  color: tab === s.key ? '#fff' : 'var(--text-sec)' }}>
                {s.label}
              </button>
            ))}
          </div>

          <div className="no-print" style={{ ...card, padding: isMobile ? 14 : 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ width: 180 }}>
                <label style={lbl}>Total de estudiantes</label>
                <input type="number" min={0} value={sections[tab].total_estudiantes}
                  onChange={e => setTotal(tab, e.target.value)} style={inp} />
              </div>
              {presentesUltimaActa > 0 && (
                <Btn variant="ghost" size="sm" onClick={() => usarAsistencia(tab)}>
                  Usar los {presentesUltimaActa} que asistieron ({ultimaActa.session_date})
                </Btn>
              )}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                El total debe estar antes de calcular P.E.P. y VALOR
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 40 }}>#</th>
                    <th style={{ ...th, width: 80 }}>Correcta</th>
                    {LETTERS.map(l => <th key={l} style={{ ...th, width: 60 }}>{l}</th>)}
                    <th style={{ ...th, width: 70 }}>Suma</th>
                    <th style={{ ...th, width: 80 }}>Aciertos</th>
                    <th style={{ ...th, width: 80 }}>P.E.P.</th>
                    <th style={{ ...th, width: 70 }} title="Peso por dificultad: 3 = difícil, 1 = fácil">VALOR</th>
                    <th style={{ ...th, width: 80 }}>Aplicada</th>
                    <th style={{ ...th, width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {current.rows.map(({ q, st }, i) => {
                    const excluida = q.aplicada === false
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', opacity: excluida ? .45 : 1 }}>
                        <td style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', fontWeight: 700 }}>{q.n}</td>
                        <td style={{ textAlign: 'center', padding: '4px 2px' }}>
                          <select value={q.correcta} onChange={e => setQ(tab, i, 'correcta', e.target.value)}
                            style={{ ...cellInp, width: 62,
                              borderColor: LETTERS.includes(q.correcta) ? 'var(--border)' : 'var(--error)' }}>
                            {!LETTERS.includes(q.correcta) && <option value={q.correcta}>{q.correcta || '—'}</option>}
                            {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </td>
                        {LETTERS.map(l => {
                          const field = l.toLowerCase()
                          const esCorrecta = q.correcta === l
                          return (
                            <td key={l} style={{ textAlign: 'center', padding: '4px 2px' }}>
                              <input type="number" min={0} value={q[field]}
                                onChange={e => setQ(tab, i, field, e.target.value)}
                                style={{ ...cellInp,
                                  background: esCorrecta ? 'var(--success-bg-strong, #CCFBF1)' : 'var(--white)',
                                  fontWeight: esCorrecta ? 700 : 400 }} />
                            </td>
                          )
                        })}
                        <td style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 700,
                          color: st.esValida ? 'var(--success)' : 'var(--error)' }}
                          title={st.esValida ? 'Coincide con el total' : 'No coincide con el total de estudiantes'}>
                          {st.esValida ? '✓' : st.suma}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 13, color: 'var(--dark)' }}>{st.aciertos ?? '—'}</td>
                        <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700,
                          color: colorEfectividad(st.pep) }}>
                          {st.pep == null ? '—' : `${st.pep.toFixed(1)}%`}
                        </td>
                        <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 800,
                          color: st.error ? 'var(--error)' : 'var(--dark)' }} title={st.error || ''}>
                          {st.error === 'Letra incorrecta' ? '⚠️' : st.valor}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={q.aplicada !== false}
                            onChange={e => setQ(tab, i, 'aplicada', e.target.checked)}
                            title="Si se desmarca, la pregunta se excluye por completo del cálculo"
                            style={{ accentColor: 'var(--orange)', width: 15, height: 15, cursor: 'pointer' }} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button onClick={() => removeQ(tab, i)} title="Eliminar pregunta"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                            <TrashIc s={14} c="var(--subtle)" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn variant="secondary" size="sm" onClick={() => addQ(tab)}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <PlusIc s={13} c="currentColor" /> Agregar pregunta
                </span>
              </Btn>
              <span style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                Desmarcar <strong>Aplicada</strong> excluye la pregunta del cálculo (no la cuenta como cero).
                VALOR es el peso por dificultad: <strong>3</strong> = pocos acertaron, <strong>1</strong> = casi todos.
              </span>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 26 }}>
            <Btn variant="secondary" disabled={!!saving} onClick={() => persist(false)}>
              {saving === 'draft' ? '⏳' : '💾'} Guardar borrador
            </Btn>
            <Btn variant="gradient" disabled={!!saving} onClick={() => persist(true)}>
              {saving === 'final' ? '⏳' : '🔒'} Cerrar tabla
            </Btn>
            {record?.id && (
              <Btn variant="ghost" size="sm" onClick={eliminar}>🗑️ Eliminar</Btn>
            )}
          </div>
        </>
      )}

      {isFinal && (
        <div className="no-print" style={{ padding: '12px 16px', borderRadius: 12, background: '#CCFBF1', marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#0D9488', margin: 0, fontWeight: 600 }}>
            🔒 Esta tabla ya fue cerrada el {new Date(record.finalized_at || record.updated_at).toLocaleString('es-CO')}.
            Puedes imprimirla o exportarla, pero no editarla.
          </p>
        </div>
      )}

      {/* ── El informe final: lo único que sale impreso ── */}
      {/* Cuatro bloques, en este orden: asistencia · tabla de efectividad ·
          recomendaciones · tareas. Los dos últimos salen de cruzar cada
          pregunta con la rejilla del libro (lib/tareasRecomendaciones.js). */}
      <div id="clone-print" style={{ ...card, background: '#fff', color: BRAND.dark,
        padding: isMobile ? 20 : 40, borderTop: `5px solid ${BRAND.orange}` }}>

        <PrintDocHeader
          title="INFORME FINAL DE LA SESIÓN"
          subtitle={`${group?.name || ''}${group?.grade ? ` · ${group.grade}` : ''}${title ? ` · ${title}` : ''}`}
          meta={[
            { label: 'Fecha', value: fmtFecha(sessionDate) },
            { label: 'Docente', value: user?.name || '—' },
            { label: 'Unidad', value: unitLabel },
          ]}
        />

        {/* Unidad del libro trabajada. Los datos salen del snapshot guardado con
            la tabla (0054), no del plan vigente: un informe cerrado tiene que
            seguir diciendo lo mismo aunque el tutor recargue el plan después. */}
        {unitLabel && (
          <div style={{ background: BRAND.orangeSoft, borderLeft: `4px solid ${BRAND.orange}`,
            borderRadius: '0 8px 8px 0', padding: '12px 14px', marginBottom: 24 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .8, color: BRAND.orange,
              fontWeight: 800, marginBottom: 4 }}>Unidad del libro trabajada</div>
            <div style={{ fontSize: 14.5, fontWeight: 800 }}>📕 {unitLabel}</div>

            {(unitData?.ejes || []).length > 0 && (
              <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 6 }}>
                <strong style={{ color: BRAND.purple }}>Ejes articuladores:</strong> {unitData.ejes.join(' · ')}
              </div>
            )}

            {(unitData?.level || typeof unitData?.coverage === 'number' || typeof unitData?.priority === 'number') && (
              <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 4, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {typeof unitData.coverage === 'number' && <span><strong style={{ color: BRAND.purple }}>Cobertura diagnóstica:</strong> {fmtPct1(unitData.coverage)}</span>}
                {typeof unitData.priority === 'number' && <span><strong style={{ color: BRAND.purple }}>Prioridad:</strong> {fmtPct1(unitData.priority)}</span>}
                {unitData.level && <span><strong style={{ color: BRAND.purple }}>Nivel:</strong> {unitData.level}</span>}
              </div>
            )}

            {unitData?.notes && (
              <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 6, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                <strong style={{ color: BRAND.purple }}>Indicaciones del tutor:</strong> {unitData.notes}
              </div>
            )}
          </div>
        )}

        {/* ── 1. Asistencia ── */}
        {/* Sale del acta que el docente ya diligenció en "Marcar asistencia":
            el informe no la vuelve a capturar, solo la trae. */}
        <PrintSection n={1} title="Asistencia" color={BRAND.blue} tint={BRAND.blueSoft}
          note={acta ? `${actaPresentes} de ${actaEntries.length} asistieron` : null}>

          {!acta ? (
            <p style={{ fontSize: 11.5, color: '#888', fontStyle: 'italic', margin: 0 }}>
              Este grupo todavía no tiene un acta de asistencia registrada.
            </p>
          ) : (
            <>
              <table style={{ width: '100%', fontSize: 12, marginBottom: 12, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', width: 110, color: BRAND.gray }}>Fecha del acta</td>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>{fmtFecha(acta.session_date)}</td>
                    <td style={{ padding: '4px 0', width: 90, color: BRAND.gray }}>Lugar</td>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>{acta.place || '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 0', color: BRAND.gray }}>Asistencia</td>
                    <td style={{ padding: '4px 0', fontWeight: 800, color: BRAND.blue }}>
                      {actaPresentes} de {actaEntries.length}
                      {actaEntries.length > 0 &&
                        ` (${((actaPresentes * 100) / actaEntries.length).toFixed(1)}%)`}
                    </td>
                    <td style={{ padding: '4px 0', color: BRAND.gray }}>Tema</td>
                    <td style={{ padding: '4px 0', fontWeight: 600 }}>{acta.topic || '—'}</td>
                  </tr>
                </tbody>
              </table>

              <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BRAND.blueSoft, color: BRAND.blue }}>
                    <th style={{ textAlign: 'left', padding: '6px 5px', width: 26 }}>#</th>
                    <th style={{ textAlign: 'left', padding: '6px 5px' }}>Alumno</th>
                    <th style={{ textAlign: 'left', padding: '6px 5px', width: 100 }}>Documento</th>
                    <th style={{ textAlign: 'center', padding: '6px 5px', width: 60 }}>Asistió</th>
                    <th style={{ textAlign: 'left', padding: '6px 5px' }}>Observación</th>
                  </tr>
                </thead>
                <tbody>
                  {actaEntries.map((e, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BRAND.line}` }}>
                      <td style={{ padding: '4px 5px', color: '#888' }}>{i + 1}</td>
                      <td style={{ padding: '4px 5px' }}>{e.name}</td>
                      <td style={{ padding: '4px 5px', color: BRAND.gray }}>{e.document || '—'}</td>
                      <td style={{ padding: '4px 5px', textAlign: 'center', fontWeight: 800,
                        color: e.present ? BRAND.green : '#B91C1C' }}>{e.present ? 'Sí' : 'No'}</td>
                      <td style={{ padding: '4px 5px', color: BRAND.gray }}>{e.comment || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {acta.notes && (
                <p style={{ fontSize: 11.5, color: BRAND.gray, lineHeight: 1.6, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                  <strong style={{ color: BRAND.blue }}>Observaciones generales:</strong> {acta.notes}
                </p>
              )}
            </>
          )}
        </PrintSection>

        {/* ── 2. Tabla de efectividad ── */}
        <PrintSection n={2} title="Tabla de efectividad" color={BRAND.purple} tint={BRAND.purpleSoft}
          note={`Efectividad de la sesión: ${fmtPct(result.efectividadSesion)}`}>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, textAlign: 'center' }}>
            {SECTIONS.map(({ key, label }) => (
              <div key={key} style={{ flex: 1, border: `1px solid ${BRAND.line}`, borderTop: `3px solid ${BRAND.purple}`,
                borderRadius: 8, padding: '10px 8px' }}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .8,
                  color: BRAND.purple, fontWeight: 800 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4, color: BRAND.dark }}>
                  {result[key].tieneDatos ? fmtPct(result[key].efectividadGrupo) : 'No aplicado'}
                </div>
                {result[key].tieneDatos && (
                  <div style={{ fontSize: 10.5, color: BRAND.gray, marginTop: 2 }}>
                    Máx. por estudiante: {result[key].efectividadMaxima} · {result[key].total} estudiantes
                  </div>
                )}
              </div>
            ))}
            {/* La cifra que manda en todo el informe: es el umbral de los dos
                módulos siguientes, así que va con el naranja de marca. */}
            <div style={{ flex: 1, borderRadius: 8, padding: '10px 8px', background: BRAND.orange, color: '#fff' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: .8, fontWeight: 800,
                color: 'rgba(255,255,255,.85)' }}>
                Efectividad de la sesión
              </div>
              <div style={{ fontSize: 25, fontWeight: 900, marginTop: 4 }}>{fmtPct(result.efectividadSesion)}</div>
            </div>
          </div>

          {SECTIONS.filter(({ key }) => result[key].tieneDatos).map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
                color: BRAND.purple, marginBottom: 6 }}>{label}</div>
              <table style={{ width: '100%', fontSize: 11.5, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: BRAND.purpleSoft, color: BRAND.purple }}>
                    <th style={{ textAlign: 'left', padding: '6px 5px', width: 34 }}>#</th>
                    <th style={{ textAlign: 'center', padding: '6px 5px', width: 66 }}>Correcta</th>
                    {LETTERS.map(l => <th key={l} style={{ textAlign: 'center', padding: '6px 5px', width: 40 }}>{l}</th>)}
                    <th style={{ textAlign: 'center', padding: '6px 5px', width: 60 }}>Aciertos</th>
                    <th style={{ textAlign: 'center', padding: '6px 5px', width: 66 }}>P.E.P.</th>
                    <th style={{ textAlign: 'center', padding: '6px 5px', width: 54 }}>VALOR</th>
                  </tr>
                </thead>
                <tbody>
                  {result[key].rows.filter(r => r.q.aplicada !== false).map(({ q, st }, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${BRAND.line}` }}>
                      <td style={{ padding: '4px 5px', color: '#888' }}>{q.n}</td>
                      <td style={{ padding: '4px 5px', textAlign: 'center', fontWeight: 800, color: BRAND.purple }}>{q.correcta}</td>
                      {LETTERS.map(l => (
                        <td key={l} style={{ padding: '4px 5px', textAlign: 'center',
                          background: q.correcta === l ? BRAND.greenSoft : 'transparent',
                          fontWeight: q.correcta === l ? 800 : 400 }}>{q[l.toLowerCase()]}</td>
                      ))}
                      <td style={{ padding: '4px 5px', textAlign: 'center' }}>{st.aciertos ?? '—'}</td>
                      {/* Mismo semáforo de la pantalla, pero en hex fijos: el
                          documento no debe seguir el tema de la app. */}
                      <td style={{ padding: '4px 5px', textAlign: 'center', fontWeight: 800,
                        color: st.pep == null ? BRAND.gray
                          : st.pep >= 69 ? BRAND.green : st.pep >= 34 ? '#B45309' : '#B91C1C' }}>
                        {st.pep == null ? '—' : `${st.pep.toFixed(1)}%`}
                      </td>
                      <td style={{ padding: '4px 5px', textAlign: 'center', fontWeight: 700 }}>{st.valor}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: `2px solid ${BRAND.purple}`, background: BRAND.purpleSoft }}>
                    <td colSpan={7} style={{ padding: '6px 5px', fontWeight: 800, color: BRAND.purple }}>
                      Efectividad de grupo · Efectividad máxima por estudiante
                    </td>
                    <td style={{ padding: '6px 5px', textAlign: 'center', fontWeight: 900 }}>
                      {fmtPct(result[key].efectividadGrupo)}
                    </td>
                    <td style={{ padding: '6px 5px', textAlign: 'center', fontWeight: 900 }}>
                      {result[key].efectividadMaxima}
                    </td>
                  </tr>
                </tbody>
              </table>
              {result[key].inconsistencias > 0 && (
                <p style={{ fontSize: 10.5, color: '#B91C1C', marginTop: 6 }}>
                  ⚠️ {result[key].inconsistencias} pregunta(s) con conteos que no suman el total de estudiantes.
                </p>
              )}
            </div>
          ))}
        </PrintSection>

        {/* ── 3 y 4. Recomendaciones y tareas ── */}
        {/* El umbral de las dos listas es la efectividad de la SESIÓN. Sin ella
            (ningún momento aplicado) no hay con qué comparar. */}
        {result.efectividadSesion == null ? (
          <p style={{ fontSize: 11.5, color: '#888', fontStyle: 'italic' }}>
            Registra al menos un momento de la sesión para generar las recomendaciones y las tareas.
          </p>
        ) : (
          <>
            {!informe.hayRejilla && (
              <p style={{ fontSize: 11, color: '#B45309', lineHeight: 1.55, marginBottom: 14 }}>
                ⚠️ {!materia
                  ? 'Los textos de recomendaciones y tareas por pregunta están disponibles para Química y Sociales; para esta materia aún no se han cargado.'
                  : unidad
                  ? `La rejilla del libro no tiene preguntas cargadas para la unidad ${unidad}.`
                  : 'Elige la unidad del libro trabajada para que el informe traiga los textos de recomendaciones y tareas.'}
                {' '}Las preguntas se listan igual, clasificadas por su desempeño.
              </p>
            )}

            <PrintSection n={3} title="Recomendaciones" color={BRAND.orange} tint={BRAND.orangeSoft}
              note={`Por debajo de ${fmtPct(result.efectividadSesion)} · refuerza antes de avanzar`}>
              <ModuloFichas
                items={informe.recomendaciones}
                color={BRAND.orange}
                tint={BRAND.orangeSoft}
                vacio="Ninguna pregunta quedó por debajo de la efectividad de la sesión."
              />
            </PrintSection>

            {/* El módulo se titula "¿Qué evalúa?" en el documento; en el código
                y en la rejilla la columna sigue llamándose `tarea`. */}
            <PrintSection n={4} title="¿Qué evalúa?" color={BRAND.green} tint={BRAND.greenSoft}
              note={`Por encima de ${fmtPct(result.efectividadSesion)} · lo que el grupo ya domina`}>
              <ModuloFichas
                items={informe.tareas}
                color={BRAND.green}
                tint={BRAND.greenSoft}
                vacio="Ninguna pregunta quedó por encima de la efectividad de la sesión."
              />
            </PrintSection>
          </>
        )}

        <div style={{ display: 'flex', gap: 40, marginTop: 46, pageBreakInside: 'avoid' }}>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: `1.5px solid ${BRAND.purple}`, paddingTop: 5, fontSize: 11 }}>
              {user?.name || ''}<br />
              <span style={{ color: BRAND.purple, fontWeight: 700, textTransform: 'uppercase',
                fontSize: 9.5, letterSpacing: .7 }}>Docente</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ borderTop: `1.5px solid ${BRAND.purple}`, paddingTop: 5, fontSize: 11 }}>
              <br />
              <span style={{ color: BRAND.purple, fontWeight: 700, textTransform: 'uppercase',
                fontSize: 9.5, letterSpacing: .7 }}>Tutor</span>
            </div>
          </div>
        </div>

        <PrintDocFooter nota={record?.finalized_at
          ? `Informe cerrado el ${new Date(record.finalized_at).toLocaleString('es-CO')}`
          : null} />
      </div>
    </div>
  )
}

export default CloneEffectivenessPage
