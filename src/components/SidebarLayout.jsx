import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';
import AthlentoLogo from './AthlentoLogo';

const navItems = {
  admin: [
    { to: '/admin', label: 'Dashboard', exact: true },
    { to: '/admin/coaches', label: 'Coaches (clientes)' },
    { to: '/admin/alumnos', label: 'Alumnos' },
    { to: '/admin/usuarios', label: 'Usuarios' },
    { to: '/admin/rutinas', label: 'Rutinas' },
    { to: '/admin/planes', label: 'Planes y cobros' },
    { to: '/admin/biblioteca-ejercicios', label: 'Biblioteca global' },
    { to: '/admin/consultas', label: 'Soporte / Consultas' }
  ],
  coach: [
    { to: '/coach', label: 'Dashboard', exact: true },
    { to: '/coach/calendario', label: 'Calendario' },
    { to: '/coach/alumnos', label: 'Mis alumnos' },
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

  let items = navItems[role] || [];
  if (role === 'coach' && plan) {
    items = items.filter(item => !item.requires || plan[item.requires]);
  }

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

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

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-hidden={!sidebarOpen}>
        <div className="sidebar-drawer">
          <div className="sidebar-brand">
            <AthlentoLogo size="sm" />
          </div>
          <div className="sidebar-middle">
            <div className="sidebar-user-top">
              <span className="sidebar-user-top-text">
                {user?.name} {user?.lastName}
              </span>
            </div>
            <nav className="sidebar-nav flex-column" aria-label="Navegación principal">
              {items.map(({ to, label, exact }) => (
                <Nav.Link
                  key={to}
                  as={Link}
                  to={to}
                  className={exact ? (location.pathname === to ? 'active' : '') : (location.pathname.startsWith(to) ? 'active' : '')}
                  onClick={closeSidebar}
                >
                  {label}
                </Nav.Link>
              ))}
            </nav>
          </div>
          <div className="sidebar-footer">
            <div className="sidebar-footer-user">{user?.name} {user?.lastName}</div>
            <div className="sidebar-footer-logout">
              <button type="button" className="btn btn-outline-light btn-sm w-100" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content flex-grow-1">
        <Outlet />
      </main>
    </div>
  );
}
