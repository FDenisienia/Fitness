import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../context/PlanContext';
import { clientsApi, routinesApi, plannedWorkoutsApi, weightLogsApi } from '../../api';
import { clientDisplay, getInitials } from '../../utils/clientDisplay';

function IconUsers() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function IconRoutines() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>; }
function IconWorkout() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6.5 6.5h11" /><path d="M6.5 12h11" /><path d="M6.5 17.5h11" /><path d="M3 6.5v11" /><path d="M21 6.5v11" /><circle cx="12" cy="12" r="3" /></svg>; }
function IconMessage() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>; }
function IconCalendar() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>; }
function IconPlus() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>; }
function IconUserPlus() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>; }
function IconBell() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>; }

export default function CoachDashboard() {
  const { user } = useAuth();
  const plan = usePlan();
  const [clients, setClients] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState([]);
  const [weightRecords, setWeightRecords] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [clientsRes, routinesRes] = await Promise.all([clientsApi.list(), routinesApi.list()]);
        const cList = clientsRes.data || [];
        setClients(cList);
        setRoutines(routinesRes.data || []);

        const clientDataPromises = cList.map((c) =>
          Promise.all([
            plannedWorkoutsApi.listByClient(c.id).catch(() => ({ data: [] })),
            weightLogsApi.listByClient(c.id).catch(() => ({ data: [] })),
          ]).then(([pw, wr]) => ({ id: c.id, pw: pw.data || [], wr: wr.data || [] }))
        );
        const clientData = await Promise.all(clientDataPromises);
        const allPw = clientData.flatMap((d) => d.pw);
        const wrMap = Object.fromEntries(clientData.map((d) => [d.id, d.wr]));
        setPlannedWorkouts(allPw);
        setWeightRecords(wrMap);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const myWorkouts = useMemo(() =>
    plannedWorkouts.filter(pw => clients.some(c => c.id === pw.clientId)),
    [plannedWorkouts, clients]
  );
  const todayWorkouts = useMemo(() =>
    myWorkouts.filter(w => (w.date && String(w.date).slice(0, 10)) === todayStr),
    [myWorkouts, todayStr]
  );
  const completedToday = useMemo(() => todayWorkouts.filter(w => w.completed).length, [todayWorkouts]);
  const activeRoutinesCount = useMemo(() => routines.filter(r => r.status === 'activa').length, [routines]);

  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  }, []);
  const alumnosConWorkoutEstaSemana = useMemo(() => {
    const completedByClient = {};
    myWorkouts.filter(w => w.completed && String(w.completedAt || '').slice(0, 10) >= weekAgo).forEach(w => {
      completedByClient[w.clientId] = true;
    });
    return Object.keys(completedByClient).length;
  }, [myWorkouts, weekAgo]);
  const coachPerformance = clients.length > 0 ? Math.round((alumnosConWorkoutEstaSemana / clients.length) * 100) : 0;

  const alumnosDelDia = useMemo(() => {
    return clients.map(client => {
      const todayW = todayWorkouts.find(w => w.clientId === client.id);
      const lastWorkout = myWorkouts
        .filter(w => w.clientId === client.id && w.completed)
        .sort((a, b) => (String(b.completedAt || '')).localeCompare(String(a.completedAt || '')))[0];
      let status = 'inactive';
      if (todayW) status = todayW.completed ? 'completed' : 'pending';
      const d = clientDisplay(client);
      return {
        ...client,
        name: d.name,
        lastName: d.lastName,
        status,
        lastActivity: lastWorkout?.completedAt || null,
        todayWorkout: todayW,
      };
    });
  }, [clients, todayWorkouts, myWorkouts]);

  const activityFeed = useMemo(() => {
    const feed = [];
    clients.forEach(client => {
      const lastCompleted = myWorkouts
        .filter(w => w.clientId === client.id && w.completed)
        .sort((a, b) => (String(b.completedAt || '')).localeCompare(String(a.completedAt || '')))[0];
      if (lastCompleted) {
        const lastDate = new Date(lastCompleted.completedAt);
        const daysSince = Math.floor((new Date() - lastDate) / 86400000);
        if (daysSince >= 3) {
          const d = clientDisplay(client);
          feed.push({ type: 'alert', text: `${d.name} no entrena hace ${daysSince} días`, time: lastCompleted.completedAt, clientId: client.id });
        }
      }
    });
    Object.entries(weightRecords).forEach(([clientId, recs]) => {
      const sorted = [...(recs || [])].sort((a, b) => (String(b.fecha || b.loggedAt || '')).localeCompare(String(a.fecha || a.loggedAt || '')));
      const client = clients.find(c => c.id === clientId);
      if (!client || !sorted[0]) return;
      const prev = sorted[1];
      if (prev && parseFloat(sorted[0].peso || sorted[0].weight) < parseFloat(prev.peso || prev.weight)) {
        const d = clientDisplay(client);
        feed.push({ type: 'success', text: `${d.name} registra avance en peso`, time: sorted[0].fecha || sorted[0].loggedAt, clientId });
      }
    });
    return feed.sort((a, b) => (String(b.time || '')).localeCompare(String(a.time || ''))).slice(0, 6);
  }, [clients, myWorkouts, weightRecords]);

  const maxDisplay = plan?.maxAlumnos === 999 ? '∞' : (plan?.maxAlumnos ?? 10);

  if (loading) {
    return <div className="d-flex justify-content-center py-5"><div className="spinner-border" /></div>;
  }

  return (
    <div className="coach-dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-left">
          <h1>Hola, {user?.name}</h1>
          <p className="subtitle">Resumen de tu actividad como coach</p>
        </div>
        <div className="dashboard-header-right">
          <Link to="/coach/consultas" className="dashboard-icon-btn"><IconMessage /></Link>
          <div className="dashboard-avatar" style={{ background: 'var(--orange)' }}>
            {getInitials(user?.name, user?.lastName)}
          </div>
        </div>
      </header>

      {clients.length > 0 && (
        <div className="coach-performance-badge">
          <span>📈 Rendimiento esta semana:</span>
          <strong>{coachPerformance}%</strong>
          <span>de alumnos activos</span>
        </div>
      )}

      <div className="dashboard-quick-actions">
        <Link to="/coach/rutinas" className="quick-action-btn"><IconPlus /> Crear rutina</Link>
        <Link to="/coach/alumnos" className="quick-action-btn"><IconUserPlus /> Asignar alumno</Link>
        <Link to="/coach/consultas" className="quick-action-btn"><IconMessage /> Enviar mensaje</Link>
        <Link to="/coach/calendario" className="quick-action-btn"><IconCalendar /> Ver calendario</Link>
      </div>

      <div className="dashboard-kpis kpis-grid">
        <Link to="/coach/alumnos" className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-icon-wrap kpi-users"><IconUsers /></div>
            <div>
              <div className="kpi-value">{clients.length}</div>
              <div className="kpi-label">Alumnos activos</div>
              <div className="kpi-micro">de {maxDisplay} máx.</div>
            </div>
          </div>
        </Link>
        <Link to="/coach/rutinas" className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-icon-wrap kpi-routines"><IconRoutines /></div>
            <div>
              <div className="kpi-value">{activeRoutinesCount}</div>
              <div className="kpi-label">Rutinas activas</div>
              <div className="kpi-micro">{routines.length} total</div>
            </div>
          </div>
        </Link>
        <Link to="/coach/calendario" className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-icon-wrap kpi-workouts"><IconWorkout /></div>
            <div>
              <div className="kpi-value">{todayWorkouts.length}</div>
              <div className="kpi-label">Entrenamientos de hoy</div>
              <div className="kpi-micro">{completedToday} completados</div>
            </div>
          </div>
        </Link>
        <Link to="/coach/consultas" className="kpi-card">
          <div className="kpi-card-inner">
            <div className="kpi-icon-wrap kpi-messages"><IconMessage /></div>
            <div>
              <div className="kpi-value">0</div>
              <div className="kpi-label">Mensajes sin responder</div>
              <div className="kpi-micro">Al día</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-panel">
          <div className="dashboard-panel-header">Alumnos del día</div>
          <div className="dashboard-panel-body">
            {alumnosDelDia.length === 0 ? (
              <div className="dashboard-empty">Aún no tienes alumnos.</div>
            ) : (
              alumnosDelDia.map(alumno => (
                <div key={alumno.id} className="alumno-card">
                  <div className="alumno-avatar">{getInitials(alumno.name, alumno.lastName)}</div>
                  <div className="alumno-info">
                    <div className="alumno-name">{alumno.name} {alumno.lastName}</div>
                    <div className="alumno-meta">
                      <span className={`alumno-status-dot ${alumno.status}`} />
                      <span>{alumno.objective || 'Sin objetivo'}</span>
                      <span>•</span>
                      <span>
                        {alumno.status === 'completed' && '✓ Completado'}
                        {alumno.status === 'pending' && '⏳ Pendiente'}
                        {alumno.status === 'inactive' && 'Sin sesión hoy'}
                      </span>
                      {alumno.lastActivity && <><span>•</span><span>Última actividad: {String(alumno.lastActivity).slice(0, 10)}</span></>}
                    </div>
                  </div>
                  <div className="alumno-actions">
                    <Link to={`/coach/alumnos/${alumno.id}`} className="alumno-action-btn" title="Ver perfil"><IconRoutines /></Link>
                    <Link to="/coach/consultas" className="alumno-action-btn" title="Enviar mensaje"><IconMessage /></Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">Actividad</div>
          <div className="dashboard-panel-body">
            {activityFeed.length === 0 ? (
              <div className="dashboard-empty">No hay actividad reciente.</div>
            ) : (
              activityFeed.map((item, idx) => (
                <Link key={idx} to={item.clientId ? `/coach/alumnos/${item.clientId}` : '/coach/consultas'} className="activity-item text-decoration-none">
                  <div className={`activity-icon ${item.type}`}>
                    {item.type === 'alert' && <IconBell />}
                    {item.type === 'success' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <div className="activity-content">
                    <div className="activity-text">{item.text}</div>
                    <div className="activity-time">{String(item.time || '').slice(0, 10)}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link to="/coach/consultas" className="panel-footer-link">Ver mensajes</Link>
        </div>
      </div>
    </div>
  );
}
