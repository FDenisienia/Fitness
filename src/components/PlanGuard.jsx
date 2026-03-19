import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../context/PlanContext';

const FEATURE_MESSAGES = {
  hasWeightTracking: 'El seguimiento de peso está disponible en planes Pro o superiores.',
};

/**
 * Protege rutas que requieren una feature del plan. Solo para coaches.
 */
export function PlanGuard({ feature, children, fallback }) {
  const { user } = useAuth();
  const plan = usePlan();

  if (!user || user.role !== 'coach') return children;
  if (!plan) return children;

  const hasFeature = plan[feature];
  if (!hasFeature) {
    if (fallback) return fallback;
    return (
      <Card className="border-warning">
        <Card.Body className="text-center py-5">
          <h5>Función no disponible en tu plan</h5>
          <p className="text-muted mb-3">{FEATURE_MESSAGES[feature] || 'Mejora tu plan para acceder.'}</p>
          <Button as={Link} to="/coach" variant="primary">Volver al panel</Button>
        </Card.Body>
      </Card>
    );
  }
  return children;
}
