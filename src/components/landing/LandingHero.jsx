import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';

export default function LandingHero() {
  return (
    <section id="hero" className="landing-hero">
      <div className="landing-hero-bg" aria-hidden="true" />
      <Container>
        <Row className="align-items-center min-vh-75">
          <Col lg={6} className="order-lg-1 order-2">
            <motion.h1
              className="landing-hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Gestioná tus clientes fitness <span className="text-accent">como un profesional</span>
            </motion.h1>
            <motion.p
              className="landing-hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              Plataforma todo en uno para coaches: rutinas personalizadas, seguimiento de progreso, chat integrado y calendario. Tus alumnos entrenan mejor, vos trabajás menos.
            </motion.p>
            <motion.div
              className="landing-hero-cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <Button as={Link} to="/registro" size="lg" className="btn-primary me-2 mb-2 mb-md-0 btn-animated">
                Solicitá tu prueba gratis
              </Button>
              <Button as={Link} to="/login" variant="outline-light" size="lg" className="btn-animated">
                Ya tengo cuenta
              </Button>
            </motion.div>
          </Col>
          <Col lg={6} className="order-lg-2 order-1 mb-5 mb-lg-0">
            <motion.div
              className="landing-hero-mockup"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <DashboardMockup />
            </motion.div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="dashboard-mockup">
      <div className="mockup-header">
        <span className="mockup-dots" />
        <span className="mockup-title">Dashboard Coach</span>
        <span className="mockup-avatar">JD</span>
      </div>
      <div className="mockup-content">
        <div className="mockup-quick-actions">
          {['Crear rutina', 'Asignar alumno', 'Ver calendario'].map((l, i) => (
            <div key={i} className="mockup-pill">{l}</div>
          ))}
        </div>
        <div className="mockup-kpis">
          {[
            { value: '12', label: 'Alumnos', color: 'accent' },
            { value: '8', label: 'Rutinas activas', color: 'blue' },
            { value: '5', label: 'Hoy', color: 'green' },
          ].map((k, i) => (
            <div key={i} className={`mockup-kpi mockup-kpi--${k.color}`}>
              <span className="mockup-kpi-value">{k.value}</span>
              <span className="mockup-kpi-label">{k.label}</span>
            </div>
          ))}
        </div>
        <div className="mockup-list">
          <div className="mockup-list-item">
            <span className="mockup-avatar-sm">JG</span>
            <span>Juan García • Fuerza • Pendiente</span>
          </div>
          <div className="mockup-list-item">
            <span className="mockup-avatar-sm">MP</span>
            <span>María Pérez • Hipertrofia • Completado</span>
          </div>
          <div className="mockup-list-item">
            <span className="mockup-avatar-sm">LR</span>
            <span>Laura Rodríguez • Pérdida peso • Sin sesión</span>
          </div>
        </div>
      </div>
    </div>
  );
}
