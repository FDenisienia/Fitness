import React, { useState, useMemo, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { weightLogsApi, routinesApi, plannedWorkoutsApi, exercisesApi } from '../../api';
import WeightChart from '../../components/weight/WeightChart';
import WeightSummary from '../../components/weight/WeightSummary';
import { calcRoutineCalories } from '../../utils/routineCalories';

const LAST_N_DEFAULT = 5;

export default function ClientSeguimientoPage() {
  const { user } = useAuth();
  const plan = usePlan();
  const canWeightTracking = plan?.hasWeightTracking ?? false;
  const hasAdvancedWeight = plan?.hasAdvancedWeight ?? false;

  const [records, setRecords] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [exerciseLibrary, setExerciseLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWeight, setEditingWeight] = useState(null);
  const [form, setForm] = useState({ peso: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' });
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [showAllWeights, setShowAllWeights] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    if (!user?.clientId) return setLoading(false);
    try {
      const [recRes, rRes, pwRes, exRes] = await Promise.all([
        weightLogsApi.listByClient(user.clientId),
        routinesApi.list(),
        plannedWorkoutsApi.listByClient(user.clientId),
        exercisesApi.list().catch(() => ({ data: [] })),
      ]);
      setRecords(recRes.data || []);
      setRoutines(rRes.data || []);
      setPlannedWorkouts(pwRes.data || []);
      setExerciseLibrary(exRes.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.clientId]);

  const completed = plannedWorkouts.filter(pw => pw.completed);

  const filteredRecords = useMemo(() => {
    let list = [...records].sort((a, b) => (String(b.fecha || '')).localeCompare(String(a.fecha || '')));
    if (dateFilterFrom) list = list.filter(r => (r.fecha || '') >= dateFilterFrom);
    if (dateFilterTo) list = list.filter(r => (r.fecha || '') <= dateFilterTo);
    return list;
  }, [records, dateFilterFrom, dateFilterTo]);

  const displayedRecords = useMemo(() => {
    if (showAllWeights || filteredRecords.length <= LAST_N_DEFAULT) return filteredRecords;
    return filteredRecords.slice(0, LAST_N_DEFAULT);
  }, [filteredRecords, showAllWeights]);

  const hasMoreToShow = filteredRecords.length > LAST_N_DEFAULT && !showAllWeights;

  const handleSaveWeight = async () => {
    if (!form.peso || !user?.clientId) return;
    setSaving(true);
    try {
      if (editingWeight) {
        await weightLogsApi.update(editingWeight.id, user.clientId, {
          peso: parseFloat(form.peso),
          fecha: form.fecha,
          observaciones: form.observaciones || null,
        });
      } else {
        await weightLogsApi.create(user.clientId, {
          peso: parseFloat(form.peso),
          fecha: form.fecha,
          observaciones: form.observaciones || null,
        });
      }
      setEditingWeight(null);
      setForm({ peso: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEditWeight = (r) => {
    setEditingWeight(r);
    setForm({
      peso: String(r.peso ?? r.weight ?? ''),
      fecha: (r.fecha || '').slice(0, 10) || new Date().toISOString().split('T')[0],
      observaciones: r.observaciones || r.notes || '',
    });
    setShowModal(true);
  };

  const handleDeleteWeight = async (id) => {
    if (!user?.clientId) return;
    try {
      await weightLogsApi.delete(id, user.clientId);
      if (editingWeight?.id === id) {
        setEditingWeight(null);
        setShowModal(false);
      }
      loadData();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  const openAddWeight = () => {
    setEditingWeight(null);
    setForm({ peso: '', fecha: new Date().toISOString().split('T')[0], observaciones: '' });
    setShowModal(true);
  };

  const clearDateFilter = () => {
    setDateFilterFrom('');
    setDateFilterTo('');
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-2">Mi seguimiento</h2>
          <p className="text-muted mb-0">Evolución de peso y entrenamientos completados</p>
        </div>
        {canWeightTracking && <Button onClick={openAddWeight} className="btn-primary">Registrar mi peso</Button>}
      </div>

      {canWeightTracking ? (
        <>
          <WeightSummary records={records} />
          <WeightChart records={records} showTrend advancedPeriods={hasAdvancedWeight} />
          <Card className="mb-4">
            <Card.Header className="d-flex flex-column flex-sm-row justify-content-between align-items-start gap-2">
              <strong>Historial de peso</strong>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateFilterFrom}
                  onChange={e => setDateFilterFrom(e.target.value)}
                  className="flex-grow-1 flex-sm-grow-0"
                  style={{ minWidth: 120, maxWidth: 140 }}
                />
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateFilterTo}
                  onChange={e => setDateFilterTo(e.target.value)}
                  className="flex-grow-1 flex-sm-grow-0"
                  style={{ minWidth: 120, maxWidth: 140 }}
                />
                {(dateFilterFrom || dateFilterTo) && (
                  <Button variant="link" size="sm" className="p-0 text-muted" onClick={clearDateFilter}>
                    Limpiar filtro
                  </Button>
                )}
              </div>
            </Card.Header>
            <Table responsive className="table-modern mb-0">
              <thead><tr><th>Fecha</th><th>Peso (kg)</th><th>Observaciones</th><th className="text-end">Acciones</th></tr></thead>
              <tbody>
                {displayedRecords.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-muted">Sin registros en este rango. {dateFilterFrom || dateFilterTo ? 'Ajusta el filtro de fechas.' : 'Registra tu peso para llevar el seguimiento.'}</td></tr>
                ) : (
                  displayedRecords.map(r => (
                    <tr key={r.id}>
                      <td>{(r.fecha || '').slice(0, 10)}</td>
                      <td><strong>{r.peso ?? r.weight} kg</strong></td>
                      <td className="small">{r.observaciones || r.notes || '—'}</td>
                      <td className="text-end">
                        <Button variant="link" size="sm" className="p-0 me-2 text-primary" onClick={() => handleEditWeight(r)}>Editar</Button>
                        <Button variant="link" size="sm" className="p-0 text-danger" onClick={() => handleDeleteWeight(r.id)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
            {(hasMoreToShow || (showAllWeights && filteredRecords.length > LAST_N_DEFAULT)) && (
              <Card.Footer className="bg-transparent border-top">
                {showAllWeights ? (
                  <Button variant="link" size="sm" className="p-0" onClick={() => setShowAllWeights(false)}>
                    Ver solo últimos {LAST_N_DEFAULT}
                  </Button>
                ) : (
                  <Button variant="link" size="sm" className="p-0" onClick={() => setShowAllWeights(true)}>
                    Ver todos ({filteredRecords.length} registros)
                  </Button>
                )}
              </Card.Footer>
            )}
          </Card>
        </>
      ) : (
        <Card className="mb-4 border-secondary">
          <Card.Body className="text-center py-4 text-muted">
            El seguimiento de peso corporal está disponible cuando tu coach tenga un plan Pro o superior.
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Header><h5 className="mb-0">Entrenamientos completados</h5></Card.Header>
        <Card.Body>
          {completed.length === 0 ? (
            <p className="text-muted mb-0">Completa los entrenamientos planificados en tu calendario.</p>
          ) : (
            <Table responsive className="table-modern mb-0">
              <thead><tr><th>Fecha</th><th>Rutina</th><th>RPE</th></tr></thead>
              <tbody>
                {[...completed]
                  .sort((a, b) => (b.completedAt || b.date || '').localeCompare(a.completedAt || a.date || ''))
                  .slice(0, 15)
                  .map(pw => {
                    const routine = routines.find(r => r.id === pw.routineId);
                    const { total } = calcRoutineCalories(routine, exerciseLibrary);
                    const dateStr = (pw.completedAt || pw.date || '').slice(0, 10);
                    return (
                      <tr key={pw.id}>
                        <td>{dateStr}</td>
                        <td>{routine?.name} {total > 0 && <span className="text-muted small">({total} kcal)</span>}</td>
                        <td>{(pw.rpe || pw.intensity) ? `${pw.rpe || pw.intensity}/10` : '-'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => { setShowModal(false); setEditingWeight(null); }} fullscreen="sm-down">
        <Modal.Header closeButton>
          <Modal.Title>{editingWeight ? 'Editar registro de peso' : 'Registrar mi peso'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Fecha</Form.Label>
            <Form.Control type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Peso (kg)</Form.Label>
            <Form.Control type="number" step="0.1" value={form.peso} onChange={e => setForm(f => ({ ...f, peso: e.target.value }))} placeholder="Ej: 72.5" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Observaciones (opcional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => { setShowModal(false); setEditingWeight(null); }}>Cancelar</Button>
          <Button className="btn-primary" onClick={handleSaveWeight} disabled={!form.peso || saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
