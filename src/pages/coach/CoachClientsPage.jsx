import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { clientsApi, routinesApi, clientRoutinesApi, plannedWorkoutsApi, usersApi } from '../../api';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { SUBSCRIPTION_PLANS, OBJECTIVES, LEVELS } from '../../data/mockData';

function clientDisplay(c) {
  const u = c.user || c;
  const status = u.status ?? 'active';
  return {
    id: c.id,
    name: u.name,
    lastName: u.lastName,
    email: u.email,
    age: c.age,
    objective: c.objective,
    objectiveDescription: c.objectiveDescription,
    level: c.level,
    status,
    active: status === 'active',
  };
}

export default function CoachClientsPage({ embedded = false, basePath = '/coach/usuarios' }) {
  const { user } = useAuth();
  const { clientId } = useParams();
  const navigate = useNavigate();
  const plan = usePlan() || SUBSCRIPTION_PLANS.basico;

  const [clients, setClients] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [clientRoutines, setClientRoutines] = useState({});
  const [plannedWorkouts, setPlannedWorkouts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAlumno, setNewAlumno] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    age: '',
    objective: '',
    objectiveDescription: '',
    level: 'principiante',
  });
  const [editingAlumno, setEditingAlumno] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pwTarget, setPwTarget] = useState(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwBanner, setPwBanner] = useState({ variant: '', text: '' });

  const clientUserId = (c) => c?.userId ?? c?.user?.id;

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [clientsRes, routinesRes] = await Promise.all([
        clientsApi.list(),
        routinesApi.list(),
      ]);
      const cList = clientsRes.data || [];
      setClients(cList);
      setRoutines(routinesRes.data || []);
      const clientDataPromises = cList.map((c) =>
        Promise.all([
          clientRoutinesApi.listByClient(c.id).catch(() => ({ data: [] })),
          plannedWorkoutsApi.listByClient(c.id).catch(() => ({ data: [] })),
        ]).then(([cr, pw]) => ({ id: c.id, cr: cr.data || [], pw: pw.data || [] }))
      );
      const clientData = await Promise.all(clientDataPromises);
      const crMap = Object.fromEntries(clientData.map((d) => [d.id, d.cr]));
      const pwMap = Object.fromEntries(clientData.map((d) => [d.id, d.pw]));
      setClientRoutines(crMap);
      setPlannedWorkouts(pwMap);
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const myClients = clients;
  const selectedClient = clientId ? myClients.find(c => c.id === clientId) : null;
  const atLimit = myClients.length >= plan.maxAlumnos;

  const createAlumno = async () => {
    if (!newAlumno.name?.trim()) {
      alert('Indica el nombre del alumno.');
      return;
    }
    if (!newAlumno.email?.trim()) {
      alert('Indica el email del alumno (será su usuario para iniciar sesión).');
      return;
    }
    if (atLimit) { alert(`Tu plan permite máx. ${plan.maxAlumnos} alumnos.`); return; }
    setSaving(true);
    try {
      await clientsApi.create({
        name: newAlumno.name,
        lastName: newAlumno.lastName,
        email: newAlumno.email,
        password: newAlumno.password || 'cliente123',
        age: newAlumno.age || null,
        objective: newAlumno.objective || null,
        objectiveDescription: newAlumno.objective === 'personalizado' ? newAlumno.objectiveDescription?.trim() || null : null,
        level: newAlumno.level || 'principiante',
      });
      setNewAlumno({
        name: '',
        lastName: '',
        email: '',
        password: '',
        age: '',
        objective: '',
        objectiveDescription: '',
        level: 'principiante',
      });
      setShowCreate(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al crear alumno');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c) => {
    const d = clientDisplay(c);
    setEditingAlumno(c);
    setEditForm({
      name: d.name,
      lastName: d.lastName,
      email: d.email,
      age: d.age || '',
      objective: d.objective || '',
      objectiveDescription: d.objectiveDescription || '',
      level: d.level || 'principiante',
    });
    setShowEdit(true);
  };

  const saveEdit = async () => {
    if (!editingAlumno) return;
    setSaving(true);
    try {
      await clientsApi.update(editingAlumno.id, {
        name: editForm.name,
        lastName: editForm.lastName,
        email: editForm.email,
        age: editForm.age || null,
        objective: editForm.objective || null,
        objectiveDescription:
          editForm.objective === 'personalizado' ? editForm.objectiveDescription?.trim() || null : null,
        level: editForm.level || 'principiante',
      });
      setShowEdit(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const openPasswordModal = (c) => {
    const uid = clientUserId(c);
    if (!uid) {
      setPwBanner({ variant: 'danger', text: 'No se pudo identificar el usuario del cliente.' });
      return;
    }
    setPwBanner({ variant: '', text: '' });
    const d = clientDisplay(c);
    setPwTarget({
      userId: uid,
      label: `${d.name} ${d.lastName}`.trim() || d.email,
      lastKnownPassword: c.user?.lastPasswordPlain ?? null,
    });
  };

  const submitClientPassword = async (password) => {
    if (!pwTarget) return;
    setPwSubmitting(true);
    setPwBanner({ variant: '', text: '' });
    try {
      await usersApi.patchPassword(pwTarget.userId, { password });
      setPwBanner({ variant: 'success', text: 'Contraseña actualizada correctamente' });
      setPwTarget(null);
      loadData();
    } catch (err) {
      const msg = err?.data?.error || err.message || 'No se pudo actualizar la contraseña';
      setPwBanner({ variant: 'danger', text: msg });
    } finally {
      setPwSubmitting(false);
    }
  };

  const deleteAlumno = async (c) => {
    if (!confirm(`¿Eliminar a ${clientDisplay(c).name} ${clientDisplay(c).lastName}?`)) return;
    try {
      await clientsApi.delete(c.id);
      if (clientId === c.id) navigate(basePath);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const unassignRoutineFromClient = async (routineId) => {
    if (!selectedClient) return;
    if (!confirm('¿Quitar esta rutina del alumno? Se eliminarán también todas las fechas planificadas en el calendario para esta rutina.')) return;
    setSaving(true);
    try {
      await clientRoutinesApi.unassign(selectedClient.id, routineId);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al quitar la rutina');
    } finally {
      setSaving(false);
    }
  };

  const deletePlannedWorkoutEntry = async (pwId) => {
    if (!confirm('¿Quitar este día del calendario?')) return;
    setSaving(true);
    try {
      await plannedWorkoutsApi.remove(pwId);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  const getClientRoutines = (cid) => {
    const cr = (clientRoutines[cid] || []).filter(r => r.active !== false);
    return cr.map(r => r.routine).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (clientId && selectedClient) {
    const d = clientDisplay(selectedClient);
    const clientRoutineList = getClientRoutines(selectedClient.id);
    const toPwDate = (pw) => {
      const raw = pw.date;
      if (!raw) return '';
      if (typeof raw === 'string') return raw.slice(0, 10);
      return new Date(raw).toISOString().slice(0, 10);
    };
    const clientPlannedPending = (plannedWorkouts[selectedClient.id] || [])
      .filter((pw) => !pw.completed)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const clientCompleted = (plannedWorkouts[selectedClient.id] || [])
      .filter(pw => pw.completed)
      .sort((a, b) => new Date(b.completedAt || b.date) - new Date(a.completedAt || a.date))
      .slice(0, 20);

    return (
      <div>
        <Link to={basePath} className="text-muted mb-2 d-inline-block">← Volver a la lista</Link>
        {pwBanner.text && (
          <Alert
            variant={pwBanner.variant === 'success' ? 'success' : 'danger'}
            className="mb-2"
            dismissible
            onClose={() => setPwBanner({ variant: '', text: '' })}
          >
            {pwBanner.text}
          </Alert>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h4 className="mb-0">Perfil de {d.name} {d.lastName}</h4>
            <div className="d-flex gap-1 flex-wrap">
              <Button variant="outline-secondary" size="sm" onClick={() => openEdit(selectedClient)}>Editar</Button>
              <Button variant="outline-primary" size="sm" onClick={() => openPasswordModal(selectedClient)}>
                Resetear contraseña
              </Button>
              {plan.hasWeightTracking && <Button as={Link} to={`/coach/seguimiento/${selectedClient.id}`} variant="outline-primary" size="sm">Seguimiento</Button>}
              <Button variant="outline-danger" size="sm" onClick={() => deleteAlumno(selectedClient)}>Eliminar</Button>
              <Button as={Link} to={`/coach/rutinas?assign=${selectedClient.id}`} className="btn-primary btn-sm">Asignar rutina</Button>
            </div>
          </Card.Header>
          <Card.Body>
            <p><strong>Email:</strong> {d.email}</p>
            <p><strong>Objetivo:</strong> {d.objective ? d.objective.charAt(0).toUpperCase() + d.objective.slice(1) : '-'}</p>
            {d.objective === 'personalizado' && d.objectiveDescription && (
              <p className="mb-2">
                <strong>Descripción del objetivo:</strong>
                <span className="d-block text-muted mt-1" style={{ whiteSpace: 'pre-wrap' }}>{d.objectiveDescription}</span>
              </p>
            )}
            <p><strong>Nivel:</strong> {d.level || '-'}</p>
          </Card.Body>
        </Card>
        <h5>Rutinas asignadas</h5>
        {clientRoutineList.length === 0 ? (
          <p className="text-muted">Este alumno aún no tiene rutinas asignadas.</p>
        ) : (
          <div className="cards-grid">
            {clientRoutineList.map((r) => (
              <Card key={r.id} className="p-3 client-routine-card">
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="flex-grow-1 min-width-0">
                    <Link to={`/coach/rutinas/${r.id}`} className="text-decoration-none text-reset">
                      <strong className="d-block text-truncate">{r.name}</strong>
                      <p className="mb-0 small text-muted">{r.objective} • {r.level}</p>
                    </Link>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="flex-shrink-0"
                    disabled={saving}
                    onClick={() => unassignRoutineFromClient(r.id)}
                  >
                    Quitar asignación
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
        <h5 className="mt-4">Entrenamientos en el calendario</h5>
        {clientPlannedPending.length === 0 ? (
          <p className="text-muted">No hay entrenamientos planificados pendientes.</p>
        ) : (
          <Card>
            <Table responsive className="table-modern mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Rutina</th>
                  <th className="text-end">Acción</th>
                </tr>
              </thead>
              <tbody>
                {clientPlannedPending.map((pw) => (
                  <tr key={pw.id}>
                    <td>{new Date(toPwDate(pw) + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{pw.routine?.name || routines.find((x) => x.id === pw.routineId)?.name || '—'}</td>
                    <td className="text-end">
                      <Button variant="outline-danger" size="sm" disabled={saving} onClick={() => deletePlannedWorkoutEntry(pw.id)}>
                        Quitar del calendario
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
        <h5 className="mt-4">Entrenamientos completados</h5>
        {clientCompleted.length === 0 ? (
          <p className="text-muted">El cliente aún no ha completado ningún entrenamiento.</p>
        ) : (
          <Card>
            <Table responsive className="table-modern mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Rutina</th>
                  <th>RPE</th>
                  <th>Sensaciones</th>
                  <th>Mensaje / feedback</th>
                </tr>
              </thead>
              <tbody>
                {clientCompleted.map(pw => (
                  <tr key={pw.id}>
                    <td>{pw.completedAt ? new Date(pw.completedAt).toLocaleDateString() : new Date(pw.date).toLocaleDateString()}</td>
                    <td>{pw.routine?.name || '-'}</td>
                    <td>{pw.rpe != null ? `${pw.rpe}/10` : '—'}</td>
                    <td className="small text-muted" style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{pw.sensations?.trim() || '—'}</td>
                    <td className="small text-muted" style={{ maxWidth: 220, whiteSpace: 'pre-wrap' }}>{(pw.feedback || pw.clientNotes)?.trim() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
        <Modal show={showEdit} onHide={() => setShowEdit(false)}>
          <Modal.Header closeButton><Modal.Title>Editar alumno</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Apellido</Form.Label><Form.Control value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></Form.Group>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Edad</Form.Label><Form.Control type="number" value={editForm.age} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Objetivo</Form.Label><Form.Select value={editForm.objective} onChange={(e) => { const v = e.target.value; setEditForm((f) => ({ ...f, objective: v, ...(v !== 'personalizado' ? { objectiveDescription: '' } : {}) })); }}><option value="">Seleccionar</option>{OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}</Form.Select></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Nivel</Form.Label><Form.Select value={editForm.level} onChange={e => setEditForm(f => ({ ...f, level: e.target.value }))}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</Form.Select></Form.Group></Col>
            </Row>
            {editForm.objective === 'personalizado' && (
              <Form.Group className="mb-3">
                <Form.Label>Descripción del objetivo personalizado</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={editForm.objectiveDescription}
                  onChange={(e) => setEditForm((f) => ({ ...f, objectiveDescription: e.target.value }))}
                  placeholder="Ej: preparación para competencia, foco en movilidad de hombro..."
                />
              </Form.Group>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button className="btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </Modal.Footer>
        </Modal>

        <ChangePasswordModal
          show={!!pwTarget}
          onHide={() => !pwSubmitting && setPwTarget(null)}
          title="Resetear contraseña"
          targetLabel={pwTarget?.label}
          lastKnownPassword={pwTarget?.lastKnownPassword ?? null}
          submitLabel="Guardar contraseña"
          submitting={pwSubmitting}
          onSubmit={submitClientPassword}
        />
      </div>
    );
  }

  const maxDisplay = plan.maxAlumnos === 999 ? '∞' : plan.maxAlumnos;
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
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
          <div>
            <h2 className="mb-1">Mis alumnos</h2>
            <p className="text-muted small mb-0">
              <strong>{myClients.length} / {maxDisplay}</strong> alumnos usados
              {atLimit && <span className="text-danger ms-1">· Límite alcanzado</span>}
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="btn-primary" disabled={atLimit}>
            Crear alumno {atLimit && `(límite)`}
          </Button>
        </div>
      )}
      {embedded && (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <p className="text-muted small mb-0">
            <strong>{myClients.length} / {maxDisplay}</strong> alumnos usados
            {atLimit && <span className="text-danger ms-1">· Límite alcanzado</span>}
          </p>
          <Button onClick={() => setShowCreate(true)} className="btn-primary" disabled={atLimit}>
            Crear alumno {atLimit && `(límite)`}
          </Button>
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {atLimit && <div className="alert alert-warning py-2">Has alcanzado el límite de tu plan ({plan.maxAlumnos} alumnos).</div>}
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Email</th>
              <th>Estado</th>
              <th>Objetivo</th>
              <th>Nivel</th>
              <th>Rutinas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {myClients.map(c => {
              const d = clientDisplay(c);
              return (
                <tr key={c.id}>
                  <td>{d.name} {d.lastName}</td>
                  <td>{d.email}</td>
                  <td>
                    <Badge bg={d.active ? 'success' : 'secondary'}>
                      {d.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td>{d.objective || '-'}</td>
                  <td>{d.level || '-'}</td>
                  <td>{getClientRoutines(c.id).length}</td>
                  <td>
                    <Button as={Link} to={`${basePath}/${c.id}`} size="sm" variant="outline-primary" className="me-1">Ver perfil</Button>
                    <Button size="sm" variant="outline-secondary" className="me-1" onClick={() => openEdit(c)}>Editar</Button>
                    <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openPasswordModal(c)}>
                      Resetear contraseña
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => deleteAlumno(c)}>Eliminar</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      <Modal show={showEdit} onHide={() => setShowEdit(false)}>
        <Modal.Header closeButton><Modal.Title>Editar alumno</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Apellido</Form.Label><Form.Control value={editForm.lastName} onChange={e => setEditForm(f => ({ ...f, lastName: e.target.value }))} /></Form.Group></Col>
          </Row>
          <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></Form.Group>
          <Row>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Edad</Form.Label><Form.Control type="number" value={editForm.age} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Objetivo</Form.Label><Form.Select value={editForm.objective} onChange={(e) => { const v = e.target.value; setEditForm((f) => ({ ...f, objective: v, ...(v !== 'personalizado' ? { objectiveDescription: '' } : {}) })); }}><option value="">Seleccionar</option>{OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}</Form.Select></Form.Group></Col>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Nivel</Form.Label><Form.Select value={editForm.level} onChange={e => setEditForm(f => ({ ...f, level: e.target.value }))}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</Form.Select></Form.Group></Col>
          </Row>
          {editForm.objective === 'personalizado' && (
            <Form.Group className="mb-3">
              <Form.Label>Descripción del objetivo personalizado</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editForm.objectiveDescription}
                onChange={(e) => setEditForm((f) => ({ ...f, objectiveDescription: e.target.value }))}
                placeholder="Ej: preparación para competencia, foco en movilidad de hombro..."
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCreate} onHide={() => setShowCreate(false)}>
        <Modal.Header closeButton><Modal.Title>Crear alumno</Modal.Title></Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Nombre</Form.Label><Form.Control value={newAlumno.name} onChange={e => setNewAlumno(n => ({ ...n, name: e.target.value }))} /></Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Apellido</Form.Label><Form.Control value={newAlumno.lastName} onChange={e => setNewAlumno(n => ({ ...n, lastName: e.target.value }))} /></Form.Group></Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              required
              autoComplete="email"
              placeholder="ej: alumno@email.com"
              value={newAlumno.email}
              onChange={e => setNewAlumno(n => ({ ...n, email: e.target.value }))}
            />
            <Form.Text className="text-muted">El alumno usará este email para entrar a la app.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3"><Form.Label>Contraseña inicial</Form.Label><Form.Control type="password" value={newAlumno.password} onChange={e => setNewAlumno(n => ({ ...n, password: e.target.value }))} placeholder="Opcional (default: cliente123)" /></Form.Group>
          <Row>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Edad</Form.Label><Form.Control type="number" value={newAlumno.age} onChange={e => setNewAlumno(n => ({ ...n, age: e.target.value }))} /></Form.Group></Col>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Objetivo</Form.Label><Form.Select value={newAlumno.objective} onChange={(e) => { const v = e.target.value; setNewAlumno((n) => ({ ...n, objective: v, ...(v !== 'personalizado' ? { objectiveDescription: '' } : {}) })); }}><option value="">Seleccionar</option>{OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}</Form.Select></Form.Group></Col>
            <Col md={4}><Form.Group className="mb-3"><Form.Label>Nivel</Form.Label><Form.Select value={newAlumno.level} onChange={e => setNewAlumno(n => ({ ...n, level: e.target.value }))}>{LEVELS.map(l => <option key={l} value={l}>{l}</option>)}</Form.Select></Form.Group></Col>
          </Row>
          {newAlumno.objective === 'personalizado' && (
            <Form.Group className="mb-3">
              <Form.Label>Descripción del objetivo personalizado</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAlumno.objectiveDescription}
                onChange={(e) => setNewAlumno((n) => ({ ...n, objectiveDescription: e.target.value }))}
                placeholder="Ej: preparación para competencia, foco en movilidad de hombro..."
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={createAlumno} disabled={saving}>{saving ? 'Creando...' : 'Crear'}</Button>
        </Modal.Footer>
      </Modal>

      <ChangePasswordModal
        show={!!pwTarget}
        onHide={() => !pwSubmitting && setPwTarget(null)}
        title="Resetear contraseña"
        targetLabel={pwTarget?.label}
        lastKnownPassword={pwTarget?.lastKnownPassword ?? null}
        submitLabel="Guardar contraseña"
        submitting={pwSubmitting}
        onSubmit={submitClientPassword}
      />
    </div>
  );
}
