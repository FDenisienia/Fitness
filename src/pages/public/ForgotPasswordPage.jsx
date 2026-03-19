import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-5 auth-page">
      <Container className="max-w-400">
        <Card className="p-4">
          <Card.Body>
            <div className="text-center mb-4">
              <h2 className="fw-bold">Recuperar contraseña</h2>
              <p className="text-muted">Ingresa tu email y te enviaremos un enlace para restablecerla</p>
            </div>
            {sent ? (
              <Alert variant="success">
                Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                <div className="mt-3">
                  <Link to="/login">Volver al login</Link>
                </div>
              </Alert>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </Form.Group>
                <Button type="submit" className="w-100 btn-primary py-2">
                  Enviar enlace
                </Button>
              </Form>
            )}
            <p className="text-center mt-4 mb-0 text-muted small">
              <Link to="/login">Volver al inicio de sesión</Link>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
