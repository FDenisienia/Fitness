import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Badge, Form, Spinner } from 'react-bootstrap';
import { coachesApi } from '../../api';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';

export default function CoachesPage() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newCoach, setNewCoach] = useState({ name: '', lastName: '', email: '', password: '', specialty: '', subscriptionPlan: 'basico' });
  const [creating, setCreating] = useState(false);

  const loadCoaches = async () => {
    try {
      const res = await coachesApi.list();
      setCoaches(res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadCoaches();
  }, []);

  const getClientsCount = (coach) => coach.clientsCount ?? 0;

  const openEdit = (c) => {
    setEditingCoach(c);
    setEditForm({
      name: c.name || '',
      lastName: c.lastName || '',
      email: c.email || '',
      specialty: c.specialty || '',
      subscriptionPlan: c.subscriptionPlan || 'basico',
      subscriptionStatus: c.subscriptionStatus || 'activa',
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editingCoach) return;
    setSaving(true);
    try {
      await coachesApi.update(editingCoach.id, {
        name: editForm.name,
        lastName: editForm.lastName,
        email: editForm.email,
        specialty: editForm.specialty,
        subscriptionPlan: editForm.subscriptionPlan,
        subscriptionStatus: editForm.subscriptionStatus,
      });
      setShowEdit(false);
      loadCoaches();
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const createCoach = async () => {
    if (!newCoach.email || !newCoach.password) return;
    setCreating(true);
    try {
      await coachesApi.create({
        name: newCoach.name,
        lastName: newCoach.lastName,
        email: newCoach.email,
        password: newCoach.password,
        specialty: newCoach.specialty,
        subscriptionPlan: newCoach.subscriptionPlan,
      });
      setShowCreate(false);
      setNewCoach({ name: '', lastName: '', email: '', password: '', specialty: '', subscriptionPlan: 'basico' });
      loadCoaches();
    } catch (err) {
      alert(err.message || 'Error al crear coach');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Coaches (tus clientes)</h2>
          <p className="text-muted mb-0">Crear, gestionar y controlar uso de la plataforma</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="btn-primary">Crear coach</Button>
      </div>
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr>
              <th>Coach</th>
              <th>Email</th>
              <th>Plan</th>
              <th>Alumnos</th>
              <th>Uso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {coaches.map(c => {
              const plan = SUBSCRIPTION_PLANS[c.subscriptionPlan] || SUBSCRIPTION_PLANS.basico;
              const count = getClientsCount(c);
              return (
                <tr key={c.id}>
                  <td>{c.name} {c.lastName}</td>
                  <td>{c.email}</td>
                  <td><Badge bg="primary">{plan.name}</Badge> {plan.id === 'personalizado' ? 'Personalizado' : `USD ${Number(plan.price).toFixed(2)}/mes`}</td>
                  <td><strong>{count}</strong>/{plan.maxAlumnos === 999 ? '∞' : plan.maxAlumnos}</td>
                  <td>{c.specialty || '-'}</td>
                  <td><Badge bg={c.active !== false ? 'success' : 'secondary'}>{c.active !== false ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td>
                    <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openEdit(c)}>Editar</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton><Modal.Title>Editar coach</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Apellido</Form.Label><Form.Control value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Especialidad</Form.Label><Form.Control value={editForm.specialty} onChange={e => setEditForm(f => ({ ...f, specialty: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Plan</Form.Label><Form.Select value={editForm.subscriptionPlan} onChange={e => setEditForm(f => ({ ...f, subscriptionPlan: e.target.value }))}>{Object.entries(SUBSCRIPTION_PLANS).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}</Form.Select></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Estado suscripción</Form.Label><Form.Select value={editForm.subscriptionStatus} onChange={e => setEditForm(f => ({ ...f, subscriptionStatus: e.target.value }))}><option value="activa">Activa</option><option value="inactiva">Inactiva</option></Form.Select></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCreate} onHide={() => setShowCreate(false)}>
        <Modal.Header closeButton><Modal.Title>Crear coach</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={newCoach.name} onChange={e => setNewCoach(n => ({ ...n, name: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Apellido</Form.Label><Form.Control value={newCoach.lastName} onChange={e => setNewCoach(n => ({ ...n, lastName: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={newCoach.email} onChange={e => setNewCoach(n => ({ ...n, email: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Contraseña</Form.Label><Form.Control type="password" value={newCoach.password} onChange={e => setNewCoach(n => ({ ...n, password: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Especialidad</Form.Label><Form.Control value={newCoach.specialty} onChange={e => setNewCoach(n => ({ ...n, specialty: e.target.value }))} placeholder="Ej: Fuerza" /></Form.Group>
          <Form.Group><Form.Label>Plan de suscripción</Form.Label><Form.Select value={newCoach.subscriptionPlan} onChange={e => setNewCoach(n => ({ ...n, subscriptionPlan: e.target.value }))}>{Object.entries(SUBSCRIPTION_PLANS).map(([k, p]) => <option key={k} value={k}>{p.name} - {p.id === 'personalizado' ? 'Personalizado' : `USD ${Number(p.price).toFixed(2)}/mes`} (máx {p.maxAlumnos === 999 ? '∞' : p.maxAlumnos} alumnos)</option>)}</Form.Select></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={createCoach} disabled={creating || !newCoach.email || !newCoach.password}>{creating ? 'Creando...' : 'Crear'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
