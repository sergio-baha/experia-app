import React from 'react'
import { PlusIc, XIc, Btn, Modal, ImageUploader, FileUploader } from '../ui.jsx'
import { SECTION_TYPES } from './constants.js'
import { ActivityPicker, ActivityCard } from '../ActivityCard.jsx'
import { resolveActivity, normalizeCustom, CUSTOM_ID, ACTIVITY_BANKS } from '../../lib/activityBank.js'
import { CustomActivityForm } from '../CustomActivityForm.jsx'
import { isTutorOnlySection } from '../../pages/lesson.jsx'

// Ancho y alto de imágenes y del visor de PDF. Ambos son OPCIONALES y se
// guardan como número de píxeles (el ancho admite además '%'), porque así viajan
// dentro de `content` sin tocar el esquema. Dejarlos vacíos conserva exactamente
// el comportamiento anterior — es lo que hace que las lecciones ya publicadas no
// cambien de aspecto al agregar esta función.
const SizeFields = ({ sec, idx, update, inp, hint }) => (
  <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
      <input value={sec.width ?? ''} onChange={e => update(idx, 'width', e.target.value)}
        placeholder="Ancho (ej. 640 o 80%)" style={inp} />
      <input value={sec.height ?? ''} onChange={e => update(idx, 'height', e.target.value)}
        placeholder="Alto en px (ej. 600)" style={inp} />
    </div>
    {hint && (
      <p style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.5, margin: '6px 0 0' }}>{hint}</p>
    )}
  </>
)

// Recuadro destacado para elegir la actividad del banco de este módulo, o
// crear una propia (queda en `sec.custom` y pasa a ser la por defecto).
const ActivityPanel = ({ sec, onPatch }) => {
  const current = resolveActivity(sec)
  const custom = normalizeCustom(sec.custom)
  const [preview, setPreview] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, border: '2px solid var(--orange)', background: 'var(--orange-bg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1 }}>
            🎲 Actividad de este módulo
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', marginTop: 2 }}>
            {ACTIVITY_BANKS[current?.bank]?.icon} {current?.title}
          </div>
        </div>
        <button type="button" onClick={() => setPreview(p => !p)}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--orange)', background: 'var(--white)', color: 'var(--orange)',
            cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700 }}>
          {preview ? 'Ocultar detalle' : '👁️ Ver detalle'}
        </button>
      </div>
      {preview && <div style={{ marginTop: -20 }}><ActivityCard activity={current} /></div>}
      <div style={{ fontSize: 12, color: 'var(--text-sec)', marginBottom: 8 }}>
        Elige la que mejor se adapte a tu grupo{sec.bank === 'fisicas' ? ' (solo pausas activas físicas)' : ' — físicas o rompehielos'},
        o crea una propia si ninguna del banco te sirve.
        Es la que verán tus estudiantes; en la Clase en Vivo aún puedes cambiarla.
      </div>
      {creating ? (
        <CustomActivityForm initial={sec.custom} saveLabel="Guardar y usar en este módulo" onCancel={() => setCreating(false)}
          onSave={data => { onPatch({ custom: data, activityId: CUSTOM_ID }); setCreating(false) }} />
      ) : (
        <ActivityPicker scope={sec.bank || 'ambas'} value={current?.id} onChange={id => onPatch({ activityId: id })}
          custom={custom} onCreate={() => setCreating(true)} />
      )}
    </div>
  )
}

