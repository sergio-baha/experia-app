import React from 'react'
import { createPortal } from 'react-dom'
import { PlusIc, XIc, CheckIc, ChevRIc, Btn, ImageUploader, RichInput, RichText, ZoomImg, useMobile } from '../ui.jsx'
import { BANK_AREAS, ROUND_LABELS, DIFFICULTY, loadQuestionBank, bankToModuleQuestion } from '../../lib/questionBankMeta.js'
import QuestionBankPicker from './QuestionBankPicker.jsx'
import { PassageToggle } from './PassageView.jsx'
import { useStore } from '../../store/store.jsx'
import { SABER_GUIDES, checkRound, evidenceInfo, evidenceIndex, tagWithBank } from '../../lib/saberGuide.js'

const newQuestionId = () => `q_${crypto.randomUUID().slice(0, 8)}`
const newQuestion = (isPoll) => ({ id: newQuestionId(), question: '', options: ['', '', '', ''], ...(isPoll ? {} : { correct: 0 }) })
const normalizeQuestion = (question, isPoll) => ({ ...question, id: question.id || newQuestionId(), ...(isPoll ? {} : { correct: question.correct ?? 0 }) })
// Una pregunta "vacía" (la que trae un quiz recién creado) se reemplaza al
// agregar la primera del banco, en vez de quedar como pregunta en blanco.
const isBlank = (q) => !q.question?.trim() && (q.options || []).every(o => !o?.trim())

// Pregunta copiada del banco: su evidencia la fija el banco, no se puede cambiar
// (si no, bastaría con reetiquetar para "cuadrar" el reparto de competencias).
const isBankQuestionId = (id) => /^(mate|bio|qui|fis|lec|soc)-\d+$/.test(id || '')

// Evidencia de la Guía Saber 11 de una pregunta (obligatoria en una ronda).
const EvidenceSelect = ({ area, question, onChange }) => {
  const guide = SABER_GUIDES[area]
  if (!guide) return null
  const info = evidenceInfo(area, question.evidencia)
  const locked = isBankQuestionId(question.id) && !!info
  return (
    <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: 'var(--white)',
      border: `1.5px solid ${info ? 'var(--border)' : 'var(--error)'}` }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: info ? 'var(--muted)' : 'var(--error)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 4 }}>
        Evidencia de la Guía Saber 11 {locked ? '(del banco)' : '— obligatoria'}
      </label>
      {!locked && (
        <select value={question.evidencia || ''} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 12.5, background: 'var(--white)', marginBottom: info ? 6 : 0 }}>
          <option value="">— Elige la evidencia que evalúa esta pregunta —</option>
          {guide.competencias.map(c => (
            <optgroup key={c.id} label={c.label}>
              {c.afirmaciones.flatMap(a => Object.entries(a.evidencias)).map(([code, text]) => (
                <option key={code} value={code}>{code} — {text.length > 90 ? text.slice(0, 88) + '…' : text}</option>
              ))}
            </optgroup>
          ))}
        </select>
      )}
      {info && (
        <div style={{ fontSize: 11.5, color: 'var(--text-sec)', lineHeight: 1.45 }}>
          <b style={{ color: 'var(--purple)' }}>{info.competencia.label}</b><br />
          <b>Afirmación {info.afirmacion.n}.</b> {info.afirmacion.text}<br />
          <b>Evidencia {info.code}.</b> {info.evidencia}
        </div>
      )}
    </div>
  )
}

