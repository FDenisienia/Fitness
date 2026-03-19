import React from 'react';
import { Card } from 'react-bootstrap';

export default function ClientConsultationsPage() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Mensajes</h2>
      </div>
      <Card className="border-0">
        <Card.Body className="text-center py-5 text-muted">
          <p className="mb-0">Mensajería coach-cliente en desarrollo. Próximamente podrás chatear con tu coach aquí.</p>
        </Card.Body>
      </Card>
    </div>
  );
}
