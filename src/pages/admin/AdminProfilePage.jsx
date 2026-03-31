import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';

const TOKEN_KEY = 'fitcoach_token';

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ variant: '', text: '' });

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setLastName(user.lastName || '');
    setEmail(user.email || '');
    setUsername(user.username || '');
  }, [user?.id, user?.name, user?.lastName, user?.email, user?.username]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ variant: '', text: '' });

    if (!name.trim()) {
      setMessage({ variant: 'danger', text: 'El nombre es obligatorio.' });
      return;
    }
    if (!email.trim()) {
      setMessage({ variant: 'danger', text: 'El correo electrónico es obligatorio.' });
      return;
    }
    if (!username.trim()) {
      setMessage({ variant: 'danger', text: 'El nombre de usuario es obligatorio.' });
      return;
    }

    const pwd = password.trim();
    const pwd2 = password2.trim();
    if (pwd || pwd2) {
      if (pwd !== pwd2) {
        setMessage({ variant: 'danger', text: 'Las contraseñas no coinciden.' });
        return;
      }
      if (pwd.length < 8) {
        setMessage({ variant: 'danger', text: 'La contraseña debe tener al menos 8 caracteres.' });
        return;
      }
      if (!/[A-ZÁÉÍÓÚÜÑ]/.test(pwd)) {
        setMessage({
          variant: 'danger',
          text: 'La contraseña debe incluir al menos una letra mayúscula.',
        });
        return;
      }
      if (!/\d/.test(pwd)) {
        setMessage({ variant: 'danger', text: 'La contraseña debe incluir al menos un número.' });
        return;
      }
    }

    const body = {
      name: name.trim(),
      lastName: lastName.trim() === '' ? '' : lastName.trim(),
      email: email.trim(),
      username: username.trim(),
    };
    if (pwd) {
      body.password = pwd;
    }

    setSaving(true);
    try {
      const res = await adminApi.updateMe(body);
      if (res.token) {
        sessionStorage.setItem(TOKEN_KEY, res.token);
      }
      await refreshUser?.();
      setPassword('');
      setPassword2('');
      setMessage({ variant: 'success', text: 'Cambios guardados correctamente.' });
    } catch (err) {
      setMessage({
        variant: 'danger',
        text: err?.message || err?.data?.error || 'No se pudieron guardar los cambios.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="admin-profile-page">
      <h2 className="mb-4">Mi cuenta</h2>
      <p className="text-muted mb-4">
        Actualizá tu nombre, correo, usuario para iniciar sesión y, si querés, la contraseña.
      </p>

      {message.text && (
        <Alert variant={message.variant} dismissible onClose={() => setMessage({ variant: '', text: '' })}>
          {message.text}
        </Alert>
      )}

      <Card>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Card.Subtitle className="mb-3 text-muted">Datos personales</Card.Subtitle>
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <Form.Label>Nombre</Form.Label>
                <Form.Control value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
              </div>
              <div className="col-md-6">
                <Form.Label>Apellido</Form.Label>
                <Form.Control
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
              <div className="col-md-6">
                <Form.Label>Correo electrónico</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <Card.Subtitle className="mb-3 text-muted">Acceso</Card.Subtitle>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Label>Nombre de usuario</Form.Label>
                <Form.Control
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
                <Form.Text className="text-muted">Solo letras minúsculas, números, guion y guion bajo (3–32 caracteres).</Form.Text>
              </div>
              <div className="col-md-6">
                <Form.Label>Nueva contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
              <div className="col-md-6">
                <Form.Label>Confirmar nueva contraseña</Form.Label>
                <Form.Control
                  type="password"
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Repetir si cambiás la contraseña"
                />
                <Form.Text className="text-muted">
                  Mínimo 8 caracteres, una mayúscula y un número.
                </Form.Text>
              </div>
            </div>

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
