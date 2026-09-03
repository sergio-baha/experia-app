import React from 'react'

// Aviso a estudiantes cuando el profesor lanzó una Clase en Vivo Guiada para
// su curso. Unirse es decisión del estudiante — no se auto-une.
const GuidedSessionBanner = ({ session, onJoin }) => {
  const [joining, setJoining] = React.useState(false)
  const [dismissed, setDismissed] = React.useState(null) // guarda el id de sesión descartada

  if (!session || dismissed === session.id) return null

  const handleJoin = async () => {
    setJoining(true)
    try { await onJoin() } catch (_) { /* el estudiante puede reintentar */ }
    finally { setJoining(false) }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
      background: 'var(--gradient-orange)', color: '#fff', flexShrink: 0 }}>
      <span style={{ fontSize: 18, animation: 'glow 2s ease infinite' }}>🔴</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
        Tu profesor inició una clase en vivo{session.title ? `: ${session.title}` : ''} — únete para seguirla en tiempo real.
      </span>
      <button onClick={handleJoin} disabled={joining}
        style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#fff', color: 'var(--orange)',
          fontWeight: 700, fontSize: 13, cursor: joining ? 'default' : 'pointer', fontFamily: 'var(--font)', flexShrink: 0 }}>
        {joining ? 'Uniendo…' : 'Unirme'}
      </button>
      <button onClick={() => setDismissed(session.id)} aria-label="Ocultar aviso"
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.8)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
        ✕
      </button>
    </div>
  )
}

// Bloqueo de la ruta mientras hay una Clase en Vivo Guiada activa y el
// estudiante todavía no se unió: cubre el contenido normal (mapa, lección,
// reto…) con un candado — la ruta se ve de fondo (desenfocada, por el
// wrapper que la renderiza) pero no se puede interactuar con ella hasta
// unirse. app.jsx es quien aplica el desenfoque/pointer-events al contenido;
// este componente es solo la tarjeta de aviso encima.
export const RouteLockOverlay = ({ session, onJoin }) => {
  const [joining, setJoining] = React.useState(false)

  const handleJoin = async () => {
    setJoining(true)
    try { await onJoin() } catch (_) { /* el estudiante puede reintentar */ }
    finally { setJoining(false) }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'rgba(15,15,20,.45)', padding: 20 }}>
      <div style={{ maxWidth: 360, width: '100%', background: 'var(--white)', borderRadius: 18,
        padding: '28px 26px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ fontSize: 34, marginBottom: 10, animation: 'glow 2s ease infinite' }}>🔴</div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>
          Tu profesor inició una clase en vivo{session?.title ? `: ${session.title}` : ''}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
          Tu ruta queda en pausa mientras dure la clase. Únete para seguir avanzando junto con tu profesor.
        </p>
        <button onClick={handleJoin} disabled={joining}
          style={{ padding: '11px 24px', borderRadius: 10, border: 'none', background: 'var(--gradient-orange)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: joining ? 'default' : 'pointer',
            fontFamily: 'var(--font)', width: '100%' }}>
          {joining ? 'Uniendo…' : 'Unirme a la clase'}
        </button>
      </div>
    </div>
  )
}

export default GuidedSessionBanner
