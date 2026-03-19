import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { clientsApi, routinesApi, plannedWorkoutsApi } from '../../api';
import Calendar from '../../components/Calendar';

function clientDisplay(c) {
  const u = c.user || c;
  return `${u.name || ''} ${u.lastName || ''}`.trim();
}

export default function CoachCalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClient, setFilterClient] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [assignData, setAssignData] = useState({ date: '', clientId: '', routineId: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [clientsRes, routinesRes] = await Promise.all([clientsApi.list(), routinesApi.list()]);
      const cList = clientsRes.data || [];
      setClients(cList);
      setRoutines(routinesRes.data || []);

      let allPw = [];
      for (const c of cList) {
        try {
          const pw = await plannedWorkoutsApi.listByClient(c.id);
          allPw = allPw.concat(pw.data || []);
        } catch (_) {}
      }
      setPlannedWorkouts(allPw);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredWorkouts = filterClient
    ? plannedWorkouts.filter(pw => pw.clientId === filterClient)
    : plannedWorkouts;

  const toDateStr = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  };

  const handleAddWorkout = (date, _workouts, isAdd) => {
    if (!isAdd || !date) return;
    setAssignData({ date, clientId: clients[0]?.id || '', routineId: routines[0]?.id || '', notes: '' });
    setShowAssign(true);
  };

  const saveAssign = async () => {
    if (!assignData.clientId || !assignData.routineId || !assignData.date) return;
    setSaving(true);
    try {
      await plannedWorkoutsApi.create(assignData.clientId, {
        date: assignData.date,
        routineId: assignData.routineId,
        notes: assignData.notes || null,
      });
      setShowAssign(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al planificar');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkoutClick = (pw, routine) => {
    if (routine) navigate(`/coach/rutinas/${pw.routineId}`);
  };

  const handleMarkComplete = async (workout, { rpe, feedback }) => {
    try {
      await plannedWorkoutsApi.update(workout.id, {
        completed: true,
        rpe: parseInt(rpe, 10) || null,
        clientNotes: feedback || null,
        feedback: feedback || null,
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Error al marcar');
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  const normalizedWorkouts = filteredWorkouts.map(pw => ({
    ...pw,
    date: toDateStr(pw.date),
  }));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Calendario de planificación</h2>
        <Form.Select style={{ maxWidth: 220 }} value={filterClient} onChange={e => setFilterClient(e.target.value)}>
          <option value="">Todos mis alumnos</option>
          {clients.map(c => <option key={c.id} value={c.id}>{clientDisplay(c)}</option>)}
        </Form.Select>
      </div>

      <Calendar
        plannedWorkouts={normalizedWorkouts}
        routines={routines}
        onSelectDay={(date, workouts, isAdd) => handleAddWorkout(date, workouts, isAdd)}
        onWorkoutClick={handleWorkoutClick}
        onMarkComplete={handleMarkComplete}
        mode="plan"
      />

      <Modal show={showAssign} onHide={() => setShowAssign(false)}>
        <Modal.Header closeButton><Modal.Title>Planificar entrenamiento</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Fecha</Form.Label>
            <Form.Control type="date" value={assignData.date} onChange={e => setAssignData(d => ({ ...d, date: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Alumno</Form.Label>
            <Form.Select value={assignData.clientId} onChange={e => setAssignData(d => ({ ...d, clientId: e.target.value }))}>
              {clients.map(c => <option key={c.id} value={c.id}>{clientDisplay(c)}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Rutina</Form.Label>
            <Form.Select value={assignData.routineId} onChange={e => setAssignData(d => ({ ...d, routineId: e.target.value }))}>
              {routines.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Notas (opcional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={assignData.notes} onChange={e => setAssignData(d => ({ ...d, notes: e.target.value }))} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAssign(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={saveAssign} disabled={saving}>{saving ? 'Planificando...' : 'Planificar'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
