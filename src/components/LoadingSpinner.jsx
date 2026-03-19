import React from 'react';
import { Spinner } from 'react-bootstrap';

/**
 * Spinner de carga reutilizable para estados de loading.
 */
export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`d-flex justify-content-center align-items-center py-5 ${className}`}>
      <Spinner animation="border" role="status" aria-label="Cargando">
        <span className="visually-hidden">Cargando...</span>
      </Spinner>
    </div>
  );
}
