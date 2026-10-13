import React from 'react'
import { ACTIVITY_BANKS, BANK_SCOPES, CUSTOM_ID, activitiesForScope } from '../lib/activityBank.js'

// =============================================
// EXPERIA — Banco de actividades (rompehielos / pausas activas físicas)
// · ActivityCard   → lo que ve el estudiante: imagen + lo esencial para
//                    ejecutar la actividad (formato, objetivo, paso a paso).
// · ActivityPicker → el selector del profesor (editor de ruta y Clase en Vivo).
// Datos en src/lib/activityBank.js.
// =============================================

const pill = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20,
  background: bg, color, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
})

export const ActivityCard = ({ activity, delay = 0 }) => {
  const [zoom, setZoom] = React.useState(false)

  React.useEffect(() => {
    if (!zoom) return
    const onKey = (e) => { if (e.key === 'Escape') setZoom(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom])

  if (!activity) return null
  const bank = ACTIVITY_BANKS[activity.bank]

  return (
    <div style={{ margin: '32px 0', borderRadius: 18, overflow: 'hidden', background: 'var(--white)',
      border: '1px solid var(--border)', boxShadow: 'var(--sh-md)', animation: `fadeUp .45s ${delay}ms ease both` }}>
      <div style={{ padding: '18px 22px 14px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={pill('var(--orange-bg)', 'var(--orange)')}>{bank?.icon} {bank?.label}{activity.num ? ` · #${activity.num}` : ''}</span>
          {activity.format && <span style={pill('var(--purple-bg)', 'var(--purple)')}>👥 {activity.format}</span>}
          <span style={pill('var(--bg-alt)', 'var(--text-sec)')}>⏱️ {activity.duration}</span>
        </div>
        <h3 style={{ fontSize: 21, fontWeight: 800, color: 'var(--dark)', margin: 0, lineHeight: 1.3 }}>{activity.title}</h3>
        {activity.goal && (
          <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.6, margin: '8px 0 0' }}>
            <strong>Objetivo:</strong> {activity.goal}
          </p>
        )}
      </div>

      {activity.image && <button onClick={() => setZoom(true)} title="Ver imagen completa"
        style={{ display: 'block', width: '100%', padding: 0, border: 'none', cursor: 'zoom-in', background: 'var(--bg-alt)' }}>
        <img src={activity.image} alt={activity.title} loading="lazy"
          style={{ display: 'block', width: '100%', maxHeight: 520, objectFit: 'contain' }} />
      </button>}

      <div style={{ padding: '18px 22px 20px' }}>
        {activity.steps.length > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
          Paso a paso
        </div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activity.steps.map((st, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--gradient)', color: '#fff', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--dark)' }}>{st.title}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--orange)' }}>{st.time}</span>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.6, margin: '3px 0 0' }}>{st.text}</p>
              </div>
            </div>
          ))}
        </div>
        {activity.outcome && (
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'var(--success-bg)',
            fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--success)' }}>🎯 Resultado esperado:</strong> {activity.outcome}
          </div>
        )}
      </div>

      {zoom && (
        <div onClick={() => setZoom(false)} role="dialog" aria-label={activity.title}
          style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,.85)', cursor: 'zoom-out',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={activity.image} alt={activity.title}
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
        </div>
      )}
    </div>
  )
}

// Selector del profesor. `scope` = valor de `section.bank` ('ambas' muestra
// pestañas Física / Rompehielos; 'fisicas' solo las físicas).
// `custom` = actividad propia ya creada (se elige con CUSTOM_ID) y
// `onCreate` abre el formulario para crear/editar la propia.
export const ActivityPicker = ({ scope = 'ambas', value, onChange, compact, custom, onCreate }) => {
  const banks = BANK_SCOPES[scope] || BANK_SCOPES.ambas
  const current = activitiesForScope(scope).find(a => a.id === value)
  const [tab, setTab] = React.useState(current?.bank || banks[0])
  React.useEffect(() => { if (current && current.bank !== tab) setTab(current.bank) }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const list = activitiesForScope(tab)
  return (
    <div>
      {banks.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {banks.map(b => {
            const on = tab === b
            return (
              <button key={b} type="button" onClick={() => setTab(b)}
                style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
                  fontSize: 12.5, fontWeight: 700, background: on ? 'var(--dark)' : 'var(--bg-alt)', color: on ? 'var(--white)' : 'var(--text-sec)' }}>
                {ACTIVITY_BANKS[b].icon} {ACTIVITY_BANKS[b].label}
              </button>
            )
          })}
        </div>
      )}
      {(custom || onCreate) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {custom && (
            <button type="button" onClick={() => onChange(CUSTOM_ID)} title={custom.goal}
              style={{ padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700,
                border: `2px solid ${value === CUSTOM_ID ? 'var(--orange)' : 'var(--border)'}`,
                background: value === CUSTOM_ID ? 'var(--orange-bg)' : 'var(--white)', color: 'var(--dark)' }}>
              {value === CUSTOM_ID ? '✓ ' : ''}✏️ {custom.title} <span style={{ fontWeight: 500, color: 'var(--muted)' }}>· propia</span>
            </button>
          )}
          {onCreate && (
            <button type="button" onClick={onCreate}
              style={{ padding: '8px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12.5, fontWeight: 700,
                border: '2px dashed var(--orange)', background: 'var(--white)', color: 'var(--orange)' }}>
              {custom ? '✏️ Editar mi actividad propia' : '＋ Crear actividad propia'}
            </button>
          )}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 130 : 150}px, 1fr))`, gap: 8,
        maxHeight: compact ? 300 : 380, overflow: 'auto', padding: 2 }}>
        {list.map(a => {
          const on = a.id === value
          return (
            <button key={a.id} type="button" onClick={() => onChange(a.id)} title={a.goal}
              style={{ textAlign: 'left', padding: 0, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', fontFamily: 'var(--font)',
                border: `2px solid ${on ? 'var(--orange)' : 'var(--border)'}`, background: on ? 'var(--orange-bg)' : 'var(--white)' }}>
              <img src={a.image} alt="" loading="lazy" style={{ display: 'block', width: '100%', height: 74, objectFit: 'cover' }} />
              <div style={{ padding: '6px 8px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--dark)', lineHeight: 1.3 }}>
                  {on && '✓ '}{a.num}. {a.title}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{a.format}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
