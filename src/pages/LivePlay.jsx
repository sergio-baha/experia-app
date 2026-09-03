import React from 'react'
import { Btn } from '../components/ui.jsx'
import { LiveQuestionView } from '../components/LiveQuestionView.jsx'
import { joinLiveSession } from '../lib/liveClient.js'
import { primeAudio, isMuted, toggleMute } from '../lib/sound.js'
// =============================================
// EXPERIA — Modo Aula en Vivo · Estudiante (página pública, sin login)
// Acceso: /#/live  o  /#/live/<PIN>
// El ciclo de pregunta/revelado/explicación/podio vive en LiveQuestionView
// (compartido con la Clase en Vivo Guiada de estudiantes logueados).
// =============================================

const SS_KEY = 'experia:live-participant'

const codeFromHash = () => {
  const m = window.location.hash.match(/#\/live\/?([A-Za-z0-9]+)?/)
  return m && m[1] ? m[1] : ''
}

// height fija (NO minHeight) + overflowY:auto en el contenedor EXTERIOR: esta
// página es hija directa de #root, que en styles.css tiene height:100%+
// overflow:hidden — sin una altura fija propia, un contenido más alto que la
// pantalla (pregunta larga, podio con muchos participantes) quedaría
// recortado sin poder scrollear. El centrado vertical va en un div interior
// aparte (no en el mismo que scrollea) para evitar el bug de flexbox donde
// align-items:center + overflow:auto en el MISMO elemento recorta el inicio
// del contenido que se desborda.
const Center = ({ children }) => (
  <div style={{ height: '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', background: 'var(--bg, #F9FAFB)' }}>
    <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'var(--font)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>{children}</div>
    </div>
  </div>
)

// ---------- Formulario de ingreso ----------
const JoinForm = ({ onJoined }) => {
  const [code, setCode]       = React.useState(codeFromHash())
  const [nombre, setNombre]   = React.useState('')
  const [apellido, setApe]    = React.useState('')
  const [correo, setCorreo]   = React.useState('')
  const [salon, setSalon]     = React.useState('')
  const [busy, setBusy]       = React.useState(false)
  const [err, setErr]         = React.useState('')

  const inp = { padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--border)', fontFamily: 'var(--font)',
    fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box', background: 'var(--white)' }
  const lbl = { fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5 }

  const submit = async () => {
    if (!code.trim()) { setErr('Ingresa el PIN'); return }
    if (!nombre.trim()) { setErr('El nombre es obligatorio'); return }
    setErr(''); setBusy(true); primeAudio() // desbloquea audio dentro del gesto
    try {
      const p = await joinLiveSession({ code: code.trim(), nombre, apellido, correo, salon })
      try { sessionStorage.setItem(SS_KEY, JSON.stringify({ participant: p.id, session: p.session_id, nombre: p.nombre, token: p.claim_token })) } catch (_) {}
      onJoined(p)
    } catch (e) {
      setErr(e.message || 'No se pudo unir a la sesión')
    } finally { setBusy(false) }
  }

  return (
    <Center>
      <div style={{ background: 'var(--white)', borderRadius: 20, padding: '28px 24px', boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 40 }}>🎮</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', margin: '8px 0 4px' }}>Aula en Vivo</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>Ingresa el PIN y tus datos para participar</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>PIN de la sesión *</label>
            <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric" placeholder="------"
              style={{ ...inp, textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: 800 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={lbl}>Nombre *</label><input value={nombre} onChange={e => setNombre(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Apellido</label><input value={apellido} onChange={e => setApe(e.target.value)} style={inp} /></div>
          </div>
          <div><label style={lbl}>Correo</label><input value={correo} onChange={e => setCorreo(e.target.value)} type="email" style={inp} /></div>
          <div><label style={lbl}>Salón</label><input value={salon} onChange={e => setSalon(e.target.value)} placeholder="Ej: 9B" style={inp} /></div>
          {err && <p style={{ fontSize: 13, color: 'var(--error)', margin: 0, fontWeight: 600 }}>{err}</p>}
          <Btn variant="gradient" size="lg" full disabled={busy} onClick={submit}>
            {busy ? 'Entrando…' : 'Entrar 🚀'}
          </Btn>
        </div>
      </div>
    </Center>
  )
}

// Botón flotante de silencio (persistente en localStorage)
const MuteFab = () => {
  const [muted, setMuted] = React.useState(isMuted())
  return (
    <button onClick={() => setMuted(toggleMute())} title={muted ? 'Activar sonido' : 'Silenciar'}
      style={{ position: 'fixed', top: 14, right: 14, zIndex: 9000, width: 40, height: 40, borderRadius: 12,
        border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontSize: 18,
        boxShadow: 'var(--sh-md)', fontFamily: 'var(--font)' }}>
      {muted ? '🔇' : '🔊'}
    </button>
  )
}

// Segundos de podio antes de devolver al participante a Experia. Suficiente
// para leer los resultados finales sin dejarlo varado en una clase terminada.
const SEGUNDOS_PARA_SALIR = 15

const LivePlay = () => {
  const [participant, setParticipant] = React.useState(null)
  const [cuenta, setCuenta] = React.useState(null)   // null = la clase sigue viva

  // Reanuda si ya se había unido (refresco de página)
  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SS_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved?.participant && saved?.session) setParticipant({ id: saved.participant, session_id: saved.session, nombre: saved.nombre, claim_token: saved.token })
      }
    } catch (_) {}
  }, [])

  // Salida a Experia. Se limpia el participante guardado ANTES de navegar: si
  // no, al volver a #/live la sesión terminada se reanudaría desde
  // sessionStorage y el participante quedaría atrapado en el podio.
  const salirAExperia = React.useCallback(() => {
    try { sessionStorage.removeItem(SS_KEY) } catch (_) {}
    // Recarga completa contra la raíz: esta página es pública y no hay sesión,
    // así que el enrutador por hash del store no puede llevar a `landing` (solo
    // escribe el hash de páginas públicas). Soltar el hash y recargar deja la
    // app en un estado limpio.
    window.location.href = window.location.pathname
  }, [])

  // Cuenta atrás al terminar la clase.
  React.useEffect(() => {
    if (cuenta === null) return
    if (cuenta <= 0) { salirAExperia(); return }
    const t = setTimeout(() => setCuenta(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cuenta, salirAExperia])

  return (
    <>
      <MuteFab />
      {!participant
        ? <JoinForm onJoined={setParticipant} />
        : <LiveQuestionView participant={participant} Wrap={Center}
            onEnded={() => setCuenta(SEGUNDOS_PARA_SALIR)} />}

      {cuenta !== null && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 4000,
          padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
          background: 'var(--white)', borderTop: '1px solid var(--border)',
          boxShadow: 'var(--sh-lg)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, color: 'var(--text-sec)' }}>
            La clase terminó · vuelves a Experia en <b style={{ color: 'var(--orange)' }}>{cuenta}s</b>
          </span>
          <Btn size="sm" onClick={salirAExperia}>Volver ahora →</Btn>
        </div>
      )}
    </>
  )
}

export default LivePlay
