import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { routinesApi, plannedWorkoutsApi } from '../../api';
import Calendar from '../../components/Calendar';
import { Spinner } from 'react-bootstrap';

export default function ClientCalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user?.clientId) return setLoading(false);
    try {
      const [rRes, pwRes] = await Promise.all([
        routinesApi.list(),
        plannedWorkoutsApi.listByClient(user.clientId),
      ]);
      setRoutines(rRes.data || []);
      const pw = pwRes.data || [];
      setPlannedWorkouts(pw.map(p => ({ ...p, date: (p.date || '').slice(0, 10) })));
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.clientId]);

  const handleWorkoutClick = (pw, routine) => {
    if (routine) navigate(`/cliente/rutinas/${routine.id}?date=${pw.date}`);
  };

  const handleMarkComplete = async (workout, { rpe, feedback }) => {
    try {
      await plannedWorkoutsApi.update(workout.id, {
        completed: true,
        rpe: parseInt(rpe, 10) || null,
        clientNotes: feedback || null,
        feedback: feedback || null,
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Error al marcar');
    }
  };

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  return (
    <div>
      <h2 className="mb-4">Mi planificación</h2>

      <Calendar
        plannedWorkouts={plannedWorkouts}
        routines={routines}
        onWorkoutClick={handleWorkoutClick}
        onWorkoutComplete={loadData}
        onMarkComplete={handleMarkComplete}
        allowMarkComplete
        mode="view"
      />
    </div>
  );
}
