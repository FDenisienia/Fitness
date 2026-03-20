import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav } from 'react-bootstrap';

export default function PublicLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLanding) return;
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  const scrollTo = (e, id) => {
    e.preventDefault();
    const el = document.querySelector(id);
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLanding) {
    return (
      <>
        <Navbar
          expand="lg"
          className={`navbar-landing py-3 ${scrolled ? 'scrolled' : ''}`}
          collapseOnSelect
        >
          <Container fluid className="px-3 px-lg-4">
            <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
              Athlento
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="public-nav" />
            <Navbar.Collapse id="public-nav" className="navbar-landing-collapse">
              <div className="flex-grow-1" />
              <Nav className="align-items-center navbar-landing-nav">
                <Nav.Link href="#funcionalidades" onClick={(e) => scrollTo(e, '#funcionalidades')}>
                  Funcionalidades
                </Nav.Link>
                <Nav.Link href="#como-funciona" onClick={(e) => scrollTo(e, '#como-funciona')}>
                  Cómo funciona
                </Nav.Link>
                <Nav.Link href="#planes" onClick={(e) => scrollTo(e, '#planes')}>
                  Planes
                </Nav.Link>
              </Nav>
              <div className="flex-grow-1" />
              <Nav.Link as={Link} to="/login" className="navbar-landing-login">
                Iniciar sesión
              </Nav.Link>
            </Navbar.Collapse>
          </Container>
        </Navbar>
        <Outlet />
      </>
    );
  }

  const isLoginPage = location.pathname === '/login';

  return (
    <>
      <Navbar expand="lg" className="navbar-landing py-3" collapseOnSelect>
        <Container fluid className="px-3 px-lg-4">
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
            Athlento
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="public-nav" />
          <Navbar.Collapse id="public-nav" className="justify-content-end">
            <Nav>
              <Nav.Link as={Link} to="/">Inicio</Nav.Link>
              {!isLoginPage && (
                <>
                  <Nav.Link as={Link} to="/login">Iniciar sesión</Nav.Link>
                  <Nav.Link as={Link} to="/registro" className="btn btn-primary ms-2">
                    Registrarse
                  </Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Outlet />
    </>
  );
}
