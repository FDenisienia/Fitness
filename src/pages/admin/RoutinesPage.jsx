import React, { useState, useMemo } from 'react';
import { Card, Table, Button, Modal, Badge, Form, Row, Col } from 'react-bootstrap';
import { store, generateId, OBJECTIVES, LEVELS, ROUTINE_STATUS, STIMULUS_TYPES } from '../../data/mockData';
import ExerciseAutocomplete from '../../components/ExerciseAutocomplete';

export default function RoutinesPage() {
  const users = store.getUsers();
  const [routines, setRoutines] = useState(store.getRoutines());
  const [clientRoutines, setClientRoutines] = useState(store.getClientRoutines());
  const [filter, setFilter] = useState({ name: '', objective: '', level: '', status: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', objective: '', level: '', frequencyPerWeek: 4, durationMinutes: 60, daysCount: 4, status: 'activa',
    recommendations: '', warnings: '', exercises: [{ id: generateId(), name: '', sets: 3, reps: '10', rest: '60 seg', order: 1, videoUrl: '' }]
  });
  const [showAssign, setShowAssign] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [assignClient, setAssignClient] = useState('');

  const clients = users.filter(u => u.role === 'cliente');
  const coaches = users.filter(u => u.role === 'coach');
  const exerciseLibrary = useMemo(() => {
    const lib = store.getExerciseLibrary();
    return lib.filter(ex => ex.scope === 'global' || ex.createdBy === '1');
  }, []);

  const filtered = routines.filter(r => {
    const matchName = !filter.name || r.name.toLowerCase().includes(filter.name.toLowerCase());
    const matchObj = !filter.objective || r.objective === filter.objective;
    const matchLevel = !filter.level || r.level === filter.level;
    const matchStatus = !filter.status || r.status === filter.status;
    return matchName && matchObj && matchLevel && matchStatus;
  });

  const getCreator = (r) => {
    if (r.createdByRole === 'admin') return 'Admin';
    return coaches.find(c => c.id === r.createdBy) ? `${coaches.find(c => c.id === r.createdBy).name} ${coaches.find(c => c.id === r.createdBy).lastName}` : '-';
  };

  const getAssignedCount = (routineId) => clientRoutines.filter(cr => cr.routineId === routineId).length;

  const getEmptyExercise = () => ({
    id: generateId(),
    name: '',
    sets: 3,
    reps: '10',
    rest: '60 seg',
    order: 1,
    videoUrl: '',
    libraryExerciseId: null
  });

  const openModal = (routine = null) => {
    if (routine) {
      setEditing(routine);
      const exs = routine.exercises?.length
        ? routine.exercises.map(ex => ({ ...ex, libraryExerciseId: ex.libraryExerciseId ?? null }))
        : [getEmptyExercise()];
      setForm({ ...routine, exercises: exs });
    } else {
      setEditing(null);
      setForm({
        name: '', description: '', objective: '', level: '', frequencyPerWeek: 4, durationMinutes: 60, daysCount: 4, status: 'activa',
        recommendations: '', warnings: '', exercises: [getEmptyExercise()]
      });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    let updated = [...routines];
    const exercisesToSave = (form.exercises || []).map((ex, i) => ({ ...ex, order: i + 1 }));
    const routineData = { ...form, exercises: exercisesToSave, createdBy: '1', createdByRole: 'admin' };
    if (editing) {
      updated = updated.map(r => r.id === editing.id ? { ...r, ...routineData } : r);
    } else {
      updated.push({ id: generateId(), ...routineData, createdAt: new Date().toISOString().split('T')[0] });
    }
    store.setRoutines(updated);
    setRoutines(updated);
    setShowModal(false);
  };

  const duplicateRoutine = (r) => {
    const newR = { ...r, id: generateId(), name: r.name + ' (copia)', createdAt: new Date().toISOString().split('T')[0] };
    const updated = [...routines, newR];
    store.setRoutines(updated);
    setRoutines(updated);
  };

  const deleteRoutine = (id) => {
    if (!confirm('¿Eliminar esta rutina?')) return;
    const updated = routines.filter(r => r.id !== id);
    store.setRoutines(updated);
    setClientRoutines(clientRoutines.filter(cr => cr.routineId !== id));
    store.setClientRoutines(clientRoutines.filter(cr => cr.routineId !== id));
    setRoutines(updated);
    setClientRoutines(store.getClientRoutines());
  };

  const openAssign = (r) => {
    setSelectedRoutine(r);
    setAssignClient('');
    setShowAssign(true);
  };

  const saveAssign = () => {
    if (!selectedRoutine || !assignClient) return;
    const newAssign = { clientId: assignClient, routineId: selectedRoutine.id, assignedAt: new Date().toISOString().split('T')[0], assignedBy: '1' };
    if (clientRoutines.some(cr => cr.clientId === assignClient && cr.routineId === selectedRoutine.id)) {
      alert('Este cliente ya tiene asignada esta rutina');
      return;
    }
    const updated = [...clientRoutines, newAssign];
    store.setClientRoutines(updated);
    setClientRoutines(updated);
    setShowAssign(false);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de rutinas</h2>
        <Button onClick={() => openModal()} className="btn-primary">Crear rutina</Button>
      </div>
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-2">
            <Col md={3}><Form.Control placeholder="Buscar por nombre" value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} /></Col>
            <Col md={2}><Form.Select value={filter.objective} onChange={e => setFilter(f => ({ ...f, objective: e.target.value }))}><option value="">Objetivo</option>{OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}</Form.Select></Col>
            <Col md={2}><Form.Select value={filter.level} onChange={e => setFilter(f => ({ ...f, level: e.target.value }))}><option value="">Nivel</option>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</Form.Select></Col>
            <Col md={2}><Form.Select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}><option value="">Estado</option>{ROUTINE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Col>
          </Row>
        </Card.Body>
      </Card>
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr>
              <th>Rutina</th>
              <th>Objetivo</th>
              <th>Nivel</th>
              <th>Creada por</th>
              <th>Asignada a</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td><strong>{r.name}</strong></td>
                <td>{r.objective}</td>
                <td>{r.level}</td>
                <td>{getCreator(r)}</td>
                <td>{getAssignedCount(r.id)} clientes</td>
                <td><Badge bg={r.status === 'activa' ? 'success' : r.status === 'borrador' ? 'warning' : 'secondary'}>{r.status}</Badge></td>
                <td>
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openModal(r)}>Editar</Button>
                  <Button size="sm" variant="outline-success" className="me-1" onClick={() => openAssign(r)}>Asignar</Button>
                  <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => duplicateRoutine(r)}>Duplicar</Button>
                  <Button size="sm" variant="outline-danger" onClick={() => deleteRoutine(r.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
        <Modal.Header closeButton><Modal.Title>{editing ? 'Editar rutina' : 'Crear rutina'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={8}><Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Estado</Form.Label><Form.Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>{ROUTINE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Form.Group></Col>
          </Row>
          <Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control as="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Form.Group>
          <Row>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Objetivo</Form.Label><Form.Select value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}><option value="">Seleccionar</option>{OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}</Form.Select></Form.Group></Col>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Nivel</Form.Label><Form.Select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}><option value="">Seleccionar</option>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</Form.Select></Form.Group></Col>
            <Col md={2}><Form.Group className="mb-3"><Form.Label>Duración (min)</Form.Label><Form.Control type="number" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))} /></Form.Group></Col>
            <Col md={2}><Form.Group className="mb-3"><Form.Label>Estímulo</Form.Label><Form.Select value={form.estimulo || ''} onChange={e => setForm(f => ({ ...f, estimulo: e.target.value || null }))}><option value="">-</option>{STIMULUS_TYPES.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Form.Group></Col>
          </Row>
          <h6 className="mt-3">Ejercicios</h6>
          <p className="small text-muted mb-2">Busca en la biblioteca o escribe el nombre manualmente</p>
          {form.exercises?.map((ex, i) => (
            <Card key={ex.id} className="mb-2 p-3">
              <Row className="g-2">
                <Col md={12} lg={4}>
                  <ExerciseAutocomplete
                    value={ex.name}
                    libraryExerciseId={ex.libraryExerciseId}
                    library={exerciseLibrary}
                    placeholder="Buscar o escribir ejercicio..."
                    onChange={(name) => setForm(f => ({
                      ...f,
                      exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, name } : ee)
                    }))}
                    onSelectFromLibrary={(libEx) => {
                      if (!libEx) {
                        setForm(f => ({
                          ...f,
                          exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, libraryExerciseId: null } : ee)
                        }));
                        return;
                      }
                      setForm(f => ({
                        ...f,
                        exercises: f.exercises.map((ee, ii) => ii === i ? {
                          ...ee,
                          name: libEx.name,
                          videoUrl: libEx.videoUrl ?? ee.videoUrl,
                          description: libEx.description,
                          instructions: libEx.instructions,
                          muscleGroup: libEx.muscleGroup,
                          caloriasPorRep: libEx.caloriasPorRep,
                          caloriasPorMin: libEx.caloriasPorMin,
                          libraryExerciseId: libEx.id
                        } : ee)
                      }));
                    }}
                  />
                </Col>
                <Col md={2}><Form.Control placeholder="S" value={ex.sets} onChange={e => setForm(f => ({ ...f, exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, sets: e.target.value } : ee) }))} /></Col>
                <Col md={2}><Form.Control placeholder="R" value={ex.reps} onChange={e => setForm(f => ({ ...f, exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, reps: e.target.value } : ee) }))} /></Col>
                <Col md={2}><Form.Control placeholder="Descanso" value={ex.rest} onChange={e => setForm(f => ({ ...f, exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, rest: e.target.value } : ee) }))} /></Col>
                <Col md={2}><Form.Control placeholder="Cal/rep" type="number" step="0.1" value={ex.caloriasPorRep ?? ''} onChange={e => setForm(f => ({ ...f, exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, caloriasPorRep: e.target.value ? parseFloat(e.target.value) : null } : ee) }))} /></Col>
                <Col md={2}><Form.Control placeholder="Cal/min" type="number" step="0.1" value={ex.caloriasPorMin ?? ''} onChange={e => setForm(f => ({ ...f, exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, caloriasPorMin: e.target.value ? parseFloat(e.target.value) : null } : ee) }))} /></Col>
                <Col md={2}><Form.Control placeholder="URL video" value={ex.videoUrl || ''} onChange={e => setForm(f => ({ ...f, exercises: f.exercises.map((ee, ii) => ii === i ? { ...ee, videoUrl: e.target.value } : ee) }))} /></Col>
                <Col md={2} lg={1}><Button size="sm" variant="outline-danger" onClick={() => setForm(f => ({ ...f, exercises: f.exercises.filter((_, ii) => ii !== i) }))}>×</Button></Col>
              </Row>
            </Card>
          ))}
          <Button size="sm" variant="outline-primary" onClick={() => setForm(f => ({ ...f, exercises: [...(f.exercises || []), getEmptyExercise()] }))}>+ Ejercicio</Button>
          <Form.Group className="mt-3"><Form.Label>Recomendaciones</Form.Label><Form.Control as="textarea" value={form.recommendations || ''} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} /></Form.Group>
          <Form.Group><Form.Label>Advertencias</Form.Label><Form.Control value={form.warnings || ''} onChange={e => setForm(f => ({ ...f, warnings: e.target.value }))} /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={handleSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showAssign} onHide={() => setShowAssign(false)}>
        <Modal.Header closeButton><Modal.Title>Asignar rutina "{selectedRoutine?.name}" a cliente</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Select value={assignClient} onChange={e => setAssignClient(e.target.value)}>
            <option value="">Seleccionar cliente</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>)}
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={saveAssign}>Asignar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