const CustomModuleModal = ({ open, initial, onClose, onSave, extraActions }) => {
  const [title, setTitle]     = React.useState('')
  const [desc, setDesc]       = React.useState('')
  const [task, setTask]       = React.useState('')
  const [xp, setXp]           = React.useState(50)
  const [sections, setSections] = React.useState([])
  const [err, setErr]         = React.useState('')

  React.useEffect(() => {
    if (open) {
      setTitle(initial?.title || '')
      setDesc(initial?.desc || '')
      setTask(initial?.task || '')
      setXp(initial?.xp || 50)
      setSections(initial?.content || [])
      setErr('')
    }
  }, [open, initial])

  const addSection = (type) => {
    const defaults = {
      intro:   { type: 'intro',   title: '', text: '' },
      text:    { type: 'text',    title: '', text: '' },
      callout: { type: 'callout', title: '', text: '', icon: '💡' },
      video:   { type: 'video',   title: '', url: '', desc: '' },
      embed:   { type: 'embed',   title: '', url: '', desc: '' },
      // width/height vacíos = comportamiento histórico (ancho completo, alto
      // máximo 420 px recortado). Solo al escribirlos se activa el encuadre sin
      // recorte — así ninguna lección ya publicada cambia de aspecto.
      image:   { type: 'image',   title: '', url: '', caption: '', height: '', width: '' },
      pdf:     { type: 'pdf',     title: '', url: '', filename: '', caption: '', height: '', width: '', allowDownload: true },
      checklist: { type: 'checklist', title: '', desc: '', items: [{ t: '' }] },
      download: { type: 'download', title: '', desc: '', url: '', filename: '', filesize: '' },
      activity: { type: 'activity', title: '', bank: 'ambas', activityId: 'rom-01' },
      slides:   { type: 'slides', title: '', desc: '', images: [] },
    }
    setSections(s => [...s, { ...defaults[type], _id: Date.now() }])
  }

  // Salto de página: NO es un tipo de contenido (sin campos propios), es un
  // marcador estructural que `splitContentPages` (lesson.jsx) usa para partir
  // `content` en pantallas. El estudiante debe llegar a la última para poder
  // completar el módulo — ver §5 de CLAUDE.md.
  const addPageBreak = () => setSections(s => [...s, { type: 'pagebreak', _id: Date.now() }])

  const updateSection = (idx, key, val) => setSections(s => s.map((sec, i) => i === idx ? { ...sec, [key]: val } : sec))
  const removeSection = (idx) => setSections(s => s.filter((_, i) => i !== idx))
  const moveSection   = (idx, dir) => {
    const next = [...sections]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSections(next)
  }

  const handleSave = () => {
    if (!title.trim()) { setErr('El título es obligatorio'); return }
    onSave({ title: title.trim(), desc: desc.trim(), task: task.trim(), xp: Number(xp) || 50, content: sections })
  }

  const inp = { width: '100%', padding: '9px 12px', borderRadius: 10, boxSizing: 'border-box',
    border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none', background: 'var(--white)' }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar módulo' : 'Crear módulo personalizado'} width={580}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '70vh', overflow: 'auto', paddingRight: 4 }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Título *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErr('') }}
              placeholder="Ej: Innovación en el Aula" style={inp} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>XP</label>
            <input type="number" value={xp} onChange={e => setXp(e.target.value)} min={0} max={500} style={inp} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Descripción breve</label>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Resumen del módulo para el mapa de aprendizaje" style={inp} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 6 }}>Instrucción para el estudiante (¿Qué debe hacer?)</label>
          <input value={task} onChange={e => setTask(e.target.value)}
            placeholder="Ej: Lee todo el contenido y completa la lección" style={inp} />
        </div>

        {/* Banco de actividades: si el módulo tiene una sección `activity`
            (apertura / pausa activa), el profesor la elige aquí arriba viendo
            todo el banco, sin buscarla entre las secciones. */}
        {sections.map((sec, idx) => sec.type !== 'activity' ? null : (
          <ActivityPanel key={'act' + (sec._id || idx)} sec={sec}
            onPatch={patch => setSections(s => s.map((x, i) => i === idx ? { ...x, ...patch } : x))} />
        ))}

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, display: 'block', marginBottom: 10 }}>Contenido del módulo</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sections.map((sec, idx) => sec.type === 'pagebreak' ? (
              <div key={sec._id || idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, borderTop: '2px dashed var(--orange)' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', whiteSpace: 'nowrap' }}>➗ Nueva página</span>
                <div style={{ flex: 1, borderTop: '2px dashed var(--orange)' }} />
                <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                  style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === 0 ? .3 : 1, flexShrink: 0 }}>↑</button>
                <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                  style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === sections.length - 1 ? .3 : 1, flexShrink: 0 }}>↓</button>
                <button onClick={() => removeSection(idx)}
                  style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2', flexShrink: 0 }}>
                  <XIc s={12} c="var(--error)" />
                </button>
              </div>
            ) : (
              <div key={sec._id || idx} style={{ padding: '14px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                    {SECTION_TYPES.find(t => t.id === sec.type)?.label || sec.type}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => moveSection(idx, -1)} disabled={idx === 0}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === 0 ? .3 : 1 }}>↑</button>
                    <button onClick={() => moveSection(idx, 1)} disabled={idx === sections.length - 1}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', fontSize: 12, opacity: idx === sections.length - 1 ? .3 : 1 }}>↓</button>
                    <button onClick={() => removeSection(idx)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2' }}>
                      <XIc s={12} c="var(--error)" />
                    </button>
                  </div>
                </div>

                {sec.type !== 'video' && sec.type !== 'embed' && sec.type !== 'image' && sec.type !== 'pdf' && sec.type !== 'checklist' && sec.type !== 'download' && (
                  <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                    placeholder="Título de esta sección" style={{ ...inp, marginBottom: 8 }} />
                )}
                {(sec.type === 'intro' || sec.type === 'text') && (
                  <textarea value={sec.text} onChange={e => updateSection(idx, 'text', e.target.value)}
                    placeholder="Escribe el contenido..." rows={3}
                    style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
                )}
                {sec.type === 'callout' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8 }}>
                    <input value={sec.icon} onChange={e => updateSection(idx, 'icon', e.target.value)}
                      placeholder="💡" style={inp} />
                    <textarea value={sec.text} onChange={e => updateSection(idx, 'text', e.target.value)}
                      placeholder="Texto destacado..." rows={2}
                      style={{ ...inp, resize: 'vertical' }} />
                  </div>
                )}
                {sec.type === 'video' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título del video" style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.url} onChange={e => updateSection(idx, 'url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..." style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.desc} onChange={e => updateSection(idx, 'desc', e.target.value)}
                      placeholder="Descripción opcional del video" style={inp} />
                  </>
                )}
                {sec.type === 'embed' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título del recurso" style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.url} onChange={e => updateSection(idx, 'url', e.target.value)}
                      placeholder="https://view.genially.com/..." style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.desc} onChange={e => updateSection(idx, 'desc', e.target.value)}
                      placeholder="Descripción opcional del recurso" style={inp} />
                  </>
                )}
                {sec.type === 'image' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título de la imagen (opcional)" style={{ ...inp, marginBottom: 8 }} />
                    {sec.url && (
                      <img src={sec.url} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'contain',
                        borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)', background: 'var(--bg-alt)' }} />
                    )}
                    <ImageUploader label={sec.url ? 'Reemplazar imagen' : 'Subir imagen'} compact
                      onUploaded={url => updateSection(idx, 'url', url)} />
                    <SizeFields sec={sec} idx={idx} update={updateSection} inp={inp}
                      hint="Con el alto en blanco la imagen se recorta a 420 px de alto. Escribe un alto para verla completa (sin recorte) y un ancho para que no ocupe todo el espacio." />
                    <input value={sec.caption} onChange={e => updateSection(idx, 'caption', e.target.value)}
                      placeholder="Pie de foto (opcional)" style={{ ...inp, marginTop: 8 }} />
                  </>
                )}
                {sec.type === 'pdf' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título del documento (opcional)" style={{ ...inp, marginBottom: 8 }} />
                    {sec.url && (
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>📕 {sec.filename || 'documento.pdf'}</div>
                    )}
                    <FileUploader label={sec.url ? 'Reemplazar PDF' : 'Subir PDF'} compact
                      accept="application/pdf,.pdf" maxSizeMB={25}
                      onUploaded={({ url, name }) => {
                        updateSection(idx, 'url', url)
                        updateSection(idx, 'filename', name)
                      }} />
                    <SizeFields sec={sec} idx={idx} update={updateSection} inp={inp}
                      hint="Alto del visor en píxeles (por defecto 720). El ancho en blanco ocupa todo el espacio disponible. El estudiante puede ampliarlo a pantalla completa." />
                    {/* Lo decide quien arma la ruta: hay material que se consulta
                        en la plataforma pero no se reparte. */}
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={sec.allowDownload !== false}
                        onChange={e => updateSection(idx, 'allowDownload', e.target.checked)}
                        style={{ marginTop: 2, cursor: 'pointer' }} />
                      <span style={{ fontSize: 12.5, color: 'var(--text-sec)', lineHeight: 1.5 }}>
                        Permitir descargarlo y abrirlo aparte
                        <span style={{ display: 'block', fontSize: 11, color: 'var(--subtle)' }}>
                          Desmárcalo para material restringido: se lee dentro de la lección, sin botones de descarga.
                        </span>
                      </span>
                    </label>
                    <input value={sec.caption} onChange={e => updateSection(idx, 'caption', e.target.value)}
                      placeholder="Nota al pie (opcional)" style={{ ...inp, marginTop: 8 }} />
                    <p style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.5, margin: '8px 0 0' }}>
                      En celular el navegador no incrusta PDFs: ahí el estudiante verá una tarjeta con el botón para abrirlo.
                      ⚠️ Restringir la descarga <strong>desalienta</strong> el reparto, pero el archivo sigue siendo accesible
                      para quien conozca su enlace: no lo uses para material confidencial.
                    </p>
                  </>
                )}
                {sec.type === 'download' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título del material (opcional)" style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.desc} onChange={e => updateSection(idx, 'desc', e.target.value)}
                      placeholder="Descripción para el estudiante (opcional)" style={{ ...inp, marginBottom: 8 }} />
                    {sec.url && <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>📎 {sec.filename}</div>}
                    <FileUploader label={sec.url ? 'Reemplazar archivo' : 'Subir archivo'} compact
                      onUploaded={({ url, name, size }) => {
                        updateSection(idx, 'url', url)
                        updateSection(idx, 'filename', name)
                        updateSection(idx, 'filesize', size)
                      }} />
                  </>
                )}
                {sec.type === 'slides' && (
                  <>
                    <input value={sec.desc || ''} onChange={e => updateSection(idx, 'desc', e.target.value)}
                      placeholder="Descripción (opcional)" style={{ ...inp, marginBottom: 8 }} />
                    {(sec.images || []).map((im, ii) => {
                      const imgs = sec.images || []
                      const setImgs = (next) => updateSection(idx, 'images', next)
                      const move = (d) => { const n = [...imgs]; const t = ii + d; if (t < 0 || t >= n.length) return; [n[ii], n[t]] = [n[t], n[ii]]; setImgs(n) }
                      return (
                        <div key={ii} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                          <a href={im.url} target="_blank" rel="noreferrer" title="Abrir en grande">
                            <img src={im.url} alt="" style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)', display: 'block' }} />
                          </a>
                          <input value={im.caption || ''} placeholder={`Pie de la diapositiva ${ii + 1} (opcional)`}
                            onChange={e => setImgs(imgs.map((x, j) => j === ii ? { ...x, caption: e.target.value } : x))}
                            style={{ ...inp, flex: 1 }} />
                          <button type="button" onClick={() => move(-1)} disabled={ii === 0}
                            style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', opacity: ii === 0 ? .3 : 1 }}>↑</button>
                          <button type="button" onClick={() => move(1)} disabled={ii === imgs.length - 1}
                            style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'var(--bg-alt)', opacity: ii === imgs.length - 1 ? .3 : 1 }}>↓</button>
                          <button type="button" onClick={() => setImgs(imgs.filter((_, j) => j !== ii))}
                            style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: '#FEE2E2' }}><XIc s={11} c="var(--error)" /></button>
                        </div>
                      )
                    })}
                    <ImageUploader label="Agregar diapositiva" compact
                      onUploaded={url => updateSection(idx, 'images', [...(sec.images || []), { url, caption: '' }])} />
                    <p style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.5, margin: '6px 0 0' }}>
                      Se muestran a ancho completo y sin recorte, con botón de pantalla completa para proyectarlas en la Clase en Vivo.
                    </p>
                  </>
                )}
                {sec.type !== 'activity' && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, cursor: 'pointer', fontSize: 12, color: 'var(--text-sec)' }}>
                    <input type="checkbox" checked={isTutorOnlySection(sec)} onChange={e => updateSection(idx, 'tutorOnly', e.target.checked)} />
                    👩‍🏫 Solo visible para el docente <span style={{ color: 'var(--subtle)' }}>(guía de la clase; el estudiante no la ve)</span>
                  </label>
                )}
                {sec.type === 'activity' && (
                  <>
                    <select value={sec.bank || 'ambas'} onChange={e => updateSection(idx, 'bank', e.target.value)}
                      style={{ ...inp, marginBottom: 8 }}>
                      <option value="ambas">Físicas o rompehielos (apertura)</option>
                      <option value="fisicas">Solo pausas activas físicas</option>
                      <option value="rompehielos">Solo rompehielos</option>
                    </select>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Actividad: <strong>{resolveActivity(sec)?.title}</strong> — se elige en el recuadro 🎲 de arriba.
                    </div>
                  </>
                )}
                {sec.type === 'saber-results' && (
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>
                    📊 <strong>Resultados Saber del colegio — {sec.area}</strong>: gráficas por competencia, por componente y
                    niveles de desempeño{sec.synthetic ? ' (hoy con datos de ejemplo, sintéticos)' : ''}. Usa <strong>👁️ Vista previa</strong> para verlas.
                  </div>
                )}
                {sec.type === 'checklist' && (
                  <>
                    <input value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)}
                      placeholder="Título de la sección (opcional)" style={{ ...inp, marginBottom: 8 }} />
                    <input value={sec.desc} onChange={e => updateSection(idx, 'desc', e.target.value)}
                      placeholder="Descripción (opcional)" style={{ ...inp, marginBottom: 8 }} />
                    {(sec.items || []).map((item, ii) => (
                      <div key={ii} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input value={item.t} onChange={e => {
                            const items = [...sec.items]; items[ii] = { ...items[ii], t: e.target.value }
                            updateSection(idx, 'items', items)
                          }}
                          placeholder={`Paso ${ii + 1}`} style={{ ...inp, flex: 1 }} />
                        <button onClick={() => updateSection(idx, 'items', sec.items.filter((_, j) => j !== ii))}
                          style={{ width: 26, height: 34, borderRadius: 7, border: 'none', cursor: 'pointer', background: '#FEE2E2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <XIc s={11} c="var(--error)" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => updateSection(idx, 'items', [...(sec.items || []), { t: '' }])}
                      style={{ padding: '4px 12px', borderRadius: 7, border: '1.5px dashed var(--border)', background: 'var(--white)',
                        cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, color: 'var(--muted)' }}>
                      + Agregar paso
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {SECTION_TYPES.map(t => (
              <button key={t.id} onClick={() => addSection(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
                  border: '1.5px dashed var(--border)', background: 'var(--white)', color: 'var(--text-sec)',
                  cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange)'; e.currentTarget.style.color = 'var(--orange)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}>
                <PlusIc s={12} c="currentColor" /> {t.label}
              </button>
            ))}
            <button onClick={addPageBreak}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 8,
                border: '1.5px dashed var(--orange)', background: 'var(--orange-bg)', color: 'var(--orange)',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600 }}>
              <PlusIc s={12} c="currentColor" /> ➗ Salto de página
            </button>
          </div>
          {sections.some(s => s.type === 'pagebreak') && (
            <p style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.5, margin: '8px 0 0' }}>
              Con saltos de página el estudiante navega pantalla por pantalla y debe llegar a la última para poder completar el módulo.
            </p>
          )}
        </div>

        {err && <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
          {extraActions}
          <Btn variant="secondary" full onClick={onClose}>Cancelar</Btn>
          <Btn variant="gradient" full onClick={handleSave}>
            {initial ? 'Guardar cambios' : 'Crear módulo'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}

export default CustomModuleModal
