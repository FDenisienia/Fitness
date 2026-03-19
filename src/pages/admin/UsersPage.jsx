import React, { useState } from 'react';
import { Card, Table, Button, Form, Modal, Badge, Row, Col } from 'react-bootstrap';
import { store, generateId } from '../../data/mockData';

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'coach', label: 'Coach' },
  { value: 'cliente', label: 'Cliente' }
];

export default function UsersPage() {
  const [users, setUsers] = useState(store.getUsers());
  const [filter, setFilter] = useState({ name: '', email: '', role: '', state: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', lastName: '', email: '', password: '', role: 'cliente', active: true, coachId: '', specialty: '', age: '', objective: '', level: '' });

  const filtered = users.filter(u => {
    const matchName = !filter.name || `${u.name} ${u.lastName}`.toLowerCase().includes(filter.name.toLowerCase());
    const matchEmail = !filter.email || u.email.toLowerCase().includes(filter.email.toLowerCase());
    const matchRole = !filter.role || u.role === filter.role;
    const matchState = filter.state === '' || (filter.state === 'activo' && u.active) || (filter.state === 'inactivo' && !u.active);
    return matchName && matchEmail && matchRole && matchState;
  });

  const coaches = users.filter(u => u.role === 'coach');

  const openModal = (user = null) => {
    if (user) {
      setEditing(user);
      setForm({
        name: user.name, lastName: user.lastName, email: user.email, password: '',
        role: user.role, active: user.active ?? true,
        coachId: user.coachId || '', specialty: user.specialty || '',
        age: user.age || '', objective: user.objective || '', level: user.level || ''
      });
    } else {
      setEditing(null);
      setForm({ name: '', lastName: '', email: '', password: '', role: 'cliente', active: true, coachId: '', specialty: '', age: '', objective: '', level: '' });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    let updated = [...users];
    if (editing) {
      updated = updated.map(u => u.id === editing.id ? { ...u, ...form, password: form.password || u.password } : u);
    } else {
      if (!form.email || !form.password) return;
      if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
        alert('Ya existe un usuario con ese email');
        return;
      }
      updated.push({
        id: generateId(), ...form,
        createdAt: new Date().toISOString().split('T')[0]
      });
    }
    store.setUsers(updated);
    setUsers(updated);
    setShowModal(false);
  };

  const toggleActive = (user) => {
    const updated = users.map(u => u.id === user.id ? { ...u, active: !u.active } : u);
    store.setUsers(updated);
    setUsers(updated);
  };

  const deleteUser = (id) => {
    if (!confirm('¿Eliminar este usuario?')) return;
    const updated = users.filter(u => u.id !== id);
    store.setUsers(updated);
    setUsers(updated);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de usuarios</h2>
        <Button onClick={() => openModal()} className="btn-primary">Crear usuario</Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-2">
            <Col md={3}>
              <Form.Control placeholder="Buscar por nombre" value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} />
            </Col>
            <Col md={3}>
              <Form.Control placeholder="Buscar por email" value={filter.email} onChange={e => setFilter(f => ({ ...f, email: e.target.value }))} />
            </Col>
            <Col md={2}>
              <Form.Select value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}>
                <option value="">Todos los roles</option>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select value={filter.state} onChange={e => setFilter(f => ({ ...f, state: e.target.value }))}>
                <option value="">Todos</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>{u.name} {u.lastName}</td>
                <td>{u.email}</td>
                <td><Badge bg="secondary">{ROLES.find(r => r.value === u.role)?.label || u.role}</Badge></td>
                <td><Badge bg={u.active ? 'success' : 'secondary'}>{u.active ? 'Activo' : 'Inactivo'}</Badge></td>
                <td>
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openModal(u)}>Editar</Button>
                  <Button size="sm" variant="outline-warning" className="me-1" onClick={() => toggleActive(u)}>{u.active ? 'Desactivar' : 'Activar'}</Button>
                  <Button size="sm" variant="outline-danger" onClick={() => deleteUser(u.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Editar usuario' : 'Crear usuario'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Apellido</Form.Label><Form.Control value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} /></Form.Group></Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={!!editing} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña {editing && '(dejar vacío para mantener)'}</Form.Label>
            <Form.Control type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editing ? '••••••••' : ''} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rol</Form.Label>
            <Form.Select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Form.Select>
          </Form.Group>
          {form.role === 'coach' && (
            <Form.Group className="mb-3">
              <Form.Label>Especialidad</Form.Label>
              <Form.Control value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Ej: Hipertrofia" />
            </Form.Group>
          )}
          {form.role === 'cliente' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Coach asignado</Form.Label>
                <Form.Select value={form.coachId} onChange={e => setForm(f => ({ ...f, coachId: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {coaches.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastName}</option>)}
                </Form.Select>
              </Form.Group>
              <Row>
                <Col md={4}><Form.Group className="mb-3"><Form.Label>Edad</Form.Label><Form.Control type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></Form.Group></Col>
                <Col md={4}><Form.Group className="mb-3"><Form.Label>Objetivo</Form.Label><Form.Control value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} /></Form.Group></Col>
                <Col md={4}><Form.Group className="mb-3"><Form.Label>Nivel</Form.Label><Form.Control value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} /></Form.Group></Col>
              </Row>
            </>
          )}
          <Form.Check type="switch" label="Usuario activo" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={handleSave}>Guardar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
