import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, InputGroup } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { chatApi } from '../../api/chat';

const LOGIN_UNREAD_KEY = 'athlento_login_unread';

function EyeToggleIcon({ visible }) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success && result.user) {
        try {
          const { data } = await chatApi.unreadSummary();
          const total = (data?.coachClientUnread ?? 0) + (data?.adminCoachUnread ?? 0);
          if (total > 0) {
            sessionStorage.setItem(LOGIN_UNREAD_KEY, JSON.stringify(data));
          } else {
            sessionStorage.removeItem(LOGIN_UNREAD_KEY);
          }
        } catch (_) {
          sessionStorage.removeItem(LOGIN_UNREAD_KEY);
        }
        const role = result.user.role;
        if (role === 'admin') navigate('/admin');
        else if (role === 'coach') navigate('/coach');
        else navigate('/cliente');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      const status = err?.status;
      const raw = err?.message || '';
      const looksLikeNetwork =
        raw === 'Failed to fetch' ||
        err?.name === 'TypeError' ||
        (typeof raw === 'string' && raw.includes('NetworkError'));
      let msg;
      if (status === 502 || status === 503) {
        msg =
          'No hay conexión con la API. Inicia el backend (carpeta backend: npm run dev) y comprueba que use el puerto 3001.';
      } else if (looksLikeNetwork) {
        msg =
          'No se pudo conectar con el servidor. Asegúrate de tener el backend en ejecución: en la carpeta backend ejecuta «npm run dev» (puerto 3001). Si abres el front con «npm run dev» en la raíz del proyecto, las peticiones usan el proxy de Vite hacia ese puerto. Si usas un build estático, define VITE_API_URL apuntando a tu API (p. ej. http://localhost:3001/api).';
      } else {
        msg = raw || 'Error al iniciar sesión';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-4 py-md-5 px-3 auth-page">
      <Container className="max-w-400 px-0 px-sm-3">
        <Card className="p-4">
          <Card.Body>
            <div className="text-center mb-4">
              <h2 className="fw-bold">Iniciar sesión</h2>
              <p className="text-muted">Accede a tu cuenta de Athlento</p>
            </div>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4">
                <Form.Label>Contraseña</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="d-flex align-items-center px-3"
                    onClick={() => setShowPassword((v) => !v)}
                    disabled={loading}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <EyeToggleIcon visible={showPassword} />
                  </Button>
                </InputGroup>
              </Form.Group>
              <div className="mb-3">
                <Link to="/recuperar-password" className="small">¿Olvidaste tu contraseña?</Link>
              </div>
              <Button type="submit" className="w-100 btn-primary py-2" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </Form>
            <p className="text-center mt-4 mb-0 text-muted small">
              ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
            </p>
          </Card.Body>
        </Card>
        <p className="text-center mt-3 text-muted small">
          Demo: admin@fitcoach.com / admin123 | coach@fitcoach.com / coach123 | cliente1@email.com / cliente123
        </p>
      </Container>
    </div>
  );
}
