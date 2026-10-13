import React from 'react'
import { Btn, ImageUploader } from './ui.jsx'
import { normalizeCustom } from '../lib/activityBank.js'

// =============================================
// EXPERIA — Actividad propia (cuando el profesor no quiere una del banco)
// Mismos campos que una actividad del banco (activityBank.js) para que el
// estudiante la vea igual, con ActivityCard. Lo usan el editor de ruta
// (CustomModuleModal → queda como la por defecto del módulo) y la Clase en
// Vivo (LiveHost → solo para esa clase).
// =============================================

const EMPTY_STEP = { time: '', title: '', text: '' }
const FORMATS = ['Individual', 'Parejas', 'Grupos pequeños', 'Todo el grupo']

const label = { fontSize: 11.5, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .6, display: 'block', marginBottom: 5 }
const inp = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 9, border: '1.5px solid var(--border)',
  background: 'var(--white)', color: 'var(--dark)', fontSize: 13.5, fontFamily: 'var(--font)', outline: 'none' }

export const CustomActivityForm = ({ initial, onSave, onCancel, saveLabel = 'Usar esta actividad' }) => {
  const [a, setA] = React.useState(() => ({
    title: initial?.title || '', format: initial?.format || '', duration: initial?.duration || '10 min',
    goal: initial?.goal || '', outcome: initial?.outcome || '', image: initial?.image || '',
    steps: initial?.steps?.length ? initial.steps.map(s => ({ ...EMPTY_STEP, ...s })) : [{ ...EMPTY_STEP }, { ...EMPTY_STEP }, { ...EMPTY_STEP }],
  }))
  const [err, setErr] = React.useState('')
  const set = (k, v) => setA(x => ({ ...x, [k]: v }))
  const setStep = (i, k, v) => setA(x => ({ ...x, steps: x.steps.map((s, j) => j === i ? { ...s, [k]: v } : s) }))

  const save = () => {
    const c = normalizeCustom(a)
    if (!c) return setErr('Escribe el nombre de la actividad.')
    if (!c.steps.length && !c.goal) return setErr('Describe al menos el objetivo o un paso.')
    const { id, bank, ...data } = c // eslint-disable-line no-unused-vars
    onSave(data)
  }

  return (
    <div style={{ padding: 14, borderRadius: 12, background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--dark)' }}>✏️ Actividad propia</div>
      <div>
        <label style={label}>Nombre *</label>
        <input value={a.title} onChange={e => set('title', e.target.value)} placeholder="Ej: La telaraña de nombres" style={inp} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={label}>Formato</label>
          <input value={a.format} onChange={e => set('format', e.target.value)} list="custom-activity-formats" placeholder="Individual, parejas…" style={inp} />
          <datalist id="custom-activity-formats">{FORMATS.map(f => <option key={f} value={f} />)}</datalist>
        </div>
        <div>
          <label style={label}>Duración</label>
          <input value={a.duration} onChange={e => set('duration', e.target.value)} placeholder="10 min" style={inp} />
        </div>
      </div>
      <div>
        <label style={label}>Objetivo</label>
        <textarea value={a.goal} onChange={e => set('goal', e.target.value)} rows={2} placeholder="¿Para qué sirve esta actividad?" style={{ ...inp, resize: 'vertical' }} />
      </div>
      <div>
        <label style={label}>Paso a paso</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {a.steps.map((st, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 10, background: 'var(--bg-alt)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange)', width: 18 }}>{i + 1}</span>
                <input value={st.title} onChange={e => setStep(i, 'title', e.target.value)} placeholder="Título del paso" style={{ ...inp, flex: 2 }} />
                <input value={st.time} onChange={e => setStep(i, 'time', e.target.value)} placeholder="Min 0–3" style={{ ...inp, flex: 1, minWidth: 0 }} />
                {a.steps.length > 1 && (
                  <button type="button" onClick={() => set('steps', a.steps.filter((_, j) => j !== i))} title="Quitar paso"
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>✕</button>
                )}
              </div>
              <textarea value={st.text} onChange={e => setStep(i, 'text', e.target.value)} rows={2} placeholder="Qué se hace en este paso"
                style={{ ...inp, resize: 'vertical' }} />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set('steps', [...a.steps, { ...EMPTY_STEP }])}
          style={{ marginTop: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--orange)', fontWeight: 700, fontSize: 12.5, fontFamily: 'var(--font)' }}>
          ＋ Agregar paso
        </button>
      </div>
      <div>
        <label style={label}>Resultado esperado (opcional)</label>
        <input value={a.outcome} onChange={e => set('outcome', e.target.value)} placeholder="¿Qué debería lograr el grupo?" style={inp} />
      </div>
      <div>
        <label style={label}>Imagen (opcional)</label>
        {a.image && <img src={a.image} alt="" style={{ display: 'block', maxWidth: '100%', maxHeight: 140, objectFit: 'contain', borderRadius: 8, marginBottom: 6 }} />}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ImageUploader label={a.image ? 'Reemplazar imagen' : 'Subir imagen'} compact folder="actividades" onUploaded={url => set('image', url)} />
          {a.image && <button type="button" onClick={() => set('image', '')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12.5 }}>Quitar</button>}
        </div>
      </div>
      {err && <p style={{ fontSize: 12.5, color: 'var(--error)', fontWeight: 600, margin: 0 }}>{err}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Btn variant="secondary" size="sm" onClick={onCancel}>Cancelar</Btn>
        <Btn size="sm" onClick={save}>{saveLabel}</Btn>
      </div>
    </div>
  )
}
