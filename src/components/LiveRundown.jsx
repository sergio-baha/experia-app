import React from 'react'
import { CHARACTERS_BY_THEME } from '../lib/characters.jsx'
import { RUNDOWN_BLOCKS, RUNDOWN_TRACKS, RUNDOWN_TOTAL_MIN } from '../lib/liveRundown.js'

// Opacidad de cada bloque en la barra proporcional del guion — los bloques de
// práctica (D, F) van más llenos porque son el grueso de la sesión.
const RUNDOWN_ALPHA = { A: '33', B: '4D', C: '40', D: 'B3', E: '33', F: 'D9', G: '26' }

// ---------- Guion estándar de la sesión en vivo (por tema del curso) ----------
// Mismo rundown de 2h10 para las 4 rutas — solo cambia cómo cada tutor llama
// cada bloque (RUNDOWN_TRACKS) y el color/nombre del tutor (characters.jsx).
// Un curso sin tema no tiene track ni personaje: no se renderiza nada. Se usa
// tanto en el Editor de Ruta (referencia mientras se arma el curso) como en
// el lanzador de Aula en Vivo (referencia justo antes de dictar la clase).
const LiveRundown = ({ theme, defaultOpen = false }) => {
  const [open, setOpen] = React.useState(defaultOpen)
  const track = RUNDOWN_TRACKS[theme]
  const character = CHARACTERS_BY_THEME[theme]
  if (!track || !character) return null
  const accent = character.fx.accent

  return (
    <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--white)', marginBottom: 18, overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, padding: '14px 16px', background: 'none', border: 'none',
        cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>📋</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--dark)' }}>Guion de la sesión en vivo</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>2h10 · 7 bloques · guía {character.name}</div>
          </div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 700, whiteSpace: 'nowrap' }}>{open ? 'Ocultar ▲' : 'Ver guion ▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 16, border: '1px solid var(--border)' }}>
            {RUNDOWN_BLOCKS.map(b => (
              <div key={b.id} title={`${track.titles[b.id]} · ${b.start}–${b.end}`}
                style={{ width: `${(b.minutes / RUNDOWN_TOTAL_MIN) * 100}%`, background: accent + RUNDOWN_ALPHA[b.id] }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RUNDOWN_BLOCKS.map((b, i) => (
              <div key={b.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', borderLeft: `3px solid ${accent}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {b.start}–{b.end} · {b.minutes} min
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .6, color: 'var(--muted)',
                    display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: accent, flex: 'none' }} />
                    {i + 1} · {b.kind}
                  </span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginTop: 4 }}>{track.titles[b.id]}</div>
                <div style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 4, lineHeight: 1.5 }}>{b.generic}</div>
                <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--dark)', marginTop: 8, padding: '8px 10px',
                  borderRadius: 8, background: 'var(--white)', border: '1px solid var(--border)' }}>
                  “{track.cues[b.id]}”
                </div>
                {b.notes.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                    {b.notes.map((n, ni) => <li key={ni}>{n}</li>)}
                  </ul>
                )}
                {b.pending && (
                  <span style={{ display: 'inline-block', marginTop: 8, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: .4, background: 'var(--orange-bg)', color: 'var(--orange)', borderRadius: 6, padding: '3px 8px' }}>
                    Pendiente · {b.pending}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveRundown
