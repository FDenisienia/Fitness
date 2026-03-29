import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { validatePasswordPair } from '../utils/passwordValidation';

function EyeToggleIcon({ visible }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * Modal reutilizable: nueva contraseña + confirmación.
 * `onSubmit` recibe la contraseña en texto plano (solo en memoria hasta el fetch).
 */
export default function ChangePasswordModal({
  show,
  onHide,
  title = 'Cambiar contraseña',
  targetLabel,
  submitLabel = 'Guardar',
  onSubmit,
  submitting = false,
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!show) {
      setPassword('');
      setConfirm('');
      setLocalError('');
      setShowNew(false);
      setShowConfirm(false);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const err = validatePasswordPair(password, confirm);
    if (err) {
      setLocalError(err);
      return;
    }
    await onSubmit(password.trim());
  };

  return (
    <Modal show={show} onHide={() => !submitting && onHide()} centered>
      <Modal.Header closeButton={!submitting}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {targetLabel && (
            <p className="text-muted small mb-3 mb-0">
              Usuario: <strong>{targetLabel}</strong>
            </p>
          )}
          {localError && (
            <Alert variant="danger" className="py-2 small">
              {localError}
            </Alert>
          )}
          <Form.Group className="mb-3">
            <Form.Label>Nueva contraseña</Form.Label>
            <InputGroup>
              <Form.Control
                className="border-end-0"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline-secondary"
                className="border-start-0 d-flex align-items-center px-3"
                onClick={() => setShowNew((v) => !v)}
                disabled={submitting}
                aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showNew ? 'Ocultar' : 'Mostrar'}
              >
                <EyeToggleIcon visible={showNew} />
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              Mínimo 8 caracteres, una mayúscula y un número.
            </Form.Text>
          </Form.Group>
          <Form.Group className="mb-0">
            <Form.Label>Confirmar contraseña</Form.Label>
            <InputGroup>
              <Form.Control
                className="border-end-0"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={submitting}
              />
              <Button
                type="button"
                variant="outline-secondary"
                className="border-start-0 d-flex align-items-center px-3"
                onClick={() => setShowConfirm((v) => !v)}
                disabled={submitting}
                aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                title={showConfirm ? 'Ocultar' : 'Mostrar'}
              >
                <EyeToggleIcon visible={showConfirm} />
              </Button>
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onHide} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Guardando…' : submitLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
