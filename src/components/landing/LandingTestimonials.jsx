import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { TESTIMONIALS } from '../../data/landingData';

export default function LandingTestimonials() {
  return (
    <section id="testimonios" className="landing-testimonials">
      <Container>
        <motion.div
          className="section-header text-center mb-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Lo que dicen nuestros usuarios</h2>
          <p className="section-subtitle max-w-600 mx-auto">
            Coaches y clientes que ya mejoraron su día a día.
          </p>
        </motion.div>

        <Row className="g-4">
          {TESTIMONIALS.map((t, i) => (
            <Col xs={12} md={4} key={i}>
              <motion.div
                className="testimonial-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{t.text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
}
