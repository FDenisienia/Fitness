import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';

export default function LandingContact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      // TODO: conectar con API de contacto cuando exista
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contacto" className="landing-contact">
      <Container>
        <motion.div
          className="section-header text-center mb-5"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="section-title">Contacto</h2>
          <p className="section-subtitle max-w-600 mx-auto">
            ¿Tenés dudas o querés más información? Escribinos y te respondemos a la brevedad.
          </p>
        </motion.div>

        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <motion.div
              className="landing-contact-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              {sent ? (
                <div className="landing-contact-success text-center py-5">
                  <div className="landing-contact-success-icon">✓</div>
                  <h3 className="landing-contact-success-title">¡Mensaje enviado!</h3>
                  <p className="landing-contact-success-text">
                    Gracias por contactarnos. Te responderemos pronto.
                  </p>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setSent(false)}
                    className="mt-3"
                  >
                    Enviar otro mensaje
                  </Button>
                </div>
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      required
                      className="landing-contact-input"
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      required
                      className="landing-contact-input"
                    />
                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Label>Mensaje</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="¿En qué podemos ayudarte?"
                      required
                      className="landing-contact-input"
                    />
                  </Form.Group>
                  <Button
                    type="submit"
                    className="btn-primary w-100"
                    disabled={sending}
                  >
                    {sending ? 'Enviando...' : 'Enviar mensaje'}
                  </Button>
                </Form>
              )}
            </motion.div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
