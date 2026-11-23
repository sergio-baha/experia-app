import React from 'react'
import { QuestionText, ZoomImg } from '../ui.jsx'

// =============================================
// Contexto (texto de lectura, infografía, tabla) de una pregunta del banco,
// para que el profesor lo lea al armar su ruta. Sin esto solo veía el título
// y no podía juzgar las preguntas que dependen del texto (nov 2026).
// QuestionText arma las tablas escritas con "|"; las imágenes se amplían.
// =============================================

export const PassageView = ({ passage, maxHeight = '55vh' }) => {
  if (!passage) return null
  const { intro, title, paragraphs, images, imagesLayout, source } = passage
  const row = imagesLayout === 'row' && (images || []).length > 1
  return (
    <div style={{ maxHeight, overflowY: 'auto', padding: '12px 14px', borderRadius: 12, background: 'var(--bg)',
      border: '1px solid var(--border)', WebkitOverflowScrolling: 'touch' }}>
      {intro && <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>{intro}</div>}
      {title && <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--dark)', marginBottom: 8 }}>{title}</div>}
      {(paragraphs || []).map((p, i) => (
        <QuestionText key={i} as="p" style={{ fontSize: 13.5, color: 'var(--text-sec)', lineHeight: 1.65, margin: '0 0 9px', textAlign: 'justify' }}>{p}</QuestionText>
      ))}
      {!!images?.length && (
        <div style={{ display: 'flex', flexDirection: row ? 'row' : 'column', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {images.map((im, i) => (
            <figure key={i} style={{ margin: 0, flex: row ? '1 1 200px' : 'none' }}>
              <ZoomImg src={im.url} alt={im.caption || title || 'Imagen del contexto'}
                style={{ width: '100%', maxHeight: 520, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)', background: '#fff' }} />
              {im.caption && <figcaption style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'center', marginTop: 3 }}>{im.caption}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {source && <p style={{ fontSize: 11.5, color: 'var(--subtle)', fontStyle: 'italic', margin: '8px 0 0' }}>{source}</p>}
    </div>
  )
}

// Botón "📖 Leer el texto" que despliega el contexto debajo. No propaga el
// clic: en el editor va dentro de la tarjeta plegada, que se abre al tocarla.
export const PassageToggle = ({ passage, label = 'Leer el texto', style }) => {
  const [open, setOpen] = React.useState(false)
  if (!passage) return null
  const name = passage.title || (passage.images?.length && !passage.paragraphs?.length ? 'imagen del contexto' : '')
  return (
    <div style={style} onClick={e => e.stopPropagation()}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        style={{ padding: '4px 10px', borderRadius: 20, border: '1.5px solid var(--purple)', cursor: 'pointer', fontFamily: 'var(--font)',
          fontSize: 12, fontWeight: 700, background: open ? 'var(--purple)' : 'var(--purple-bg)', color: open ? '#fff' : 'var(--purple)' }}>
        📖 {open ? 'Ocultar el texto' : `${label}${name ? `: ${name}` : ''}`}
      </button>
      {open && <div style={{ marginTop: 8 }}><PassageView passage={passage} /></div>}
    </div>
  )
}

export default PassageView
