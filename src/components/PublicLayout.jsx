import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import AthlentoLogo from './AthlentoLogo';

export default function PublicLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLanding) return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const updateOverflow = () => {
      const isMobile = window.matchMedia('(max-width: 991px)').matches;
      document.body.style.overflow = isMobile && menuOpen ? 'hidden' : '';
    };
    updateOverflow();
    window.addEventListener('resize', updateOverflow);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('resize', updateOverflow);
    };
  }, [menuOpen]);

  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navLinksLeft = isLanding ? [
    { href: '#funcionalidades', label: 'Funcionalidades', onClick: (e) => scrollTo(e, '#funcionalidades') },
    { href: '#como-empezar', label: 'Cómo empezar', onClick: (e) => scrollTo(e, '#como-empezar') },
    { href: '#planes', label: 'Planes', onClick: (e) => scrollTo(e, '#planes') },
    { href: '#contacto', label: 'Contacto', onClick: (e) => scrollTo(e, '#contacto') },
  ] : [];
  const navLinksRight = isLanding ? [
    { to: '/login', label: 'Iniciar sesión', isLink: true },
  ] : [];
  const navLinks = !isLanding ? [
    { to: '/', label: 'Inicio', isLink: true },
    ...(location.pathname !== '/login' ? [
      { to: '/login', label: 'Iniciar sesión', isLink: true, alignRight: true },
      { to: '/registro', label: 'Registrarse', isLink: true, primary: true },
    ] : []),
  ] : [];

  if (isLanding) {
    return (
      <>
        <header className={`navbar-landing ${scrolled ? 'scrolled' : ''}`}>
          {/* Desktop: 3 bloques (left | center | right) */}
          <div className="navbar-landing-inner">
            {/* Bloque izquierdo: links de navegación */}
            <nav className="navbar-landing-block navbar-landing-block--left">
              {navLinksLeft.map((item, i) => (
                item.isLink ? (
                  <Link key={i} to={item.to} className="navbar-landing-link" onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </Link>
                ) : (
                  <a key={i} href={item.href} className="navbar-landing-link" onClick={item.onClick}>
                    {item.label}
                  </a>
                )
              ))}
            </nav>

            {/* Bloque centro: logo + marca (vertical) */}
            <Link to="/" className="navbar-landing-block navbar-landing-block--center">
              <AthlentoLogo size="xs" layout="horizontal" />
            </Link>

            {/* Bloque derecho: Iniciar sesión */}
            <div className="navbar-landing-block navbar-landing-block--right">
              {navLinksRight.map((item, i) => (
                <Link key={i} to={item.to} className="navbar-landing-cta" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile: hamburguesa + logo centrado */}
          <div className="navbar-landing-mobile">
            <button
              type="button"
              className={`navbar-landing-toggle ${menuOpen ? 'navbar-landing-toggle--open' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
            >
              <span className="navbar-landing-toggle-bar" />
              <span className="navbar-landing-toggle-bar" />
              <span className="navbar-landing-toggle-bar" />
            </button>
            <Link to="/" className="navbar-landing-brand-mobile">
              <AthlentoLogo size="xs" layout="horizontal" />
            </Link>
          </div>

          {/* Dropdown móvil */}
          <div className={`navbar-landing-dropdown ${menuOpen ? 'navbar-landing-dropdown--open' : ''}`}>
            <nav className="navbar-landing-dropdown-nav">
              {navLinksLeft.map((item, i) => (
                item.isLink ? (
                  <Link key={i} to={item.to} className="navbar-landing-dropdown-link" onClick={() => setMenuOpen(false)}>
                    {item.label}
                  </Link>
                ) : (
                  <a key={i} href={item.href} className="navbar-landing-dropdown-link" onClick={item.onClick}>
                    {item.label}
                  </a>
                )
              ))}
              <Link to="/login" className="navbar-landing-dropdown-cta" onClick={() => setMenuOpen(false)}>
                Iniciar sesión
              </Link>
            </nav>
          </div>
        </header>
        <Outlet />
      </>
    );
  }

  return (
    <>
      <header className="navbar-landing navbar-landing--legacy">
        <div className="navbar-landing-top">
          <button
            type="button"
            className={`navbar-landing-toggle ${menuOpen ? 'navbar-landing-toggle--open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
          >
            <span className="navbar-landing-toggle-bar" />
            <span className="navbar-landing-toggle-bar" />
            <span className="navbar-landing-toggle-bar" />
          </button>
          <Link to="/" className="navbar-landing-brand">
            <AthlentoLogo size="xs" />
          </Link>
          <div className="navbar-landing-spacer" aria-hidden="true" />
        </div>
        <div className={`navbar-landing-dropdown ${menuOpen ? 'navbar-landing-dropdown--open' : ''}`}>
            <nav className="navbar-landing-nav">
            {navLinks.map((item, i) => (
              <Link key={i} to={item.to} className={`navbar-landing-link ${item.primary ? 'navbar-landing-link--primary' : ''} ${item.alignRight ? 'navbar-landing-link--right' : ''}`} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  );
}
