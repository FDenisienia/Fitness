import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { clientsApi } from '../../api';
import { OBJECTIVES, LEVELS } from '../../data/mockData';

export default function ClientProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: '', lastName: '', age: '', objective: '', level: '' });
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      lastName: user?.lastName || '',
      age: user?.age ?? '',
      objective: user?.objective || '',
      level: user?.level || '',
    });
  }, [user?.id, user?.name, user?.lastName, user?.age, user?.objective, user?.level]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.clientId) return;
    setSaving(true);
    try {
      await clientsApi.update(user.clientId, {
        name: profileForm.name.trim(),
        lastName: profileForm.lastName.trim(),
        age: profileForm.age ? parseInt(profileForm.age, 10) : null,
        objective: profileForm.objective || null,
        level: profileForm.level || null,
      });
      await refreshUser?.();
      setSavedMsg('Datos guardados correctamente');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const showObjectiveDescription =
    user?.objective === 'personalizado' && Boolean(user?.objectiveDescription?.trim());

  return (
    <div className="client-profile-page">
      <h2 className="mb-4">Mi perfil</h2>
      <Card className="mb-4">
        <Card.Header><strong>Datos personales</strong></Card.Header>
        <Card.Body>
          <Form onSubmit={handleSaveProfile}>
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label>Nombre</Form.Label>
                <Form.Control value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <Form.Label>Apellido</Form.Label>
                <Form.Control value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
              </div>
              <div className="col-md-6">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={user?.email || ''} disabled className="bg-light" />
                <Form.Text className="text-muted">El email no se puede modificar desde el perfil.</Form.Text>
              </div>
              <div className="col-md-6">
                <Form.Label>Edad</Form.Label>
                <Form.Control type="number" min={1} max={120} value={profileForm.age} onChange={e => setProfileForm(f => ({ ...f, age: e.target.value }))} placeholder="Ej: 28" />
              </div>
              <div className="col-md-6">
                <Form.Label>Objetivo</Form.Label>
                <Form.Select
                  value={profileForm.objective}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProfileForm((f) => ({ ...f, objective: v }));
                  }}
                >
                  <option value="">— Seleccionar —</option>
                  {OBJECTIVES.map((o) => (
                    <option key={o} value={o}>
                      {o.charAt(0).toUpperCase() + o.slice(1)}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-6">
                <Form.Label>Nivel</Form.Label>
                <Form.Select value={profileForm.level} onChange={e => setProfileForm(f => ({ ...f, level: e.target.value }))}>
                  <option value="">— Seleccionar —</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </Form.Select>
              </div>
              {showObjectiveDescription && (
                <div className="col-12">
                  <div className="client-profile-objective-desc">
                    <span className="client-profile-objective-desc__label">Descripción del objetivo</span>
                    <p className="client-profile-objective-desc__text">{user.objectiveDescription}</p>
                    <p className="client-profile-objective-desc__hint">Tu coach definió este texto; si tenés dudas, consultale.</p>
                  </div>
                </div>
              )}
              <div className="col-12">
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</Button>
                {savedMsg && <span className="ms-3 text-success">{savedMsg}</span>}
              </div>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
