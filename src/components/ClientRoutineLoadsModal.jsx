import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { clientRoutinesApi } from '../api';
import { sanitizeWeightInput } from '../utils/weightInput';

function sortExercises(exercises) {
  return [...(exercises || [])].sort((a, b) => {
    const sa = Math.max(1, a.sessionIndex ?? a.session ?? 1);
    const sb = Math.max(1, b.sessionIndex ?? b.session ?? 1);
    if (sa !== sb) return sa - sb;
    return (a.order || 0) - (b.order || 0);
  });
}

export default function ClientRoutineLoadsModal({
  show,
  onHide,
  routine,
  clientRoutineId,
  onSaved,
  title = 'Editar cargas por serie',
}) {
  const exercises = useMemo(() => sortExercises(routine?.exercises), [routine?.exercises]);
  const [draftByCreId, setDraftByCreId] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!show || !exercises.length) return;
    const d = {};
    for (const ex of exercises) {
      const creId = ex.clientRoutineExerciseId || ex.id;
      const sets = ex.exerciseSets?.length
        ? ex.exerciseSets
        : Array.from({ length: Math.max(1, parseInt(String(ex.sets), 10) || 3) }, (_, i) => ({
            setNumber: i + 1,
            assignedWeight: null,
          }));
      d[creId] = sets.map((s) =>
        s.assignedWeight != null && s.assignedWeight !== '' ? String(s.assignedWeight) : ''
      );
    }
    setDraftByCreId(d);
  }, [show, exercises]);

  const buildUpdates = () =>
    exercises.map((ex) => {
      const creId = ex.clientRoutineExerciseId || ex.id;
      const n = ex.exerciseSets?.length || Math.max(1, parseInt(String(ex.sets), 10) || 3);
      const arr = draftByCreId[creId] || Array(n).fill('');
      return { clientRoutineExerciseId: creId, setWeights: arr.slice(0, n) };
    });

  const handleSave = async () => {
    if (!clientRoutineId) return;
    setSaving(true);
    try {
      await clientRoutinesApi.patchSetWeights(clientRoutineId, { updates: buildUpdates() });
      onSaved?.();
      onHide();
    } catch (e) {
      alert(e.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const setCell = (creId, idx, val) => {
    setDraftByCreId((prev) => ({
      ...prev,
      [creId]: (prev[creId] || []).map((v, i) => (i === idx ? sanitizeWeightInput(val) : v)),
    }));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" fullscreen="md-down">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <p className="small text-muted mb-3">
          Pesos opcionales por serie (kg). Dejá en blanco si aún no aplica.
        </p>
        {exercises.map((ex) => {
          const creId = ex.clientRoutineExerciseId || ex.id;
          const n = ex.exerciseSets?.length || Math.max(1, parseInt(String(ex.sets), 10) || 3);
          const row = draftByCreId[creId] || Array(n).fill('');
          return (
            <div key={creId} className="form-section mb-3 pb-3 border-bottom border-secondary border-opacity-25">
              <div className="form-section-title mb-2">{ex.name}</div>
              <p className="small text-muted mb-2">
                {n} serie{n !== 1 ? 's' : ''}
                {ex.reps ? ` · ${ex.reps} reps` : ''}
              </p>
              <Row className="g-2">
                {Array.from({ length: n }, (_, i) => (
                  <Col xs={6} sm={4} md={3} key={i}>
                    <Form.Group className="mb-0">
                      <Form.Label className="small mb-1">Serie {i + 1}</Form.Label>
                      <Form.Control
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="kg"
                        value={row[i] ?? ''}
                        onChange={(e) => setCell(creId, i, e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                ))}
              </Row>
            </div>
          );
        })}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={saving}>
          Cancelar
        </Button>
        <Button className="btn-primary" onClick={handleSave} disabled={saving || !clientRoutineId}>
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