// Barra fija de la regla: siempre a la vista mientras el tutor arma la ronda.
// Dice qué le falta en palabras y cuánto lleva de cada competencia.
const RoundBar = ({ check, isMobile }) => (
  <div role="status" aria-live="polite" style={{ flexShrink: 0, padding: isMobile ? '8px 14px' : '10px 24px',
    background: check.ok ? '#ECFDF5' : '#FEF2F2', borderBottom: `2px solid ${check.ok ? '#15803D' : '#B91C1C'}`,
    display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16, flexWrap: 'wrap' }}>
    <div style={{ flex: '1 1 260px', minWidth: 0, fontSize: 13, fontWeight: 800, lineHeight: 1.35, color: check.ok ? '#166534' : '#991B1B' }}>
      {check.ok
        ? `⚖️ En equilibrio: ${check.n} preguntas cumplen la distribución de la Guía Saber 11.`
        : `⚖️ ${check.guidance}`}
    </div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {check.rows.map(r => {
        const done = r.need === 0
        return (
          <span key={r.id} title={`${r.label}: ${r.pct} % de la prueba`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap', background: '#fff', color: done ? '#166534' : '#991B1B', border: `1.5px solid ${done ? '#15803D' : '#B91C1C'}` }}>
            {done ? '✓' : r.need > 0 ? `${r.need === 1 ? 'falta' : 'faltan'} ${r.need}` : `${r.need === -1 ? 'sobra' : 'sobran'} ${-r.need}`} · {r.short} <b>{r.actual}/{r.goal}</b>
          </span>
        )
      })}
    </div>
  </div>
)

const QuizCreatorModal = ({ open, initial, onClose, onSave, variant = 'quiz', usedElsewhere = {} }) => {
  const isPoll = variant === 'poll'
  const [title, setTitle]   = React.useState('')
  const [desc, setDesc]     = React.useState('')
  const [task, setTask]     = React.useState('')
  const [xp, setXp]         = React.useState(100)
  const [questions, setQs]  = React.useState([])
  const [correctMsg, setCorrectMsg]     = React.useState('')
  const [incorrectMsg, setIncorrectMsg] = React.useState('')
  const [passingScore, setPassingScore] = React.useState(60)
  const [maxAttempts, setMaxAttempts]   = React.useState('')
  const [passMsg, setPassMsg]           = React.useState('')
  const [failMsg, setFailMsg]           = React.useState('')
  const [err, setErr]       = React.useState('')
  // --- Passage (texto/imágenes de apoyo, opcional) ---
  const [pOn, setPOn]       = React.useState(false)
  const [pIntro, setPIntro] = React.useState('')
  const [pTitle, setPTitle] = React.useState('')
  const [pText, setPText]   = React.useState('')
  const [pSource, setPSrc]  = React.useState('')
  const [pImgs, setPImgs]   = React.useState([])
  // --- Banco de preguntas (rondas en vivo, módulos 4 y 6) ---
  const [bankArea, setBankArea]   = React.useState('')
  const [bankRound, setBankRound] = React.useState(null)
  // Pantalla completa: en celular, pestaña visible (preguntas de la ronda | banco)
  const [tab, setTab]             = React.useState('round')
  const [settingsOpen, setSettingsOpen] = React.useState(true)
  const [openQ, setOpenQ]         = React.useState(() => new Set()) // preguntas desplegadas para editar
  const isMobile = useMobile(900)
  const role = useStore(s => s.user?.role)
  const toggleOpenQ = (id) => setOpenQ(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  // Escape cierra la pantalla, como cerraba el modal.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  React.useEffect(() => {
    if (open) {
      setBankArea(initial?.bank || '')
      setBankRound(initial?.bankRound || null)
      setTab('round')
      // En una ronda del banco lo importante son las preguntas: los ajustes
      // generales (descripción, mensajes, resultado) arrancan plegados.
      setSettingsOpen(!initial?.bank)
      setOpenQ(new Set((initial?.questions || []).filter(isBlank).map(q => q.id)))
      setTitle(initial?.title || '')
      setDesc(initial?.desc || '')
      setTask(initial?.task || '')
      setXp(initial?.xp || 100)
      setQs(initial?.questions?.length ? initial.questions.map(q => normalizeQuestion(q, isPoll)) : [newQuestion(isPoll)])
      setCorrectMsg(initial?.correctMessage || '')
      setIncorrectMsg(initial?.incorrectMessage || '')
      setPassingScore(initial?.passingScore ?? 60)
      setMaxAttempts(initial?.maxAttempts != null ? String(initial.maxAttempts) : '')
      setPassMsg(initial?.passMessage || '')
      setFailMsg(initial?.failMessage || '')
      setErr('')
      const ps = initial?.passage
      setPOn(!!ps)
      setPIntro(ps?.intro || '')
      setPTitle(ps?.title || '')
      setPText((ps?.paragraphs || []).join('\n\n'))
      setPSrc(ps?.source || '')
      setPImgs(ps?.images || [])
    }
  }, [open, initial])

  // Rondas guardadas antes de la asociación con la guía: las preguntas del
  // banco toman su evidencia del banco al abrir el editor.
  React.useEffect(() => {
    if (!open || !bankArea) return
    let alive = true
    loadQuestionBank().then(bank => {
      if (!alive) return
      const index = evidenceIndex(bank)
      setQs(list => tagWithBank(list, index))
    }).catch(() => {})
    return () => { alive = false }
  }, [open, bankArea])

  const addImg = (url) => setPImgs(l => [...l, { url, caption: '', width: 340, height: 420 }])
  const updImg = (i, k, v) => setPImgs(l => l.map((im, idx) => idx === i ? { ...im, [k]: v } : im))
  const rmImg  = (i) => setPImgs(l => l.filter((_, idx) => idx !== i))

  const buildPassage = () => {
    if (!pOn) return null
    const blocks = pText.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
    const paragraphs = blocks.length > 1 ? blocks : pText.split('\n').map(s => s.trim()).filter(Boolean)
    const images = pImgs.filter(im => im.url).map(im => ({
      url: im.url,
      ...(im.caption ? { caption: im.caption } : {}),
      ...(im.width  ? { width:  Number(im.width)  } : {}),
      ...(im.height ? { height: Number(im.height) } : {}),
    }))
    const p = {}
    if (pIntro.trim())  p.intro = pIntro.trim()
    if (pTitle.trim())  p.title = pTitle.trim()
    if (paragraphs.length) p.paragraphs = paragraphs
    if (images.length) { p.images = images; p.imagesLayout = 'row' }
    if (pSource.trim()) p.source = pSource.trim()
    return Object.keys(p).length ? p : null
  }

  const [advOpen, setAdvOpen] = React.useState({}) // id -> bool (opciones avanzadas abiertas)
  const toggleAdv = (id) => setAdvOpen(o => ({ ...o, [id]: !o[id] }))

  // Banco: marcar/desmarcar una pregunta. Se COPIA al módulo (texto de
  // lectura y pista incluidos); editarla aquí no cambia el banco.
  const toggleBankQ = (bq, bank) => setQs(list => {
    if (list.some(x => x.id === bq.id)) {
      const rest = list.filter(x => x.id !== bq.id)
      return rest.length ? rest : [newQuestion(isPoll)]
    }
    return [...list.filter(x => !isBlank(x)), bankToModuleQuestion(bq, bank)]
  })
  const restoreDefaults = async () => {
    if (!bankArea || !bankRound) return
    if (!window.confirm(`¿Reemplazar las ${questions.length} preguntas actuales por las predeterminadas de la ${ROUND_LABELS[bankRound]?.toLowerCase() || 'ronda'}?`)) return
    const bank = await loadQuestionBank()
    const byId = Object.fromEntries(bank.questions.map(q => [q.id, q]))
    const ids = bank.defaults?.[bankArea]?.[`r${bankRound}`] || []
    if (ids.length) setQs(ids.map(id => bankToModuleQuestion(byId[id], bank)))
  }
  const diffCounts = Object.keys(DIFFICULTY).map(k => [k, questions.filter(q => q.difficulty === k).length]).filter(([, n]) => n)
  // ⚠️ Regla de la Guía Saber 11: una ronda que no la cumpla no se guarda.
  const roundCheck = !isPoll && bankArea ? checkRound(bankArea, questions.filter(q => !isBlank(q))) : null

  const addQ = () => {
    const nq = newQuestion(isPoll)
    setQs(q => [...q, nq])
    setOpenQ(s => new Set(s).add(nq.id))
  }
  const removeQ = (id) => setQs(q => q.filter(x => x.id !== id))
  const updateQ = (id, key, val) => setQs(q => q.map(x => x.id === id ? { ...x, [key]: val } : x))
  const dupQ = (id) => setQs(q => {
    const i = q.findIndex(x => x.id === id); if (i < 0) return q
    const copy = { ...q[i], id: newQuestionId(), options: [...q[i].options], optionImages: [...(q[i].optionImages || [])] }
    return [...q.slice(0, i + 1), copy, ...q.slice(i + 1)]
  })
  const moveQ = (id, dir) => setQs(q => {
    const i = q.findIndex(x => x.id === id); const j = i + dir
    if (i < 0 || j < 0 || j >= q.length) return q
    const next = [...q];[next[i], next[j]] = [next[j], next[i]]; return next
  })
  const updateOpt = (qId, optIdx, val) => setQs(q => q.map(x => {
    if (x.id !== qId) return x
    const opts = [...x.options]; opts[optIdx] = val
    return { ...x, options: opts }
  }))
  // Imagen por opción (opción visual). '' para quitarla.
  const updateOptImg = (qId, optIdx, url) => setQs(q => q.map(x => {
    if (x.id !== qId) return x
    const imgs = [...(x.optionImages || [])]; imgs[optIdx] = url
    return { ...x, optionImages: imgs }
  }))

  const handleSave = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    if (!questions.length) { setErr('Agrega al menos una pregunta'); return }
    // Una opción es válida si tiene texto O una imagen (opciones visuales).
    const incomplete = questions.find(q => !q.question.trim() || q.options.some((o, i) => !o.trim() && !(q.optionImages?.[i])))
    if (incomplete) { setErr('Completa todas las preguntas y opciones (texto o imagen en cada opción)'); return }
    if (roundCheck && !roundCheck.ok) { setErr('Aún no se puede guardar. ' + roundCheck.guidance); return }
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 100, questions: cleanQuestions(), passage: buildPassage(), type: 'challenge', ctype: isPoll ? 'poll' : 'quiz',
      bank: (!isPoll && bankArea) || null, bankRound: (!isPoll && bankArea && bankRound) || null,
      ...(isPoll ? {} : {
        correctMessage: correctMsg.trim(), incorrectMessage: incorrectMsg.trim(),
        passingScore: Math.min(100, Math.max(0, Number(passingScore) || 0)),
        maxAttempts: (maxAttempts === '' || Number(maxAttempts) <= 0) ? null : Math.floor(Number(maxAttempts)),
        passMessage: passMsg.trim(), failMessage: failMsg.trim(),
      }) })
  }

  // Limpia campos opcionales vacíos y normaliza números antes de guardar
  const cleanQuestions = () => questions.map(q => {
    const out = { id: q.id, question: q.question.trim(), options: q.options }
    if (!isPoll) out.correct = q.correct
    if (q.image) {
      out.image = q.image
      if (q.imageHeight) out.imageHeight = Number(q.imageHeight)
      if (q.imagePosition) out.imagePosition = q.imagePosition   // before | between | after
      // 'between' parte la pregunta en dos: `question` (antes) + `questionAfter` (después de la imagen)
      if (q.imagePosition === 'between' && q.questionAfter?.trim()) out.questionAfter = q.questionAfter.trim()
    }
    // Imágenes por opción (opciones visuales): array alineado por índice, '' donde no hay
    const optImgs = q.optionImages || []
    if (optImgs.some(u => u)) out.optionImages = q.options.map((_, i) => optImgs[i] || '')
    if (!isPoll && q.explanation?.trim()) out.explanation = q.explanation.trim()
    if (!isPoll && q.explanationImage) out.explanationImage = q.explanationImage
    if (q.timeLimit) out.timeLimit = Number(q.timeLimit)
    if (!isPoll && q.points) out.points = Number(q.points)
    if (!isPoll && q.weight !== '' && q.weight != null && Number(q.weight) >= 0) out.weight = Number(q.weight)
    if (q.difficulty) out.difficulty = q.difficulty
    if (!isPoll && q.evidencia) out.evidencia = q.evidencia
    // Rondas del banco: el texto de lectura viaja con su pregunta y la pista la
    // dice el tutor en la clase en vivo (snapshot de 0075).
    if (q.passage) out.passage = q.passage
    if (!isPoll && q.hint?.trim()) out.hint = q.hint.trim()
    return out
  })

  const inp = { padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const advLbl = { fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 4 }

  if (!open) return null

  const screenTitle = isPoll ? (initial ? 'Editar encuesta en vivo' : 'Crear encuesta en vivo')
    : bankArea ? `${ROUND_LABELS[bankRound] || 'Ronda de preguntas'} — ${BANK_AREAS[bankArea]?.icon || ''} ${BANK_AREAS[bankArea]?.label || ''}`
    : (initial ? 'Editar reto Quiz' : 'Crear reto Quiz')
  const showBank = !isPoll && !!bankArea
  const realCount = questions.filter(q => !isBlank(q)).length
  // Rondas del banco (nov 2026): el PROFESOR solo elige preguntas del banco —
  // no crea ni duplica preguntas sueltas. El admin conserva ambas opciones
  // para casos especiales. Un quiz sin banco no cambia.
  const bankOnly = !!bankArea && !isPoll && role !== 'admin'
  const showLeft  = !isMobile || !showBank || tab === 'round'
  const showRight = showBank && (!isMobile || tab === 'bank')
  const tabBtn = (active) => ({ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 800,
    background: 'transparent', color: active ? 'var(--orange)' : 'var(--muted)', borderBottom: `3px solid ${active ? 'var(--orange)' : 'transparent'}` })

  // Pantalla completa (antes un modal de 600 px): a la izquierda las preguntas
  // del módulo, a la derecha el banco SIEMPRE visible para ir agregando sin
  // cambiar de vista. En celular, dos pestañas.
  return createPortal(
    <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '10px 14px' : '12px 24px', background: 'var(--white)',
        borderBottom: '1px solid var(--border)', flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={onClose} title="Cerrar sin guardar (Esc)"
          style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <XIc s={16} c="var(--muted)" />
        </button>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)' }}>{screenTitle}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            {title || 'Sin título'} · <b style={{ color: 'var(--orange)' }}>{realCount} pregunta{realCount !== 1 ? 's' : ''}</b>
            {diffCounts.length > 0 && <> · {diffCounts.map(([k, n]) => `${n} ${DIFFICULTY[k].label.toLowerCase()}`).join(' · ')}</>}
          </div>
        </div>
        {err && <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>{err}</span>}
        <Btn variant="secondary" size="sm" onClick={onClose}>Cancelar</Btn>
        <Btn variant="gradient" size="sm" onClick={handleSave}>{initial ? '💾 Guardar cambios' : 'Crear reto'}</Btn>
      </div>

      {roundCheck && <RoundBar check={roundCheck} isMobile={isMobile} />}

      {isMobile && showBank && (
        <div style={{ display: 'flex', background: 'var(--white)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button style={tabBtn(tab === 'round')} onClick={() => setTab('round')}>📝 Preguntas del módulo ({realCount})</button>
          <button style={tabBtn(tab === 'bank')} onClick={() => setTab('bank')}>📚 Banco</button>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
      {showLeft && (
      <div style={{ flex: showBank ? '1 1 55%' : 1, minWidth: 0, overflowY: 'auto', padding: isMobile ? '16px 14px 40px' : '22px 26px 60px' }}>
      <div style={{ maxWidth: showBank ? 'none' : 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ── Banco de preguntas: lo primero que ve el tutor en una ronda ── */}
        {!isPoll && (
          <div style={{ padding: 14, borderRadius: 12, background: 'var(--orange-bg)', border: '1.5px solid var(--orange)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--orange)' }}>📚 Banco de preguntas</span>
              <select value={bankArea} onChange={e => setBankArea(e.target.value)}
                style={{ padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 12.5, background: 'var(--white)' }}>
                {!bankRound && <option value="">— Sin banco —</option>}
                {Object.entries(BANK_AREAS).map(([k, a]) => <option key={k} value={k}>{a.icon} {a.label}</option>)}
              </select>
              {bankArea && (
                <select value={bankRound || ''} onChange={e => setBankRound(Number(e.target.value) || null)}
                  style={{ padding: '5px 8px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 12.5, background: 'var(--white)' }}>
                  <option value="">Ronda…</option>
                  <option value="1">{ROUND_LABELS[1]} (módulo 4)</option>
                  <option value="2">{ROUND_LABELS[2]} (módulo 6)</option>
                </select>
              )}
            </div>
            {bankArea ? (
              <>
                <p style={{ fontSize: 12.5, color: 'var(--text-sec)', margin: '10px 0', lineHeight: 1.55 }}>
                  {isMobile
                    ? <>Abre la pestaña <b>📚 Banco</b> para revisar todas las preguntas de la asignatura y agregar las que prefieras.</>
                    : <>A la derecha está <b>todo el banco</b> de la asignatura: revisa las preguntas y usa <b>+ Agregar</b> en las que te gusten; para sacar una del módulo, <b>✓ En el módulo</b> o 🗑 aquí abajo.</>}
                  {' '}En la clase en vivo aparecen una a una cuando avanzas, y el tutor del curso da la pista de cada una.
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {isMobile && <Btn variant="gradient" size="sm" onClick={() => setTab('bank')}>📚 Ver el banco</Btn>}
                  {bankRound && <Btn variant="secondary" size="sm" onClick={restoreDefaults}>↺ Volver a las predeterminadas</Btn>}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 11.5, color: 'var(--muted)', margin: '8px 0 0' }}>
                Elige una asignatura para traer preguntas listas (con su pista) en vez de escribirlas una a una.
              </p>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }} placeholder="Ej: Evaluación de conceptos clave" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>XP</label>
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} min={0} style={inp} />
          </div>
        </div>
        <button onClick={() => setSettingsOpen(o => !o)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700, color: 'var(--purple)', alignSelf: 'flex-start' }}>
          <span style={{ display: 'inline-block', transform: settingsOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
            <ChevRIc s={13} c="var(--purple)" />
          </span>
          ⚙️ {settingsOpen ? 'Ocultar' : 'Más'} ajustes (descripción, instrucción, mensajes{!isPoll ? ', resultado final' : ''})
        </button>
        {settingsOpen && (<>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Descripción breve</label>
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Resumen para el mapa de aprendizaje" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Instrucción al estudiante</label>
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="Ej: Responde todas las preguntas y confirma cada respuesta" style={inp} />
        </div>
        {!isPoll && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje de acierto (opcional)</label>
              <input value={correctMsg} onChange={e => setCorrectMsg(e.target.value)} placeholder="✓ ¡Correcto!" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje de error (opcional)</label>
              <input value={incorrectMsg} onChange={e => setIncorrectMsg(e.target.value)} placeholder="✗ Respuesta correcta:" style={inp} />
            </div>
          </div>
        )}

        {/* ── Resultado final: qué ve el estudiante al terminar el quiz ── */}
        {!isPoll && (
          <div style={{ padding: '14px', borderRadius: 12, background: 'var(--orange-bg)', border: '1px solid var(--orange-pale)' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', display: 'block', marginBottom: 10 }}>
              🏁 Resultado final (al terminar todas las preguntas)
            </label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Puntaje mínimo para aprobar (%)</label>
                <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} min={0} max={100} style={{ ...inp, width: 110 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Intentos permitidos</label>
                <input type="number" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} min={1} placeholder="∞ ilimitados" style={{ ...inp, width: 130 }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 10px' }}>Si no se alcanza el mínimo, el estudiante no puede continuar. Deja "Intentos" vacío para ilimitados; al agotarlos, se le pide acudir al tutor para reiniciar.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje si aprueba (opcional)</label>
                <textarea value={passMsg} onChange={e => setPassMsg(e.target.value)} rows={2} placeholder="¡Excelente trabajo! Aprobaste la evaluación." style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Mensaje si no aprueba (opcional)</label>
                <textarea value={failMsg} onChange={e => setFailMsg(e.target.value)} rows={2} placeholder="Aún no alcanzas el puntaje mínimo. ¡Sigue practicando!" style={{ ...inp, resize: 'vertical' }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--muted)', margin: '8px 0 0' }}>Los campos vacíos usan el mensaje por defecto (mostrado como ejemplo).</p>
          </div>
        )}

        {/* ── Texto / imágenes de apoyo (passage) ──
            En una ronda del banco cada pregunta trae su propio texto, así que
            el texto común del módulo se oculta (salvo que ya tuviera uno). */}
        {(!bankArea || pOn) && <div style={{ padding: '14px', borderRadius: 12, background: 'var(--purple-bg)', border: '1px solid var(--purple)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--purple)' }}>
            <input type="checkbox" checked={pOn} onChange={e => setPOn(e.target.checked)} />
            Agregar texto o imágenes de apoyo (se muestran encima de las preguntas)
          </label>

          {pOn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
              <input value={pIntro} onChange={e => setPIntro(e.target.value)} placeholder="Instrucción (ej: DE ACUERDO CON EL SIGUIENTE TEXTO RESPONDE LAS PREGUNTAS 1 A 3)" style={inp} />
              <input value={pTitle} onChange={e => setPTitle(e.target.value)} placeholder="Título del texto (opcional)" style={inp} />
              <textarea value={pText} onChange={e => setPText(e.target.value)} rows={6}
                placeholder="Pega aquí el texto de lectura. Separa los párrafos con una línea en blanco."
                style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />

              {/* Imágenes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pImgs.map((im, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 10, background: 'var(--white)', border: '1px solid var(--border)' }}>
                    <img src={im.url} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input value={im.caption} onChange={e => updImg(i, 'caption', e.target.value)} placeholder="Pie de imagen (ej: Recuadro 1)" style={{ ...inp, fontSize: 12 }} />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <label style={{ fontSize: 11, color: 'var(--muted)' }}>Ancho px</label>
                        <input type="number" value={im.width || ''} onChange={e => updImg(i, 'width', e.target.value)} placeholder="auto" min={40} style={{ ...inp, width: 80, fontSize: 12 }} />
                        <label style={{ fontSize: 11, color: 'var(--muted)' }}>Alto máx px</label>
                        <input type="number" value={im.height || ''} onChange={e => updImg(i, 'height', e.target.value)} placeholder="auto" min={40} style={{ ...inp, width: 80, fontSize: 12 }} />
                      </div>
                    </div>
                    <button onClick={() => rmImg(i)} title="Quitar imagen"
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <XIc s={13} c="var(--error)" />
                    </button>
                  </div>
                ))}
                <ImageUploader label="Subir imagen" compact onUploaded={addImg} />
              </div>

              <input value={pSource} onChange={e => setPSrc(e.target.value)} placeholder="Fuente / autor (opcional)" style={inp} />
            </div>
          )}
        </div>}
        </>)}

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 12 }}>
            Preguntas del módulo ({realCount}){bankArea ? ' — en este orden salen en la clase en vivo' : ''}
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {questions.map((q, qi) => {
              const isOpenQ = openQ.has(q.id)
              return (
              <div key={q.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--white)',
                border: `1.5px solid ${isOpenQ ? 'var(--purple)' : 'var(--border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: isOpenQ ? 10 : 6 }}>
                  <span onClick={() => toggleOpenQ(q.id)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', cursor: 'pointer', flex: 1, minWidth: 0 }}>
                    Pregunta {qi + 1}
                    {q.difficulty && <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: q.difficulty === 'dificil' ? '#FEE2E2' : q.difficulty === 'facil' ? '#DCFCE7' : '#FEF3C7',
                      color: q.difficulty === 'dificil' ? 'var(--error)' : q.difficulty === 'facil' ? 'var(--success)' : '#B45309' }}>
                      {q.difficulty === 'dificil' ? 'Difícil' : q.difficulty === 'facil' ? 'Fácil' : 'Media'}</span>}
                    {!isPoll && bankArea && evidenceInfo(bankArea, q.evidencia) && (
                      <span title={`Afirmación ${evidenceInfo(bankArea, q.evidencia).afirmacion.n}: ${evidenceInfo(bankArea, q.evidencia).afirmacion.text}`}
                        style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'var(--purple-bg)', color: 'var(--purple)' }}>
                        🎯 {evidenceInfo(bankArea, q.evidencia).competencia.label}
                      </span>
                    )}
                    {q.passage && <span title={q.passage.intro} style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: 'var(--purple-bg)', color: 'var(--purple)' }}>📖 {q.passage.title || 'Texto de lectura'}</span>}
                  </span>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => toggleOpenQ(q.id)} title={isOpenQ ? 'Plegar' : 'Editar esta pregunta'}
                      style={{ height: 26, padding: '0 9px', borderRadius: 7, border: '1px solid var(--purple)', cursor: 'pointer',
                        background: isOpenQ ? 'var(--purple)' : 'var(--white)', color: isOpenQ ? '#fff' : 'var(--purple)',
                        fontFamily: 'var(--font)', fontSize: 11.5, fontWeight: 700 }}>
                      {isOpenQ ? 'Listo' : '✏️ Editar'}
                    </button>
                    {[['up', -1, '↑'], ['down', 1, '↓']].map(([k, dir, sym]) => (
                      <button key={k} onClick={() => moveQ(q.id, dir)} disabled={dir < 0 ? qi === 0 : qi === questions.length - 1} title={dir < 0 ? 'Subir' : 'Bajar'}
                        style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)',
                          fontSize: 14, fontWeight: 700, color: 'var(--muted)', opacity: (dir < 0 ? qi === 0 : qi === questions.length - 1) ? .3 : 1 }}>{sym}</button>
                    ))}
                    {!bankOnly && <button onClick={() => dupQ(q.id)} title="Duplicar"
                      style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PlusIc s={13} c="var(--muted)" />
                    </button>}
                    <button onClick={() => removeQ(q.id)} disabled={questions.length <= 1} title="Eliminar"
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: questions.length <= 1 ? .3 : 1 }}>
                      <XIc s={13} c="var(--error)" />
                    </button>
                  </div>
                </div>
                {isOpenQ ? (<>
                {q.passage && <PassageToggle passage={q.passage} label="Leer el contexto" style={{ marginBottom: 10 }} />}
                <div style={{ marginBottom: 10 }}>
                  <RichInput multiline rows={2} value={q.question} onChange={v => updateQ(q.id, 'question', v)}
                    placeholder="Escribe la pregunta aquí… (usa la barra para negrilla, color, ∑ fórmulas e 🖼️ imágenes)" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {q.options.map((opt, oi) => {
                    const optImg = q.optionImages?.[oi] || ''
                    return (
                    <div key={oi} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {isPoll ? (
                        <span style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, background: 'var(--bg-alt)', marginTop: 8,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                      ) : (
                        <button onClick={() => updateQ(q.id, 'correct', oi)} title="Marcar como correcta"
                          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0, marginTop: 8,
                            background: q.correct === oi ? 'var(--success)' : 'var(--bg-alt)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {q.correct === oi
                            ? <CheckIc s={13} c="#fff" />
                            : <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{String.fromCharCode(65 + oi)}</span>}
                        </button>
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <RichInput value={opt} onChange={v => updateOpt(q.id, oi, v)}
                          placeholder={`Opción ${String.fromCharCode(65 + oi)}${!isPoll && q.correct === oi ? ' (correcta)' : ''}${optImg ? ' — texto opcional' : ''}`}
                          style={{ border: !isPoll && q.correct === oi ? '1.5px solid var(--success)' : '1.5px solid var(--border)' }} />
                        {optImg ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={optImg} alt="" style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                            <button onClick={() => updateOptImg(q.id, oi, '')} title="Quitar imagen"
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <XIc s={12} c="var(--error)" />
                            </button>
                          </div>
                        ) : (
                          <ImageUploader label="🖼️ Imagen de la opción (opcional)" compact onUploaded={url => updateOptImg(q.id, oi, url)} />
                        )}
                      </div>
                    </div>
                  )})}
                </div>
                {!isPoll && <p style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 8 }}>Haz clic en el círculo para marcar la opción correcta. Cada opción puede llevar texto, imagen, o ambos.</p>}

                {!isPoll && bankArea && <EvidenceSelect area={bankArea} question={q} onChange={v => updateQ(q.id, 'evidencia', v)} />}

                {/* ── Opciones avanzadas por pregunta ── */}
                <button onClick={() => toggleAdv(q.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 0', border: 'none',
                    background: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: 'var(--purple)' }}>
                  <span style={{ display: 'inline-block', transform: advOpen[q.id] ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>
                    <ChevRIc s={13} c="var(--purple)" />
                  </span>
                  ⚙️ Opciones avanzadas {(q.image || (!isPoll && (q.explanation || q.hint))) ? '•' : ''}
                </button>

                {advOpen[q.id] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, padding: 12, borderRadius: 10, background: 'var(--white)', border: '1px dashed var(--border)' }}>
                    {/* Imagen de la pregunta */}
                    <div>
                      <label style={advLbl}>Imagen de la pregunta (opcional)</label>
                      {q.image && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <img src={q.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Alto máx px</label>
                            <input type="number" value={q.imageHeight || ''} onChange={e => updateQ(q.id, 'imageHeight', e.target.value)} placeholder="auto" min={40} style={{ ...inp, width: 80, fontSize: 12 }} />
                            <button onClick={() => { updateQ(q.id, 'image', ''); updateQ(q.id, 'imageHeight', ''); updateQ(q.id, 'imagePosition', '') }} title="Quitar"
                              style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <XIc s={12} c="var(--error)" />
                            </button>
                          </div>
                          {/* Posición de la imagen respecto a la pregunta */}
                          <label style={advLbl}>Posición de la imagen</label>
                          <select value={q.imagePosition || 'before'} onChange={e => updateQ(q.id, 'imagePosition', e.target.value)} style={{ ...inp, fontSize: 12, marginBottom: 6 }}>
                            <option value="before">Antes de la pregunta (arriba)</option>
                            <option value="between">En medio del texto de la pregunta</option>
                            <option value="after">Después de las opciones (abajo)</option>
                          </select>
                          {q.imagePosition === 'between' && (
                            <div style={{ marginTop: 4 }}>
                              <label style={advLbl}>Segunda parte de la pregunta (va DESPUÉS de la imagen)</label>
                              <RichInput multiline rows={2} value={q.questionAfter || ''} onChange={v => updateQ(q.id, 'questionAfter', v)}
                                placeholder="Continúa aquí el texto de la pregunta que va debajo de la imagen…" />
                              <p style={{ fontSize: 10, color: 'var(--subtle)', margin: '4px 0 0' }}>El cuadro principal de arriba es la primera parte; esto va después de la imagen.</p>
                            </div>
                          )}
                        </>
                      )}
                      <ImageUploader label={q.image ? 'Reemplazar imagen' : 'Subir imagen'} compact onUploaded={url => updateQ(q.id, 'image', url)} />
                    </div>

                    {/* Explicación (no aplica a encuestas: no hay respuesta correcta que explicar) */}
                    {!isPoll && (
                      <div>
                        <label style={advLbl}>Explicación (se muestra al estudiante después de responder)</label>
                        <RichInput multiline rows={3} value={q.explanation || ''} onChange={v => updateQ(q.id, 'explanation', v)}
                          placeholder="Explica por qué la respuesta correcta es la correcta… (admite fórmulas e imágenes)" />
                        <div style={{ marginTop: 6 }}>
                          {q.explanationImage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                              <img src={q.explanationImage} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                              <button onClick={() => updateQ(q.id, 'explanationImage', '')} title="Quitar"
                                style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <XIc s={12} c="var(--error)" />
                              </button>
                            </div>
                          )}
                          <ImageUploader label={q.explanationImage ? 'Reemplazar imagen' : 'Imagen de la explicación (opcional)'} compact onUploaded={url => updateQ(q.id, 'explanationImage', url)} />
                        </div>
                      </div>
                    )}

                    {/* Pista: la dice el tutor del curso en la clase en vivo, a un
                        tercio del tiempo; fuera de la clase, el estudiante la pide. */}
                    {!isPoll && (
                      <div>
                        <label style={advLbl}>💡 Pista del tutor (opcional)</label>
                        <textarea value={q.hint || ''} onChange={e => updateQ(q.id, 'hint', e.target.value)} rows={2}
                          placeholder="Una ayuda que oriente sin dar la respuesta…" style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }} />
                      </div>
                    )}

                    {/* Peso de la pregunta en la calificación (ponderado) */}
                    {!isPoll && (
                      <div>
                        <label style={advLbl}>Peso en la calificación</label>
                        <input type="number" value={q.weight ?? ''} onChange={e => updateQ(q.id, 'weight', e.target.value)} placeholder="1 (igual para todas)" min={0} step="0.1" style={{ ...inp, fontSize: 12, width: 160 }} />
                        <p style={{ fontSize: 10, color: 'var(--subtle)', margin: '4px 0 0' }}>El puntaje del reto se calcula ponderado por estos pesos. Si dejas todas en blanco, valen igual. No tienen que sumar 100 — se normalizan solas.</p>
                      </div>
                    )}

                    {/* Metadatos para el modo en vivo */}
                    <div style={{ display: 'grid', gridTemplateColumns: isPoll ? '1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={advLbl}>Tiempo (s)</label>
                        <input type="number" value={q.timeLimit || ''} onChange={e => updateQ(q.id, 'timeLimit', e.target.value)} placeholder="20" min={5} style={{ ...inp, fontSize: 12 }} />
                      </div>
                      {!isPoll && (
                        <div>
                          <label style={advLbl}>Puntos</label>
                          <input type="number" value={q.points || ''} onChange={e => updateQ(q.id, 'points', e.target.value)} placeholder="1000" min={0} style={{ ...inp, fontSize: 12 }} />
                        </div>
                      )}
                      <div>
                        <label style={advLbl}>Dificultad</label>
                        <select value={q.difficulty || ''} onChange={e => updateQ(q.id, 'difficulty', e.target.value)} style={{ ...inp, fontSize: 12 }}>
                          <option value="">—</option>
                          <option value="facil">Fácil</option>
                          <option value="media">Media</option>
                          <option value="dificil">Difícil</option>
                        </select>
                      </div>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--subtle)', margin: 0 }}>⏱️ Tiempo{!isPoll && ' y puntos'} se usará{!isPoll && 'n'} en el Modo Aula en Vivo (contra reloj).</p>
                  </div>
                )}
                </>) : (
                  // Resumen plegado: enunciado, opciones con la correcta marcada y pista.
                  <div onClick={() => toggleOpenQ(q.id)} style={{ cursor: 'pointer' }}>
                    {q.passage && <PassageToggle passage={q.passage} label="Leer el contexto" style={{ marginBottom: 8 }} />}
                    {q.image && (
                      <div onClick={e => e.stopPropagation()} style={{ marginBottom: 6 }}>
                        <ZoomImg src={q.image} alt="Imagen de la pregunta" style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }} />
                      </div>
                    )}
                    <RichText as="p" style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.45, margin: 0,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {q.question || 'Pregunta sin texto — toca ✏️ Editar'}
                    </RichText>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', marginTop: 6 }}>
                      {(q.options || []).map((o, oi) => (
                        <span key={oi} style={{ fontSize: 11.5, color: !isPoll && q.correct === oi ? 'var(--success)' : 'var(--muted)', fontWeight: !isPoll && q.correct === oi ? 700 : 500 }}>
                          {String.fromCharCode(65 + oi)}) {(o || '').replace(/\*\*|\{\{#[0-9a-fA-F]{3,8}\||\}\}/g, '').slice(0, 60)}{(o || '').length > 60 ? '…' : ''}{!isPoll && q.correct === oi ? ' ✓' : ''}
                        </span>
                      ))}
                    </div>
                    {q.hint && <div style={{ fontSize: 11.5, color: 'var(--orange)', marginTop: 5 }}>💡 {q.hint}</div>}
                  </div>
                )}
              </div>
              )
            })}
          </div>
          {bankOnly ? (
            <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '12px 0 0', lineHeight: 1.5 }}>
              📚 Las preguntas de esta ronda se eligen del banco{isMobile ? ' (pestaña 📚 Banco)' : ' (columna derecha)'}. Así cada pregunta conserva su competencia, su pista y su explicación.
            </p>
          ) : (
          <button onClick={addQ}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, marginTop: 12,
              border: '1.5px dashed var(--purple)', background: 'var(--purple-bg)', color: 'var(--purple)',
              cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600 }}>
            <PlusIc s={14} c="var(--purple)" /> Agregar pregunta
          </button>
          )}
        </div>

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}
      </div>
      </div>
      )}

      {showRight && (
        <div style={{ flex: '1 1 45%', minWidth: 0, overflowY: 'auto', padding: isMobile ? '16px 14px 40px' : '22px 26px 60px',
          background: 'var(--bg-alt)', borderLeft: isMobile ? 'none' : '1px solid var(--border)' }}>
          <QuestionBankPicker embedded area={bankArea} selectedIds={new Set(questions.map(q => q.id))} balance={roundCheck}
            usedElsewhere={usedElsewhere} onToggle={toggleBankQ} />
        </div>
      )}
      </div>
    </div>,
    document.body
  )
}

export default QuizCreatorModal
