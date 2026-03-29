import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Row, Col, Spinner } from 'react-bootstrap';
import { exercisesApi } from '../../api';
import { MUSCLE_GROUPS, EQUIPMENT } from '../../data/mockData';
import { isValidYoutubeEmbedUrl } from '../../utils/youtubeEmbed';

export default function ExerciseLibraryPage() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ search: '', muscle: '', equipment: '' });
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', instructions: '', muscleGroup: '', equipment: '', videoUrl: '', caloriasPorRep: '', caloriasPorMin: '' });
  const [saving, setSaving] = useState(false);

  const loadLibrary = async () => {
    try {
      const res = await exercisesApi.list();
      setLibrary(res.data || []);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadLibrary();
  }, []);

  const filtered = library.filter(ex => {
    const matchSearch = !filter.search || ex.name?.toLowerCase().includes(filter.search.toLowerCase()) || (ex.description || '').toLowerCase().includes(filter.search.toLowerCase());
    const matchMuscle = !filter.muscle || ex.muscleGroup === filter.muscle;
    const matchEquip = !filter.equipment || ex.equipment === filter.equipment;
    return matchSearch && matchMuscle && matchEquip;
  });

  const openModalHandler = (ex = null) => {
    if (ex) {
      setEditing(ex);
      setForm({
        name: ex.name || '',
        description: ex.description || '',
        instructions: ex.instructions || '',
        muscleGroup: ex.muscleGroup || '',
        equipment: ex.equipment || '',
        videoUrl: ex.videoUrl || '',
        caloriasPorRep: ex.caloriasPorRep ?? '',
        caloriasPorMin: ex.caloriasPorMin ?? '',
      });
    } else {
      setEditing(null);
      setForm({ name: '', description: '', instructions: '', muscleGroup: '', equipment: '', videoUrl: '', caloriasPorRep: '', caloriasPorMin: '' });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    if (!form.muscleGroup || !form.equipment) {
      alert('Selecciona grupo muscular y equipamiento.');
      return;
    }
    const vUrl = form.videoUrl?.trim() || '';
    if (vUrl && !isValidYoutubeEmbedUrl(vUrl)) {
      alert('La URL de vídeo debe ser un enlace embed de YouTube (https://www.youtube.com/embed/...).');
      return;
    }
    if (form.caloriasPorRep && form.caloriasPorMin) {
      alert('Indica solo calorías por repetición o por minuto, no ambas.');
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        instructions: form.instructions?.trim() || null,
        muscleGroup: form.muscleGroup || null,
        equipment: form.equipment || null,
        videoUrl: vUrl || null,
        caloriasPorRep: form.caloriasPorRep ? parseFloat(form.caloriasPorRep) : null,
        caloriasPorMin: form.caloriasPorMin ? parseFloat(form.caloriasPorMin) : null,
      };
      if (editing) {
        await exercisesApi.update(editing.id, data);
      } else {
        await exercisesApi.create(data);
      }
      setShowModal(false);
      loadLibrary();
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const deleteExercise = async (id) => {
    if (!confirm('¿Eliminar este ejercicio de la biblioteca?')) return;
    try {
      await exercisesApi.delete(id);
      loadLibrary();
    } catch (err) {
      alert(err.message || 'Error al eliminar');
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Biblioteca de ejercicios</h2>
        <Button onClick={() => openModalHandler()} className="btn-primary">Añadir ejercicio</Button>
      </div>
      <Card className="mb-4">
        <Card.Body>
          <div className="filters-grid">
            <Form.Control className="flex-grow-1" placeholder="Buscar por nombre..." value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
            <Form.Select style={{ minWidth: '160px' }} value={filter.muscle} onChange={e => setFilter(f => ({ ...f, muscle: e.target.value }))}><option value="">Grupo muscular</option>{MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}</Form.Select>
            <Form.Select style={{ minWidth: '160px' }} value={filter.equipment} onChange={e => setFilter(f => ({ ...f, equipment: e.target.value }))}><option value="">Equipamiento</option>{EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}</Form.Select>
          </div>
        </Card.Body>
      </Card>
      <Card>
        <Table responsive className="table-modern mb-0">
          <thead>
            <tr><th>Ejercicio</th><th>Grupo muscular</th><th>Equipamiento</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {filtered.map(ex => (
              <tr key={ex.id}>
                <td><strong>{ex.name}</strong></td>
                <td>{ex.muscleGroup || '-'}</td>
                <td>{ex.equipment || '-'}</td>
                <td>
                  <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openModalHandler(ex)}>Editar</Button>
                  <Button size="sm" variant="outline-danger" onClick={() => deleteExercise(ex.id)}>Eliminar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>{editing ? 'Editar ejercicio' : 'Añadir ejercicio'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3"><Form.Label>Nombre <span className="text-danger">*</span></Form.Label><Form.Control value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Descripción</Form.Label><Form.Control as="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Instrucciones</Form.Label><Form.Control as="textarea" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} /></Form.Group>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Grupo muscular <span className="text-danger">*</span></Form.Label><Form.Select value={form.muscleGroup} onChange={e => setForm(f => ({ ...f, muscleGroup: e.target.value }))} required><option value="">Seleccionar</option>{MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}</Form.Select></Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Equipamiento <span className="text-danger">*</span></Form.Label><Form.Select value={form.equipment} onChange={e => setForm(f => ({ ...f, equipment: e.target.value }))} required><option value="">Seleccionar</option>{EQUIPMENT.map(eq => <option key={eq} value={eq}>{eq}</option>)}</Form.Select></Form.Group></Col>
          </Row>
          <Row>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Calorías por repetición</Form.Label><Form.Control type="number" step="0.1" value={form.caloriasPorRep} onChange={e => setForm(f => ({ ...f, caloriasPorRep: e.target.value }))} placeholder="Ej: 0.4 (para ejercicios por reps)" /></Form.Group></Col>
            <Col md={6}><Form.Group className="mb-3"><Form.Label>Calorías por minuto</Form.Label><Form.Control type="number" step="0.1" value={form.caloriasPorMin} onChange={e => setForm(f => ({ ...f, caloriasPorMin: e.target.value }))} placeholder="Ej: 10 (para cardio)" /></Form.Group></Col>
          </Row>
          <Form.Group>
            <Form.Label>URL video (YouTube embed)</Form.Label>
            <Form.Control value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://www.youtube.com/embed/..." />
            {form.videoUrl?.trim() && !isValidYoutubeEmbedUrl(form.videoUrl.trim()) && (
              <Form.Text className="text-danger d-block">Usa el formato embed: https://www.youtube.com/embed/VIDEO_ID</Form.Text>
            )}
            {form.videoUrl?.trim() && isValidYoutubeEmbedUrl(form.videoUrl.trim()) && (
              <div className="ratio ratio-16x9 mt-2 border rounded overflow-hidden bg-dark">
                <iframe title="Vista previa del vídeo" src={form.videoUrl.trim()} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button className="btn-primary" onClick={handleSave} disabled={saving || !form.name?.trim() || !form.muscleGroup || !form.equipment}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
