import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Badge, Form, Spinner, Alert } from 'react-bootstrap';
import { coachesApi, usersApi } from '../../api';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import {
  deactivateCoachAsAdmin,
  activateCoachAsAdmin,
  hardDeleteCoachAsAdmin,
} from '../../services/coachAdminService';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';
import { getPasswordPolicyError } from '../../utils/passwordValidation';

export default function CoachesPage({ embedded = false }) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newCoach, setNewCoach] = useState({
    username: '',
    name: '',
    lastName: '',
    email: '',
    password: '',
    specialty: '',
    subscriptionPlan: 'basico',
  });
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionCoach, setActionCoach] = useState(null);
  const [pwTarget, setPwTarget] = useState(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwBanner, setPwBanner] = useState({ variant: '', text: '' });

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

  const getTotalClients = (coach) => coach.clientsCount ?? 0;
  const getActiveClients = (coach) =>
    typeof coach.activeClientsCount === 'number' ? coach.activeClientsCount : 0;

  const openEdit = (c) => {
    setEditingCoach(c);
    setEditForm({
      username: c.username || '',
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
        username: editForm.username,
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
    if (!newCoach.username?.trim() || !newCoach.email || !newCoach.password) return;
    const pwErr = getPasswordPolicyError(newCoach.password);
    if (pwErr) {
      alert(pwErr);
      return;
    }
    setCreating(true);
    try {
      await coachesApi.create({
        username: newCoach.username.trim().toLowerCase(),
        name: newCoach.name,
        lastName: newCoach.lastName,
        email: newCoach.email,
        password: newCoach.password.trim(),
        specialty: newCoach.specialty,
        subscriptionPlan: newCoach.subscriptionPlan,
      });
      setShowCreate(false);
      setNewCoach({
        username: '',
        name: '',
        lastName: '',
        email: '',
        password: '',
        specialty: '',
        subscriptionPlan: 'basico',
      });
      loadCoaches();
    } catch (err) {
      alert(err.message || 'Error al crear coach');
    } finally {
      setCreating(false);
    }
  };

  const openConfirm = (type, c) => {
    setConfirmModal(type);
    setActionCoach(c);
  };

  const closeConfirm = () => {
    if (actionLoading) return;
    setConfirmModal(null);
    setActionCoach(null);
  };

  const runDeactivate = async () => {
    if (!actionCoach) return;
    setActionLoading(true);
    try {
      await deactivateCoachAsAdmin(actionCoach.id);
      await loadCoaches();
      closeConfirm();
    } catch (err) {
      alert(err.message || 'Error al desactivar');
    } finally {
      setActionLoading(false);
    }
  };

  const runActivate = async () => {
    if (!actionCoach) return;
    setActionLoading(true);
    try {
      await activateCoachAsAdmin(actionCoach.id);
      await loadCoaches();
      closeConfirm();
    } catch (err) {
      alert(err.message || 'Error al activar');
    } finally {
      setActionLoading(false);
    }
  };

  const runDelete = async () => {
    if (!actionCoach) return;
    setActionLoading(true);
    try {
      await hardDeleteCoachAsAdmin(actionCoach.id);
      await loadCoaches();
      closeConfirm();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setActionLoading(false);
    }
  };

  const openPasswordModal = (c) => {
    const uid = c.userId ?? c.user?.id;
    if (!uid) {
      setPwBanner({ variant: 'danger', text: 'No se pudo identificar el usuario del coach.' });
      return;
    }
    setPwBanner({ variant: '', text: '' });
    setPwTarget({
      userId: uid,
      label: `${c.name || ''} ${c.lastName || ''}`.trim() || c.email,
    });
  };

  const submitCoachPassword = async (password) => {
    if (!pwTarget) return;
    setPwSubmitting(true);
    setPwBanner({ variant: '', text: '' });
    try {
      await usersApi.patchPassword(pwTarget.userId, { password });
      setPwBanner({ variant: 'success', text: 'Contraseña actualizada correctamente' });
      setPwTarget(null);
      loadCoaches();
    } catch (err) {
      const msg = err?.data?.error || err.message || 'No se pudo actualizar la contraseña';
      setPwBanner({ variant: 'danger', text: msg });
    } finally {
      setPwSubmitting(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      {pwBanner.text && (
        <Alert
          variant={pwBanner.variant === 'success' ? 'success' : 'danger'}
          className="mb-3"
          dismissible
          onClose={() => setPwBanner({ variant: '', text: '' })}
        >
          {pwBanner.text}
        </Alert>
      )}
      {!embedded && (
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Coaches (tus clientes)</h2>
            <p className="text-muted mb-0">Crear, gestionar y controlar uso de la plataforma</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="btn-primary">Crear coach</Button>
        </div>
      )}
      {embedded && (
        <div className="d-flex justify-content-end mb-3">
          <Button onClick={() => setShowCreate(true)} className="btn-primary">Crear coach</Button>
        </div>
      )}
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr>
              <th>Coach</th>
              <th>Usuario</th>
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
              const totalAl = getTotalClients(c);
              const activeAl = getActiveClients(c);
              const isDeleted = !!(c.deletedAt || c.coachEliminado);
              const isActive = c.active !== false && c.status === 'active';
              return (
                <tr key={c.id}>
                  <td>{c.name} {c.lastName}</td>
                  <td>{c.username || '—'}</td>
                  <td>{c.email || '—'}</td>
                  <td><Badge bg="primary">{plan.name}</Badge> {plan.id === 'personalizado' ? 'Personalizado' : `USD ${Number(plan.price).toFixed(2)}/mes`}</td>
                  <td className="small">
                    <strong>{activeAl}</strong> activos
                    <span className="text-muted"> · </span>
                    <strong>{totalAl}</strong> total
                    <span className="text-muted"> / plan {plan.maxAlumnos === 999 ? '∞' : plan.maxAlumnos}</span>
                  </td>
                  <td>{c.specialty || '-'}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1 align-items-center">
                      {isDeleted && <Badge bg="dark">Eliminado (lógico)</Badge>}
                      {!isDeleted && (
                        <Badge bg={isActive ? 'success' : 'secondary'}>{isActive ? 'Cuenta activa' : 'Cuenta inactiva'}</Badge>
                      )}
                      {c.legacyUnassigned && <Badge bg="info" title="Sin createdBy en BD — asignar admin si aplica">Legacy</Badge>}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {!isDeleted && (
                        <>
                          <Button size="sm" variant="outline-secondary" onClick={() => openEdit(c)}>Editar</Button>
                          <Button size="sm" variant="outline-primary" onClick={() => openPasswordModal(c)}>
                            Cambiar contraseña
                          </Button>
                          {isActive ? (
                            <Button size="sm" variant="outline-warning" onClick={() => openConfirm('deactivate', c)}>Desactivar</Button>
                          ) : (
                            <Button size="sm" variant="outline-success" onClick={() => openConfirm('activate', c)}>Activar</Button>
                          )}
                          <Button size="sm" variant="outline-danger" onClick={() => openConfirm('delete', c)}>Eliminar</Button>
                        </>
                      )}
                      {isDeleted && <span className="text-muted small">Solo lectura en listado</span>}
                    </div>
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
          <Form.Group className="mb-3"><Form.Label>Nombre de usuario</Form.Label><Form.Control value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} autoComplete="off" /></Form.Group>
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
          <Form.Group className="mb-3">
            <Form.Label>Nombre de usuario</Form.Label>
            <Form.Control
              value={newCoach.username}
              onChange={e => setNewCoach(n => ({ ...n, username: e.target.value }))}
              autoComplete="off"
              placeholder="solo letras minúsculas, números, guiones"
            />
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={newCoach.name} onChange={e => setNewCoach(n => ({ ...n, name: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Apellido</Form.Label><Form.Control value={newCoach.lastName} onChange={e => setNewCoach(n => ({ ...n, lastName: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={newCoach.email} onChange={e => setNewCoach(n => ({ ...n, email: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Contraseña</Form.Label>
            <Form.Control type="password" value={newCoach.password} onChange={e => setNewCoach(n => ({ ...n, password: e.target.value }))} autoComplete="new-password" />
            <Form.Text className="text-muted">Mín. 8 caracteres, una mayúscula y un número.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Especialidad</Form.Label><Form.Control value={newCoach.specialty} onChange={e => setNewCoach(n => ({ ...n, specialty: e.target.value }))} placeholder="Ej: Fuerza" /></Form.Group>
          <Form.Group><Form.Label>Plan de suscripción</Form.Label><Form.Select value={newCoach.subscriptionPlan} onChange={e => setNewCoach(n => ({ ...n, subscriptionPlan: e.target.value }))}>{Object.entries(SUBSCRIPTION_PLANS).map(([k, p]) => <option key={k} value={k}>{p.name} - {p.id === 'personalizado' ? 'Personalizado' : `USD ${Number(p.price).toFixed(2)}/mes`} (máx {p.maxAlumnos === 999 ? '∞' : p.maxAlumnos} alumnos)</option>)}</Form.Select></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={createCoach} disabled={creating || !newCoach.username?.trim() || !newCoach.email || !newCoach.password}>{creating ? 'Creando...' : 'Crear'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={confirmModal === 'deactivate'} onHide={closeConfirm} centered>
        <Modal.Header closeButton><Modal.Title>Desactivar coach</Modal.Title></Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="mb-0">
            Se desactivará a <strong>{actionCoach?.name} {actionCoach?.lastName}</strong> y <strong>todos sus clientes</strong>.
            Nadie de ese equipo podrá iniciar sesión hasta que reactives la cuenta del coach.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirm} disabled={actionLoading}>Cancelar</Button>
          <Button variant="warning" onClick={runDeactivate} disabled={actionLoading}>{actionLoading ? 'Procesando...' : 'Desactivar'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={confirmModal === 'activate'} onHide={closeConfirm} centered>
        <Modal.Header closeButton><Modal.Title>Activar coach</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Se reactivará a <strong>{actionCoach?.name} {actionCoach?.lastName}</strong> y <strong>todos sus clientes</strong> asociados a su cuenta.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirm} disabled={actionLoading}>Cancelar</Button>
          <Button variant="success" onClick={runActivate} disabled={actionLoading}>{actionLoading ? 'Procesando...' : 'Activar'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={confirmModal === 'delete'} onHide={closeConfirm} centered>
        <Modal.Header closeButton><Modal.Title>Eliminar coach</Modal.Title></Modal.Header>
        <Modal.Body>
          <Alert variant="danger" className="mb-0">
            Se eliminará de forma <strong>permanente</strong> a <strong>{actionCoach?.name} {actionCoach?.lastName}</strong>, todos sus alumnos, rutinas,
            ejercicios personalizados, chats y demás datos asociados. Esta acción no se puede deshacer.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeConfirm} disabled={actionLoading}>Cancelar</Button>
          <Button variant="danger" onClick={runDelete} disabled={actionLoading}>{actionLoading ? 'Procesando...' : 'Eliminar definitivamente'}</Button>
        </Modal.Footer>
      </Modal>

      <ChangePasswordModal
        show={!!pwTarget}
        onHide={() => !pwSubmitting && setPwTarget(null)}
        title="Cambiar contraseña"
        targetLabel={pwTarget?.label}
        submitLabel="Cambiar contraseña"
        submitting={pwSubmitting}
        onSubmit={submitCoachPassword}
      />
    </div>
  );
}
