import React from 'react'
import { Ranking } from './LiveQuestionView.jsx'

// =============================================
// EXPERIA — Clase en Vivo Guiada: secuencia didáctica + ranking
// La misma barra la ven el profesor (pantalla proyectada) y cada estudiante
// en su dispositivo, para que todos sepan en qué paso de la secuencia va la
// clase, cuáles ya pasaron y qué viene. Acepta módulos crudos de la BD
// (`challenge_type`) o ya mapeados por dbModToAppMod (`ctype`).
// =============================================

const stepIcon = (m) => {
  const ct = m.ctype || m.challenge_type
  if (m.type === 'lesson') return '📖'
  if (m.type === 'final_delivery') return '🏁'
  if (m.type === 'closing_record') return '📋'
  if (ct === 'poll') return '📊'
  if (ct === 'quiz') return '🎯'
  return '🧩'
}

// `onSelect(i)` solo lo pasa el profesor: los pasos se vuelven clicables.
export const LiveSequence = ({ modules, currentId, onSelect, disabled }) => {
  const currentIdx = modules.findIndex(m => m.id === currentId)
  const current = currentIdx >= 0 ? modules[currentIdx] : null
  const pct = modules.length > 1 && currentIdx >= 0 ? (currentIdx / (modules.length - 1)) * 100 : 0
  const railRef = React.useRef(null)

  // Mantiene el paso actual a la vista cuando la secuencia es más ancha que la pantalla
  React.useEffect(() => {
    const el = railRef.current?.querySelector('[data-current="true"]')
    el?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [currentId])

  if (!modules.length) return null
  return (
    <div style={{ padding: '14px 16px 12px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)',
      boxShadow: 'var(--sh-md)', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
          Secuencia de la clase
        </div>
        {current && (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            Paso {currentIdx + 1} de {modules.length}
          </div>
        )}
      </div>

      <div ref={railRef} style={{ position: 'relative', overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ position: 'relative', display: 'flex', minWidth: modules.length * 74 }}>
          {/* Riel de fondo + avance */}
          <div style={{ position: 'absolute', left: 37, right: 37, top: 19, height: 4, borderRadius: 4, background: 'var(--border)' }}>
            <div style={{ height: '100%', width: pct + '%', borderRadius: 4, background: 'var(--gradient)', transition: 'width .6s ease' }} />
          </div>
          {modules.map((m, i) => {
            const done = currentIdx >= 0 && i < currentIdx
            const now = i === currentIdx
            const clickable = !!onSelect && !now && !disabled
            return (
              <button key={m.id} data-current={now} type="button"
                onClick={clickable ? () => onSelect(i) : undefined}
                title={m.title}
                style={{ flex: 1, minWidth: 74, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font)',
                  cursor: clickable ? 'pointer' : 'default' }}>
                <span style={{ width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: now ? 20 : 16, fontWeight: 800, transition: 'all .3s ease',
                  background: now ? 'var(--gradient)' : done ? 'var(--success)' : 'var(--white)',
                  color: now || done ? '#fff' : 'var(--subtle)',
                  border: now || done ? 'none' : '2px solid var(--border)',
                  transform: now ? 'scale(1.12)' : 'none',
                  animation: now ? 'glow 2.2s ease infinite' : 'none' }}>
                  {done ? '✓' : now ? stepIcon(m) : i + 1}
                </span>
                <span style={{ fontSize: 11, lineHeight: 1.25, maxWidth: 92, textAlign: 'center',
                  fontWeight: now ? 800 : 600, color: now ? 'var(--dark)' : done ? 'var(--muted)' : 'var(--subtle)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {m.title}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {current && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)', display: 'flex', alignItems: 'center',
          gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--dark)' }}>
            {stepIcon(current)} Ahora: {current.title}
          </div>
          {modules[currentIdx + 1] && (
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>
              Sigue: {modules[currentIdx + 1].title}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Ranking parcial de la clase. Solo aparece cuando alguien ya sumó puntos
// (antes del primer quiz sería una lista de ceros). Lo ven el profesor en la
// pantalla proyectada y el estudiante bajo el resultado de cada pregunta.
export const LiveRanking = ({ parts, meId, limit = 5, title = '🏆 Ranking de la clase' }) => {
  if (!parts.some(p => (p.score || 0) > 0)) return null
  const top = parts.slice(0, limit)
  const myIdx = meId ? parts.findIndex(p => p.id === meId) : -1
  const me = myIdx >= 0 ? parts[myIdx] : null
  return (
    <div style={{ padding: '16px 18px', borderRadius: 18, background: 'var(--white)', border: '1px solid var(--border)',
      boxShadow: 'var(--sh-md)', marginTop: 16, animation: 'fadeUp .4s ease both' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}>{parts.length} participante(s)</div>
      </div>
      <Ranking list={top} meId={meId} />
      {me && myIdx >= limit && (
        <div style={{ marginTop: 10, textAlign: 'center', padding: '10px', borderRadius: 12, background: 'var(--orange-bg)' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Tu posición: </span>
          <b style={{ color: 'var(--orange)' }}>#{myIdx + 1} · {me.score} pts</b>
        </div>
      )}
    </div>
  )
}
