import React from 'react';
import { Card } from 'react-bootstrap';

export default function WeightSummary({ records = [] }) {
  const sorted = [...records].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (!first) {
    return (
      <Card className="mb-4 border-0 bg-light">
        <Card.Body className="text-center py-4 text-muted">
          Sin registros de peso. Añade tu primer registro.
        </Card.Body>
      </Card>
    );
  }

  const diff = last && first !== last ? (parseFloat(last.peso) - parseFloat(first.peso)).toFixed(1) : null;

  return (
    <div className="row g-3 mb-4">
      <div className="col-md-4">
        <Card className="border-0 bg-primary bg-opacity-10 h-100">
          <Card.Body>
            <h6 className="text-muted text-uppercase mb-2">Peso inicial</h6>
            <h3 className="mb-0">{first.peso} <span className="fs-6 fw-normal text-muted">kg</span></h3>
            <small className="text-muted">{first.fecha}</small>
          </Card.Body>
        </Card>
      </div>
      <div className="col-md-4">
        <Card className="border-0 bg-success bg-opacity-10 h-100">
          <Card.Body>
            <h6 className="text-muted text-uppercase mb-2">Peso actual</h6>
            <h3 className="mb-0">{(last || first).peso} <span className="fs-6 fw-normal text-muted">kg</span></h3>
            <small className="text-muted">{(last || first).fecha}</small>
          </Card.Body>
        </Card>
      </div>
      {diff != null && (
        <div className="col-md-4">
          <Card className={`border-0 h-100 ${parseFloat(diff) < 0 ? 'bg-success bg-opacity-10' : parseFloat(diff) > 0 ? 'bg-warning bg-opacity-10' : 'bg-secondary bg-opacity-10'}`}>
            <Card.Body>
              <h6 className="text-muted text-uppercase mb-2">Diferencia total</h6>
              <h3 className={`mb-0 ${parseFloat(diff) < 0 ? 'text-success' : parseFloat(diff) > 0 ? 'text-warning' : ''}`}>
                {parseFloat(diff) > 0 ? '+' : ''}{diff} <span className="fs-6 fw-normal text-muted">kg</span>
              </h3>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}
