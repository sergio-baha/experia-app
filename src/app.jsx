import React from 'react'
import { useStore, nav, doLogout } from './store/store.jsx'
import { selectActiveCourseTheme, CLONE_PAGES } from './store/store.jsx'
import { startIdleWatch } from './lib/idleTimeout.js'
import { applySavedTheme, applyLightOnly } from './lib/theme.js'
import { useGuidedSession } from './lib/liveClient.js'
import { NotifManager } from './components/ui.jsx'
import CourseAmbient from './components/CourseAmbient.jsx'
import { OnboardingModal } from './components/Onboarding.jsx'
import GuidedSessionBanner, { RouteLockOverlay } from './components/GuidedSessionBanner.jsx'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'

// ---- PWA Install Prompt (solo móvil, solo cuando el navegador lo dispara) ----
const PWAInstallPrompt = () => {
  const [prompt, setPrompt] = React.useState(null)
  const [dismissed, setDismissed] = React.useState(
    () => !!sessionStorage.getItem('pwa-dismissed')
  )

  React.useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
    else handleDismiss()
  }

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-dismissed', '1')
    setDismissed(true)
  }

  if (!prompt || dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9000,
      background: 'var(--white)', borderRadius: 16,
      boxShadow: '0 8px 32px rgba(0,0,0,.18)', border: '1.5px solid var(--orange-pale)',
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
      animation: 'fadeUp .35s var(--ease-out)',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--gradient-orange)',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'sans-serif' }}>E</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>Instalar Experia</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Accede más rápido desde tu pantalla de inicio</div>
      </div>
      <button onClick={handleDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18,
          color: 'var(--subtle)', padding: '4px 6px', lineHeight: 1, flexShrink: 0 }}
        aria-label="Cerrar">×</button>
      <button onClick={handleInstall}
        style={{ background: 'var(--orange)', border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 14px',
          borderRadius: 8, fontFamily: 'var(--font)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Instalar
      </button>
    </div>
  )
}

// Páginas con carga diferida — cada rol solo descarga lo que necesita
const LandingPage           = React.lazy(() => import('./pages/landing.jsx'))
const LoginPage             = React.lazy(() => import('./pages/login.jsx'))
const LearningMap           = React.lazy(() => import('./pages/map.jsx'))
const LessonView            = React.lazy(() => import('./pages/lesson.jsx'))
const ChallengeView         = React.lazy(() => import('./pages/challenges.jsx'))
const ProfilePage           = React.lazy(() => import('./pages/profile.jsx'))
const StudentProductUpload  = React.lazy(() => import('./pages/Grid.jsx'))
const CourseCertificatePage = React.lazy(() => import('./pages/CourseCertificatePage.jsx'))
const InstructorDashboard   = React.lazy(() => import('./pages/InstructorDashboard.jsx'))
const InstructorRouteEditor = React.lazy(() => import('./pages/InstructorRouteEditor.jsx'))
const AdminAnalytics        = React.lazy(() => import('./pages/AdminAnalytics.jsx'))
const AdminCourses          = React.lazy(() => import('./pages/AdminCourses.jsx'))
const InstructorStudentView = React.lazy(() => import('./pages/InstructorStudentView.jsx'))

// Nuevas páginas extraídas
const AreaSelection         = React.lazy(() => import('./pages/AreaSelection.jsx'))
const CourseSelection       = React.lazy(() => import('./pages/CourseSelection.jsx'))
const GamesPage             = React.lazy(() => import('./pages/games.jsx'))
const InstructorStatsPage   = React.lazy(() => import('./pages/InstructorStats.jsx'))
const ItemAnalysisPage      = React.lazy(() => import('./pages/InstructorItemAnalysis.jsx'))
const ClosingRecordPage     = React.lazy(() => import('./pages/ClosingRecord.jsx'))
const SchoolsAdminPage      = React.lazy(() => import('./pages/AdminSchools.jsx'))
const AdminPage             = React.lazy(() => import('./pages/AdminUsers.jsx'))
const ForumPage             = React.lazy(() => import('./pages/forum.jsx'))
const CertPage              = React.lazy(() => import('./pages/CertPage.jsx'))
const LivePlayPage          = React.lazy(() => import('./pages/LivePlay.jsx'))
const LiveHostPage          = React.lazy(() => import('./pages/LiveHost.jsx'))
const GuidedClassView       = React.lazy(() => import('./components/GuidedClassView.jsx'))

// Modo clon — piloto TEMPORAL (0051). Lazy, así que las cuentas normales nunca
// descargan estos chunks.
const CloneAttendancePage    = React.lazy(() => import('./pages/CloneAttendance.jsx'))
const CloneEffectivenessPage = React.lazy(() => import('./pages/CloneEffectiveness.jsx'))
const CloneGroupsPage        = React.lazy(() => import('./pages/CloneGroups.jsx'))
const CloneUnitDashboard     = React.lazy(() => import('./pages/CloneUnitDashboard.jsx'))

