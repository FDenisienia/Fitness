import React from 'react';
import { Card } from 'react-bootstrap';

export default function ConsultationsPage() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Consultas de coaches</h2>
          <p className="text-muted mb-0">Responde las dudas y consultas de los coaches</p>
        </div>
      </div>
      <Card className="border-0">
        <Card.Body className="text-center py-5 text-muted">
          <p className="mb-0">Mensajería admin-coach en desarrollo. Próximamente podrás gestionar las consultas de soporte aquí.</p>
        </Card.Body>
      </Card>
    </div>
  );
}
