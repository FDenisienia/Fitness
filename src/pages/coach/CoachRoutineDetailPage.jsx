import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { routinesApi } from '../../api';
import RoutineDetail from '../../components/RoutineDetail';
import { Spinner } from 'react-bootstrap';

export default function CoachRoutineDetailPage() {
  const { user } = useAuth();
  const { routineId } = useParams();
  const [searchParams] = useSearchParams();
  const forClient = searchParams.get('forClient')?.trim() || '';
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutine = useCallback(() => {
    if (!routineId) return;
    setLoading(true);
    setError('');
    const query = forClient ? { forClient } : {};
    routinesApi
      .getById(routineId, query)
      .then((res) => setRoutine(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [routineId, forClient]);

  useEffect(() => {
    loadRoutine();
  }, [loadRoutine]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }
  if (error || !routine) return <p className="text-muted">Rutina no encontrada.</p>;

  return (
    <div>
      <Link to="/coach/rutinas" className="routine-back-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Volver a rutinas
      </Link>
      <RoutineDetail
        routine={routine}
        showPdfButton={true}
        canEditLoads={!!forClient && !!routine?.clientRoutineId}
        onLoadsSaved={loadRoutine}
      />
    </div>
  );
}
