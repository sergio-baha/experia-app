import React from 'react'
import {
  useStore, nav,
  forkCourseForInstitution, loadCourseForEditing, loadModulesForImport,
  saveCourseDraft, discardCourseDraft, publishCourseModules,
  getCourseDisplayName, generatePresenceCode,
} from '../store/store.jsx'
import { useMobile, PlusIc, TrashIc, EditIc, GripIc, LockIc, Btn, Modal } from '../components/ui.jsx'
import CertificateCard, { DEFAULT_ACHIEVEMENT_TEXT as DEFAULT_CERT_ACHIEVEMENT_TEXT, fichaCertificado } from '../components/CertificateCard.jsx'
import LiveRundown from '../components/LiveRundown.jsx'
import {
  TYPE_LABELS, TYPE_COLORS, TYPE_BG,
  ChallengeEditorModal, QuizCreatorModal, CustomModuleModal,
  NewChallengeModal, RoutePreviewModal,
} from '../components/route-editor/index.js'

// ─── Módulo individual en la lista ───────────────────────────────────────────
const ModuleRow = ({ mod, idx, dragIdx, overIdx, isMobile,
  onDragStart, onDragOver, onDrop, onDragEnd,
  onEdit, onDuplicate, onToggle, onDelete, showDelete,
  onTogglePresence, onGenerateCode, onSetAvailability, onOpenActa, onOpenPlan }) => {
  const isOver = overIdx === idx
  return (
    <div draggable
      onDragStart={onDragStart} onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={onDrop} onDragEnd={onDragEnd}
      style={{
        borderRadius: 14,
        background: mod.enabled ? 'var(--white)' : 'var(--bg)',
        border: isOver ? '2px dashed var(--orange)' : mod.enabled ? '1px solid var(--border)' : '1px dashed var(--border)',
        opacity: dragIdx === idx ? .4 : mod.enabled ? 1 : .55,
        transition: 'all .15s',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px' }}>
        <GripIc s={16} c="var(--subtle)" />
        <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0,
          background: TYPE_BG[mod.type] || 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: TYPE_COLORS[mod.type] || 'var(--muted)' }}>{idx + 1}</div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
            background: TYPE_BG[mod.type] || 'var(--bg-alt)', color: TYPE_COLORS[mod.type] || 'var(--muted)',
            textTransform: 'uppercase', letterSpacing: .8 }}>{TYPE_LABELS[mod.type] || 'MÓDULO'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: mod.enabled ? 'var(--dark)' : 'var(--subtle)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</span>
          {mod.override && (
            <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4,
              background: 'var(--orange-bg)', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8 }}>EDITADO</span>
          )}
        </div>
        <button onClick={onEdit} title="Editar contenido"
          style={{ background: mod.override ? 'var(--orange-bg)' : 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <EditIc s={13} c={mod.override ? 'var(--orange)' : 'var(--muted)'} />
        </button>
        <button onClick={onDuplicate} title="Duplicar"
          style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13 }}>⧉</button>
        {showDelete && (
          <button onClick={onDelete} title="Eliminar"
            style={{ background: '#FEE2E2', border: 'none', cursor: 'pointer',
              width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TrashIc s={13} c="var(--error)" />
          </button>
        )}
        <button onClick={onTogglePresence} title="Requiere código presencial"
          style={{ background: mod.requiresPresenceCode ? 'var(--orange-bg)' : 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LockIc s={13} c={mod.requiresPresenceCode ? 'var(--orange)' : 'var(--muted)'} />
        </button>
        {mod.requiresPresenceCode && mod.isDbModule && (
          <button onClick={onGenerateCode} title="Generar código para clase"
            style={{ background: 'var(--orange-bg)', border: 'none', cursor: 'pointer', color: 'var(--orange)',
              height: 26, padding: '0 8px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
            🔑 Código
          </button>
        )}
        {mod.type === 'closing_record' && (
          <button onClick={onOpenActa} title="Diligenciar el acta de cierre"
            style={{ background: '#FEF3C7', border: 'none', cursor: 'pointer', color: '#B45309',
              height: 26, padding: '0 8px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
            📋 Diligenciar
          </button>
        )}
        {mod.type === 'clone_dashboard' && (
          <button onClick={onOpenPlan} title="El plan se carga por grupo, en Grupos y listados"
            style={{ background: '#DBEAFE', border: 'none', cursor: 'pointer', color: '#1D4ED8',
              height: 26, padding: '0 8px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
            📚 Cargar plan
          </button>
        )}
        {mod.type === 'final_delivery' && (
          <button onClick={onSetAvailability} title="Definir fechas de disponibilidad de la entrega"
            style={{ background: (mod.availableFrom || mod.availableUntil) ? 'var(--orange-bg)' : 'var(--bg-alt)',
              border: 'none', cursor: 'pointer', color: (mod.availableFrom || mod.availableUntil) ? 'var(--orange)' : 'var(--muted)',
              height: 26, padding: '0 8px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 4,
              flexShrink: 0, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
            📅 Disponibilidad
          </button>
        )}
        <div onClick={onToggle}
          style={{ width: 38, height: 20, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
            background: mod.enabled ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}>
          <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
            left: mod.enabled ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
        </div>
      </div>
    </div>
  )
}

// ─── Formulario de disponibilidad de la entrega (rango de fechas) ────────────
// Convierte entre ISO (guardado) y el valor de <input type="datetime-local">.
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const AvailabilityForm = ({ mod, onSave, onCancel }) => {
  const [from, setFrom]   = React.useState(toLocalInput(mod.availableFrom))
  const [until, setUntil] = React.useState(toLocalInput(mod.availableUntil))
  const [err, setErr]     = React.useState('')
  const inp = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }
  const save = () => {
    const fromIso  = from  ? new Date(from).toISOString()  : null
    const untilIso = until ? new Date(until).toISOString() : null
    if (fromIso && untilIso && new Date(fromIso) >= new Date(untilIso)) { setErr('La fecha de cierre debe ser posterior a la de apertura.'); return }
    onSave(fromIso, untilIso)
  }
  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 14, lineHeight: 1.5 }}>
        Define entre qué fechas el estudiante podrá subir su entrega. Fuera de ese rango, el módulo aparece cerrado. Deja un campo vacío para no poner límite por ese lado.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={lbl}>🟢 Disponible desde (apertura)</label>
          <input type="datetime-local" value={from} onChange={e => { setFrom(e.target.value); setErr('') }} style={inp} />
        </div>
        <div>
          <label style={lbl}>🔴 Disponible hasta (cierre)</label>
          <input type="datetime-local" value={until} onChange={e => { setUntil(e.target.value); setErr('') }} style={inp} />
        </div>
      </div>
      {err && <p style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600, margin: '10px 0 0' }}>⚠️ {err}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <Btn variant="secondary" full onClick={() => onSave(null, null)}>Quitar límite</Btn>
        <Btn variant="gradient" full onClick={save}>Guardar fechas</Btn>
      </div>
      <p style={{ fontSize: 11, color: 'var(--subtle)', margin: '10px 0 0' }}>Recuerda Publicar para que el cambio llegue a los estudiantes.</p>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font)' }}>Cancelar</button>
      </div>
    </div>
  )
}

// ─── Modo Curso: edita los módulos reales de la copia del tutor ───────────────
const EMPTY_CERT_CONFIG = { enabled: false, title: '', achievementText: '', signatoryName: '', signatoryRole: '', hours: '' }

const CourseEditor = ({ courseId, courseName: initialName, expiresAt, onBack }) => {
  const isMobile = useMobile()
  const courses  = useStore(s => s.courses || [])
  const institutions = useStore(s => s.institutions || [])
  const courseRow = React.useMemo(() => courses.find(c => c.id === courseId), [courses, courseId])
  // El tema del curso (los forks copian el theme del padre) alimenta el preview temático.
  const courseTheme = courseRow?.theme || null
  const [moduleList, setModuleList]     = React.useState([])
  const [loading, setLoading]           = React.useState(true)
  const [loadErr, setLoadErr]           = React.useState('')
  const [courseName, setCourseName]     = React.useState(initialName || '')
  const [certConfig, setCertConfig]     = React.useState(EMPTY_CERT_CONFIG)
  const [saving, setSaving]             = React.useState(false)
  const [publishing, setPublishing]     = React.useState(false)
  const [hasDraft, setHasDraft]         = React.useState(false)
  const [savedMsg, setSavedMsg]         = React.useState('')
  const [dragIdx, setDragIdx]           = React.useState(null)
  const [overIdx, setOverIdx]           = React.useState(null)
  const [editingModule, setEditingModule]       = React.useState(null)
  const [editingChallenge, setEditingChallenge] = React.useState(null)
  const [editingQuiz, setEditingQuiz]           = React.useState(null)
  const [showNewChallenge, setShowNewChallenge] = React.useState(false)
  const [showAddModule, setShowAddModule]       = React.useState(false)
  const [showPreview, setShowPreview]           = React.useState(false)
  const [showCertPreview, setShowCertPreview]   = React.useState(false)
  const [availModalMod, setAvailModalMod]       = React.useState(null)
  const [codeModalMod, setCodeModalMod]         = React.useState(null)
  const [generatedCode, setGeneratedCode]       = React.useState(null)
  const [codeGenError, setCodeGenError]         = React.useState('')
  const [codeGenLoading, setCodeGenLoading]     = React.useState(false)
  const [showImport, setShowImport]             = React.useState(false)
  const [importSourceId, setImportSourceId]     = React.useState('')
  const [importing, setImporting]               = React.useState(false)

  // Versiones de ESTE MISMO curso hechas en OTROS colegios — se pueden traer
  // como plantilla para reemplazar la ruta actual (pedido: usar la versión que
  // otra profesora dejó lista en su colegio). Se apoya en la misma "familia":
  // mismo parent_course_id que este fork. Solo aparecen las que el tutor puede
  // leer (cualquier fork activo, tras la migración 0041).
  const importableForks = React.useMemo(() => {
    const parentId = courseRow?.parent_course_id
    if (!parentId) return []
    return courses
      .filter(c => c.id !== courseId && c.parent_course_id === parentId && c.is_active)
      .map(c => ({ ...c, institutionName: institutions.find(i => i.id === c.institution_id)?.name || 'Otro colegio' }))
  }, [courses, institutions, courseId, courseRow])

  React.useEffect(() => {
    setLoading(true); setLoadErr('')
    loadCourseForEditing(courseId).then(({ modules, error, hasDraft, draftName, certConfig: cc }) => {
      if (error) { setLoadErr(error); setLoading(false); return }
      setModuleList(modules)
      setHasDraft(!!hasDraft)
      if (hasDraft && draftName) setCourseName(draftName)
      setCertConfig(cc || EMPTY_CERT_CONFIG)
      setLoading(false)
    })
  }, [courseId])

  // ─── drag & drop ───
  const handleDrop = (i) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = [...moduleList]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved)
    setModuleList(next); setDragIdx(null); setOverIdx(null)
  }

  const toggleEnabled = (id) => setModuleList(l => l.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  const toggleRequiresPresence = (id) => setModuleList(l => l.map(m => m.id === id ? { ...m, requiresPresenceCode: !m.requiresPresenceCode } : m))
  const setModuleAvailability = (id, from, until) => setModuleList(l => l.map(m => m.id === id ? { ...m, availableFrom: from, availableUntil: until } : m))

  const openCodeModal = (mod) => { setCodeModalMod(mod); setGeneratedCode(null); setCodeGenError('') }
  const handleGenerateCode = async () => {
    if (!codeModalMod) return
    setCodeGenLoading(true); setCodeGenError('')
    try {
      const row = await generatePresenceCode(codeModalMod.id)
      setGeneratedCode(row)
    } catch (err) {
      const detail = err?.message || err?.hint || err?.details || ''
      setCodeGenError(detail ? `No se pudo generar el código: ${detail}` : 'No se pudo generar el código. Intenta de nuevo.')
      console.error('generatePresenceCode:', err)
    } finally {
      setCodeGenLoading(false)
    }
  }
  const deleteModule  = (id) => setModuleList(l => l.filter(m => m.id !== id))

  const duplicateModule = (mod) => {
    const dup = {
      ...mod,
      id: 'new_' + Date.now(),
      title: 'Copia — ' + mod.title,
      _dbRow: null,
    }
    setModuleList(l => [...l, dup])
  }

  // ─── edición de contenido ───
  const saveBaseModuleOverride = (data) => {
    const { title, desc, task, xp, content } = data
    setModuleList(l => l.map(m => m.id === editingModule?.id
      ? { ...m, title, desc, task, xp, content, override: { title, desc, task, xp, content } } : m))
    setEditingModule(null)
  }

  const saveChallengeOverride = (override) => {
    if (override.__clearOverride) {
      setModuleList(l => l.map(m => m.id === editingChallenge?.id
        ? { ...m, override: null } : m))
    } else if (editingChallenge?.isNew) {
      setModuleList(l => [...l, {
        id: 'new_' + Date.now(), type: 'challenge',
        ctype: editingChallenge.ctype, enabled: true,
        _dbRow: null, ...override,
      }])
    } else {
      setModuleList(l => l.map(m => m.id === editingChallenge?.id
        ? { ...m, ...override, override: { ...(m.override || {}), ...override } } : m))
    }
    setEditingChallenge(null)
  }

  const saveQuizCustom = (mod) => {
    if (!editingQuiz?.id || editingQuiz?.isNew) {
      setModuleList(l => [...l, { id: 'new_' + Date.now(), enabled: true, _dbRow: null, ...mod }])
    } else {
      setModuleList(l => l.map(m => m.id === editingQuiz.id ? { ...m, ...mod } : m))
    }
    setEditingQuiz(null)
  }

  const handleNewChallenge = ({ ctype, title, desc, task, xp }) => {
    setShowNewChallenge(false)
    const template = { isNew: true, type: 'challenge', ctype, title, desc, task, xp }
    if (ctype === 'quiz' || ctype === 'poll') setEditingQuiz({ ...template, questions: [] })
    else setEditingChallenge(template)
  }

  const addFinalDelivery = () => {
    if (moduleList.some(m => m.type === 'final_delivery')) return
    setModuleList(l => [...l, {
      id: 'new_fd_' + Date.now(), type: 'final_delivery', ctype: null,
      title: 'Entrega Final', desc: 'Sube tu rejilla pedagógica.',
      task: '', xp: 300, enabled: true, _dbRow: null,
    }])
  }

  // Acta de cierre: la DILIGENCIA el tutor; el docente-estudiante la ve en su
  // ruta como constancia y el nodo se le completa cuando el tutor la cierra.
  // ⚠️ Mientras siga en borrador, bloquea el nodo siguiente del grupo.
  const addClosingRecord = () => {
    if (moduleList.some(m => m.type === 'closing_record')) return
    setModuleList(l => [...l, {
      id: 'new_cr_' + Date.now(), type: 'closing_record', ctype: null,
      title: 'Acta de cierre', desc: 'Asistencia y observaciones del cierre del curso con el grupo.',
      task: '', xp: 50, enabled: true, _dbRow: null,
    }])
  }

  // Tablero del plan de unidades (piloto clon, 0052). El módulo NO guarda el
  // contenido: el plan lo carga el tutor por GRUPO en "Grupos y listados", así
  // que cada docente ve el suyo. Aquí solo se agrega la puerta a la ruta.
  const addCloneDashboard = () => {
    if (moduleList.some(m => m.type === 'clone_dashboard')) return
    setModuleList(l => [...l, {
      id: 'new_cd_' + Date.now(), type: 'clone_dashboard', ctype: null,
      title: 'Plan de unidades del libro',
      desc: 'Orden en que debes trabajar las unidades del libro con tus alumnos y los ejes articuladores de cada una.',
      task: '', xp: 100, enabled: true, _dbRow: null,
    }])
  }

  const addCustomModule = (mod) => {
    setModuleList(l => [...l, { id: 'new_' + Date.now(), enabled: true, _dbRow: null, ...mod }])
  }

  // Importa la ruta de otro colegio: REEMPLAZA la lista actual con sus módulos
  // (traídos como módulos nuevos, sin pisar el colegio de origen). Queda como
  // cambio sin guardar: el tutor revisa y luego Guarda borrador / Publica.
  const handleImportFork = async () => {
    if (!importSourceId) return
    setImporting(true)
    const { modules, error } = await loadModulesForImport(importSourceId)
    setImporting(false)
    if (error) { setSavedMsg('⚠️ ' + error); return }
    setModuleList(modules)
    setShowImport(false)
    const src = importableForks.find(f => f.id === importSourceId)
    setImportSourceId('')
    setSavedMsg(`📥 Ruta importada de ${src?.institutionName || 'otro colegio'} — revísala y luego Guarda borrador o Publica`)
    setTimeout(() => setSavedMsg(''), 5000)
  }

  // ─── guardar borrador / publicar / descartar ───
  // "Guardar borrador" NO afecta a los estudiantes (courses.draft_modules).
  // "Publicar" recién aplica el cambio a course_modules, que es lo que leen.
  const handleSaveDraft = async () => {
    setSaving(true); setSavedMsg('')
    const result = await saveCourseDraft(courseId, moduleList, courseName, certConfig)
    setSaving(false)
    if (result.error) { setSavedMsg('⚠️ ' + result.error); return }
    setHasDraft(true)
    setSavedMsg('💾 Borrador guardado — los estudiantes aún NO ven este cambio')
    setTimeout(() => setSavedMsg(''), 3500)
  }

  const handlePublish = async () => {
    setPublishing(true); setSavedMsg('')
    const result = await publishCourseModules(courseId, moduleList, courseName, certConfig)
    setPublishing(false)
    if (result.error) { setSavedMsg('⚠️ ' + result.error); return }
    // Recarga para obtener los UUIDs reales de los módulos nuevos
    const { modules, certConfig: cc } = await loadCourseForEditing(courseId)
    setModuleList(modules)
    setCertConfig(cc || EMPTY_CERT_CONFIG)
    setHasDraft(false)
    setSavedMsg('🚀 Publicado — ya es lo que ven los estudiantes')
    setTimeout(() => setSavedMsg(''), 3500)
  }

  const handleDiscardDraft = async () => {
    setSaving(true); setSavedMsg('')
    await discardCourseDraft(courseId)
    const { modules, certConfig: cc } = await loadCourseForEditing(courseId)
    setModuleList(modules)
    setCertConfig(cc || EMPTY_CERT_CONFIG)
    setHasDraft(false)
    setSaving(false)
    setSavedMsg('Borrador descartado — vuelto a lo publicado')
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const btnRow = (onClick, color, bg, hoverBg, icon, label) => ({
    onClick, onMouseEnter: e => e.currentTarget.style.background = hoverBg,
    onMouseLeave: e => e.currentTarget.style.background = bg,
    style: { marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 12,
      border: `2px dashed ${color}`, background: bg, color, cursor: 'pointer',
      fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600, width: '100%', justifyContent: 'center', transition: 'all .2s' },
  })

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Cargando módulos…</div>
  if (loadErr) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--error)', fontSize: 14 }}>⚠️ {loadErr}</div>

  const activeCount = moduleList.filter(m => m.enabled).length

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} title="Volver"
            style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '8px 12px', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
            ← Volver
          </button>
          <div>
            <h2 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 2 }}>Editar módulos del curso</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Versión de este colegio (la comparte contigo cualquier otro tutor asignado a él). Los estudiantes solo ven lo que publiques — puedes editar y previsualizar sin afectarlos hasta que estés conforme.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {savedMsg && <span style={{ fontSize: 13, fontWeight: 600, color: savedMsg.startsWith('⚠️') ? 'var(--error)' : 'var(--success)' }}>{savedMsg}</span>}
          {importableForks.length > 0 && (
            <Btn variant="secondary" disabled={saving || publishing} onClick={() => { setImportSourceId(importableForks[0].id); setShowImport(true) }}>📥 Importar de otro colegio</Btn>
          )}
          <Btn variant="secondary" onClick={() => setShowPreview(true)}>👁 Vista previa</Btn>
          {hasDraft && <Btn variant="secondary" disabled={saving || publishing} onClick={handleDiscardDraft}>🗑 Descartar borrador</Btn>}
          <Btn variant="secondary" disabled={saving || publishing} onClick={handleSaveDraft}>{saving ? '⏳ Guardando…' : '💾 Guardar borrador'}</Btn>
          <Btn variant="gradient" disabled={saving || publishing} onClick={handlePublish}>{publishing ? '⏳ Publicando…' : '🚀 Publicar'}</Btn>
        </div>
      </div>

      {/* Estado de publicación + vigencia (informativa) */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        {hasDraft ? (
          <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: '#FEF3C7', color: '#B45309' }}>
            🟠 Tienes cambios sin publicar — los estudiantes siguen viendo la versión anterior
          </span>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: '#CCFBF1', color: 'var(--success)' }}>
            ✅ Publicado — es lo que ven los estudiantes
          </span>
        )}
        <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, background: 'var(--bg-alt)', color: 'var(--muted)' }}>
          {expiresAt
            ? `📅 Vigente para este colegio hasta ${new Date(expiresAt).toLocaleDateString('es-CO')}`
            : '📅 Vigencia indefinida para este colegio'}
        </span>
      </div>

      {/* Nombre del curso */}
      <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)', marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 5 }}>
          Nombre personalizado del curso
        </label>
        <input value={courseName} onChange={e => setCourseName(e.target.value)}
          placeholder="Ej: Laboratorio — IED San Francisco"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Solo para tu referencia interna — los estudiantes SIEMPRE ven el nombre del curso original, nunca este.</p>
      </div>

      {/* Certificado del curso */}
      <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--bg-alt)', border: '1px solid var(--border)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: certConfig.enabled ? 14 : 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
              🎓 Certificado al completar la ruta
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>
              Se emite automáticamente cuando el estudiante completa el 100% de los módulos habilitados.
            </p>
          </div>
          <div onClick={() => setCertConfig(c => ({ ...c, enabled: !c.enabled }))}
            style={{ width: 38, height: 20, borderRadius: 10, flexShrink: 0, cursor: 'pointer',
              background: certConfig.enabled ? 'var(--success)' : 'var(--border)', position: 'relative', transition: 'background .2s' }}>
            <div style={{ position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
              left: certConfig.enabled ? 20 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
          </div>
        </div>
        {certConfig.enabled && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Título del certificado</label>
              <input value={certConfig.title} onChange={e => setCertConfig(c => ({ ...c, title: e.target.value }))}
                placeholder={getCourseDisplayName(courses, courseRow) || 'Nombre del curso'}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Texto de logro</label>
              <textarea value={certConfig.achievementText} onChange={e => setCertConfig(c => ({ ...c, achievementText: e.target.value }))}
                placeholder={DEFAULT_CERT_ACHIEVEMENT_TEXT} rows={2}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Nombre de quien firma</label>
                <input value={certConfig.signatoryName} onChange={e => setCertConfig(c => ({ ...c, signatoryName: e.target.value }))}
                  placeholder="Ej: Prof. Juan Pérez"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Rol / institución</label>
                <input value={certConfig.signatoryRole} onChange={e => setCertConfig(c => ({ ...c, signatoryRole: e.target.value }))}
                  placeholder="Ej: Instructor · CEINFES"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ width: 140 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Intensidad (horas)</label>
                <input type="number" min={0} value={certConfig.hours ?? ''} onChange={e => setCertConfig(c => ({ ...c, hours: e.target.value }))}
                  placeholder="Ej: 8"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Los campos vacíos usan los valores por defecto (placeholder). Si dejas las horas vacías, no se muestran en el certificado.</p>
            <Btn variant="secondary" size="sm" onClick={() => setShowCertPreview(true)} style={{ alignSelf: 'flex-start' }}>👁 Vista previa del certificado</Btn>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>
              Módulos — {activeCount} activo{activeCount !== 1 ? 's' : ''} de {moduleList.length}
            </h3>
            <span style={{ fontSize: 11, color: 'var(--subtle)' }}>⋮⋮ Arrastra para reordenar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {moduleList.map((mod, i) => (
              <ModuleRow key={mod.id}
                mod={mod} idx={i} dragIdx={dragIdx} overIdx={overIdx} isMobile={isMobile}
                onDragStart={() => setDragIdx(i)}
                onDragOver={() => setOverIdx(i)}
                onDrop={() => handleDrop(i)}
                onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
                onOpenActa={() => {
                  if (!mod.isDbModule) { setSavedMsg('⚠️ Publica la ruta primero para poder diligenciar el acta'); return }
                  nav('closing-record', mod.id)
                }}
                onOpenPlan={() => nav('clone-groups')}
                onEdit={() => {
                  if (mod.type === 'lesson' || mod.type === 'final_delivery' || mod.type === 'closing_record'
                      || mod.type === 'clone_dashboard') setEditingModule(mod)
                  else if (mod.ctype === 'quiz' || mod.ctype === 'poll') setEditingQuiz(mod)
                  else setEditingChallenge(mod)
                }}
                onDuplicate={() => duplicateModule(mod)}
                onToggle={() => toggleEnabled(mod.id)}
                onDelete={() => deleteModule(mod.id)}
                showDelete={true}
                onTogglePresence={() => toggleRequiresPresence(mod.id)}
                onGenerateCode={() => openCodeModal(mod)}
                onSetAvailability={() => setAvailModalMod(mod)}
              />
            ))}
          </div>

          <button {...btnRow(() => setShowNewChallenge(true), 'var(--purple)', 'var(--purple-bg)', '#EDE9FE')}>
            <PlusIc s={18} c="var(--purple)" /> Crear nuevo reto
          </button>
          <button {...btnRow(() => setShowAddModule(true), 'var(--success)', '#F0FDFA', '#CCFBF1')}>
            <PlusIc s={18} c="var(--success)" /> Crear módulo personalizado
          </button>
          {!moduleList.some(m => m.type === 'final_delivery') && (
            <button {...btnRow(addFinalDelivery, 'var(--success)', '#CCFBF1', '#99F6E4')}>
              <PlusIc s={18} c="var(--success)" /> Agregar Entrega Final
            </button>
          )}
          {!moduleList.some(m => m.type === 'closing_record') && (
            <button {...btnRow(addClosingRecord, '#B45309', '#FEF3C7', '#FDE68A')}>
              <PlusIc s={18} c="#B45309" /> Agregar Acta de Cierre
            </button>
          )}
          {!moduleList.some(m => m.type === 'clone_dashboard') && (
            <button {...btnRow(addCloneDashboard, '#1D4ED8', '#DBEAFE', '#BFDBFE')}>
              <PlusIc s={18} c="#1D4ED8" /> Agregar Plan de Unidades del libro
            </button>
          )}
        </div>

        {/* Guion estándar de Aula en Vivo — solo si el curso tiene tema inmersivo */}
        <LiveRundown theme={courseTheme} />

        {/* Tips */}
        <div style={{ padding: 18, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Cómo usar el editor</h4>
          {[
            { icon: '⋮⋮', text: 'Arrastra para cambiar el orden de los módulos.' },
            { icon: '✏️', text: 'Edita el contenido de cualquier módulo o reto.' },
            { icon: '⧉',  text: 'Duplica un módulo para reutilizarlo.' },
            { icon: '🗑️', text: 'Elimina módulos que no necesites.' },
            { icon: '🟢', text: 'Activa o desactiva módulos con el toggle.' },
            { icon: '💾', text: 'Guarda para que tus estudiantes vean los cambios.' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{tip.icon}</span>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{tip.text}</p>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: 10, borderRadius: 10, background: 'var(--orange-bg)', border: '1px solid var(--orange-pale)' }}>
            <p style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
              ✏️ Estás editando la versión de este colegio. Los cambios los verán sus estudiantes, y cualquier otro tutor asignado a este colegio ve y puede seguir editando esta misma versión.
            </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Importar ruta de otro colegio" width={460}>
        <p style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 14, lineHeight: 1.5 }}>
          Trae la ruta que otro colegio ya dejó lista para este mismo curso. <strong>Reemplaza</strong> los módulos que tienes ahora en el editor — el colegio de origen no se toca, y no afecta a tus estudiantes hasta que Guardes borrador o Publiques.
        </p>
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }}>Versión a importar</label>
        <select value={importSourceId} onChange={e => setImportSourceId(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', boxSizing: 'border-box', marginBottom: 16 }}>
          {importableForks.map(f => <option key={f.id} value={f.id}>Versión de {f.institutionName}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" full onClick={() => setShowImport(false)}>Cancelar</Btn>
          <Btn variant="gradient" full disabled={importing || !importSourceId} onClick={handleImportFork}>
            {importing ? '⏳ Importando…' : '📥 Importar y reemplazar'}
          </Btn>
        </div>
      </Modal>
      <NewChallengeModal open={showNewChallenge} onClose={() => setShowNewChallenge(false)} onCreate={handleNewChallenge} />
      <ChallengeEditorModal open={!!editingChallenge} mod={editingChallenge} onClose={() => setEditingChallenge(null)} onSave={saveChallengeOverride} />
      <QuizCreatorModal open={!!editingQuiz} initial={editingQuiz?.isNew ? null : editingQuiz} onClose={() => setEditingQuiz(null)} onSave={saveQuizCustom}
        variant={editingQuiz?.ctype === 'poll' ? 'poll' : 'quiz'} />
      <CustomModuleModal open={!!editingModule} initial={editingModule}
        onClose={() => setEditingModule(null)} onSave={saveBaseModuleOverride} />
      <CustomModuleModal open={showAddModule}
        onClose={() => setShowAddModule(false)}
        onSave={mod => { addCustomModule(mod); setShowAddModule(false) }} />
      <RoutePreviewModal open={showPreview} onClose={() => setShowPreview(false)}
        area={null} moduleList={moduleList} customModules={[]} theme={courseTheme} />
      <Modal open={!!availModalMod} onClose={() => setAvailModalMod(null)} title="Disponibilidad de la entrega" width={420}>
        {availModalMod && (
          <AvailabilityForm
            mod={availModalMod}
            onSave={(from, until) => { setModuleAvailability(availModalMod.id, from, until); setAvailModalMod(null) }}
            onCancel={() => setAvailModalMod(null)}
          />
        )}
      </Modal>
      <Modal open={showCertPreview} onClose={() => setShowCertPreview(false)} title="Vista previa del certificado" width={860}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4 landscape; margin: 0; }
            body * { visibility: hidden !important; }
            #cert-preview, #cert-preview * { visibility: visible !important; }
            #cert-preview { position: absolute !important; left: 0; top: 0; width: 100% !important;
              box-shadow: none !important; margin: 0 !important; }
          }
        ` }} />
        <div className="cert-prev-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, flex: 1, minWidth: 180 }}>
            Así se verá el certificado con la configuración actual. El nombre y la fecha son de ejemplo.
          </p>
          <Btn variant="gradient" size="sm" onClick={() => window.print()}>🖨️ Descargar / Imprimir</Btn>
        </div>
        <CertificateCard
          idAttr="cert-preview"
          isMobile={isMobile}
          title={certConfig.title || getCourseDisplayName(courses, courseRow) || 'Nombre del curso'}
          achievementText={certConfig.achievementText || DEFAULT_CERT_ACHIEVEMENT_TEXT}
          hours={certConfig.hours}
          studentName="Nombre del Estudiante"
          dateStr={new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          {...fichaCertificado(courseId)}
        />
      </Modal>
      <Modal open={!!codeModalMod} onClose={() => setCodeModalMod(null)}
        title={`Código presencial — ${codeModalMod?.title || ''}`} width={380}>
        <div style={{ textAlign: 'center', padding: '4px 0' }}>
          {generatedCode ? (
            <>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: 8, color: 'var(--orange)', margin: '12px 0' }}>
                {generatedCode.code}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                {generatedCode.expires_at
                  ? `Válido hasta las ${new Date(generatedCode.expires_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}.`
                  : 'Sin vencimiento — funciona hasta que generes uno nuevo.'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Dilo en voz alta en clase — solo funciona para este módulo.</p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              Genera un código nuevo para esta clase. Al generarlo, cualquier código anterior de este módulo deja de funcionar.
            </p>
          )}
          {codeGenError && <p style={{ color: 'var(--error)', fontSize: 12 }}>{codeGenError}</p>}
          <Btn variant="primary" onClick={handleGenerateCode} disabled={codeGenLoading} style={{ marginTop: 8 }}>
            {codeGenLoading ? 'Generando...' : generatedCode ? 'Regenerar código' : 'Generar código'}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}

// ─── Selector: colegio → curso → crear/abrir copia ───────────────────────────
const InstructorRouteEditor = () => {
  const institutions           = useStore(s => s.institutions)
  const instructorInstitutions = useStore(s => s.instructorInstitutions || [])
  const institutionCourses     = useStore(s => s.institutionCourses || [])
  const courses                = useStore(s => s.courses || [])
  const userCourses            = useStore(s => s.userCourses || [])
  const user                   = useStore(s => s.user)
  const isMobile = useMobile()

  // Instituciones a las que este instructor está asignado.
  // Si no tiene ninguna asignada en instructor_institutions pero sí tiene
  // institution_id en su perfil, se usa esa como fallback (ej. instructores
  // creados antes de que existiera la tabla instructor_institutions).
  const myInstitutions = React.useMemo(() => {
    const assigned = instructorInstitutions
      .filter(ii => ii.instructor_id === user?.id)
      .map(ii => institutions.find(i => i.id === ii.institution_id))
      .filter(Boolean)
    if (assigned.length > 0) return assigned
    // fallback: institución del perfil
    if (user?.institution_id) {
      const inst = institutions.find(i => i.id === user.institution_id)
      return inst ? [inst] : []
    }
    return []
  }, [instructorInstitutions, institutions, user])

  // Si solo tiene una institución, pre-seleccionarla
  const [routeInstitution, setRouteInstitution] = React.useState(() =>
    myInstitutions.length === 1 ? myInstitutions[0].id : '')

  React.useEffect(() => {
    if (myInstitutions.length === 1 && !routeInstitution)
      setRouteInstitution(myInstitutions[0].id)
  }, [myInstitutions])

  // ── Modo curso (fork activo) ──
  const [activeFork, setActiveFork] = React.useState(null) // { id, name }

  // ── Selector de curso (dentro del colegio) ──
  const [selectedCourseId, setSelectedCourseId] = React.useState('')
  const [forking, setForking]   = React.useState(false)
  const [forkErr, setForkErr]   = React.useState('')

  // Cursos que el instructor tiene acceso Y que están en la institución seleccionada
  const allowedCourseIds = React.useMemo(() =>
    new Set(userCourses.filter(uc => uc.user_id === user?.id && uc.is_active).map(uc => uc.course_id)),
    [userCourses, user])

  const linkedCourses = React.useMemo(() => {
    if (!routeInstitution) return []
    return institutionCourses
      .filter(r => r.institution_id === routeInstitution && r.is_active)
      .map(r => courses.find(c => c.id === r.course_id))
      .filter(c => c && (allowedCourseIds.size === 0 || allowedCourseIds.has(c.id)) && !c.parent_course_id)
  }, [routeInstitution, institutionCourses, courses, allowedCourseIds])

  // Autoseleccionar si solo hay un curso
  React.useEffect(() => {
    if (linkedCourses.length === 1) setSelectedCourseId(linkedCourses[0].id)
    else setSelectedCourseId('')
    setForkErr('')
  }, [routeInstitution])

  const selectedCourse = linkedCourses.find(c => c.id === selectedCourseId) || null

  // ¿Ya existe una copia para este colegio? Es compartida entre todos los
  // tutores asignados a él (no solo quien la creó), para que todos editen
  // la MISMA ruta que verá el estudiante.
  const existingFork = React.useMemo(() => {
    if (!selectedCourseId || !routeInstitution) return null
    return courses.find(c =>
      c.parent_course_id === selectedCourseId &&
      c.institution_id === routeInstitution &&
      c.is_active
    ) || null
  }, [courses, selectedCourseId, routeInstitution])

  // Versiones YA editadas de este mismo curso en OTROS colegios — permite
  // partir de una de ellas en vez de empezar desde el curso original (ej.
  // "usar la versión que ya ajusté para el Colegio CEINFES" en un colegio
  // nuevo). Solo visibles si el instructor tiene acceso de lectura a esos
  // forks (asignado como instructor a esos colegios, o admin).
  const siblingForks = React.useMemo(() => {
    if (!selectedCourseId || !routeInstitution) return []
    return courses
      .filter(c => c.parent_course_id === selectedCourseId && c.institution_id !== routeInstitution && c.is_active)
      .map(c => ({ ...c, institutionName: institutions.find(i => i.id === c.institution_id)?.name || 'Otro colegio' }))
  }, [courses, institutions, selectedCourseId, routeInstitution])

  const [cloneSourceId, setCloneSourceId] = React.useState('')
  React.useEffect(() => { setCloneSourceId('') }, [selectedCourseId, routeInstitution])

  const handleOpenFork = async (useExisting) => {
    if (useExisting && existingFork) {
      setActiveFork({ id: existingFork.id, name: existingFork.name })
      return
    }
    if (!selectedCourseId || !routeInstitution) return
    setForking(true); setForkErr('')
    const result = await forkCourseForInstitution(selectedCourseId, routeInstitution, cloneSourceId || undefined)
    setForking(false)
    if (result.error) { setForkErr(result.error); return }
    setActiveFork({ id: result.id, name: result.name })
  }

  // ── Si hay un fork activo, renderiza el editor de curso ──
  if (activeFork) {
    // Vigencia informativa: la del curso ORIGINAL para este colegio (institution_courses),
    // no del fork — el acceso del estudiante siempre se rige por esa fecha (ver 0030).
    const activeForkExpiry = institutionCourses.find(
      r => r.institution_id === routeInstitution && r.course_id === selectedCourseId
    )?.expires_at || null
    return <CourseEditor courseId={activeFork.id} courseName={activeFork.name} expiresAt={activeForkExpiry} onBack={() => setActiveFork(null)} />
  }

  // ── Vista principal: selector de los cursos asignados al instructor ──
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Editor de Ruta de Formación</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Elige uno de tus cursos para crear y editar la versión de tu colegio.</p>
        </div>

        {/* ── Selector: colegio + curso ── */}
        <div style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--white)', border: '2px solid var(--orange)', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            📚 Tus cursos
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Colegio (solo si el instructor tiene más de uno) */}
            {myInstitutions.length > 1 && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }}>🏫 Colegio</label>
                <select value={routeInstitution} onChange={e => { setRouteInstitution(e.target.value); setSelectedCourseId('') }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }}>
                  <option value="">— Elige un colegio —</option>
                  {myInstitutions.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}
                </select>
              </div>
            )}
            {/* Curso */}
            {routeInstitution && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }}>📖 Curso</label>
                {linkedCourses.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No tienes cursos asignados en este colegio.</p>
                ) : (
                  <select value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setForkErr('') }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }}>
                    <option value="">— Elige un curso —</option>
                    {linkedCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* CTA: abrir o crear copia */}
          {selectedCourse && (
            <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 12,
              background: existingFork ? '#F0FDFA' : '#FFFBEB',
              border: `1.5px solid ${existingFork ? '#86EFAC' : '#FCD34D'}` }}>
              {existingFork ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F766E' }}>✅ Ya existe una versión personalizada de "{selectedCourse.name}" para este colegio</div>
                    <div style={{ fontSize: 12, color: '#115E59', marginTop: 2 }}>"{existingFork.name}" — esto es exactamente lo que ven tus estudiantes. Si otro tutor de este colegio la edita, tú verás sus cambios y viceversa.</div>
                  </div>
                  <Btn variant="gradient" onClick={() => handleOpenFork(true)}>✏️ Seguir editando</Btn>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>📋 Crear la versión de "{selectedCourse.name}" para este colegio</div>
                      <div style={{ fontSize: 12, color: '#78350F', marginTop: 2 }}>
                        {cloneSourceId
                          ? 'Se copiará el contenido de la versión elegida abajo. El original y esa otra versión quedan intactos.'
                          : 'Se generará una copia completa del curso base para este colegio. El original queda intacto.'}
                        {' '}Cualquier tutor asignado a este colegio podrá seguir editándola después.
                      </div>
                    </div>
                    <Btn variant="gradient" disabled={forking} onClick={() => handleOpenFork(false)}>
                      {forking ? '⏳ Creando copia…' : '✨ Crear versión del colegio'}
                    </Btn>
                  </div>
                  {siblingForks.length > 0 && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #FCD34D' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 5 }}>
                        Empezar desde
                      </label>
                      <select value={cloneSourceId} onChange={e => setCloneSourceId(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }}>
                        <option value="">🆕 Curso original (en blanco)</option>
                        {siblingForks.map(f => (
                          <option key={f.id} value={f.id}>📋 Copiar la versión de {f.institutionName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              {forkErr && <p style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600, marginTop: 8 }}>⚠️ {forkErr}</p>}
            </div>
          )}
        </div>

      </div>

      {/* Ayuda: cómo funciona el editor por curso */}
      <div style={{ padding: 18, borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)', maxWidth: 560 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>Cómo funciona</h4>
        {[
          { icon: '📚', text: 'Elige uno de los cursos que tienes asignados.' },
          { icon: '✨', text: 'La primera vez se crea la versión de ese colegio (una copia del curso). El original queda intacto.' },
          { icon: '✏️', text: 'Edita módulos, retos, su orden y contenido a tu antojo.' },
          { icon: '👥', text: 'Es compartida: si otro tutor asignado al mismo colegio también la edita, ambos ven y modifican la misma versión.' },
          { icon: '💾', text: 'Guarda: los estudiantes de ese colegio verán tus cambios.' },
        ].map((tip, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{tip.icon}</span>
            <p style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.6, margin: 0 }}>{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InstructorRouteEditor
