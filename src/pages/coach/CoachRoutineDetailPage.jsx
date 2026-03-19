import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { routinesApi } from '../../api';
import RoutineDetail from '../../components/RoutineDetail';
import { Spinner } from 'react-bootstrap';

export default function CoachRoutineDetailPage() {
  const { user } = useAuth();
  const { routineId } = useParams();
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!routineId) return;
    routinesApi.getById(routineId)
      .then(res => setRoutine(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [routineId]);

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
      <RoutineDetail routine={routine} showPdfButton={true} />
    </div>
  );
}
