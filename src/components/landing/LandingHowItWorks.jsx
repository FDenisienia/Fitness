import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { HOW_IT_WORKS_STEPS } from '../../data/landingData';

export default function LandingHowItWorks() {
  return (
    <section id="como-empezar" className="landing-how-it-works">
      <Container>
        <motion.div
          className="section-header text-center mb-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Empezar es sencillo</h2>
          <p className="section-subtitle max-w-600 mx-auto">
            Cinco pasos para pasar de caos a control total sobre tus entrenamientos.
          </p>
        </motion.div>

        <div className="how-it-works-timeline">
          <Row className="justify-content-center">
            {HOW_IT_WORKS_STEPS.map((s, i) => (
              <Col xs={12} md={6} lg key={s.step} className="mb-4 mb-lg-0">
                <motion.div
                  className="step-card"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="step-number">{s.step}</div>
                  <h4 className="step-title">{s.title}</h4>
                  <p className="step-desc">{s.desc}</p>
                  {i < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="step-connector d-none d-lg-block" aria-hidden="true" />
                  )}
                </motion.div>
              </Col>
            ))}
          </Row>
        </div>

        <div className="text-center mt-5">
          <Button as={Link} to="/registro" size="lg" className="btn-primary">
            Crear cuenta gratis
          </Button>
        </div>
      </Container>
    </section>
  );
}
