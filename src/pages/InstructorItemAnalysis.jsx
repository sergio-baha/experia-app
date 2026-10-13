import React from 'react'
import { useStore, fetchAnalyticsModules, fetchItemAnalysis, fetchRawAnswers, getCourseDisplayName } from '../store/store.jsx'
import { useMobile, Btn, ChevRIc, Skeleton } from '../components/ui.jsx'

// ── Análisis de ítems ────────────────────────────────────────────────────────
// Le devuelve al instructor evidencia sobre SUS pruebas: qué tan duro fue cada
// pregunta (dificultad), si separa a quien sabe de quien no (discriminación) y
// qué distractor se está llevando a los mejores. Todo se agrega en la base
// (0049) y todo se muestra con el tamaño de la muestra: una métrica sin decir
// sobre cuántos datos se calculó es peor que no mostrarla.

const MIN_N = 10  // bajo esto, D y r_pb no significan nada y no se muestran

const fmtPct = (v) => v == null ? '—' : Math.round(Number(v) * 100) + '%'
const fmtNum = (v) => v == null ? '—' : Number(v).toFixed(2)
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

// Semáforo de discriminación (criterio clásico de análisis de ítems)
const discLevel = (d) => {
  if (d == null) return { color: 'var(--subtle)', label: 'Muestra insuficiente', hint: `Se necesitan al menos ${MIN_N} estudiantes.` }
  if (d < 0)   return { color: 'var(--error)',  label: 'Invertido',  hint: 'Los que más saben lo fallan más: revisa la redacción o la clave.' }
  if (d < 0.1) return { color: 'var(--error)',  label: 'No discrimina', hint: 'No separa a quien sabe de quien no.' }
  if (d < 0.2) return { color: 'var(--warn)',   label: 'Débil',      hint: 'Discrimina poco; vale la pena revisarlo.' }
  return { color: 'var(--success)', label: 'Bien', hint: 'Separa correctamente por nivel de dominio.' }
}

const diffLabel = (p) => {
  if (p == null) return ''
  if (p >= 0.9) return 'Muy fácil'
  if (p >= 0.7) return 'Fácil'
  if (p >= 0.4) return 'Media'
  if (p >= 0.2) return 'Difícil'
  return 'Muy difícil'
}

