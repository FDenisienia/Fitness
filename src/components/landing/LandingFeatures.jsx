import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FEATURES } from '../../data/landingData';

const ICON_MAP = {
  users: (
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
  ),
  routines: (
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
  ),
  library: (
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2zM12 11v6M9 14h6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chart: (
    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  ),
  message: (
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
  ),
  dashboard: (
    <path d="M3 3v18h18M18 9l-5 5-4-4-3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  ),
  calendar: (
    <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
  ),
  video: (
    <path d="M23 7l-7 5 7 5V7zM16 19H2V5h14v14z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
  ),
};

function FeatureIcon({ icon }) {
  const path = ICON_MAP[icon] || ICON_MAP.users;
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {path}
    </svg>
  );
}

export default function LandingFeatures() {
  return (
    <section id="funcionalidades" className="landing-features">
      <Container>
        <motion.div
          className="section-header text-center mb-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Todo lo que necesitás en una plataforma</h2>
          <p className="section-subtitle max-w-600 mx-auto">
            Herramientas diseñadas específicamente para coaches que quieren profesionalizar su servicio.
          </p>
        </motion.div>

        <Row className="g-4">
          {FEATURES.map((f, i) => (
            <Col xs={12} md={6} lg={4} xl={3} key={f.id}>
              <motion.div
                className="feature-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                whileHover={{ y: -6 }}
              >
                <div className="feature-card-icon">
                  <FeatureIcon icon={f.icon} />
                </div>
                <h4 className="feature-card-title">{f.title}</h4>
                <p className="feature-card-desc">{f.description}</p>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
