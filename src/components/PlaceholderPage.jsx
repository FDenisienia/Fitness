import React from 'react';
import { Card } from 'react-bootstrap';

/**
 * Página placeholder para funcionalidades en desarrollo.
 */
export default function PlaceholderPage({ title, subtitle, message }) {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="text-muted mb-0">{subtitle}</p>}
        </div>
      </div>
      <Card className="border-0">
        <Card.Body className="text-center py-5 text-muted">
          <p className="mb-0">{message}</p>
        </Card.Body>
      </Card>
    </div>
  );
}
