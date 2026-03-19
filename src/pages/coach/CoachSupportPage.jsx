import React from 'react';
import { Card } from 'react-bootstrap';

export default function CoachSupportPage() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Soporte</h2>
          <p className="text-muted mb-0">Consulta con el administrador tus dudas sobre la plataforma</p>
        </div>
      </div>
      <Card className="border-0">
        <Card.Body className="text-center py-5 text-muted">
          <p className="mb-0">Chat de soporte con administrador en desarrollo. Próximamente podrás consultar aquí.</p>
        </Card.Body>
      </Card>
    </div>
  );
}