// ── Detalle de un ítem: distractores + evolución ─────────────────────────────
const ItemDetail = ({ item }) => {
  const distractors = Array.isArray(item.distractors) ? item.distractors : []
  return (
    <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '16px 0' }}>
        {[
          { label: 'Dificultad (p)', value: fmtPct(item.p_value), hint: diffLabel(item.p_value) },
          { label: 'Discriminación (D)', value: fmtNum(item.discrimination), hint: discLevel(item.discrimination).label },
          { label: 'Correlación ítem-total', value: fmtNum(item.r_pb), hint: item.r_pb == null ? '' : (item.r_pb < 0.2 ? 'baja' : 'aceptable') },
          { label: 'Respuestas', value: item.n, hint: 'primer intento' },
        ].map((m, i) => (
          <div key={i}>
            <div style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 500 }}>{m.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)' }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>
        Opciones elegidas
      </div>
      {!item.has_choices || distractors.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>
          Este reto se respondió antes de que se guardara la opción elegida, así que solo hay acierto/error.
          Los intentos nuevos sí registran el distractor.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {distractors.map((d, i) => {
            const pct = Math.round(Number(d.pct || 0) * 100)
            const color = d.is_correct ? 'var(--success)' : (d.n_top > 0 ? 'var(--error)' : 'var(--warn)')
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 20 }}>
                    {d.is_correct ? '✓' : '✗'}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--dark)', flex: 1, minWidth: 0 }}>
                    {d.text || `Opción ${(d.chosen ?? 0) + 1}`}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap' }}>{pct}% ({d.n})</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-alt)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: pct + '%', background: color }} />
                </div>
                {!d.is_correct && d.n_top > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--error)', marginTop: 3 }}>
                    {d.n_top} estudiante{d.n_top !== 1 ? 's' : ''} del cuartil alto eligió esta opción — el distractor está atrapando a los que más saben.
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {item.retry_n > 0 && (
        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'var(--bg)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dark)', marginBottom: 3 }}>Evolución tras fallar</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            De {item.retry_n} estudiante{item.retry_n !== 1 ? 's' : ''} que fallaron y volvieron a intentar,
            {' '}<strong style={{ color: 'var(--dark)' }}>{fmtPct(item.retry_recovery)}</strong> acertó después.
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página ───────────────────────────────────────────────────────────────────
const InstructorItemAnalysis = () => {
  const user                   = useStore(s => s.user)
  const courses                = useStore(s => s.courses || [])
  const institutions           = useStore(s => s.institutions || [])
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const institutionCourses     = useStore(s => s.institutionCourses || [])
  const isMobile = useMobile()

  const isAdmin = user?.role === 'admin'

  // Instituciones del instructor (mismo criterio que el editor de ruta: la
  // asignación explícita manda; el institution_id del perfil es el respaldo).
  const myInstitutions = React.useMemo(() => {
    if (isAdmin) return institutions
    const assigned = instructorInstitutions
      .filter(ii => ii.instructor_id === user?.id)
      .map(ii => institutions.find(i => i.id === ii.institution_id))
      .filter(Boolean)
    if (assigned.length > 0) return assigned
    const own = institutions.find(i => i.id === user?.institution_id)
    return own ? [own] : []
  }, [isAdmin, institutions, instructorInstitutions, user])

  const [instId, setInstId]     = React.useState(() => myInstitutions.length === 1 ? myInstitutions[0].id : '')
  const [courseId, setCourseId] = React.useState('')
  const [moduleId, setModuleId] = React.useState('')

  React.useEffect(() => {
    if (myInstitutions.length === 1 && !instId) setInstId(myInstitutions[0].id)
  }, [myInstitutions])

  // Cursos con datos posibles para ese colegio: los habilitados MÁS sus forks
  // (la copia del colegio tiene sus propios module_id, y es ahí donde caen los
  // intentos de esos estudiantes).
  const courseOptions = React.useMemo(() => {
    const linked = institutionCourses
      .filter(r => (!instId || r.institution_id === instId) && r.is_active)
      .map(r => r.course_id)
    const base = courses.filter(c => !c.parent_course_id && (linked.includes(c.id) || (!instId && !myInstitutions.length)))
    const forks = courses.filter(c => c.parent_course_id && c.is_active && !c.is_template &&
      (!instId || c.institution_id === instId) &&
      (linked.includes(c.parent_course_id) || !instId))
    return [
      ...base.map(c => ({ id: c.id, label: getCourseDisplayName(courses, c) || c.name })),
      ...forks.map(c => ({
        id: c.id,
        label: (getCourseDisplayName(courses, c) || c.name) + ' — versión del colegio',
      })),
    ]
  }, [courses, institutionCourses, instId, myInstitutions])

  React.useEffect(() => { setCourseId(''); setModuleId('') }, [instId])

  // ── Datos ──
  const [modules, setModules] = React.useState([])
  const [loadingMods, setLoadingMods] = React.useState(false)
  const [items, setItems] = React.useState([])
  const [loadingItems, setLoadingItems] = React.useState(false)
  const [err, setErr] = React.useState('')
  const [expanded, setExpanded] = React.useState(null)
  const [exporting, setExporting] = React.useState('')

  React.useEffect(() => {
    let alive = true
    if (!courseId) { setModules([]); setModuleId(''); return }
    setLoadingMods(true); setErr('')
    fetchAnalyticsModules(courseId).then(({ rows, error }) => {
      if (!alive) return
      setLoadingMods(false)
      if (error) { setErr(error); return }
      setModules(rows)
      setModuleId(rows.length === 1 ? rows[0].module_id : '')
    })
    return () => { alive = false }
  }, [courseId])

  React.useEffect(() => {
    let alive = true
    if (!moduleId) { setItems([]); return }
    setLoadingItems(true); setErr(''); setExpanded(null)
    fetchItemAnalysis(moduleId, MIN_N).then(({ rows, error }) => {
      if (!alive) return
      setLoadingItems(false)
      if (error) { setErr(error); return }
      setItems(rows)
    })
    return () => { alive = false }
  }, [moduleId])

  const selectedModule = modules.find(m => m.module_id === moduleId) || null

  // Lo peor primero: el ítem que no discrimina es el que hay que reescribir.
  // Los de muestra insuficiente van al final: no se pueden juzgar todavía.
  const sortedItems = React.useMemo(() => [...items].sort((a, b) => {
    if (a.discrimination == null && b.discrimination == null) return a.item_index - b.item_index
    if (a.discrimination == null) return 1
    if (b.discrimination == null) return -1
    return a.discrimination - b.discrimination
  }), [items])

  const flagged = sortedItems.filter(i => i.discrimination != null && i.discrimination < 0.1).length

  // ── Exportación (Fase 4) ──
  const exportItems = async () => {
    if (!items.length) return
    setExporting('items')
    const XLSX = await import('xlsx')
    const rows = sortedItems.map(i => ({
      '#': i.item_index + 1,
      'Pregunta': i.item_text,
      'Respuestas (n)': i.n,
      'Dificultad p': i.p_value == null ? '' : Number(i.p_value),
      'Discriminación D': i.discrimination == null ? 'muestra insuficiente' : Number(i.discrimination),
      'Correlación ítem-total': i.r_pb == null ? 'muestra insuficiente' : Number(i.r_pb),
      'Fallaron y reintentaron': i.retry_n,
      'Recuperación': i.retry_recovery == null ? '' : Number(i.retry_recovery),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Análisis de ítems')
    XLSX.writeFile(wb, `analisis_items_${(selectedModule?.title || 'modulo').slice(0, 24).replace(/[^\w]+/g, '_')}.xlsx`)
    setExporting('')
  }

  const exportRaw = async () => {
    setExporting('raw')
    const { rows, error } = await fetchRawAnswers(moduleId)
    if (error) { setErr(error); setExporting(''); return }
    const XLSX = await import('xlsx')
    const data = rows.map(r => ({
      'Estudiante': r.student_name,
      'Correo': r.student_email,
      'Intento': r.attempt_no,
      '#': r.item_index + 1,
      'Pregunta': r.item_text,
      'Respondió': r.chosen_text || (r.chosen == null ? '(sin responder)' : `Opción ${r.chosen + 1}`),
      'Acertó': r.correct ? 'Sí' : 'No',
      'Fecha': r.answered_at ? new Date(r.answered_at).toLocaleString('es-CO') : '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Respuestas')
    XLSX.writeFile(wb, `respuestas_${(selectedModule?.title || 'modulo').slice(0, 24).replace(/[^\w]+/g, '_')}.xlsx`)
    setExporting('')
  }

  const selectStyle = {
    padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border)',
    background: 'var(--white)', color: 'var(--dark)', fontFamily: 'var(--font)',
    fontSize: 13, fontWeight: 500, minWidth: isMobile ? '100%' : 220, maxWidth: '100%',
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 32px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Análisis de ítems</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
          Qué tan bien está construida cada pregunta de tus pruebas: dificultad, discriminación y distractores.
        </p>
      </div>

      {/* Selector: colegio → curso → módulo */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {myInstitutions.length > 1 && (
          <select value={instId} onChange={e => setInstId(e.target.value)} style={selectStyle}>
            <option value="">Colegio…</option>
            {myInstitutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        )}
        <select value={courseId} onChange={e => setCourseId(e.target.value)} style={selectStyle}
          disabled={myInstitutions.length > 1 && !instId}>
          <option value="">Curso…</option>
          {courseOptions.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={moduleId} onChange={e => setModuleId(e.target.value)} style={selectStyle} disabled={!courseId || !modules.length}>
          <option value="">{loadingMods ? 'Cargando…' : modules.length ? 'Reto…' : 'Sin retos con datos'}</option>
          {modules.map(m => (
            <option key={m.module_id} value={m.module_id}>
              {m.title} ({m.n_attempts} intento{m.n_attempts !== 1 ? 's' : ''})
            </option>
          ))}
        </select>
      </div>

      {err && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: '#FEE2E2', color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>
          {err}
        </div>
      )}

      {!courseId && (
        <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>
          Elige un curso para ver los retos que ya tienen respuestas registradas.
        </p>
      )}

      {courseId && !loadingMods && !modules.length && !err && (
        <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>
          Este curso todavía no tiene intentos registrados de tus estudiantes.
        </p>
      )}

      {loadingItems && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{[1, 2, 3].map(i => <Skeleton key={i} h={64} />)}</div>}

      {selectedModule && !loadingItems && (
        <>
          {/* Cabecera honesta: sobre qué muestra se calculó todo lo de abajo */}
          <div style={{ padding: '16px 20px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>{selectedModule.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Calculado sobre <strong>{selectedModule.n_attempts}</strong> intento{selectedModule.n_attempts !== 1 ? 's' : ''} de{' '}
                  <strong>{selectedModule.n_students}</strong> estudiante{selectedModule.n_students !== 1 ? 's' : ''}
                  {selectedModule.first_at && <> · entre {fmtDate(selectedModule.first_at)} y {fmtDate(selectedModule.last_at)}</>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
                  Dificultad y discriminación se calculan sobre el <strong>primer intento</strong> de cada estudiante;
                  mezclar reintentos las distorsiona.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn variant="ghost" onClick={exportItems} disabled={!items.length || !!exporting}>
                  {exporting === 'items' ? 'Generando…' : '⬇ Análisis'}
                </Btn>
                <Btn variant="ghost" onClick={exportRaw} disabled={!!exporting}>
                  {exporting === 'raw' ? 'Generando…' : '⬇ Respuestas'}
                </Btn>
              </div>
            </div>
            {flagged > 0 && (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FEF3C7', fontSize: 12, color: 'var(--dark)' }}>
                <strong>{flagged}</strong> pregunta{flagged !== 1 ? 's' : ''} no está{flagged !== 1 ? 'n' : ''} discriminando:
                acierta igual quien domina el tema y quien no. Suelen ser problemas de redacción o de clave, no de los estudiantes.
              </div>
            )}
          </div>

          {/* Tabla de ítems: lo peor primero */}
          {!sortedItems.length ? (
            <p style={{ fontSize: 13, color: 'var(--subtle)', fontStyle: 'italic' }}>Este reto no tiene respuestas por pregunta todavía.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sortedItems.map(item => {
                const lvl = discLevel(item.discrimination)
                const isOpen = expanded === item.item_id
                return (
                  <div key={item.item_id} style={{ borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <button onClick={() => setExpanded(isOpen ? null : item.item_id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 18px',
                        border: 'none', cursor: 'pointer', background: 'transparent', fontFamily: 'var(--font)', textAlign: 'left' }}>
                      <div style={{ width: 8, alignSelf: 'stretch', borderRadius: 4, background: lvl.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 3 }}>
                          <span style={{ color: 'var(--subtle)', fontWeight: 700 }}>{item.item_index + 1}. </span>
                          {item.item_text}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span>Acierto {fmtPct(item.p_value)} · {diffLabel(item.p_value)}</span>
                          <span style={{ color: lvl.color, fontWeight: 700 }}>D {fmtNum(item.discrimination)} · {lvl.label}</span>
                          <span>n={item.n}</span>
                        </div>
                      </div>
                      <ChevRIc s={18} c="var(--muted)" />
                    </button>
                    {isOpen && <ItemDetail item={item} />}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 20, padding: '16px 20px', borderRadius: 14, background: 'var(--bg)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--dark)' }}>Cómo leerlo.</strong>{' '}
            <em>Dificultad (p)</em> es el % que acertó: cerca de 0.5 es lo que más información aporta.{' '}
            <em>Discriminación (D)</em> compara el cuartil de mejor desempeño contra el de menor: si es negativa,
            los que más saben la fallan más y el ítem está midiendo otra cosa.{' '}
            Con menos de {MIN_N} estudiantes ninguna de las dos es confiable, así que no se muestran.
          </div>
        </>
      )}
    </div>
  )
}

export default InstructorItemAnalysis