const PageSpinner = () => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 14, animation: 'fadeIn .3s ease' }}>
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      <div style={{ position: 'absolute', inset: 0, border: '3px solid var(--border)',
        borderRadius: '50%' }} />
      <div style={{ position: 'absolute', inset: 0, border: '3px solid transparent',
        borderTopColor: 'var(--orange)', borderRightColor: 'var(--orange-light)',
        borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    </div>
  </div>
)

// =============================================
// EXPERIA — App Shell (responsive + optimized)
// =============================================
const App = () => {
  const page           = useStore(s => s.page);
  const isLoggedIn     = useStore(s => s.isLoggedIn);
  const nodeId         = useStore(s => s.nodeId);
  const user           = useStore(s => s.user);
  const selectedArea   = useStore(s => s.selectedArea);
  const hasCourses     = useStore(s => (s.courses || []).some(c => c.is_active));
  const enrolledCourse = useStore(s => s.enrolledCourseId);
  const coursesLoaded  = useStore(s => s.coursesLoaded);
  const courseTheme    = useStore(selectActiveCourseTheme);
  const activeTheme    = isLoggedIn ? courseTheme : null;
  const guided         = useGuidedSession(isLoggedIn && user?.role === 'student' ? enrolledCourse : null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  // Al terminar la Clase en Vivo Guiada, el estudiante ve el podio unos
  // segundos y luego vuelve solo a su mapa/ruta normal.
  React.useEffect(() => {
    if (guided.isJoined && guided.session?.status === 'ended') {
      const t = setTimeout(guided.leave, 5000);
      return () => clearTimeout(t);
    }
  }, [guided.isJoined, guided.session?.status, guided.leave]);

  // Aplica el tema visual inmersivo del curso activo en el elemento raíz.
  // Solo cuando el estudiante está logueado y dentro de su curso — nunca en login/landing.
  React.useEffect(() => {
    const root = document.documentElement;
    if (activeTheme) {
      root.setAttribute('data-course-theme', activeTheme);
    } else {
      root.removeAttribute('data-course-theme');
    }
  }, [activeTheme]);

  // Cierre de sesión automático por inactividad (solo con sesión activa).
  React.useEffect(() => {
    if (!isLoggedIn) return;
    const stop = startIdleWatch(doLogout);
    return stop;
  }, [isLoggedIn]);

  // El modo oscuro NUNCA debe aplicarse en la entrada pública (landing/login) ni
  // mientras un curso con tema inmersivo está activo (sus paletas fijas no están
  // pensadas para combinarse con modo oscuro). En ambos casos se respeta la
  // preferencia guardada del usuario y se restaura al volver a un contexto normal.
  React.useEffect(() => {
    const isPublicEntry = !isLoggedIn && (page === 'landing' || page === 'login');
    if (isPublicEntry || activeTheme) applyLightOnly();
    else applySavedTheme();
  }, [page, isLoggedIn, activeTheme]);
  const [studentView, setStudentView] = React.useState(null);

  React.useEffect(() => { setMobileSidebarOpen(false); }, [page]);

  if (page === 'landing' && !isLoggedIn) return <React.Suspense fallback={null}><LandingPage /></React.Suspense>;
  if (page === 'login'   && !isLoggedIn) return <React.Suspense fallback={null}><LoginPage /></React.Suspense>;
  // Verificación pública de certificado — no requiere autenticación
  if (page === 'cert') return <React.Suspense fallback={<PageSpinner />}><CertPage /></React.Suspense>;
  // Aula en Vivo (estudiante) — página pública, se entra con PIN sin login
  if (page === 'live') return <React.Suspense fallback={<PageSpinner />}><LivePlayPage /></React.Suspense>;
  if (!isLoggedIn) { setTimeout(() => nav('landing'), 0); return null; }

  const role = user?.role;
  // Los módulos del piloto clon (asistencia / efectividad) no dependen de la
  // matrícula: viven al lado de la ruta de formación, no dentro de ella. Por eso
  // se saltan los guards de curso/área — si no, un docente clon sin curso
  // resuelto quedaría atrapado en la selección de curso y no podría entrar.
  const isClonePage = CLONE_PAGES.includes(page);
  // Ruta bloqueada: hay una Clase en Vivo Guiada activa para el curso del
  // estudiante y todavía no se unió (si ya se unió, el `return` de más abajo
  // ya lo mandó a GuidedClassView, así que llegar aquí implica !isJoined).
  // Las páginas del piloto clon quedan exceptuadas — viven al lado de la
  // ruta de formación, no dentro de ella (mismo criterio que los guards de
  // curso/área de más arriba).
  const pendingGuided = role === 'student' && !!guided.session && !isClonePage;
  // Esperar a que courses + userCourses estén cargados antes de decidir la ruta
  // del estudiante. Sin esto, el primer render ocurre con datos a medias y se ve
  // un parpadeo entre el mapa/onboarding y la selección de curso.
  // ⚠️ Este `return` NO debe saltarse el layout (Sidebar/Header): son datos que
  // tardan un viaje de red normal (más en frío — primera visita del navegador,
  // sin conexión ya calentada con Supabase) y antes esto dejaba al estudiante
  // viendo una pantalla en blanco sin menú ni cabecera hasta que la carga
  // terminaba — el "bug" era justo esta espera sin chrome, no una carga colgada.
  const waitingCourses = role === 'student' && !coursesLoaded && !isClonePage;
  // Guard estudiante: si hay cursos en BD y no está inscrito → selección de curso
  if (role === 'student' && hasCourses && !enrolledCourse && !isClonePage) return <React.Suspense fallback={<PageSpinner />}><CourseSelection /></React.Suspense>;
  // Guard legado: sin cursos en BD y sin área → selección de área
  if (role === 'student' && !hasCourses && !selectedArea && !isClonePage) return <React.Suspense fallback={<PageSpinner />}><AreaSelection /></React.Suspense>;

  // Clase en Vivo Guiada: mientras el estudiante está unido, su pantalla queda
  // completamente controlada por el profesor — sin sidebar ni navegación libre.
  if (role === 'student' && guided.isJoined) {
    return <React.Suspense fallback={<PageSpinner />}><GuidedClassView guided={guided} /></React.Suspense>;
  }

  const fullPages = ['lesson', 'challenge'];
  const isFullPage = fullPages.includes(page);

  const renderPage = () => {
    if (waitingCourses) return <PageSpinner />;
    if (role === 'admin') {
      switch (page) {
        case 'admin-dashboard':  return <AdminPage />;
        case 'admin-courses':    return <AdminCourses />;
        case 'admin-schools':    return <SchoolsAdminPage />;
        case 'admin-analytics':  return <AdminAnalytics />;
        case 'instructor-items': return <ItemAnalysisPage />;
        case 'closing-record':   return <ClosingRecordPage />;
        case 'clone-groups':     return <CloneGroupsPage />;
        case 'live-host':        return <LiveHostPage />;
        case 'forum':            return <ForumPage />;
        case 'profile':          return <ProfilePage />;
        default:                 return <AdminPage />;
      }
    }
    if (role === 'instructor') {
      switch (page) {
        case 'instructor-dashboard':
          return (
            <InstructorStudentView
              studentView={studentView}
              setStudentView={setStudentView}
            />
          );
        case 'instructor-stats': return <InstructorStatsPage />;
        case 'instructor-items': return <ItemAnalysisPage />;
        case 'instructor-route': return <InstructorRouteEditor />;
        case 'closing-record':   return <ClosingRecordPage />;
        case 'clone-groups':     return <CloneGroupsPage />;
        case 'live-host':        return <LiveHostPage />;
        case 'forum':            return <ForumPage />;
        case 'profile':          return <ProfilePage />;
        default:                 return <InstructorDashboard />;
      }
    }
    switch (page) {
      case 'map':      return <LearningMap />;
      case 'lesson':   return <LessonView />;
      case 'challenge':return <ChallengeView />;
      case 'games':    return <GamesPage />;
      case 'grid':     return <StudentProductUpload />;
      case 'course-cert': return <CourseCertificatePage />;
      case 'closing-record': return <ClosingRecordPage />;
      // Piloto clon: solo llegan aquí las cuentas con ui_variant='clone',
      // porque son las únicas que ven el enlace en el sidebar.
      case 'clone-attendance':    return <CloneAttendancePage />;
      case 'clone-effectiveness': return <CloneEffectivenessPage />;
      // Tablero de unidades: SÍ vive dentro de la ruta (es un módulo del mapa),
      // así que a diferencia de los dos anteriores no va en CLONE_PAGES — debe
      // pasar por los guards de curso como cualquier otro nodo.
      case 'clone-dashboard':     return <CloneUnitDashboard />;
      case 'forum':    return <ForumPage />;
      case 'profile':  return <ProfilePage />;
      default:         return <LearningMap />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CourseAmbient />
      <NotifManager />
      <PWAInstallPrompt />
      {/* Bienvenida: solo estudiantes que no han visto el onboarding (flag en profiles) */}
      {role === 'student' && user?.onboarded === false && <OnboardingModal />}
      {!isFullPage && (
        <Sidebar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {role === 'student' && <GuidedSessionBanner session={guided.session} onJoin={guided.join} />}
        {!isFullPage && <Header onMenuClick={() => setMobileSidebarOpen(o => !o)} />}
        <main id="main-content" tabIndex="-1" className="page-enter" style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)', outline: 'none', position: 'relative' }} key={page + (nodeId || '')}>
          <div style={{ height: '100%', ...(pendingGuided ? { filter: 'blur(2px) saturate(.55)', pointerEvents: 'none', userSelect: 'none' } : {}) }}>
            <React.Suspense fallback={<PageSpinner />}>
              {renderPage()}
            </React.Suspense>
          </div>
          {pendingGuided && <RouteLockOverlay session={guided.session} onJoin={guided.join} />}
        </main>
      </div>
    </div>
  );
};

export default App;
