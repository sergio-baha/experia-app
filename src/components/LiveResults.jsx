import React from 'react'
import { fetchMyLiveResults } from '../lib/liveClient.js'
import { summarizeLiveResults } from '../lib/saberGuide.js'
// =============================================
// EXPERIA — Modo Aula en Vivo: lo que acertó el estudiante al terminar la clase,
// en total y por competencia. Va en su propio chunk (lazy desde LiveQuestionView)
// porque arrastra la guía Saber, y la página pública del PIN debe seguir liviana.
// =============================================

const CompetenciaRow = ({ label, correct, total }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 5 }}>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--dark)', lineHeight: 1.35 }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--dark)', whiteSpace: 'nowrap' }}>{correct} de {total}</span>
    </div>
    <div style={{ height: 8, borderRadius: 6, background: 'var(--border)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(correct / total) * 100}%`, borderRadius: 6, background: 'var(--purple)' }} />
    </div>
  </div>
)

// `moduleId`: solo esa ronda (el profesor la cerró y la clase sigue). Sin él, toda la clase.
const LiveResults = ({ sessionId, participant, cardStyle, moduleId = null }) => {
  const [items, setItems] = React.useState(null)
  const [error, setError] = React.useState(false)

  const load = React.useCallback(() => {
    setError(false)
    return fetchMyLiveResults({ session: sessionId, participant: participant.id, token: participant.claim_token })
      .then(setItems)
      .catch(() => setError(true))
  }, [sessionId, participant.id, participant.claim_token])

  React.useEffect(() => { load() }, [load])

  const card = { ...cardStyle, marginTop: 16, animation: 'fadeUp .4s ease both' }

  if (error) return (
    <div style={{ ...card, textAlign: 'center' }}>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 10px' }}>No pudimos cargar tus resultados.</p>
      <button onClick={load} style={{ minHeight: 40, padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--border)',
        background: 'var(--white)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
        Reintentar
      </button>
    </div>
  )
  if (!items) return null

  const scope = moduleId ? 'esta ronda' : 'esta clase'
  const title = moduleId ? '🎯 Tus resultados en esta ronda' : '🎯 Tus resultados'
  const { total, answered, correct, groups, other } = summarizeLiveResults(moduleId ? items.filter(i => i.module_id === moduleId) : items)
  if (!total) return (
    <div style={{ ...card, textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>{title}</div>
      <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>En {scope} no se alcanzaron a responder preguntas.</p>
    </div>
  )

  return (
    <div style={card}>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--dark)', marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.2 }}>
        {correct} de {total} <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--muted)' }}>{total === 1 ? 'pregunta correcta' : 'preguntas correctas'}</span>
      </div>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>Solo cuentan las preguntas que se alcanzaron a hacer en {scope}.</p>
      {answered < total && (
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 0' }}>
          {total - answered === 1 ? 'Una pregunta quedó sin responder.' : `${total - answered} preguntas quedaron sin responder.`}
        </p>
      )}
      {groups.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Por competencia</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.map(g => (
              <React.Fragment key={g.area}>
                {groups.length > 1 && <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dark)' }}>{g.label}</div>}
                {g.rows.map(r => <CompetenciaRow key={r.id} label={r.label} correct={r.correct} total={r.total} />)}
              </React.Fragment>
            ))}
            {other && <CompetenciaRow label="Otras preguntas" correct={other.correct} total={other.total} />}
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveResults
