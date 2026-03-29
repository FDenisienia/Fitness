import React, { useMemo, useState } from 'react';
import { Card, Badge, Modal, Button, Form } from 'react-bootstrap';
import { clientDisplayName, getInitials, clientDisplay } from '../utils/clientDisplay';

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

/** Abreviaturas: estimulo de rutina (prioridad) u objetivo */
const ESTIMULO_ABBREV = {
  fuerza: 'F',
  resistencia: 'R',
  'quema de grasa': 'Q',
  mixto: 'X'
};

const OBJECTIVE_ABBREV = {
  'pérdida de peso': 'P',
  fuerza: 'F',
  hipertrofia: 'H',
  resistencia: 'R',
  movilidad: 'M',
  personalizado: 'Pe'
};

function getWorkoutAbbrev(routine) {
  if (!routine) return null;
  const e = (routine.estimulo || '').toLowerCase();
  const o = (routine.objective || '').toLowerCase();
  return ESTIMULO_ABBREV[e] || OBJECTIVE_ABBREV[o] || null;
}

function getDaysInMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days = last.getDate();
  const prevMonthLast = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ day: prevMonthLast - startPad + i + 1, current: false });
  }
  for (let d = 1; d <= days; d++) {
    cells.push({ day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let r = 1; r <= remaining; r++) {
    cells.push({ day: r, current: false });
  }
  return cells;
}

function formatDate(year, month, day) {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/** Parsea YYYY-MM-DD como fecha local (evita desfase por UTC) */
function parseDateLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const levelLabel = (l) => ({ principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }[l] || l);

export default function Calendar({
  plannedWorkouts = [],
  routines = [],
  clients,
  onSelectDay,
  onWorkoutClick,
  onWorkoutComplete,
  onMarkComplete,
  onDeleteWorkout,
  onRescheduleWorkout,
  mode = 'view',
  allowMarkComplete = false,
}) {
  const today = new Date();
  const [viewDate, setViewDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [workoutToComplete, setWorkoutToComplete] = useState(null);
  const [completeForm, setCompleteForm] = useState({ rpe: 5, feedback: '' });
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  /** Coach modal: fila alumno desplegada → muestra rutina y acciones (por planned workout id) */
  const [alumnoDetailOpen, setAlumnoDetailOpen] = useState({});

  const year = viewDate.year;
  const month = viewDate.month;
  const cells = getDaysInMonth(year, month);

  const prevMonth = () => {
    if (month === 0) setViewDate({ year: year - 1, month: 11 });
    else setViewDate({ year, month: month - 1 });
  };

  const nextMonth = () => {
    if (month === 11) setViewDate({ year: year + 1, month: 0 });
    else setViewDate({ year, month: month + 1 });
  };

  const toDateStr = (d) => {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  };
  const workoutsByDate = {};
  plannedWorkouts.forEach(pw => {
    const key = toDateStr(pw.date);
    if (!key) return;
    if (!workoutsByDate[key]) workoutsByDate[key] = [];
    workoutsByDate[key].push(pw);
  });

  const todayStr = today.toISOString().split('T')[0];

  const handleDayClick = (cell) => {
    if (!cell.current) return;
    const dateStr = formatDate(year, month, cell.day);
    setSelectedDate(dateStr);
    setShowModal(true);
    onSelectDay?.(dateStr, workoutsByDate[dateStr] || []);
  };

  const dayWorkouts = selectedDate ? (workoutsByDate[selectedDate] || []) : [];

  const coachDayModal = clients !== undefined;
  const clientById = useMemo(() => {
    if (!clients?.length) return {};
    return Object.fromEntries(clients.map((c) => [c.id, c]));
  }, [clients]);

  const getClient = (clientId) => clientById[clientId] || null;

  const handleMarkComplete = (pw, e) => {
    e?.stopPropagation?.();
    setWorkoutToComplete(pw);
    setCompleteForm({ rpe: 5, feedback: '' });
    setShowCompleteModal(true);
  };

  const confirmMarkComplete = async () => {
    if (!workoutToComplete) return;
    if (onMarkComplete) {
      await onMarkComplete(workoutToComplete, { rpe: completeForm.rpe, feedback: completeForm.feedback });
    }
    setShowCompleteModal(false);
    setWorkoutToComplete(null);
    onWorkoutComplete?.();
  };

  return (
    <>
      <Card className="calendar-card border-0 shadow-sm">
        <Card.Body className="p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 fw-semibold text-dark">{MONTHS[month]} {year}</h5>
            <div className="d-flex gap-1">
              <Button variant="outline-secondary" size="sm" className="calendar-nav-btn" onClick={prevMonth} aria-label="Mes anterior">‹</Button>
              <Button variant="outline-secondary" size="sm" className="calendar-nav-btn" onClick={nextMonth} aria-label="Mes siguiente">›</Button>
            </div>
          </div>
          <div className="calendar-grid">
            {WEEKDAYS.map(w => (
              <div key={w} className="calendar-header">{w}</div>
            ))}
            {cells.map((cell, i) => {
              const dateStr = cell.current ? formatDate(year, month, cell.day) : null;
              const workouts = dateStr ? (workoutsByDate[dateStr] || []) : [];
              const anyCompleted = workouts.some(pw => pw.completed);
              const allPending = workouts.length > 0 && workouts.every(pw => !pw.completed);
              const isPast = dateStr && dateStr < todayStr;
              let statusClass = 'rest';
              if (workouts.length > 0) {
                if (anyCompleted) statusClass = 'completed';
                else if (allPending && isPast) statusClass = 'incomplete';
                else statusClass = 'pending';
              }
              const isToday = cell.current && dateStr === todayStr;
              const abbrevs = [...new Set(
                workouts
                  .map(pw => routines.find(r => r.id === pw.routineId))
                  .filter(Boolean)
                  .map(getWorkoutAbbrev)
                  .filter(Boolean)
              )];
              return (
                <div
                  key={i}
                  className={`calendar-cell ${!cell.current ? 'other-month' : ''} ${isToday ? 'today' : ''} cell-${statusClass}`}
                  onClick={() => handleDayClick(cell)}
                >
                  <span className="day-num">{cell.day}</span>
                  {abbrevs.length > 0 && (
                    <span className="day-abbrev" title={abbrevs.join(', ')}>{abbrevs.join(' ')}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="calendar-legend">
            <span className="legend-item"><b>F</b> Fuerza</span>
            <span className="legend-item"><b>R</b> Resistencia</span>
            <span className="legend-item"><b>H</b> Hipertrofia</span>
            <span className="legend-item"><b>Q</b> Quema de grasa</span>
            <span className="legend-item"><b>X</b> Mixto</span>
            <span className="legend-item"><b>P</b> Pérdida de peso</span>
            <span className="legend-item"><b>M</b> Movilidad</span>
            <span className="legend-item"><b>Pe</b> Personalizado</span>
          </div>
        </Card.Body>
      </Card>

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setRescheduleId(null);
          setAlumnoDetailOpen({});
        }}
        centered
        dialogClassName={coachDayModal ? 'coach-calendar-day-dialog' : undefined}
        contentClassName={coachDayModal ? 'coach-calendar-day-content' : undefined}
        className={coachDayModal ? 'coach-calendar-day-modal' : undefined}
      >
        <Modal.Header closeButton className={coachDayModal ? 'coach-calendar-day-header' : undefined}>
          <div className="w-100">
            <Modal.Title as="div" className={coachDayModal ? 'coach-calendar-day-title' : undefined}>
              {selectedDate && parseDateLocal(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Modal.Title>
            {coachDayModal && selectedDate && (
              <p className="coach-calendar-day-subtitle mb-0 mt-1">
                {dayWorkouts.length === 0
                  ? 'No hay entrenamientos planificados. Podés agregar uno abajo.'
                  : (() => {
                      const nAlumnos = new Set(dayWorkouts.map((w) => w.clientId)).size;
                      return `${dayWorkouts.length} entrenamiento${dayWorkouts.length !== 1 ? 's' : ''} · ${nAlumnos} alumno${nAlumnos !== 1 ? 's' : ''}`;
                    })()}
              </p>
            )}
          </div>
        </Modal.Header>
        <Modal.Body className={coachDayModal ? 'coach-calendar-day-body' : undefined}>
          {dayWorkouts.length === 0 ? (
            <p className={coachDayModal ? 'coach-calendar-day-empty mb-0' : 'text-muted mb-0'}>
              {coachDayModal ? 'Este día está libre. Usá «Añadir entrenamiento» para asignar rutina y alumno.' : 'Sin entrenamientos planificados.'}
            </p>
          ) : coachDayModal ? (
            <div className="d-flex flex-column gap-3">
              {dayWorkouts.map((pw) => {
                const routine = routines.find((r) => r.id === pw.routineId);
                const client = getClient(pw.clientId);
                const disp = client ? clientDisplay(client) : { name: '', lastName: '' };
                const initials = getInitials(disp.name, disp.lastName);
                const alumnoNombre = client ? clientDisplayName(client) : 'Alumno';
                const alumnoOpen = !!alumnoDetailOpen[pw.id];
                return (
                  <div key={pw.id} className="coach-day-entreno">
                    <div className="coach-day-entreno__client-block">
                      <div className="coach-day-entreno__client">
                        <div className="coach-day-entreno__avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div className="coach-day-entreno__client-topline">
                          <span className="coach-day-entreno__alumno-name">{alumnoNombre}</span>
                          <button
                            type="button"
                            className="coach-day-entreno__expand"
                            onClick={() => {
                              setAlumnoDetailOpen((prev) => {
                                const wasOpen = !!prev[pw.id];
                                if (wasOpen) {
                                  setRescheduleId((rid) => (rid === pw.id ? null : rid));
                                }
                                return { ...prev, [pw.id]: !wasOpen };
                              });
                            }}
                            aria-expanded={alumnoOpen}
                            aria-label={
                              alumnoOpen
                                ? 'Ocultar rutina y acciones'
                                : 'Ver rutina, estado, notas y acciones'
                            }
                          >
                            <span className={`coach-day-entreno__expand-icon ${alumnoOpen ? 'coach-day-entreno__expand-icon--open' : ''}`} aria-hidden="true">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      </div>
                      {alumnoOpen && (
                        <div className="coach-day-entreno__client-detail" id={`coach-alumno-detail-${pw.id}`}>
                          <div className="coach-day-entreno__routine-expanded-head">
                            <span className="coach-day-entreno__kicker">Rutina</span>
                            <strong className="coach-day-entreno__routine-name">{routine?.name || 'Rutina'}</strong>
                          </div>
                          <div className="coach-day-entreno__badges">
                            {routine?.objective && (
                              <span className="coach-day-badge">{routine.objective.charAt(0).toUpperCase() + routine.objective.slice(1)}</span>
                            )}
                            {routine?.level && <span className="coach-day-badge">{levelLabel(routine.level)}</span>}
                            {(routine?.stimulus || routine?.estimulo) && (
                              <span className="coach-day-badge coach-day-badge--accent">
                                {(routine.stimulus || routine.estimulo).charAt(0).toUpperCase() + (routine.stimulus || routine.estimulo).slice(1)}
                              </span>
                            )}
                            {routine?.durationMinutes != null && (
                              <span className="coach-day-badge">~{routine.durationMinutes} min</span>
                            )}
                          </div>
                          {pw.completed ? (
                            <Badge bg="success" className="mt-2 align-self-start">Completado</Badge>
                          ) : (
                            <span className="coach-day-entreno__pendiente mt-1">Pendiente</span>
                          )}

                          {pw.notes && (
                            <div className="coach-day-entreno__notes coach-day-entreno__notes--in-routine">
                              <span className="coach-day-entreno__kicker">Notas</span>
                              <p className="mb-0">{pw.notes}</p>
                            </div>
                          )}

                          {!pw.completed && (
                            <div className="coach-day-entreno__actions">
                              {allowMarkComplete && (
                                <Button variant="success" size="sm" onClick={() => handleMarkComplete(pw)}>
                                  Marcar completado
                                </Button>
                              )}
                              {typeof onRescheduleWorkout === 'function' && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="coach-day-btn-outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (rescheduleId === pw.id) {
                                      setRescheduleId(null);
                                    } else {
                                      setRescheduleId(pw.id);
                                      setRescheduleDate(toDateStr(pw.date));
                                    }
                                  }}
                                >
                                  {rescheduleId === pw.id ? 'Cancelar' : 'Cambiar fecha'}
                                </Button>
                              )}
                              {typeof onDeleteWorkout === 'function' && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteWorkout(pw);
                                  }}
                                >
                                  Quitar del calendario
                                </Button>
                              )}
                              <Button variant="outline-primary" size="sm" className="coach-day-btn-outline" onClick={() => onWorkoutClick?.(pw, routine)}>
                                Ver rutina
                              </Button>
                            </div>
                          )}

                          {typeof onRescheduleWorkout === 'function' && !pw.completed && rescheduleId === pw.id && (
                            <div className="coach-day-entreno__reschedule">
                              <Form.Label className="coach-day-entreno__kicker d-block mb-2">Nueva fecha</Form.Label>
                              <div className="d-flex flex-wrap gap-2 align-items-center">
                                <Form.Control
                                  type="date"
                                  className="coach-day-date-input"
                                  value={rescheduleDate}
                                  onChange={(e) => setRescheduleDate(e.target.value)}
                                />
                                <Button
                                  size="sm"
                                  className="btn-primary"
                                  disabled={!rescheduleDate}
                                  onClick={async () => {
                                    try {
                                      await onRescheduleWorkout(pw, rescheduleDate);
                                      setRescheduleId(null);
                                      setShowModal(false);
                                    } catch {
                                      /* error o validación ya mostrados en el padre */
                                    }
                                  }}
                                >
                                  Guardar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {dayWorkouts.map((pw) => {
                const routine = routines.find((r) => r.id === pw.routineId);
                return (
                  <Card key={pw.id} className="border-0 bg-light">
                    <Card.Body className="py-3">
                      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                        <div className="flex-grow-1">
                          <strong>{routine?.name || 'Rutina'}</strong>
                          {pw.notes && <div className="small text-muted">{pw.notes}</div>}
                        </div>
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                          {pw.completed ? (
                            <Badge bg="success">Completado</Badge>
                          ) : (
                            <>
                              {allowMarkComplete && (
                                <Button variant="success" size="sm" onClick={() => handleMarkComplete(pw)}>
                                  Marcar completado
                                </Button>
                              )}
                              {typeof onRescheduleWorkout === 'function' && (
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (rescheduleId === pw.id) {
                                      setRescheduleId(null);
                                    } else {
                                      setRescheduleId(pw.id);
                                      setRescheduleDate(toDateStr(pw.date));
                                    }
                                  }}
                                >
                                  {rescheduleId === pw.id ? 'Cancelar' : 'Cambiar fecha'}
                                </Button>
                              )}
                              {typeof onDeleteWorkout === 'function' && (
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteWorkout(pw);
                                  }}
                                >
                                  Quitar del calendario
                                </Button>
                              )}
                              <Button variant="outline-primary" size="sm" onClick={() => onWorkoutClick?.(pw, routine)}>
                                Ver rutina
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {typeof onRescheduleWorkout === 'function' && !pw.completed && rescheduleId === pw.id && (
                        <div className="mt-3 pt-3 border-top">
                          <Form.Label className="small text-muted mb-1">Nueva fecha</Form.Label>
                          <div className="d-flex flex-wrap gap-2 align-items-center">
                            <Form.Control
                              type="date"
                              className="flex-grow-1"
                              style={{ maxWidth: 200 }}
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                            />
                            <Button
                              size="sm"
                              className="btn-primary"
                              disabled={!rescheduleDate}
                              onClick={async () => {
                                try {
                                  await onRescheduleWorkout(pw, rescheduleDate);
                                  setRescheduleId(null);
                                  setShowModal(false);
                                } catch {
                                  /* error o validación ya mostrados en el padre */
                                }
                              }}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Modal.Body>
        {mode === 'plan' && onSelectDay && (
          <Modal.Footer className={coachDayModal ? 'coach-calendar-day-footer' : undefined}>
            <Button
              className={coachDayModal ? 'coach-calendar-day-footer-btn' : undefined}
              variant={coachDayModal ? 'primary' : 'outline-primary'}
              size="sm"
              onClick={() => {
                setShowModal(false);
                onSelectDay?.(selectedDate, dayWorkouts, true);
              }}
            >
              Añadir entrenamiento
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Confirmar entrenamiento completado</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>RPE - Esfuerzo percibido (1-10)</Form.Label>
            <Form.Control type="number" min={1} max={10} value={completeForm.rpe} onChange={e => setCompleteForm(f => ({ ...f, rpe: e.target.value }))} />
            <Form.Text className="text-muted">1 = muy fácil, 10 = máximo esfuerzo</Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Label>Notas (opcional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={completeForm.feedback} onChange={e => setCompleteForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Cómo te sentiste, notas para tu coach..." />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>Cancelar</Button>
          <Button variant="success" onClick={confirmMarkComplete}>Confirmar</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .calendar-header { font-size: 0.7rem; color: #64748b; font-weight: 600; text-align: center; padding: 0.4rem; letter-spacing: 0.3px; text-transform: uppercase; }
        .calendar-cell {
          min-height: 80px; border-radius: 12px; padding: 10px 6px;
          cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 4px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        @media (max-width: 639px) {
          .calendar-cell {
            min-height: 0; aspect-ratio: 1; padding: 4px 2px;
            justify-content: center; gap: 0;
          }
          .calendar-cell .day-num { font-size: 0.7rem; }
          .calendar-cell .day-abbrev { font-size: 0.55rem; font-weight: 600; line-height: 1; margin-top: 1px; }
        }
        .calendar-cell:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .calendar-cell.other-month { opacity: 0.45; }
        .calendar-cell.cell-rest { background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b; }
        .calendar-cell.cell-completed {
          background: linear-gradient(160deg, #0d9488 0%, #0f766e 100%);
          color: white; font-weight: 600; border: none;
          box-shadow: 0 2px 8px rgba(13,148,136,0.25);
        }
        .calendar-cell.cell-pending {
          background: linear-gradient(160deg, #fbbf24 0%, #f59e0b 100%);
          color: #1c1917; font-weight: 600; border: none;
          box-shadow: 0 2px 8px rgba(251,191,36,0.3);
        }
        .calendar-cell.cell-incomplete {
          background: linear-gradient(160deg, #ef4444 0%, #dc2626 100%);
          color: white; font-weight: 600; border: none;
          box-shadow: 0 2px 8px rgba(239,68,68,0.25);
        }
        .calendar-cell.today { box-shadow: 0 0 0 2px var(--accent); }
        .calendar-nav-btn { border-radius: 8px; min-width: 36px; font-weight: 600; }
        .day-num { font-size: 0.95rem; font-weight: 700; line-height: 1; letter-spacing: -0.3px; flex-shrink: 0; }
        .day-abbrev {
          font-size: 1rem; font-weight: 700; letter-spacing: 0.5px;
          line-height: 1.2; margin-top: 2px;
        }
        .calendar-cell.cell-rest .day-num { color: #475569; }
        .calendar-cell.cell-rest .day-abbrev { color: #64748b; }
        .calendar-cell.cell-pending .day-abbrev { color: #1c1917; }
        .calendar-legend {
          display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin-top: 1rem; padding-top: 1rem;
          border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #64748b;
        }
        .calendar-legend .legend-item { display: flex; align-items: center; gap: 0.25rem; }
        .calendar-legend .legend-item b { color: #334155; font-weight: 700; }
      `}</style>
    </>
  );
}
