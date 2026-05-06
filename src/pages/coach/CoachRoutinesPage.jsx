import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { routinesApi, clientsApi, exercisesApi, clientRoutinesApi } from '../../api';
import { OBJECTIVES, LEVELS, STIMULUS_TYPES } from '../../data/mockData';
import { clientDisplayName } from '../../utils/clientDisplay';
import {
  buildSessionNamesPayload,
  getSessionIndicesFromExercises,
  mergeSessionNameKeys,
} from '../../utils/sessionNames';
import { normalizeExercisesFlatOrder } from '../../utils/routineExerciseOrder';
import { sanitizeWeightInput } from '../../utils/weightInput';
import RoutineExerciseFormBlocks from '../../components/coach/RoutineExerciseFormBlocks';

const getEmptyExercise = (sessionIndex = 1) => ({
  id: `ex-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  name: '',
  sets: 3,
  reps: '10',
  rest: '60 seg',
  order: 0,
  sessionIndex: Math.max(1, parseInt(String(sessionIndex), 10) || 1),
  videoUrl: '',
  exerciseId: null,
});

export default function CoachRoutinesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const assignClientId = searchParams.get('assign');

  const [routines, setRoutines] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientRoutinesMap, setClientRoutinesMap] = useState({});
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', objective: '', level: '', frequencyPerWeek: 4, durationMinutes: 60, daysCount: 4, status: 'activa',
    recommendations: '', sessionNames: { '1': '' }, exercises: [getEmptyExercise()],
  });
  const [showAssign, setShowAssign] = useState(!!assignClientId);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [assignClient, setAssignClient] = useState(assignClientId || '');
  const [assignDate, setAssignDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [assignPhase, setAssignPhase] = useState('pick');
  const [assignWizardIndex, setAssignWizardIndex] = useState(0);
  const [weightDraftByTemplateExId, setWeightDraftByTemplateExId] = useState({});

  const assignOrderedExercises = useMemo(
    () => (selectedRoutine ? normalizeExercisesFlatOrder(selectedRoutine.exercises || []) : []),
    [selectedRoutine]
  );

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [routinesRes, clientsRes, exercisesRes] = await Promise.all([
        routinesApi.list(),
        clientsApi.list(),
        exercisesApi.list(),
      ]);
      setRoutines(routinesRes.data || []);
      setClients(clientsRes.data || []);
      setExerciseLibrary(exercisesRes.data || []);

      const crMap = {};
      for (const c of clientsRes.data || []) {
        try {
          const cr = await clientRoutinesApi.listByClient(c.id);
          crMap[c.id] = cr.data || [];
        } catch (_) {}
      }
      setClientRoutinesMap(crMap);
    } catch (err) {
      setError(err.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getAssignedClients = (routineId) => {
    return clients.filter(c => {
      const assignments = clientRoutinesMap[c.id] || [];
      return assignments.some(a => a.routineId === routineId && a.active !== false);
    });
  };

  const canEditRoutine = (r) => r.coachId === user?.coachId || getAssignedClients(r.id).length > 0;

  const openModal = (routine = null) => {
    if (routine) {
      setEditing(routine);
      const exs = routine.exercises?.length
        ? normalizeExercisesFlatOrder(
            routine.exercises.map((ex) => ({
              ...ex,
              id: ex.id || `ex-${Date.now()}`,
              exerciseId: ex.exerciseId || null,
              name: ex.name || ex.customName || '',
              sessionIndex: ex.sessionIndex ?? 1,
            }))
          )
        : [getEmptyExercise()];
      setForm({
        ...routine,
        exercises: exs,
        sessionNames: mergeSessionNameKeys(routine.sessionNames || {}, exs),
      });
    } else {
      setEditing(null);
      const ex0 = getEmptyExercise();
      setForm({
        name: '', description: '', objective: '', level: '', frequencyPerWeek: 4, durationMinutes: 60, daysCount: 4, status: 'activa',
        recommendations: '', sessionNames: { '1': '' }, exercises: [ex0],
      });
    }
    setShowModal(true);
  };

  const mapExerciseToSave = (ex) => ({
    exerciseId: ex.exerciseId || null,
    customName: ex.name || ex.customName || null,
    sets: parseInt(ex.sets, 10) || 3,
    reps: ex.reps || '10',
    rest: ex.rest || null,
    videoUrl: ex.videoUrl || null,
    order: ex.order ?? 0,
    sessionIndex:
      ex.sessionIndex != null && ex.sessionIndex !== ''
        ? Math.max(1, parseInt(String(ex.sessionIndex), 10) || 1)
        : 1,
  });

  const patchExercises = (updater) => {
    setForm((f) => {
      const raw = typeof updater === 'function' ? updater(f.exercises) : updater;
      const normalized = normalizeExercisesFlatOrder(raw);
      return {
        ...f,
        exercises: normalized,
        sessionNames: mergeSessionNameKeys(f.sessionNames, normalized),
      };
    });
  };

  const handleSave = async () => {
    if (!form.name) return;
    const exercisesList = form.exercises || [];
    const namePayload = buildSessionNamesPayload(form.sessionNames, exercisesList);
    const indices = getSessionIndicesFromExercises(exercisesList);
    for (const n of indices) {
      if (!namePayload[String(n)]) {
        alert(`Completá el nombre de la sesión del bloque ${n}.`);
        return;
      }
    }
    setSaving(true);
    try {
      const exercisesToSave = normalizeExercisesFlatOrder(exercisesList).map(mapExerciseToSave);
      const routineData = {
        name: form.name,
        description: form.description || null,
        objective: form.objective || null,
        level: form.level || null,
        frequencyPerWeek: form.frequencyPerWeek ? parseInt(form.frequencyPerWeek, 10) : null,
        durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes, 10) : null,
        daysCount: form.daysCount ? parseInt(form.daysCount, 10) : null,
        stimulus: form.estimulo || form.stimulus || null,
        status: form.status || 'activa',
        recommendations: form.recommendations || null,
        sessionNames: namePayload,
        exercises: exercisesToSave,
      };
      if (editing) {
        await routinesApi.update(editing.id, routineData);
      } else {
        await routinesApi.create(routineData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const duplicateRoutine = async (r) => {
    if (!confirm(`¿Duplicar "${r.name}"?`)) return;
    setSaving(true);
    try {
      await routinesApi.create({
        ...r,
        name: r.name + ' (copia)',
        sessionNames: r.sessionNames ? { ...r.sessionNames } : undefined,
        exercises: normalizeExercisesFlatOrder(r.exercises || []).map((ex) => ({
          exerciseId: ex.exerciseId,
          customName: ex.name || ex.customName,
          sets: ex.sets,
          reps: ex.reps,
          rest: ex.rest,
          videoUrl: ex.videoUrl,
          order: ex.order ?? 0,
          sessionIndex: ex.sessionIndex ?? 1,
        })),
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Error al duplicar');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoutine = async (r) => {
    if (!confirm(`¿Eliminar la rutina "${r.name}"?`)) return;
    setSaving(true);
    try {
      await routinesApi.delete(r.id);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  const openAssign = (r) => {
    setSelectedRoutine(r);
    setAssignClient(assignClientId || '');
    setAssignDate(new Date().toISOString().slice(0, 10));
    setAssignPhase('pick');
    setAssignWizardIndex(0);
    setWeightDraftByTemplateExId({});
    setShowAssign(true);
  };

  const closeAssignModal = () => {
    setShowAssign(false);
    setAssignPhase('pick');
    setAssignWizardIndex(0);
    setWeightDraftByTemplateExId({});
  };

  const goFromPickToWeights = () => {
    if (!selectedRoutine || !assignClient) {
      if (!assignClient) alert('Seleccioná un cliente');
      return;
    }
    if (!assignDate) {
      alert('Elige la fecha de asignación');
      return;
    }
    const already = (clientRoutinesMap[assignClient] || []).some(
      (cr) => cr.routineId === selectedRoutine.id && cr.active !== false
    );
    if (already) {
      alert('Este cliente ya tiene asignada esta rutina');
      return;
    }
    const ordered = normalizeExercisesFlatOrder(selectedRoutine.exercises || []);
    if (ordered.length === 0) {
      submitAssign(undefined);
      return;
    }
    const draft = {};
    for (const ex of ordered) {
      const n = Math.max(1, parseInt(String(ex.sets), 10) || 3);
      draft[ex.id] = Array(n).fill('');
    }
    setWeightDraftByTemplateExId(draft);
    setAssignWizardIndex(0);
    setAssignPhase('weights');
  };

  const submitAssign = async (exerciseSetWeights) => {
    if (!selectedRoutine || !assignClient) {
      if (!assignClient) alert('Seleccioná un cliente');
      return;
    }
    if (!assignDate) {
      alert('Elige la fecha de asignación');
      return;
    }
    const already = (clientRoutinesMap[assignClient] || []).some(
      (cr) => cr.routineId === selectedRoutine.id && cr.active !== false
    );
    if (already) {
      alert('Este cliente ya tiene asignada esta rutina');
      return;
    }
    setSaving(true);
    try {
      await clientRoutinesApi.assign(assignClient, selectedRoutine.id, assignDate, exerciseSetWeights);
      closeAssignModal();
      loadData();
    } catch (err) {
      alert(err.message || 'Error al asignar');
    } finally {
      setSaving(false);
    }
  };

  const finishWeightsWizard = () => {
    const exerciseSetWeights = {};
    for (const ex of assignOrderedExercises) {
      const arr = weightDraftByTemplateExId[ex.id] || [];
      exerciseSetWeights[ex.id] = arr.map((v) => {
        if (v === '' || v == null || String(v).trim() === '') return null;
        const f = parseFloat(String(v).replace(',', '.'));
        return Number.isFinite(f) ? f : null;
      });
    }
    submitAssign(exerciseSetWeights);
  };

  const setWizardWeightCell = (templateExId, setIdx, val) => {
    setWeightDraftByTemplateExId((prev) => ({
      ...prev,
      [templateExId]: (prev[templateExId] || []).map((cell, i) =>
        i === setIdx ? sanitizeWeightInput(val) : cell
      ),
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-3 mb-4">
        <h2 className="mb-0">Mis rutinas</h2>
        <Button onClick={() => openModal()} className="btn-primary align-self-start align-self-sm-auto">Crear rutina</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr>
              <th>Rutina</th>
              <th>Objetivo</th>
              <th>Nivel</th>
              <th>Asignada a</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {routines.map(r => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.objective || '-'}</td>
                <td>{r.level || '-'}</td>
                <td>{getAssignedClients(r.id).map(c => clientDisplayName(c)).join(', ') || '-'}</td>
                <td>
                  <Button size="sm" variant="outline-primary" className="me-1" as={Link} to={`/coach/rutinas/${r.id}`}>Ver</Button>
                  {canEditRoutine(r) && (
                    <>
                      <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openModal(r)}>Editar</Button>
                      <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => duplicateRoutine(r)} disabled={saving}>Duplicar</Button>
                      <Button size="sm" variant="outline-danger" className="me-1" onClick={() => deleteRoutine(r)} disabled={saving}>Eliminar</Button>
                    </>
                  )}
                  <Button size="sm" variant="outline-success" onClick={() => openAssign(r)}>Asignar a cliente</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" fullscreen="md-down" className="routine-form-modal">
        <Modal.Header closeButton><Modal.Title>{editing ? 'Editar rutina' : 'Crear rutina'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="form-section">
            <div className="form-section-title">Datos generales</div>
            <Row className="g-3">
              <Col md={6}><Form.Group className="mb-0"><Form.Label>Nombre</Form.Label><Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Fuerza Base" /></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-0"><Form.Label>Estado</Form.Label><Form.Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="activa">Activa</option><option value="borrador">Borrador</option></Form.Select></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-0"><Form.Label>Estímulo</Form.Label><Form.Select value={form.estimulo || form.stimulus || ''} onChange={e => setForm(f => ({ ...f, estimulo: e.target.value || null }))}><option value="">—</option>{STIMULUS_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Form.Group></Col>
            </Row>
            <Form.Group className="mb-0 mt-3"><Form.Label>Descripción</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descripción de la rutina..." /></Form.Group>
          </div>
          <div className="form-section">
            <div className="form-section-title">Configuración</div>
            <Row className="g-3">
              <Col md={4}><Form.Group className="mb-0"><Form.Label>Objetivo</Form.Label><Form.Select value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}><option value="">Seleccionar</option>{OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}</Form.Select></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-0"><Form.Label>Nivel</Form.Label><Form.Select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}><option value="">Seleccionar</option>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</Form.Select></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-0"><Form.Label>Duración estimada (min)</Form.Label><Form.Control type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} placeholder="60" min={15} max={180} /></Form.Group></Col>
            </Row>
          </div>
          <div className="form-section">
            <div className="form-section-title">Nombres de sesión (bloques)</div>
            <p className="small text-muted mb-3">
              Un nombre por cada bloque. Usá «Añadir bloque» debajo de la tabla para crear un grupo nuevo con sus propios ejercicios; el número de bloque define el orden, no el nombre.
            </p>
            {getSessionIndicesFromExercises(form.exercises || []).map((num) => (
              <Form.Group key={num} className="mb-2">
                <Form.Label className="small mb-1">Bloque {num}</Form.Label>
                <Form.Control
                  placeholder="Ej: Entrada en calor, Fuerza, Cardio, Core"
                  value={form.sessionNames?.[String(num)] ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sessionNames: { ...f.sessionNames, [String(num)]: e.target.value },
                    }))
                  }
                />
              </Form.Group>
            ))}
          </div>
          <div className="form-section">
            <div className="form-section-title">Ejercicios</div>
            <p className="small text-muted mb-3">
              Cada bloque es un grupo de ejercicios (calentamiento, fuerza, etc.). Podés tener varios bloques; dentro de cada uno, arrastrá con ⋮⋮ o usá ↑ ↓. Para mover un ejercicio a otro bloque, usá el selector «Bloque» en la fila.
            </p>
            <RoutineExerciseFormBlocks
              exercises={form.exercises || []}
              patchExercises={patchExercises}
              sessionNames={form.sessionNames}
              exerciseLibrary={exerciseLibrary}
              getEmptyExercise={getEmptyExercise}
            />
          </div>
          <div className="form-section">
            <div className="form-section-title">Recomendaciones</div>
            <Form.Group className="mb-0"><Form.Control as="textarea" rows={2} value={form.recommendations || ''} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} placeholder="Notas adicionales para el alumno..." /></Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssign} onHide={closeAssignModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {assignPhase === 'pick' ? 'Asignar rutina a cliente' : 'Cargas por serie'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {assignPhase === 'pick' ? (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de asignación</Form.Label>
                <Form.Control
                  type="date"
                  value={assignDate}
                  onChange={(e) => setAssignDate(e.target.value)}
                />
                <Form.Text className="text-muted">
                  El entrenamiento quedará planificado en el calendario para este día.
                </Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Cliente</Form.Label>
                <Form.Select value={assignClient} onChange={(e) => setAssignClient(e.target.value)}>
                  <option value="">Seleccionar cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {clientDisplayName(c)}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              {selectedRoutine && (
                <p className="small text-muted mb-2">
                  Rutina: <strong>{selectedRoutine.name}</strong>
                </p>
              )}
            </>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted">
                  Ejercicio {assignWizardIndex + 1} de {assignOrderedExercises.length}
                </span>
                <span className="small text-muted">
                  {Math.round(((assignWizardIndex + 1) / assignOrderedExercises.length) * 100)}%
                </span>
              </div>
              <ProgressBar
                now={((assignWizardIndex + 1) / assignOrderedExercises.length) * 100}
                className="mb-3"
                style={{ height: 6 }}
              />
              <AnimatePresence mode="wait">
                {(() => {
                  const ex = assignOrderedExercises[assignWizardIndex];
                  if (!ex) return null;
                  const n = Math.max(1, parseInt(String(ex.sets), 10) || 3);
                  const cells = weightDraftByTemplateExId[ex.id] || Array(n).fill('');
                  return (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.18 }}
                    >
                      <h6 className="mb-2">{ex.name}</h6>
                      <p className="small text-muted mb-3">
                        {n} serie{n !== 1 ? 's' : ''}
                        {ex.reps ? ` · ${ex.reps} repeticiones` : ''}
                      </p>
                      <Row className="g-2">
                        {Array.from({ length: n }, (_, i) => (
                          <Col xs={6} sm={4} key={i}>
                            <Form.Group className="mb-0">
                              <Form.Label className="small mb-1">Serie {i + 1} (kg)</Form.Label>
                              <Form.Control
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                placeholder="Opcional"
                                value={cells[i] ?? ''}
                                onChange={(e) => setWizardWeightCell(ex.id, i, e.target.value)}
                              />
                            </Form.Group>
                          </Col>
                        ))}
                      </Row>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {assignPhase === 'pick' ? (
            <>
              <Button variant="secondary" onClick={closeAssignModal}>
                Cancelar
              </Button>
              <Button className="btn-primary" onClick={goFromPickToWeights} disabled={saving}>
                Siguiente
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setAssignPhase('pick');
                  setAssignWizardIndex(0);
                }}
                disabled={saving}
              >
                Volver
              </Button>
              <Button
                variant="secondary"
                onClick={() => setAssignWizardIndex((i) => Math.max(0, i - 1))}
                disabled={saving || assignWizardIndex === 0}
              >
                Anterior
              </Button>
              {assignWizardIndex < assignOrderedExercises.length - 1 ? (
                <Button
                  className="btn-primary"
                  onClick={() => setAssignWizardIndex((i) => i + 1)}
                  disabled={saving}
                >
                  Siguiente
                </Button>
              ) : (
                <Button className="btn-primary" onClick={finishWeightsWizard} disabled={saving}>
                  {saving ? 'Asignando...' : 'Guardar asignación'}
                </Button>
              )}
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
