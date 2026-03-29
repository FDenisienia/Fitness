import React, { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Nav, Toast, ToastContainer } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import AthlentoLogo from './AthlentoLogo';
import { getInitials } from '../utils/clientDisplay';
import { chatApi } from '../api/chat';
import { formatLoginUnreadNotice, unreadBadgeForNavPath } from '../utils/unreadMessages';

const LOGIN_UNREAD_KEY = 'athlento_login_unread';

const ROLE_LABELS = {
  admin: 'Administrador',
  coach: 'Coach',
  cliente: 'Cliente',
};

const navItems = {
  admin: [
    { to: '/admin', label: 'Dashboard', exact: true },
    { to: '/admin/usuarios', label: 'Usuarios' },
    { to: '/admin/planes', label: 'Planes y cobros' },
    { to: '/admin/biblioteca-ejercicios', label: 'Biblioteca global' },
    { to: '/admin/consultas', label: 'Soporte / Consultas' }
  ],
  coach: [
    { to: '/coach', label: 'Dashboard', exact: true },
    { to: '/coach/calendario', label: 'Calendario' },
    { to: '/coach/usuarios', label: 'Usuarios' },
    { to: '/coach/seguimiento', label: 'Seguimiento', requires: 'hasWeightTracking' },
    { to: '/coach/rutinas', label: 'Rutinas' },
    { to: '/coach/biblioteca-ejercicios', label: 'Biblioteca' },
    { to: '/coach/consultas', label: 'Mensajes' },
    { to: '/coach/soporte', label: 'Soporte' }
  ],
  cliente: [
    { to: '/cliente', label: 'Inicio', exact: true },
    { to: '/cliente/calendario', label: 'Calendario' },
    { to: '/cliente/rutinas', label: 'Mis rutinas' },
    { to: '/cliente/seguimiento', label: 'Seguimiento' },
    { to: '/cliente/consultas', label: 'Mensajes' },
    { to: '/cliente/perfil', label: 'Perfil' }
  ]
};

export default function SidebarLayout({ basePath, role }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const plan = usePlan();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // En viewport ancho el drawer está siempre visible: no marcar aria-hidden (evita avisos de foco).
  const [sidebarDesktop, setSidebarDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 992px)').matches
  );
  const [unreadCounts, setUnreadCounts] = useState(null);
  const [showLoginToast, setShowLoginToast] = useState(false);
  const [loginToastBody, setLoginToastBody] = useState('');

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await chatApi.unreadSummary();
      setUnreadCounts(data);
    } catch (_) {
      setUnreadCounts({ coachClientUnread: 0, adminCoachUnread: 0 });
    }
  }, []);

  let items = navItems[role] || [];
  if (role === 'coach' && plan) {
    items = items.filter(item => !item.requires || plan[item.requires]);
  }

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchUnread();
    const t = setInterval(fetchUnread, 45000);
    const onFocus = () => fetchUnread();
    const onUnreadEvent = () => fetchUnread();
    window.addEventListener('focus', onFocus);
    window.addEventListener('athlento-unread-refresh', onUnreadEvent);
    return () => {
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('athlento-unread-refresh', onUnreadEvent);
    };
  }, [fetchUnread]);

  useEffect(() => {
    const raw = sessionStorage.getItem(LOGIN_UNREAD_KEY);
    if (!raw) return;
    sessionStorage.removeItem(LOGIN_UNREAD_KEY);
    try {
      const d = JSON.parse(raw);
      const msg = formatLoginUnreadNotice(role, d);
      if (msg) {
        setLoginToastBody(msg);
        setShowLoginToast(true);
      }
    } catch (_) {}
  }, [role]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 992px)');
    const onChange = () => setSidebarDesktop(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => setSidebarOpen(s => !s);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="d-flex app-layout">
      {/* Overlay móvil */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Header móvil - ancho completo, logo centrado */}
      <header className="mobile-header">
        <button
          type="button"
          className={`sidebar-toggle ${sidebarOpen ? 'sidebar-toggle--open' : ''}`}
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarOpen}
        >
          <span className="sidebar-toggle-bar" />
          <span className="sidebar-toggle-bar" />
          <span className="sidebar-toggle-bar" />
        </button>
        <div className="mobile-header-brand-wrap">
          <AthlentoLogo size="xs" className="mobile-header-brand" />
        </div>
        <div className="mobile-header-spacer" aria-hidden="true" />
      </header>

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        aria-hidden={sidebarDesktop ? false : !sidebarOpen}
      >
        <div className="sidebar-drawer">
          <div className="sidebar-brand">
            <AthlentoLogo size="sm" />
          </div>
          <div className="sidebar-middle">
            <div className="sidebar-user-identity" aria-label="Tu cuenta">
              <div className="sidebar-user-identity-inner">
                <div className="sidebar-user-avatar" aria-hidden="true">
                  {getInitials(user?.name, user?.lastName)}
                </div>
                <div className="sidebar-user-meta">
                  <span className="sidebar-user-name">
                    {user?.name} {user?.lastName}
                  </span>
                  {role && ROLE_LABELS[role] && (
                    <span className="sidebar-user-role">{ROLE_LABELS[role]}</span>
                  )}
                </div>
              </div>
            </div>
            <nav className="sidebar-nav flex-column" aria-label="Navegación principal">
              {items.map(({ to, label, exact }) => {
                const badge = unreadBadgeForNavPath(to, role, unreadCounts);
                const badgeLabel = badge > 99 ? '99+' : String(badge);
                return (
                  <Nav.Link
                    key={to}
                    as={Link}
                    to={to}
                    className={exact ? (location.pathname === to ? 'active' : '') : (location.pathname.startsWith(to) ? 'active' : '')}
                    onClick={() => {
                      closeSidebar();
                      fetchUnread();
                    }}
                    aria-label={badge > 0 ? `${label}, ${badge} sin leer` : label}
                  >
                    <span className="sidebar-nav-link-inner">
                      <span>{label}</span>
                      {badge > 0 && (
                        <span className="sidebar-nav-badge" title={`${badge} sin leer`} aria-hidden="true">
                          {badgeLabel}
                        </span>
                      )}
                    </span>
                  </Nav.Link>
                );
              })}
            </nav>
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-footer-logout">
              <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content flex-grow-1 position-relative">
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1080 }}>
          <Toast
            show={showLoginToast}
            onClose={() => setShowLoginToast(false)}
            delay={9000}
            autohide
            bg="dark"
          >
            <Toast.Header closeButton closeVariant="white">
              <strong className="me-auto">Mensajes sin leer</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{loginToastBody}</Toast.Body>
          </Toast>
        </ToastContainer>
        <Outlet />
      </main>
    </div>
  );
}
