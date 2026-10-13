import React from 'react'
import { useStore, nav, doLogout, AREAS, ALL_AREAS, isCloneUser } from '../store/store.jsx'
import {
  useMobile, LogoImg, MapIc, GameIc, FileIc, UserIc, BookIc,
  SchoolIc, BarIc, ClockIc, UsersIc, LogOutIc, XIc, MsgIc, ChevRIc, TargetIc, CheckIc
} from './ui.jsx'

const COLLAPSE_KEY = 'experia:sidebar-collapsed';

const Sidebar = React.memo(({ mobileOpen, onMobileClose }) => {
  const page = useStore(s => s.page);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const user = useStore(s => s.user);
  const selectedArea = useStore(s => s.selectedArea);
  const isMobile = useMobile();
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  if (!isLoggedIn || !user) return null;

  const toggleCollapsed = () => setCollapsed(c => {
    const next = !c;
    try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch {}
    return next;
  });
  // El colapso solo aplica en desktop; en móvil el overlay siempre se muestra completo.
  const isCollapsed = collapsed && !isMobile;

  const role = user.role;
  const area = ALL_AREAS.find(a => a.id === selectedArea);

  const studentItems = [
    { key: 'map', label: 'Mi formación', icon: <MapIc s={19} />, active: ['map','lesson','challenge','grid'] },
    { key: 'games', label: 'Juegos', icon: <GameIc s={19} />, active: ['games'] },
    { key: 'forum', label: 'Comunidad', icon: <MsgIc s={19} />, active: ['forum'] },
    { key: 'profile', label: 'Perfil', icon: <UserIc s={19} />, active: ['profile'] },
  ];
  const instructorItems = [
    { key: 'instructor-dashboard', label: 'Entregas',     icon: <FileIc s={19} />, active: ['instructor-dashboard'] },
    { key: 'instructor-stats',     label: 'Estadísticas', icon: <BarIc s={19} />,  active: ['instructor-stats'] },
    { key: 'instructor-items',     label: 'Análisis de ítems', icon: <TargetIc s={19} />, active: ['instructor-items'] },
    { key: 'instructor-route',     label: 'Ruta',         icon: <MapIc s={19} />,  active: ['instructor-route'] },
    { key: 'route-versions',       label: 'Versiones de ruta', icon: <BookIc s={19} />, active: ['route-versions'] },
    { key: 'live-host',            label: 'Aula en Vivo', icon: <GameIc s={19} />, active: ['live-host'] },
    { key: 'forum',                label: 'Comunidad',    icon: <MsgIc s={19} />,  active: ['forum'] },
    { key: 'profile',              label: 'Perfil',       icon: <UserIc s={19} />, active: ['profile'] },
  ];
  const adminItems = [
    { key: 'admin-dashboard',  label: 'Usuarios',   icon: <UsersIc s={19} />, active: ['admin-dashboard'] },
    { key: 'admin-courses',    label: 'Cursos',     icon: <BookIc s={19} />,  active: ['admin-courses'] },
    { key: 'admin-schools',    label: 'Colegios',   icon: <SchoolIc s={19} />, active: ['admin-schools'] },
    { key: 'admin-analytics',  label: 'Analítica',  icon: <BarIc s={19} />,   active: ['admin-analytics'] },
    { key: 'instructor-items', label: 'Análisis de ítems', icon: <TargetIc s={19} />, active: ['instructor-items'] },
    { key: 'route-versions',   label: 'Versiones de ruta', icon: <BookIc s={19} />, active: ['route-versions'] },
    { key: 'forum',            label: 'Comunidad',  icon: <MsgIc s={19} />,   active: ['forum'] },
    { key: 'profile',          label: 'Perfil',     icon: <UserIc s={19} />,  active: ['profile'] },
  ];
  // ── Modo clon (piloto temporal, 0051) ──────────────────────────────────────
  // No es un rol de BD: es la variante de interfaz `profiles.ui_variant`. El
  // docente clon conserva su ruta de formación tal cual y suma los dos módulos
  // del piloto; el tutor clon suma la gestión de grupos a su menú normal.
  const isClone = isCloneUser(user);
  const cloneStudentItems = [
    { key: 'map',                 label: 'Mi ruta de formación', icon: <MapIc s={19} />,   active: ['map','lesson','challenge','grid','course-cert','closing-record','clone-dashboard'] },
    { key: 'clone-attendance',    label: 'Marcar asistencia',    icon: <CheckIc s={19} />, active: ['clone-attendance'] },
    { key: 'clone-effectiveness', label: 'Tabla de efectividad', icon: <BarIc s={19} />,   active: ['clone-effectiveness'] },
    { key: 'profile',             label: 'Perfil',               icon: <UserIc s={19} />,  active: ['profile'] },
  ];
  const cloneTutorItems = [
    { key: 'clone-groups', label: 'Grupos y listados', icon: <UsersIc s={19} />, active: ['clone-groups'] },
    ...instructorItems,
  ];

  const items = isClone && role === 'student'    ? cloneStudentItems
              : isClone && role === 'instructor' ? cloneTutorItems
              : role === 'instructor' ? instructorItems
              : role === 'admin'      ? adminItems
              : studentItems;

  const handleNav = (e, key) => {
    // Allow Ctrl/Cmd+click and middle-click to open in new tab naturally
    if (e.button === 1 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    nav(key);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const roleColor = role === 'admin' ? '#7C3AED' : role === 'instructor' ? 'var(--success)' : 'var(--purple)';
  const roleBg    = role === 'admin' ? 'var(--violet-bg)' : role === 'instructor' ? 'var(--success-bg-strong)' : 'var(--purple-bg)';
  const baseLabel = role === 'admin' ? 'Administrador' : role === 'instructor' ? 'Instructor' : 'Estudiante';
  // El distintivo importa: en el piloto conviven cuentas normales y clon, y el
  // menú es lo único que las diferencia a simple vista.
  const roleLabel = isClone ? (role === 'instructor' ? 'Tutor clon' : 'Estudiante clon') : baseLabel;

  // Botón de colapsar/expandir — solo en desktop.
  const collapseToggle = !isMobile && (
    <button onClick={toggleCollapsed} title={isCollapsed ? 'Expandir menú' : 'Retraer menú'}
      aria-label={isCollapsed ? 'Expandir menú' : 'Retraer menú'} aria-pressed={isCollapsed}
      style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
        width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: 'var(--muted)', transition: 'color .2s' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--dark)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
      <span style={{ display: 'flex', transition: 'transform .25s var(--ease-spring)',
        transform: isCollapsed ? 'none' : 'rotate(180deg)' }}>
        <ChevRIc s={18} c="currentColor" />
      </span>
    </button>
  );

  const sidebarContent = (
    <aside style={{
      width: isCollapsed ? '76px' : 'var(--sidebar-w)', height: '100%', background: 'var(--white)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'width .25s var(--ease-out)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : (isMobile ? 'space-between' : 'center'),
        gap: 8, padding: isCollapsed ? '20px 12px 16px' : '20px 22px 16px' }}>
        {!isCollapsed && <LogoImg h={28} />}
        {isMobile && (
          <button onClick={onMobileClose} aria-label="Cerrar menú" style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIc s={18} c="var(--muted)" />
          </button>
        )}
        {collapseToggle}
      </div>

      <div style={{ padding: isCollapsed ? '0 12px 12px' : '0 16px 12px' }}>
        {isCollapsed ? (
          <div title={roleLabel} style={{ height: 8, borderRadius: 8, background: roleBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor }} />
          </div>
        ) : (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: roleBg,
            display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: roleColor }}>
              {roleLabel}
            </span>
            {area && role === 'student' && (
              <span style={{ fontSize: 10, color: area.color, fontWeight: 600 }}>· {area.icon} {area.name}</span>
            )}
          </div>
        )}
      </div>

      <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.map((item, i) => {
          const isActive = (item.active || [item.key]).includes(page);
          return (
            <a key={i} href={'#/' + item.key} onClick={(e) => handleNav(e, item.key)}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              style={{ position: 'relative', display: 'flex', alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                gap: isCollapsed ? 0 : 11, padding: isCollapsed ? '12px 0' : '12px 14px', borderRadius: 10,
                border: 'none', cursor: 'pointer', background: isActive ? 'var(--orange-bg)' : 'transparent',
                color: isActive ? 'var(--orange)' : 'var(--text-sec)', fontFamily: 'var(--font)',
                fontSize: 14, fontWeight: isActive ? 700 : 500, textAlign: 'left', width: '100%',
                transition: 'background .2s var(--ease-out), color .2s var(--ease-out), padding-left .2s var(--ease-out)',
                boxShadow: isActive ? 'inset 0 0 0 1px rgba(232,115,44,.14)' : 'none',
                minHeight: 44, textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden' }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-alt)'; e.currentTarget.style.color = 'var(--dark)'; if (!isCollapsed) e.currentTarget.style.paddingLeft = '18px'; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-sec)'; if (!isCollapsed) e.currentTarget.style.paddingLeft = '14px'; } }}>
              {/* Indicador del ítem activo */}
              <span aria-hidden="true" style={{ position: 'absolute', left: 0, top: '50%', translate: '0 -50%',
                width: 3.5, borderRadius: '0 4px 4px 0', background: 'var(--gradient-orange)',
                height: isActive ? 22 : 0, opacity: isActive ? 1 : 0,
                transition: 'height .25s var(--ease-spring), opacity .2s' }} />
              <span style={{ display: 'flex', transition: 'transform .25s var(--ease-spring)',
                transform: isActive ? 'scale(1.08)' : 'none' }}>{item.icon}</span>
              {!isCollapsed && item.label}
            </a>
          );
        })}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={doLogout} title={isCollapsed ? 'Cerrar sesión' : undefined}
          style={{ display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 0 : 8, padding: isCollapsed ? '10px 0' : '10px 14px',
          borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', background: 'transparent',
          color: 'var(--muted)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, transition: 'color .2s',
          textAlign: 'left', minHeight: 44, whiteSpace: 'nowrap', overflow: 'hidden' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
          <LogOutIc s={16} /> {!isCollapsed && 'Cerrar sesión'}
        </button>
        {!isCollapsed && (
          <div style={{ fontSize: 9, color: 'var(--subtle)', textAlign: 'center', marginTop: 6, letterSpacing: .3 }}>
            {/* eslint-disable-next-line no-undef */}
            v{new Date(typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' })}
          </div>
        )}
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div onClick={onMobileClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2999,
            backdropFilter: 'blur(2px)', animation: 'fadeIn .2s ease',
          }} />
        )}
        <div style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 3000,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
          boxShadow: mobileOpen ? 'var(--sh-xl)' : 'none',
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
});

export default Sidebar;
