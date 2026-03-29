import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { routinesApi, plannedWorkoutsApi } from '../../api';
import { calcRoutineCalories } from '../../utils/routineCalories';
import RoutineDetail from '../../components/RoutineDetail';
import { Spinner } from 'react-bootstrap';

const IconCalendar = () => <svg className="routine-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const IconClock = () => <svg className="routine-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconList = () => <svg className="routine-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>;
const IconFlame = () => <svg className="routine-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>;

const getLevelLabel = (level) => ({ principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }[level] || level);
const getObjectiveLabel = (objective) => objective?.charAt(0).toUpperCase() + objective?.slice(1) || '';

export default function ClientRoutinesPage() {
  const { user } = useAuth();
  const { routineId } = useParams();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [routines, setRoutines] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailRoutine, setDetailRoutine] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!user?.clientId) return setLoading(false);
    const load = async () => {
      try {
        const [rRes, pwRes] = await Promise.all([routinesApi.list(), plannedWorkoutsApi.listByClient(user.clientId)]);
        setRoutines(rRes.data || []);
        setPlannedWorkouts(pwRes.data || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [user?.clientId]);

  useEffect(() => {
    if (!routineId || !user?.clientId) {
      setDetailRoutine(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    routinesApi
      .getById(routineId)
      .then((res) => {
        if (!cancelled) setDetailRoutine(res.data || null);
      })
      .catch(() => {
        if (!cancelled) setDetailRoutine(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [routineId, user?.clientId]);

  const toDateStr = (d) => (d ? String(d).slice(0, 10) : '');

  const workoutsForRoutine = useMemo(() => {
    if (!routineId) return [];
    return [...plannedWorkouts]
      .filter((pw) => pw.routineId === routineId)
      .sort((a, b) => toDateStr(a.date).localeCompare(toDateStr(b.date)));
  }, [routineId, plannedWorkouts]);

  const plannedWorkoutFromUrl = useMemo(() => {
    if (!dateParam || !routineId) return null;
    return workoutsForRoutine.find((pw) => toDateStr(pw.date) === dateParam) || null;
  }, [dateParam, routineId, workoutsForRoutine]);

  const reloadPlannedWorkouts = useCallback(async () => {
    if (!user?.clientId) return;
    try {
      const pwRes = await plannedWorkoutsApi.listByClient(user.clientId);
      setPlannedWorkouts(pwRes.data || []);
    } catch (_) {}
  }, [user?.clientId]);

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
  }

  if (routineId) {
    const routine = detailRoutine || routines.find(r => r.id === routineId);
    if (detailLoading && !routine) {
      return <div className="d-flex justify-content-center py-5"><Spinner animation="border" /></div>;
    }
    if (!routine) return <p className="text-muted">Rutina no encontrada.</p>;
    return (
      <div>
        <Link to={dateParam ? '/cliente/calendario' : '/cliente/rutinas'} className="routine-back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Volver
        </Link>
        <RoutineDetail
          routine={routine}
          clientName={`${user?.name} ${user?.lastName}`}
          showPdfButton={true}
          plannedWorkout={plannedWorkoutFromUrl}
          plannedWorkoutsForRoutine={workoutsForRoutine}
          onPlannedWorkoutUpdated={reloadPlannedWorkouts}
        />
      </div>
    );
  }

  return (
    <div>
      <header className="routines-page-header">
        <h1>Mis rutinas</h1>
        <p>Planifica tus entrenamientos y consulta las rutinas asignadas por tu coach</p>
      </header>

      {routines.length === 0 ? (
        <div className="routines-empty">
          <div className="routines-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <h3>Aún no tienes rutinas asignadas</h3>
          <p>Tu coach te asignará rutinas personalizadas según tus objetivos y nivel. Cuando las recibas, las verás aquí.</p>
        </div>
      ) : (
        <div className="cards-grid">
          {routines.map(r => {
            const { total: totalKcal } = calcRoutineCalories(r, []);
            return (
              <Link key={r.id} to={`/cliente/rutinas/${r.id}`} className="routine-card">
                  <div className="routine-card-body">
                    <div className="routine-card-body-inner">
                      <div className="routine-card-category">{getObjectiveLabel(r.objective)}</div>
                      <h3 className="routine-card-title">{r.name}</h3>
                      <div className="routine-card-meta">
                        <span className="routine-card-meta-item"><IconCalendar /> Asignar en calendario</span>
                        <span className="routine-card-meta-item"><IconClock /> ~{r.durationMinutes || 45} min</span>
                        {r.exercises?.length > 0 && (
                          <span className="routine-card-meta-item"><IconList /> {r.exercises.length} ejercicios</span>
                        )}
                        {totalKcal > 0 && (
                          <span className="routine-card-meta-item routine-card-meta-kcal"><IconFlame /> {totalKcal} kcal est.</span>
                        )}
                      </div>
                    </div>
                    <div className="routine-card-footer">
                      <div className="routine-card-badges">
                        <span className="routine-badge routine-badge-level">{getLevelLabel(r.level)}</span>
                        {totalKcal > 0 && <span className="routine-badge routine-badge-kcal">{totalKcal} kcal</span>}
                      </div>
                      <span className="routine-card-cta">
                        Ver rutina
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </span>
                    </div>
                  </div>
                </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
