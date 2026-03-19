import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';

export default function LandingCTAFinal() {
  return (
    <section id="cta-final" className="landing-cta-final">
      <Container className="text-center">
        <motion.h2
          className="landing-cta-title"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          Llevá tu coaching al siguiente nivel
        </motion.h2>
        <motion.p
          className="landing-cta-subtitle"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Empezá hoy. Sin tarjeta de crédito para probar.
        </motion.p>
        <motion.div
          className="landing-cta-buttons"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Button as={Link} to="/registro" size="lg" className="btn-primary me-2 mb-2 mb-sm-0 btn-animated">
            Empezá hoy
          </Button>
          <Button as={Link} to="/login" variant="outline-light" size="lg" className="btn-animated">
            Ingresar
          </Button>
        </motion.div>
        <p className="landing-cta-note mt-4 mb-0">
          <small>Planes desde USD 7.99/mes • Cancelá cuando quieras</small>
        </p>
      </Container>
    </section>
  );
}
