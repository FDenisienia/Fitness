import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, Table, Button, Modal, Form, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { clientsApi, weightLogsApi } from '../../api';
import { clientDisplay } from '../../utils/clientDisplay';
import WeightChart from '../../components/weight/WeightChart';
import WeightSummary from '../../components/weight/WeightSummary';

export default function CoachWeightPage() {
  const { user } = useAuth();
  const plan = usePlan();
  const hasAdvancedWeight = plan?.hasAdvancedWeight ?? false;
  const { clientId } = useParams();
  const [clients, setClients] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ observaciones: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const clientsRes = await clientsApi.list();
        const cList = clientsRes.data || [];
        setClients(cList);
        const weightPromises = cList.map((c) =>
          weightLogsApi.listByClient(c.id).then((r) => ({ id: c.id, data: r.data || [] })).catch(() => ({ id: c.id, data: [] }))
        );
        const results = await Promise.all(weightPromises);
        const recMap = Object.fromEntries(results.map((r) => [r.id, r.data]));
        setRecords(recMap);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const selectedClient = clientId ? clients.find(c => c.id === clientId) : null;
  const getRecords = (cid) => (records[cid] || []).sort((a, b) => (String(b.fecha || b.loggedAt || '')).localeCompare(String(a.fecha || a.loggedAt || '')));

  const openObservationModal = (rec, cid) => {
    setEditing({ ...rec, _clientId: cid });
    setForm({ observaciones: rec.observaciones || rec.notes || '' });
    setShowModal(true);
  };

  const handleSaveObservation = async () => {
    if (!editing?._clientId) return;
    setSaving(true);
    try {
      await weightLogsApi.update(editing.id, editing._clientId, { notes: form.observaciones?.trim() || null });
      setRecords(prev => ({
        ...prev,
        [editing._clientId]: (prev[editing._clientId] || []).map(r =>
          r.id === editing.id ? { ...r, observaciones: form.observaciones?.trim() || null } : r
        ),
      }));
      setShowModal(false);
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  if (clientId && selectedClient) {
    const rawRecords = getRecords(selectedClient.id);
    const clientRecords = rawRecords.map(r => ({
      ...r,
      fecha: String(r.fecha || r.loggedAt || '').slice(0, 10),
      peso: r.peso ?? r.weight,
    }));
    const d = clientDisplay(selectedClient);
    return (
      <div>
        <Link to="/coach/seguimiento" className="text-muted mb-2 d-inline-block">← Volver</Link>
        <h2 className="mb-4">Seguimiento de peso: {d.name} {d.lastName}</h2>

        <WeightSummary records={clientRecords} />
        <WeightChart records={clientRecords} showTrend advancedPeriods={hasAdvancedWeight} />

        <Card>
          <Card.Header><strong>Historial de registros</strong></Card.Header>
          <Table responsive className="table-modern mb-0">
            <thead><tr><th>Fecha</th><th>Peso (kg)</th><th>Observaciones</th><th>Acciones</th></tr></thead>
            <tbody>
              {clientRecords.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-4 text-muted">Sin registros.</td></tr>
              ) : (
                clientRecords.map(r => (
                  <tr key={r.id}>
                    <td>{String(r.fecha || r.loggedAt || '').slice(0, 10)}</td>
                    <td>{(r.peso || r.weight)} kg</td>
                    <td className="small">{r.observaciones || r.notes || '-'}</td>
                    <td>
                      <Button size="sm" variant="outline-secondary" onClick={() => openObservationModal(r, selectedClient.id)}>
                        Agregar observación
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton><Modal.Title>Agregar observación</Modal.Title></Modal.Header>
          <Modal.Body>
            {editing && (
              <div className="small text-muted mb-3">
                Registro del {String(editing.fecha || editing.loggedAt || '').slice(0, 10)} · {editing.peso || editing.weight} kg
              </div>
            )}
            <Form.Group>
              <Form.Label>Observaciones</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} placeholder="Ej: Buen progreso..." />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="btn-primary" onClick={handleSaveObservation} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Seguimiento de peso</h2>
      <p className="text-muted mb-4">Gestiona el seguimiento de peso corporal de tus alumnos</p>
      <div className="row g-3">
        {clients.map(c => {
          const recs = getRecords(c.id);
          const lastRec = recs[0];
          const d = clientDisplay(c);
          return (
            <div key={c.id} className="col-md-6 col-lg-4">
              <Card as={Link} to={`/coach/seguimiento/${c.id}`} className="text-decoration-none text-dark h-100 card-hover">
                <Card.Body>
                  <h5>{d.name} {d.lastName}</h5>
                  <p className="text-muted small mb-2">{recs.length} registros</p>
                  {lastRec && <div className="small">Último: {String(lastRec.fecha || lastRec.loggedAt || '').slice(0, 10)} · {lastRec.peso || lastRec.weight} kg</div>}
                </Card.Body>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
