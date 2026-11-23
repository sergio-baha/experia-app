import React from 'react'
import { RichText, QuestionText, ZoomImg } from '../ui.jsx'
import { PassageToggle } from './PassageView.jsx'
import { BANK_AREAS, DIFFICULTY, loadQuestionBank } from '../../lib/questionBankMeta.js'
import { SABER_GUIDES, evidenceInfo } from '../../lib/saberGuide.js'

// =============================================
// Selector del banco de preguntas (rondas en vivo, módulos 4 y 6).
// Se muestra DENTRO del editor del módulo (QuizCreatorModal) en lugar de la
// lista de preguntas: el tutor marca/desmarca y vuelve con "Listo". Agregar
// copia la pregunta al módulo (con su texto de lectura y su pista); quitarla
// solo la saca del módulo — el banco no se modifica nunca desde aquí.
// =============================================

const chip = (bg, fg) => ({ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 20, background: bg, color: fg, whiteSpace: 'nowrap' })

const DiffChip = ({ d }) => DIFFICULTY[d]
  ? <span style={chip(DIFFICULTY[d].bg, DIFFICULTY[d].fg)}>{DIFFICULTY[d].label}</span>
  : null

const BankCard = ({ q, n, passage, underHeader, inModule, usedIn, onToggle }) => {
  const [open, setOpen] = React.useState(false)
  const info = evidenceInfo(q.area, q.evidencia)
  return (
    <div style={{ padding: '10px 12px', borderRadius: 12, background: inModule ? 'var(--orange-bg)' : 'var(--white)',
      border: `1.5px solid ${inModule ? 'var(--orange)' : 'var(--border)'}`, transition: 'all .15s' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <button onClick={onToggle} title={inModule ? 'Quitar del módulo' : 'Agregar al módulo'}
          style={{ flexShrink: 0, minWidth: 92, height: 30, borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font)',
            fontSize: 12, fontWeight: 800, border: inModule ? 'none' : '1.5px solid var(--orange)',
            background: inModule ? 'var(--orange)' : 'var(--white)', color: inModule ? '#fff' : 'var(--orange)' }}>
          {inModule ? '✓ En el módulo' : '+ Agregar'}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)' }}>#{n}</span>
            <DiffChip d={q.difficulty} />
            {info && <span style={chip('var(--purple-bg)', 'var(--purple)')} title={`Afirmación ${info.afirmacion.n}. ${info.afirmacion.text}`}>{info.competencia.short} · {info.code}</span>}
            {q.topic && <span style={chip('var(--bg-alt)', 'var(--muted)')}>{q.topic.length > 48 ? q.topic.slice(0, 46) + '…' : q.topic}</span>}
            {q.image && <span style={chip('#DBEAFE', '#1D4ED8')}>🖼️ Imagen</span>}
            {usedIn && <span style={chip('var(--purple-bg)', 'var(--purple)')} title="Ya está en otro módulo de esta ruta">También en: {usedIn}</span>}
            {q.review && <span style={chip('#FEE2E2', '#B91C1C')} title={q.review}>⚠️ Revisar</span>}
          </div>
          {passage && !underHeader && <PassageToggle passage={passage} style={{ marginBottom: 6 }} />}
          {open ? (
            <QuestionText as="p" style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.45, margin: 0 }}>{q.question}</QuestionText>
          ) : (
            <RichText as="p" style={{ fontSize: 13, color: 'var(--dark)', lineHeight: 1.45, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {q.question}
            </RichText>
          )}
          {open && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {q.image && <ZoomImg src={q.image} alt="Imagen de la pregunta" style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', borderRadius: 8, border: '1px solid var(--border)', background: '#fff' }} />}
              {q.options.map((o, i) => (
                <div key={i} style={{ fontSize: 12.5, color: i === q.correct ? 'var(--success)' : 'var(--text-sec)', fontWeight: i === q.correct ? 700 : 500 }}>
                  {String.fromCharCode(65 + i)}) <RichText>{o}</RichText>{i === q.correct && ' ✓'}
                  {q.optionImages?.[i] && <ZoomImg src={q.optionImages[i]} alt={`Opción ${String.fromCharCode(65 + i)}`} style={{ display: 'block', maxWidth: '100%', maxHeight: 160, objectFit: 'contain', margin: '2px 0 4px 18px', borderRadius: 6, border: '1px solid var(--border)', background: '#fff' }} />}
                </div>
              ))}
              {q.explanation && (
                <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.5, marginTop: 4, padding: '7px 9px', borderRadius: 8, background: 'var(--purple-bg)' }}>
                  <b style={{ color: 'var(--purple)' }}>Explicación:</b> <RichText>{q.explanation}</RichText>
                </div>
              )}
              {q.hint && <div style={{ fontSize: 12, color: 'var(--orange)', marginTop: 4 }}>💡 <b>Pista:</b> {q.hint}</div>}
              {info && (
                <div style={{ fontSize: 11.5, color: 'var(--text-sec)', lineHeight: 1.45, marginTop: 2 }}>
                  <b>{info.competencia.label}.</b> <b>Afirmación {info.afirmacion.n}:</b> {info.afirmacion.text} <b>Evidencia {info.code}:</b> {info.evidencia}
                </div>
              )}
              {q.review && <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 2 }}>⚠️ <b>Para revisar:</b> {q.review}</div>}
              <div style={{ fontSize: 11, color: 'var(--subtle)' }}>⏱️ {q.timeLimit} s · {q.source}</div>
            </div>
          )}
          <button onClick={() => setOpen(o => !o)}
            style={{ marginTop: 4, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
              fontSize: 11.5, fontWeight: 700, color: 'var(--purple)' }}>
            {open ? 'Ver menos' : 'Ver opciones, respuesta, explicación y pista'}
          </button>
        </div>
      </div>
    </div>
  )
}

