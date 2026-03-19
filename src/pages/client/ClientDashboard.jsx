import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { routinesApi, plannedWorkoutsApi, weightLogsApi } from '../../api';
import { calcRoutineCalories } from '../../utils/routineCalories';

function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getObjectiveLabel(obj) {
  if (!obj) return null;
  return obj.charAt(0).toUpperCase() + obj.slice(1);
}

const toDateStr = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.slice(0, 10);
  return new Date(d).toISOString().slice(0, 10);
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [weightRecords, setWeightRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const clientId = user?.clientId;

  useEffect(() => {
    if (!clientId) return setLoading(false);
    const load = async () => {
      try {
        const [rRes, pwRes, wrRes] = await Promise.all([
          routinesApi.list(),
          plannedWorkoutsApi.listByClient(clientId),
          weightLogsApi.listByClient(clientId),
        ]);
        setRoutines(rRes.data || []);
        setPlannedWorkouts(pwRes.data || []);
        setWeightRecords(wrRes.data || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, [clientId]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const pwNormalized = plannedWorkouts.map(pw => ({ ...pw, date: toDateStr(pw.date) }));
  const todayWorkout = pwNormalized.find(pw => pw.date === todayStr);
  const todayRoutine = todayWorkout ? routines.find(r => r.id === todayWorkout.routineId) : null;

  const sortedWeight = [...weightRecords].sort((a, b) =>
    (String(a.fecha || a.loggedAt || '')).localeCompare(String(b.fecha || b.loggedAt || ''))
  ).map(r => ({ ...r, fecha: toDateStr(r.fecha || r.loggedAt), peso: r.peso ?? r.weight }));
  const pesoActual = sortedWeight.length ? parseFloat(sortedWeight[sortedWeight.length - 1].peso) : null;
  const pesoInicial = sortedWeight.length ? parseFloat(sortedWeight[0].peso) : null;
  const diffPeso = pesoActual != null && pesoInicial != null && sortedWeight.length > 1 ? (pesoActual - pesoInicial).toFixed(1) : null;

  const { start: weekStart, end: weekEnd } = getWeekBounds(new Date());
  const weekStartStr = toDateStr(weekStart);
  const weekEndStr = toDateStr(weekEnd);
  const weekPlanned = pwNormalized.filter(pw => pw.date >= weekStartStr && pw.date <= weekEndStr);
  const weekCompleted = weekPlanned.filter(pw => pw.completed);
  const weekIncomplete = weekPlanned.filter(pw => !pw.completed && pw.date < todayStr);
  const completedCount = weekCompleted.length;
  const incompleteCount = weekIncomplete.length;
  const totalPlanified = weekPlanned.length;
  const dueCount = completedCount + incompleteCount;
  const adherencePercent = dueCount > 0 ? Math.round((completedCount / dueCount) * 100) : (totalPlanified > 0 ? 0 : 0);

  const getMotivationalMessage = (pct) => {
    if (pct >= 90) return { text: '¡Eres una máquina!', sub: 'Tu consistencia es admirable', emoji: '🔥' };
    if (pct >= 70) return { text: '¡Excelente trabajo!', sub: 'Sigue así, vas muy bien', emoji: '💪' };
    if (pct >= 50) return { text: '¡Buen ritmo!', sub: 'Cada sesión cuenta', emoji: '👍' };
    if (pct >= 25) return { text: '¡Vamos con todo!', sub: 'El próximo entrenamiento te acerca más', emoji: '🎯' };
    if (pct > 0) return { text: '¡Empieza hoy!', sub: 'Cada paso suma', emoji: '🚀' };
    return { text: '¡Tu momento es ahora!', sub: 'Completa tu primer entrenamiento', emoji: '⭐' };
  };
  const motivation = getMotivationalMessage(adherencePercent);

  const totalCaloriesBurned = weekCompleted.reduce((sum, pw) => {
    const routine = routines.find(r => r.id === pw.routineId);
    return sum + (routine ? calcRoutineCalories(routine, []).total : 0);
  }, 0);
  const totalMinutesTrained = weekCompleted.reduce((sum, pw) => {
    const routine = routines.find(r => r.id === pw.routineId);
    return sum + (routine?.durationMinutes || 45);
  }, 0);

  let dayStatus = 'descanso';
  let statusLabel = 'Día de descanso';
  let statusVariant = 'info';
  if (todayWorkout) {
    if (todayWorkout.completed) {
      dayStatus = 'completado';
      statusLabel = 'Entrenamiento completado';
      statusVariant = 'success';
    } else {
      dayStatus = 'pendiente';
      statusLabel = 'Entrenamiento pendiente';
      statusVariant = 'warning';
    }
  }

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="spinner-border" /></div>;
  }

  return (
    <div className="client-dashboard">
      <h1 className="mb-1">Hola, {user?.name}</h1>
      <p className="text-muted mb-4">Tu panel de entrenamiento</p>

      {user?.objective && (
        <Card className="mb-4 border-0 shadow-sm objective-card">
          <Card.Body className="py-3 px-4">
            <h5 className="mb-2 text-uppercase small fw-semibold text-muted" style={{ letterSpacing: '0.5px' }}>Objetivo</h5>
            <p className="mb-0 objective-label">{getObjectiveLabel(user.objective)}</p>
          </Card.Body>
        </Card>
      )}

      {totalPlanified > 0 && (
        <>
          <Card className="mb-4 border-0 shadow-sm overflow-hidden motivation-card">
            <Card.Body className="py-4 px-4">
              <Row className="align-items-center g-4">
                <Col md="auto" className="text-center">
                  <div className="motivation-ring">
                    <svg viewBox="0 0 36 36">
                      <defs>
                        <linearGradient id="motivationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#16a34a" />
                          <stop offset="100%" stopColor="var(--accent)" />
                        </linearGradient>
                      </defs>
                      <path className="motivation-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <path className="motivation-fill" stroke="url(#motivationGrad)" style={{ strokeDasharray: `${adherencePercent}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div className="motivation-percent">{adherencePercent}%</div>
                  </div>
                </Col>
                <Col>
                  <h4 className="mb-1">{motivation.emoji} {motivation.text}</h4>
                  <p className="text-muted mb-0">{motivation.sub}</p>
                  <p className="small text-muted mt-1 mb-0">
                    {dueCount > 0 ? `De ${dueCount} entrenamiento${dueCount !== 1 ? 's' : ''} de esta semana, completaste ${completedCount}` : totalPlanified > 0 ? `${totalPlanified} planificados esta semana` : 'De tus entrenamientos planificados'}
                  </p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4 border-0 shadow-sm overflow-hidden balance-stats">
            <Card.Body className="p-0">
              <div className="balance-inner">
                <div className="balance-item balance-completed">
                  <div className="balance-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg></div>
                  <div className="balance-content"><span className="balance-value">{completedCount}</span><span className="balance-label">Completadas</span></div>
                </div>
                <div className="balance-divider" />
                <div className="balance-item balance-incomplete">
                  <div className="balance-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div>
                  <div className="balance-content"><span className="balance-value">{incompleteCount}</span><span className="balance-label">Incompletas</span></div>
                </div>
                <div className="balance-divider" />
                <div className="balance-item balance-total">
                  <div className="balance-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                  <div className="balance-content"><span className="balance-value">{totalPlanified}</span><span className="balance-label">Total esta semana</span></div>
                </div>
              </div>
              <div className="balance-progress"><div className="balance-progress-bar" style={{ width: totalPlanified ? `${adherencePercent}%` : '0%' }} /></div>
            </Card.Body>
          </Card>
        </>
      )}

      {totalPlanified === 0 && (
        <Card className="mb-4 border-0 shadow-sm motivation-empty">
          <Card.Body className="text-center py-5">
            <div className="motivation-ring motivation-ring-sm mb-3"><span className="motivation-percent">0%</span></div>
            <h5 className="mb-2">⭐ ¡Tu momento es ahora!</h5>
            <p className="text-muted mb-0">Tu coach te asignará entrenamientos pronto. Cuando los tengas, ¡a darle!</p>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4 border-0 shadow-sm summary-card">
        <Card.Header className="bg-white border-bottom py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">📊 Resumen de esta semana</h5>
          <span className="small text-muted">{weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col xs={6} md={3}>
              <div className="summary-stat">
                <div className="summary-value text-warning">🔥 {totalCaloriesBurned.toLocaleString()}</div>
                <div className="summary-label">kcal esta semana</div>
                <div className="summary-hint">(estimadas)</div>
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="summary-stat">
                <div className={`summary-value ${diffPeso != null && parseFloat(diffPeso) < 0 ? 'text-success' : diffPeso != null && parseFloat(diffPeso) > 0 ? 'text-warning' : ''}`}>
                  {pesoActual != null ? `${pesoActual} kg` : '—'}
                </div>
                <div className="summary-label">Peso actual</div>
                {diffPeso != null && sortedWeight.length > 1 && (
                  <div className="summary-hint">
                    {parseFloat(diffPeso) < 0 ? `↓ ${Math.abs(parseFloat(diffPeso))} kg desde inicio` : parseFloat(diffPeso) > 0 ? `↑ ${diffPeso} kg desde inicio` : 'Sin cambio'}
                  </div>
                )}
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="summary-stat">
                <div className="summary-value text-primary">{completedCount}</div>
                <div className="summary-label">Sesiones completadas</div>
                {totalPlanified > 0 && <div className="summary-hint">{totalPlanified} planificadas esta semana</div>}
              </div>
            </Col>
            <Col xs={6} md={3}>
              <div className="summary-stat">
                <div className="summary-value" style={{ color: 'var(--accent)' }}>⏱ {totalMinutesTrained}</div>
                <div className="summary-label">Minutos esta semana</div>
                {totalMinutesTrained > 0 && <div className="summary-hint">≈ {Math.round(totalMinutesTrained / 60)}h {totalMinutesTrained % 60}min</div>}
              </div>
            </Col>
          </Row>
          {totalCaloriesBurned > 0 && (
            <div className="summary-fun mt-3 pt-3 border-top small text-muted">
              ≈ Equivalente a {Math.round(totalCaloriesBurned / 250)} porciones de pizza o {Math.round(totalCaloriesBurned / 140)} donuts
            </div>
          )}
        </Card.Body>
      </Card>

      <Card as={Link} to="/cliente/calendario" className="mb-4 border-0 shadow-sm text-decoration-none text-dark cal-card-link">
        <Card.Body className="py-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="text-muted fs-6">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <Badge bg={statusVariant} className="fs-6 px-3 py-2">
                {dayStatus === 'completado' && '🟢'}
                {dayStatus === 'pendiente' && '🟡'}
                {dayStatus === 'descanso' && '🔵'}
                {' '}{statusLabel}
              </Badge>
              {todayWorkout && todayRoutine && <span className="text-muted">{todayRoutine.name}</span>}
            </div>
            <span className="text-primary">Ver calendario →</span>
          </div>
        </Card.Body>
      </Card>

      <style>{`
        .objective-card { border-radius: 16px; border: 1px solid #e2e8f0; }
        .objective-label { font-size: 1.1rem; font-weight: 600; color: var(--dark); }
        .cal-card-link:hover { background: #f8fafc; }
        .balance-stats { border-radius: 16px; overflow: hidden; }
        .balance-inner { display: flex; align-items: stretch; flex-wrap: wrap; }
        .balance-item { flex: 1; min-width: 140px; display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; }
        .balance-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .balance-completed .balance-icon { background: linear-gradient(135deg, rgba(22, 163, 74, 0.15) 0%, rgba(22, 163, 74, 0.08) 100%); color: #16a34a; }
        .balance-incomplete .balance-icon { background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%); color: #dc2626; }
        .balance-total .balance-icon { background: linear-gradient(135deg, rgba(0, 184, 148, 0.15) 0%, rgba(0, 184, 148, 0.08) 100%); color: var(--accent); }
        .balance-content { display: flex; flex-direction: column; gap: 0.15rem; }
        .balance-value { font-size: 1.75rem; font-weight: 700; font-family: var(--font-display); letter-spacing: -0.5px; line-height: 1; }
        .balance-completed .balance-value { color: #16a34a; }
        .balance-incomplete .balance-value { color: #dc2626; }
        .balance-total .balance-value { color: var(--dark); }
        .balance-label { font-size: 0.8rem; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .balance-divider { width: 1px; background: linear-gradient(180deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent); min-height: 50px; align-self: center; }
        .balance-progress { height: 4px; background: #f1f5f9; overflow: hidden; }
        .balance-progress-bar { height: 100%; background: linear-gradient(90deg, #16a34a 0%, var(--accent) 100%); border-radius: 0 2px 2px 0; transition: width 0.4s ease; }
        @media (max-width: 768px) { .balance-divider { display: none; } .balance-item { min-width: 100%; border-bottom: 1px solid #f1f5f9; } .balance-item:last-of-type { border-bottom: none; } }
        .motivation-card { border-radius: 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; }
        .motivation-ring { position: relative; width: 100px; height: 100px; }
        .motivation-ring svg { transform: rotate(-90deg); width: 100%; height: 100%; }
        .motivation-ring .motivation-bg { fill: none; stroke: #e2e8f0; stroke-width: 3; }
        .motivation-ring .motivation-fill { fill: none; stroke-width: 3; stroke-linecap: round; transition: stroke-dasharray 0.6s ease-out; }
        .motivation-ring .motivation-percent { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 800; font-family: var(--font-display); color: var(--dark); }
        .motivation-ring-sm { width: 80px; height: 80px; margin: 0 auto; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; }
        .motivation-ring-sm .motivation-percent { position: static; font-size: 1rem; }
        .motivation-empty { border-radius: 16px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
        .summary-card { border-radius: 16px; }
        .summary-stat { padding: 0.5rem 0; }
        .summary-value { font-size: 1.35rem; font-weight: 800; font-family: var(--font-display); letter-spacing: -0.5px; line-height: 1.2; }
        .summary-label { font-size: 0.8rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 0.15rem; }
        .summary-hint { font-size: 0.75rem; color: #94a3b8; margin-top: 0.1rem; }
        .summary-fun { font-style: italic; }
      `}</style>
    </div>
  );
}
