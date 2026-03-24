import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Spinner } from 'react-bootstrap';
import { coachesApi, statsApi } from '../../api';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, coachesRes] = await Promise.all([
          statsApi.adminStats(),
          coachesApi.list(),
        ]);
        setStats(statsRes.data || {});
        setCoaches(coachesRes.data || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const revenueByPlan = coaches.reduce((acc, c) => {
    const plan = SUBSCRIPTION_PLANS[c.subscriptionPlan] || SUBSCRIPTION_PLANS.basico;
    if (c.subscriptionStatus === 'activa') acc += (plan.price ?? 0);
    return acc;
  }, 0);

  const activeCoaches = coaches.filter(c => c.active !== false && c.status === 'active');

  const statsData = stats || {};
  const statItems = [
    { label: 'Coaches activos (tus clientes)', value: activeCoaches.length, link: '/admin/coaches', color: 'success' },
    { label: 'Ingresos mensuales (USD)', value: revenueByPlan.toFixed(2), link: '/admin/coaches', color: 'primary' },
    { label: 'Alumnos totales', value: statsData.clientsCount ?? 0, link: null, color: 'info' },
    { label: 'Entrenamientos registrados', value: statsData.completedWorkouts ?? 0, link: null, color: 'warning' },
    { label: 'Mensajes sin leer', value: statsData.pendingMessages ?? 0, link: '/admin/consultas', color: 'danger' },
    { label: 'Mensajería', value: statsData.conversationsCount ?? 0, link: '/admin/consultas', color: 'secondary' },
  ];

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <h1 className="mb-2">Tu gimnasio digital</h1>
      <p className="text-muted mb-4">Métricas globales · Coaches como clientes · Control de uso</p>
      <Row>
        {statItems.map(({ label, value, link, color }) => (
          <Col md={6} lg={4} key={label} className="mb-4">
            <Card as={link ? Link : 'div'} to={link || undefined} className={`text-decoration-none text-dark h-100 ${link ? 'card-hover' : ''}`}>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted text-uppercase mb-1">{label}</h6>
                    <h3 className="mb-0">{value}</h3>
                  </div>
                  <div className={`bg-${color} bg-opacity-25 rounded-3 p-3`}>
                    <span className={`text-${color}`}>→</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