// `embedded`: va fijo en la columna derecha del editor a pantalla completa —
// sin botones de "Volver"/"Listo", porque no hay otra vista a la que volver.
const QuestionBankPicker = ({ area, selectedIds, usedElsewhere = {}, onToggle, onClose, embedded = false, balance = null }) => {
  const [bank, setBank]     = React.useState(null)
  const [err, setErr]       = React.useState('')
  const [diff, setDiff]     = React.useState('')
  const [onlyMine, setOnly] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [comp, setComp]     = React.useState('')

  React.useEffect(() => {
    loadQuestionBank().then(setBank).catch(e => setErr('No se pudo cargar el banco: ' + (e?.message || e)))
  }, [])

  const all = React.useMemo(() => (bank?.questions || []).filter(q => q.area === area), [bank, area])
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const list = all.filter(q =>
    (!diff || q.difficulty === diff)
    && (!comp || evidenceInfo(area, q.evidencia)?.competencia.id === comp)
    && (!onlyMine || selectedIds.has(q.id))
    && (!search.trim() || norm(q.question + ' ' + (q.topic || '') + ' ' + (bank.passages[q.passageId]?.title || '')).includes(norm(search.trim()))))
  const count = (d) => all.filter(q => q.difficulty === d).length
  const mine = all.filter(q => selectedIds.has(q.id))
  const a = BANK_AREAS[area]

  const pill = (active) => ({ padding: '5px 11px', borderRadius: 20, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700,
    border: active ? '1.5px solid var(--purple)' : '1.5px solid var(--border)', background: active ? 'var(--purple-bg)' : 'var(--white)',
    color: active ? 'var(--purple)' : 'var(--muted)' })

  // Las preguntas que comparten un contexto (lecturas, infografías, tablas) van
  // agrupadas bajo un encabezado con el texto completo, para leerlo una vez.
  let lastPassage = null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {!embedded && <button onClick={onClose}
          style={{ padding: '7px 12px', borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--white)', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>← Volver al módulo</button>}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)' }}>📚 Banco de {a?.icon} {a?.label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{all.length} preguntas · <b style={{ color: 'var(--orange)' }}>{mine.length} en este módulo</b></div>
        </div>
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--subtle)', margin: 0, lineHeight: 1.5 }}>
        La dificultad se asignó al azar mientras el equipo académico la define: tómala como provisional y ajústala en
        "⚙️ Opciones avanzadas" de cada pregunta si hace falta.
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button style={pill(!diff)} onClick={() => setDiff('')}>Todas ({all.length})</button>
        {Object.entries(DIFFICULTY).map(([k, d]) => (
          <button key={k} style={pill(diff === k)} onClick={() => setDiff(diff === k ? '' : k)}>{d.label} ({count(k)})</button>
        ))}
        <button style={pill(onlyMine)} onClick={() => setOnly(o => !o)}>✓ Solo las del módulo</button>
      </div>
      {/* Competencias: el filtro también dice cuántas lleva la ronda y cuántas pide la guía. */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {(SABER_GUIDES[area]?.competencias || []).map(c => {
          const row = balance?.rows.find(r => r.id === c.id)
          return (
            <button key={c.id} style={pill(comp === c.id)} onClick={() => setComp(comp === c.id ? '' : c.id)} title={c.label}>
              {c.short}{row ? ` ${row.actual}/${row.goal}${row.need === 0 ? ' ✓' : row.need > 0 ? ` · ${row.need === 1 ? 'falta' : 'faltan'} ${row.need}` : ` · ${row.need === -1 ? 'sobra' : 'sobran'} ${-row.need}`}` : ''}
            </button>
          )
        })}
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por palabra, tema o título del texto…"
        style={{ padding: '8px 10px', borderRadius: 8, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 13, outline: 'none' }} />

      {err && <p style={{ color: 'var(--error)', fontSize: 13, margin: 0 }}>{err}</p>}
      {!bank && !err && <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Cargando banco…</p>}
      {bank && list.length === 0 && <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Ninguna pregunta coincide con el filtro.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bank && list.map(q => {
          const passage = q.passageId ? bank.passages[q.passageId] : null
          const header = !!passage && q.passageId !== lastPassage
          lastPassage = q.passageId || null
          const groupSize = header ? list.filter(x => x.passageId === q.passageId).length : 0
          return (
            <React.Fragment key={q.id}>
              {header && (
                <div style={{ margin: '8px 0 0', padding: '10px 12px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '3px solid var(--purple)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 6 }}>
                    📖 Contexto{passage.title ? ` · ${passage.title}` : ''} · {groupSize === 1 ? '1 pregunta' : `${groupSize} preguntas`}
                  </div>
                  <PassageToggle passage={passage} label="Leer el contexto completo" />
                </div>
              )}
              <BankCard q={q} n={all.indexOf(q) + 1} passage={passage} underHeader inModule={selectedIds.has(q.id)}
                usedIn={usedElsewhere[q.id]} onToggle={() => onToggle(q, bank)} />
            </React.Fragment>
          )
        })}
      </div>

      {!embedded && <button onClick={onClose}
        style={{ position: 'sticky', bottom: 0, padding: '11px', borderRadius: 11, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
          fontSize: 14, fontWeight: 800, color: '#fff', background: 'var(--gradient)', boxShadow: 'var(--sh-md)' }}>
        Listo · {mine.length} pregunta{mine.length !== 1 ? 's' : ''} en el módulo
      </button>}
    </div>
  )
}

export default QuestionBankPicker
