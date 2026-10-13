import React from 'react'
import {
  useStore, nav, XS,
  loadModulesForImport, forkCourseForInstitution,
  saveRouteTemplate, deleteRouteTemplate, setCourseVersionNote,
} from '../store/store.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { Btn, Modal, useMobile } from '../components/ui.jsx'
import { RoutePreviewModal } from '../components/route-editor/index.js'
import { resolveActivity } from '../lib/activityBank.js'

// =============================================
// EXPERIA — Versiones de ruta (page 'route-versions', migración 0082)
// Biblioteca de las versiones de un curso: la ruta base, la de cada colegio y
// las PLANTILLAS (rutas guardadas con nombre propio, sin colegio). El tutor
// las compara, les pone una nota de para qué sirven, las previsualiza, las usa
// en otro de sus colegios o las guarda como plantilla. Solo dentro del mismo
// curso: una versión de Matemáticas no se ofrece para Lenguaje.
// =============================================

const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }
const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)',
  fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', color: 'var(--dark)' }
const chip = (bg, color) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20,
  background: bg, color, fontSize: 11.5, fontWeight: 700 })

const RouteVersions = () => {
  const isMobile = useMobile()
  const user                   = useStore(s => s.user)
  const courses                = useStore(s => s.courses || [])
  const institutions           = useStore(s => s.institutions || [])
  const institutionCourses     = useStore(s => s.institutionCourses || [])
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const userCourses            = useStore(s => s.userCourses || [])
  const isAdmin = user?.role === 'admin'

  // Colegios del tutor (mismo criterio que el editor de ruta).
  const myInstitutions = React.useMemo(() => {
    if (isAdmin) return institutions
    const assigned = instructorInstitutions.filter(ii => ii.instructor_id === user?.id)
      .map(ii => institutions.find(i => i.id === ii.institution_id)).filter(Boolean)
    if (assigned.length) return assigned
    const own = institutions.find(i => i.id === user?.institution_id)
    return own ? [own] : []
  }, [isAdmin, instructorInstitutions, institutions, user])
  const myInstIds = React.useMemo(() => new Set(myInstitutions.map(i => i.id)), [myInstitutions])

  // Cursos base que el tutor da en alguno de sus colegios (admin: todos).
  const baseCourses = React.useMemo(() => {
    const allowed = new Set(userCourses.filter(uc => uc.user_id === user?.id && uc.is_active).map(uc => uc.course_id))
    return courses.filter(c => !c.parent_course_id && c.is_active && (isAdmin || (
      institutionCourses.some(r => r.course_id === c.id && r.is_active && myInstIds.has(r.institution_id))
      && (allowed.size === 0 || allowed.has(c.id)))))
  }, [courses, institutionCourses, userCourses, myInstIds, isAdmin, user])

  const [baseId, setBaseId] = React.useState('')
  React.useEffect(() => {
    if (!baseCourses.some(c => c.id === baseId)) setBaseId(baseCourses[0]?.id || '')
  }, [baseCourses]) // eslint-disable-line react-hooks/exhaustive-deps
  const base = baseCourses.find(c => c.id === baseId) || null

  const instName = (id) => institutions.find(i => i.id === id)?.name || 'Colegio'
  const versions = React.useMemo(() => {
    if (!base) return []
    const family = courses.filter(c => c.parent_course_id === base.id && c.is_active)
    const templates = family.filter(c => c.is_template).sort((a, b) => a.name.localeCompare(b.name))
    const schools = family.filter(c => !c.is_template)
      .sort((a, b) => (myInstIds.has(b.institution_id) - myInstIds.has(a.institution_id)) || instName(a.institution_id).localeCompare(instName(b.institution_id)))
    return [
      { kind: 'base', course: base, title: 'Ruta base (curso original)', icon: '🧭' },
      ...templates.map(c => ({ kind: 'template', course: c, title: c.name, icon: '⭐' })),
      ...schools.map(c => ({ kind: 'school', course: c, title: instName(c.institution_id), icon: '🏫', mine: myInstIds.has(c.institution_id) })),
    ]
  }, [base, courses, myInstIds, institutions]) // eslint-disable-line react-hooks/exhaustive-deps

  // Resumen de módulos de cada versión (cuántos, última modificación, actividad
  // de apertura / pausa activa) para compararlas sin abrirlas.
  const [summary, setSummary] = React.useState({})
  const idsKey = versions.map(v => v.course.id).join(',')
  React.useEffect(() => {
    if (!idsKey) return
    let alive = true
    supabase.from('course_modules').select('course_id,title,"order",content,updated_at,is_enabled')
      .in('course_id', idsKey.split(','))
      .then(({ data }) => {
        if (!alive) return
        const out = {}
        ;(data || []).forEach(m => {
          const s = out[m.course_id] || (out[m.course_id] = { count: 0, last: null, activities: [] })
          if (m.is_enabled !== false) s.count++
          if (!s.last || m.updated_at > s.last) s.last = m.updated_at
          const sec = (m.content || []).find(x => x.type === 'activity')
          if (sec) s.activities.push({ order: m.order, module: m.title, activity: resolveActivity(sec)?.title })
        })
        Object.values(out).forEach(s => s.activities.sort((a, b) => a.order - b.order))
        setSummary(out)
      })
    return () => { alive = false }
  }, [idsKey])

  const canEditNote = (v) => isAdmin
    || (v.kind === 'template' && v.course.owner_id === user?.id)
    || (v.kind === 'school' && myInstIds.has(v.course.institution_id))
  const canDelete = (v) => v.kind === 'template' && (isAdmin || v.course.owner_id === user?.id)

  // ── Nota ──
  const [noteFor, setNoteFor] = React.useState(null)
  const [noteText, setNoteText] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState('')
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 5000) }
  const saveNote = async () => {
    setBusy(true)
    const r = await setCourseVersionNote(noteFor.course.id, noteText)
    setBusy(false)
    if (r.error) return flash('⚠️ ' + r.error)
    setNoteFor(null); flash('📝 Nota guardada')
  }

  // ── Vista previa ──
  const [preview, setPreview] = React.useState(null) // { title, modules }
  const openPreview = async (v) => {
    setBusy(true)
    const { modules, error } = await loadModulesForImport(v.course.id)
    setBusy(false)
    if (error) return flash('⚠️ ' + error)
    setPreview({ title: v.title, modules })
  }

  // ── Guardar como plantilla ──
  const [tplFrom, setTplFrom] = React.useState(null)
  const [tplName, setTplName] = React.useState('')
  const [tplNote, setTplNote] = React.useState('')
  const saveTemplate = async () => {
    if (!tplName.trim()) return flash('⚠️ Ponle un nombre a la plantilla')
    setBusy(true)
    const r = await saveRouteTemplate(tplFrom.course.id, base.id, tplName, tplNote)
    setBusy(false)
    if (r.error) return flash('⚠️ ' + r.error)
    setTplFrom(null); flash('⭐ Plantilla guardada')
  }

  const removeTemplate = async (v) => {
    if (!window.confirm(`¿Eliminar la plantilla «${v.title}»? Las versiones de colegio que se crearon a partir de ella no se tocan.`)) return
    setBusy(true)
    const r = await deleteRouteTemplate(v.course.id)
    setBusy(false)
    flash(r.error ? '⚠️ ' + r.error : '🗑 Plantilla eliminada')
  }

  // ── Usar en otro colegio ──
  const [useFrom, setUseFrom] = React.useState(null)
  const [targetId, setTargetId] = React.useState('')
  const targets = React.useMemo(() => {
    if (!useFrom || !base) return []
    return myInstitutions
      .filter(i => institutionCourses.some(r => r.institution_id === i.id && r.course_id === base.id && r.is_active))
      .filter(i => i.id !== useFrom.course.institution_id)
      .map(i => ({ inst: i, fork: courses.find(c => c.parent_course_id === base.id && c.institution_id === i.id && c.is_active && !c.is_template) || null }))
  }, [useFrom, base, myInstitutions, institutionCourses, courses])
  const target = targets.find(t => t.inst.id === targetId) || null
  const sourceLabel = (v) => v.kind === 'base' ? 'la ruta base' : v.kind === 'template' ? `la plantilla «${v.title}»` : `la versión de ${v.title}`

  const applyToSchool = async () => {
    if (!target) return
    const sourceId = useFrom.kind === 'base' ? undefined : useFrom.course.id
    if (!target.fork) {
      setBusy(true)
      const r = await forkCourseForInstitution(base.id, target.inst.id, sourceId)
      setBusy(false)
      if (r.error) return flash('⚠️ ' + r.error)
      setUseFrom(null)
      if (isAdmin) return flash(`✅ Versión creada para ${target.inst.name} a partir de ${sourceLabel(useFrom)}`)
      XS.set({ routeEditorIntent: { courseId: base.id, institutionId: target.inst.id, forkId: r.id, forkName: r.name } })
      return nav('instructor-route')
    }
    // Ya tiene versión: se abre su editor con esta ruta cargada SIN guardar;
    // el tutor la revisa y publica (o descarta) como en "📥 Importar".
    XS.set({ routeEditorIntent: { courseId: base.id, institutionId: target.inst.id, forkId: target.fork.id, forkName: target.fork.name,
      importFrom: { id: useFrom.course.id, label: sourceLabel(useFrom) } } })
    nav('instructor-route')
  }

  if (!baseCourses.length) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No tienes cursos asignados en tus colegios.</div>
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Versiones de ruta</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 720, lineHeight: 1.5 }}>
          Todas las versiones de un curso en un solo lugar: la ruta base, la de cada colegio y tus plantillas.
          Ponles una nota de para qué sirven y úsalas en otro colegio cuando te convenga.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 240, maxWidth: 460 }}>
          <label style={lbl}>📖 Curso</label>
          <select value={baseId} onChange={e => setBaseId(e.target.value)} style={inp}>
            {baseCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {msg && <span style={{ fontSize: 13, fontWeight: 600, color: msg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)' }}>{msg}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {versions.map(v => {
          const s = summary[v.course.id]
          const note = v.course.version_note
          return (
            <div key={v.course.id} style={{ padding: 16, borderRadius: 14, background: 'var(--white)', display: 'flex', flexDirection: 'column', gap: 10,
              border: `1.5px solid ${v.kind === 'template' ? 'var(--orange)' : v.mine ? 'var(--purple)' : 'var(--border)'}` }}>
              <div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                  {v.kind === 'base' && <span style={chip('var(--bg-alt)', 'var(--text-sec)')}>Ruta base</span>}
                  {v.kind === 'template' && <span style={chip('var(--orange-bg)', 'var(--orange)')}>⭐ Plantilla</span>}
                  {v.kind === 'school' && <span style={chip(v.mine ? 'var(--purple-bg)' : 'var(--bg-alt)', v.mine ? 'var(--purple)' : 'var(--text-sec)')}>{v.mine ? 'Tu colegio' : 'Otro colegio'}</span>}
                  {v.course.draft_modules && <span style={chip('#FEF3C7', '#B45309')}>Borrador sin publicar</span>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.3 }}>{v.icon} {v.title}</div>
                {v.kind === 'school' && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{v.course.name}</div>}
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {s ? `${s.count} módulo${s.count === 1 ? '' : 's'} · actualizada ${fmtDate(s.last)}` : 'Cargando…'}
                </div>
              </div>

              {s?.activities?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {s.activities.map((a, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--text-sec)' }}>🎲 <strong>{a.module}:</strong> {a.activity}</div>
                  ))}
                </div>
              )}

              <div style={{ padding: '8px 10px', borderRadius: 10, background: note ? 'var(--bg-alt)' : 'transparent',
                border: note ? 'none' : '1px dashed var(--border)', fontSize: 13, color: note ? 'var(--dark)' : 'var(--subtle)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {note || 'Sin nota: ¿para qué colegio o grupo sirve esta versión?'}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
                <Btn size="sm" variant="secondary" disabled={busy} onClick={() => openPreview(v)}>👁 Vista previa</Btn>
                {canEditNote(v) && <Btn size="sm" variant="secondary" onClick={() => { setNoteFor(v); setNoteText(note || '') }}>📝 Nota</Btn>}
                <Btn size="sm" variant="secondary" onClick={() => { setUseFrom(v); setTargetId('') }}>📋 Usar en otro colegio</Btn>
                <Btn size="sm" variant="secondary" onClick={() => { setTplFrom(v); setTplName(''); setTplNote(note || '') }}>⭐ Guardar como plantilla</Btn>
                {canDelete(v) && <Btn size="sm" variant="secondary" disabled={busy} onClick={() => removeTemplate(v)}>🗑</Btn>}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 16, maxWidth: 720, lineHeight: 1.5 }}>
        Se compara y se copia siempre lo <strong>publicado</strong> de cada versión (un borrador sin publicar no viaja).
        Las plantillas no las ve ningún estudiante: solo sirven para crear o reemplazar la versión de un colegio.
      </p>

      {/* Nota */}
      <Modal open={!!noteFor} onClose={() => !busy && setNoteFor(null)} title={`Nota · ${noteFor?.title || ''}`} width={460}>
        <label style={lbl}>¿Para qué sirve esta versión?</label>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4} autoFocus
          placeholder="Ej: Jornada única, grupos de más de 35 estudiantes. Pausa activa en parejas."
          style={{ ...inp, resize: 'vertical', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" full onClick={() => setNoteFor(null)}>Cancelar</Btn>
          <Btn variant="gradient" full disabled={busy} onClick={saveNote}>{busy ? '⏳ Guardando…' : 'Guardar nota'}</Btn>
        </div>
      </Modal>

      {/* Guardar como plantilla */}
      <Modal open={!!tplFrom} onClose={() => !busy && setTplFrom(null)} title="Guardar como plantilla" width={460}>
        <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 14 }}>
          Se guarda una copia de {tplFrom ? sourceLabel(tplFrom) : ''} con nombre propio, para usarla después en cualquier colegio.
          Cambios posteriores en el original no la afectan.
        </p>
        <label style={lbl}>Nombre *</label>
        <input value={tplName} onChange={e => setTplName(e.target.value)} autoFocus placeholder="Ej: Versión rural — grupos multigrado" style={{ ...inp, marginBottom: 12 }} />
        <label style={lbl}>Nota</label>
        <textarea value={tplNote} onChange={e => setTplNote(e.target.value)} rows={3} placeholder="¿Para qué colegio o grupo sirve?"
          style={{ ...inp, resize: 'vertical', marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" full onClick={() => setTplFrom(null)}>Cancelar</Btn>
          <Btn variant="gradient" full disabled={busy} onClick={saveTemplate}>{busy ? '⏳ Guardando…' : '⭐ Guardar plantilla'}</Btn>
        </div>
      </Modal>

      {/* Usar en otro colegio */}
      <Modal open={!!useFrom} onClose={() => !busy && setUseFrom(null)} title="Usar en otro colegio" width={480}>
        {targets.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            No hay otro colegio tuyo donde este curso esté habilitado. Un administrador lo habilita en Admin → Cursos.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6, marginBottom: 14 }}>
              Usar {useFrom ? sourceLabel(useFrom) : ''} como la ruta de:
            </p>
            <select value={targetId} onChange={e => setTargetId(e.target.value)} style={{ ...inp, marginBottom: 10 }}>
              <option value="">— Elige un colegio —</option>
              {targets.map(t => <option key={t.inst.id} value={t.inst.id}>{t.inst.name}{t.fork ? ' (ya tiene versión)' : ' (aún sin versión)'}</option>)}
            </select>
            {target && (
              <p style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 14, padding: '10px 12px', borderRadius: 10,
                background: target.fork ? '#FEF3C7' : '#F0FDFA', color: target.fork ? '#92400E' : '#115E59' }}>
                {!target.fork
                  ? <>Se creará la versión de <strong>{target.inst.name}</strong> como copia de esta ruta.{!isAdmin && ' Luego se abre en el editor.'}</>
                  : isAdmin
                    ? <>{target.inst.name} ya tiene su versión. Para reemplazarla, un tutor de ese colegio la carga desde el editor de ruta (📥 Importar) y la publica.</>
                    : <>{target.inst.name} ya tiene su versión. Se abrirá su editor con esta ruta cargada <strong>sin guardar</strong>: revísala y pulsa Publicar para que la vean sus estudiantes, o sal sin guardar para dejar la actual.</>}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" full onClick={() => setUseFrom(null)}>Cancelar</Btn>
              <Btn variant="gradient" full disabled={busy || !target || (target.fork && isAdmin)} onClick={applyToSchool}>
                {busy ? '⏳ Creando…' : target?.fork ? '✏️ Abrir en el editor' : '✨ Crear versión'}
              </Btn>
            </div>
          </>
        )}
      </Modal>

      <RoutePreviewModal open={!!preview} onClose={() => setPreview(null)} area={null}
        moduleList={preview?.modules || []} customModules={[]} theme={base?.theme || null} initialModule={null} />
    </div>
  )
}

export default RouteVersions
