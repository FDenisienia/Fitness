import React, { useState, useEffect } from 'react';
import { Card, Table, Form, Row, Col, Button, Modal, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { exercisesApi } from '../../api';
import { MUSCLE_GROUPS, EQUIPMENT } from '../../data/mockData';

export default function CoachExerciseLibraryPage() {
  const { user } = useAuth();
  const plan = usePlan();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: '', muscle: '', equipment: '', scope: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', instructions: '', muscleGroup: '', equipment: '', videoUrl: '', caloriasPorRep: '', caloriasPorMin: '' });

  const canAddPersonal = plan?.hasLibrary ?? false;

  const loadData = async () => {
    try {
      const res = await exercisesApi.list();
      setLibrary(res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filtered = library.filter(ex => {
    const matchSearch = !filter.search || (ex.name || '').toLowerCase().includes(filter.search.toLowerCase()) || (ex.description || '').toLowerCase().includes(filter.search.toLowerCase());
    const matchMuscle = !filter.muscle || ex.muscleGroup === filter.muscle;
    const matchEquip = !filter.equipment || ex.equipment === filter.equipment;
    const matchScope = !filter.scope || (filter.scope === 'global' && ex.scope === 'global') || (filter.scope === 'personal' && ex.scope === 'coach');
    return matchSearch && matchMuscle && matchEquip && matchScope;
  });

  const addPersonalExercise = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await exercisesApi.create({
        name: form.name,
        description: form.description || null,
        instructions: form.instructions || null,
        muscleGroup: form.muscleGroup || null,
        equipment: form.equipment || null,
        videoUrl: form.videoUrl || null,
        caloriasPorRep: form.caloriasPorRep ? parseFloat(form.caloriasPorRep) : null,
        caloriasPorMin: form.caloriasPorMin ? parseFloat(form.caloriasPorMin) : null,
      });
      setForm({ name: '', description: '', instructions: '', muscleGroup: '', equipment: '', videoUrl: '', caloriasPorRep: '', caloriasPorMin: '' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al añadir');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Biblioteca de ejercicios</h2>
          <p className="text-muted mb-0">Global (plataforma) + tu biblioteca personal</p>
        </div>
        {canAddPersonal && <Button onClick={() => setShowAdd(true)} className="btn-primary">Añadir ejercicio personal</Button>}
      </div>
      <Card className="mb-4">
        <Card.Body>
          <div className="filters-grid">
            <Form.Control className="flex-grow-1" placeholder="Buscar..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
            <Form.Select style={{ minWidth: '140px' }} value={filter.muscle} onChange={e => setFilter(f => ({ ...f, muscle: e.target.value }))}><option value="">Grupo muscular</option>{MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}</Form.Select>
            <Form.Select style={{ minWidth: '140px' }} value={filter.equipment} onChange={e => setFilter(f => ({ ...f, equipment: e.target.value }))}><option value="">Equipamiento</option>{EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}</Form.Select>
            <Form.Select style={{ minWidth: '140px' }} value={filter.scope} onChange={e => setFilter(f => ({ ...f, scope: e.target.value }))}><option value="">Todos</option><option value="global">Global</option><option value="personal">Mi biblioteca</option></Form.Select>
          </div>
        </Card.Body>
      </Card>
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead><tr><th>Ejercicio</th><th>Grupo muscular</th><th>Equipamiento</th><th>Origen</th><th>Descripción</th></tr></thead>
          <tbody>
            {filtered.map(ex => (
              <tr key={ex.id}>
                <td><strong>{ex.name}</strong></td>
                <td>{ex.muscleGroup || '-'}</td>
                <td>{ex.equipment || '-'}</td>
                <td><Badge bg={ex.scope === 'global' ? 'secondary' : 'primary'}>{ex.scope === 'global' ? 'Global' : 'Personal'}</Badge></td>
                <td className="small text-muted">{ex.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showAdd} onHide={() => setShowAdd(false)}>
        <Modal.Header closeButton><Modal.Title>Añadir ejercicio a tu biblioteca</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control as="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Instrucciones</Form.Label><Form.Control as="textarea" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} /></Form.Group>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Grupo muscular</Form.Label><Form.Select value={form.muscleGroup} onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))}><option value="">Seleccionar</option>{MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}</Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Equipamiento</Form.Label><Form.Select value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))}><option value="">Seleccionar</option>{EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}</Form.Select></Form.Group></Col>
          </Row>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Cal/rep</Form.Label><Form.Control type="number" step="0.1" value={form.caloriasPorRep} onChange={e => setForm(f => ({ ...f, caloriasPorRep: e.target.value }))} placeholder="Por repetición" /></Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Cal/min</Form.Label><Form.Control type="number" step="0.1" value={form.caloriasPorMin} onChange={e => setForm(f => ({ ...f, caloriasPorMin: e.target.value }))} placeholder="Por minuto (cardio)" /></Form.Group></Col>
          </Row>
          <Form.Group><Form.Label>URL video</Form.Label><Form.Control value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={addPersonalExercise} disabled={saving}>{saving ? 'Añadiendo...' : 'Añadir'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
