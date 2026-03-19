import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner } from 'react-bootstrap';
import { coachesApi } from '../../api';
import { SUBSCRIPTION_PLANS } from '../../data/mockData';

export default function AdminPlansPage() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await coachesApi.list();
        setCoaches(res.data || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const planStats = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
    const count = coaches.filter(c => c.subscriptionPlan === key && c.subscriptionStatus === 'activa').length;
    const revenue = (plan.price ?? 0) * count;
    return { ...plan, count, revenue };
  });

  const totalRevenue = planStats.reduce((a, p) => a + p.revenue, 0);

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <h2 className="mb-2">Planes para coaches en tu plataforma</h2>
      <p className="text-muted mb-4">El coach paga según el nivel de herramientas y capacidad que necesita</p>

      <Card className="mb-4 border-primary">
        <Card.Body>
          <h5>Ingresos mensuales estimados</h5>
          <h2 className="text-primary mb-0">{totalRevenue} €/mes</h2>
          <small className="text-muted">Basado en coaches con suscripción activa</small>
        </Card.Body>
      </Card>

      <div className="row g-4 mb-4">
        {planStats.map(p => (
          <div key={p.id} className="col-6 col-lg-3">
            <Card className="h-100 d-flex flex-column">
              <Card.Header className="d-flex justify-content-between align-items-center py-3">
                <strong>{p.name}</strong>
                <Badge bg="secondary">{p.count} {p.count === 1 ? 'coach' : 'coaches'}</Badge>
              </Card.Header>
              <Card.Body className="d-flex flex-column flex-grow-1">
                <div className="mb-2" style={{ minHeight: 52 }}>
                  <h3 className="mb-1">{p.id === 'personalizado' ? 'Personalizado' : `${p.price} €/mes`}</h3>
                  <p className="text-muted small mb-0">
                    {p.maxAlumnos === 999 ? 'Alumnos ilimitados' : `Hasta ${p.maxAlumnos} alumnos`}
                  </p>
                </div>
                {p.tagline && <p className="small text-muted mb-2 fst-italic">{p.tagline}</p>}
                <ul className="small mb-0 ps-3">
                  {(p.features || []).slice(0, 6).map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                  {(p.features || []).length > 6 && <li className="text-muted">+{p.features.length - 6} más</li>}
                  {(p.noIncludes || []).length > 0 && (
                    <li className="text-muted small mt-1">No incluye: {p.noIncludes.join(', ')}</li>
                  )}
                </ul>
                <div className="mt-auto pt-3">
                  <hr className="my-2" />
                  <p className="mb-0">{p.id === 'personalizado' ? <strong>Consultar</strong> : <><strong>{p.id === 'premium' ? (p.revenue || p.price) : p.revenue} €</strong> / mes</>}</p>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>

      <Card>
        <Card.Header><h5 className="mb-0">Coaches por plan</h5></Card.Header>
        <Table responsive className="table-modern mb-0">
          <thead><tr><th>Coach</th><th>Plan</th><th>Precio</th><th>Estado</th></tr></thead>
          <tbody>
            {coaches.map(c => {
              const plan = SUBSCRIPTION_PLANS[c.subscriptionPlan] || SUBSCRIPTION_PLANS.basico;
              return (
                <tr key={c.id}>
                  <td>{c.name} {c.lastName}</td>
                  <td><Badge bg="primary">{plan.name}</Badge></td>
                  <td>{plan.id === 'personalizado' ? 'Personalizado' : `${plan.price} €/mes`}</td>
                  <td><Badge bg={c.subscriptionStatus === 'activa' ? 'success' : 'secondary'}>{c.subscriptionStatus || 'activa'}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
