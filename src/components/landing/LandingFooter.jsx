import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

const FOOTER_LINKS = [
  { to: '#funcionalidades', label: 'Funcionalidades' },
  { to: '#como-funciona', label: 'Cómo funciona' },
  { to: '#planes', label: 'Planes' },
  { to: '/login', label: 'Iniciar sesión' },
  { to: '/registro', label: 'Registrarse' },
];

const SOCIAL_LINKS = [
  { label: 'Instagram', href: '#', icon: 'ig' },
  { label: 'LinkedIn', href: '#', icon: 'li' },
  { label: 'Twitter', href: '#', icon: 'tw' },
];

export default function LandingFooter() {
  const handleClick = (e, to) => {
    if (to.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(to);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="landing-footer">
      <Container>
        <Row className="landing-footer-row">
          <Col md={4} className="mb-4 mb-md-0">
            <Link to="/" className="landing-footer-brand">
              Athlento
            </Link>
            <p className="landing-footer-tagline">
              Sistema de gestión de entrenamientos para coaches profesionales.
            </p>
            <div className="landing-footer-social">
              {SOCIAL_LINKS.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="landing-footer-social-link"
                  aria-label={s.label}
                >
                  {s.label}
                </a>
              ))}
            </div>
          </Col>
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="landing-footer-heading">Enlaces</h5>
            <ul className="landing-footer-links">
              {FOOTER_LINKS.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} onClick={(e) => handleClick(e, l.to)}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Col>
          <Col md={4}>
            <h5 className="landing-footer-heading">Contacto</h5>
            <p className="landing-footer-contact mb-0">
              <a href="mailto:hola@fitcoachpro.com">hola@fitcoachpro.com</a>
            </p>
          </Col>
        </Row>
        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} Athlento. Entrenamientos personalizados.</span>
        </div>
      </Container>
    </footer>
  );
}
