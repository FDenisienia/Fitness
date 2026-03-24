import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';

const PROBLEMS = [
  { icon: 'chaos', title: 'Desorden en rutinas', desc: 'Planillas sueltas, Excel que nadie actualiza.' },
  { icon: 'tracking', title: 'Falta de seguimiento', desc: 'No sabés si tu cliente cumplió o avanzó.' },
  { icon: 'chat', title: 'Mala comunicación', desc: 'WhatsApp mezclado con todo, contexto perdido.' },
];

const SOLUTIONS = [
  { icon: 'check', text: 'Rutinas centralizadas y asignadas en segundos' },
  { icon: 'check', text: 'Registro de progreso y peso en tiempo real' },
  { icon: 'check', text: 'Chat integrado coach-cliente dentro de la app' },
];

function ProblemIcon({ type }) {
  const paths = {
    chaos: (
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    ),
    tracking: (
      <path d="M12 20V10M18 20V4M6 20v-4" />
    ),
    chat: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
  };
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round">
      {paths[type] || paths.chaos}
    </svg>
  );
}

export default function LandingProblemSolution() {
  return (
    <section id="problema-solucion" className="landing-problem-solution">
      <Container>
        <motion.div
          className="section-header text-center mb-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Menos caos, más resultados</h2>
          <p className="section-subtitle max-w-600 mx-auto">
            Los coaches se enfrentan cada día a los mismos problemas. Nosotros los resolvimos.
          </p>
        </motion.div>

        <Row className="g-4 mb-5">
          {PROBLEMS.map((p, i) => (
            <Col xs={12} md={4} key={i}>
              <motion.div
                className="problem-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <div className="problem-card-icon">
                  <ProblemIcon type={p.icon} />
                </div>
                <h4 className="problem-card-title">{p.title}</h4>
                <p className="problem-card-desc">{p.desc}</p>
              </motion.div>
            </Col>
          ))}
        </Row>

        <motion.div
          className="solution-block"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="solution-title">Cómo lo solucionamos</h3>
          <Row className="g-3 justify-content-center">
            {SOLUTIONS.map((s, i) => (
              <Col xs={12} md={4} key={i}>
                <div className="solution-item">
                  <span className="solution-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span>{s.text}</span>
                </div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </Container>
    </section>
  );
}
