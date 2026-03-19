import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Card } from 'react-bootstrap';

export default function RegisterPage() {
  return (
    <div className="min-vh-100 py-5 auth-page">
      <Container className="max-w-500">
        <Card className="p-4">
          <Card.Body>
            <div className="text-center mb-4">
              <h2 className="fw-bold">Cuentas de alumno</h2>
              <p className="text-muted mb-3">
                Las cuentas de alumno son creadas exclusivamente por tu coach. No existe registro público.
              </p>
              <p className="mb-0">
                Si quieres entrenar con FitCoach Pro, contacta a tu coach para que te cree una cuenta y te proporcione tus credenciales de acceso.
              </p>
            </div>
            <hr />
            <p className="text-center text-muted small mb-0">
              ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
