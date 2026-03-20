import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        const role = result.user.role;
        if (role === 'admin') navigate('/admin');
        else if (role === 'coach') navigate('/coach');
        else navigate('/cliente');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión');
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
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
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
