import React, { useState, useMemo, useEffect } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import { useAuth } from '../context/AuthContext';
import { plannedWorkoutsApi } from '../api';
import { calcRoutineCalories } from '../utils/routineCalories';
import VideoCard from './VideoCard';

// Iconos SVG
const IconDays = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
  </svg>
);
const IconClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);
const IconLevel = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);
const IconSets = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
  </svg>
);
const IconReps = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);
const IconRest = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconFlame = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);
const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const IconInfo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Distribuye ejercicios en bloques por día según daysCount
function distributeExercisesByDays(exercises, daysCount) {
  if (!exercises?.length || !daysCount || daysCount < 1) return [{ day: 1, exercises }];
  const sorted = [...exercises].sort((a, b) => (a.order || 0) - (b.order || 0));
  const perDay = Math.ceil(sorted.length / daysCount);
  const result = [];
  for (let d = 0; d < daysCount; d++) {
    const start = d * perDay;
    const dayExercises = sorted.slice(start, start + perDay);
    if (dayExercises.length > 0) {
      result.push({ day: d + 1, exercises: dayExercises });
    }
  }
  return result.length ? result : [{ day: 1, exercises: sorted }];
}

const getLevelLabel = (l) => ({ principiante: 'Principiante', intermedio: 'Intermedio', avanzado: 'Avanzado' }[l] || l);

export default function RoutineDetail({ routine, clientName = null, showPdfButton = false, plannedWorkout = null, coachName = null }) {
  const { user } = useAuth();
  const displayClientName = clientName || (user?.role === 'cliente' ? `${user?.name} ${user?.lastName}` : null);

  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeForm, setCompleteForm] = useState({ rpe: 5, sensations: '', feedback: '' });
  const [markedComplete, setMarkedComplete] = useState(false);
  const [expandedSession, setExpandedSession] = useState(1);

  useEffect(() => {
    setExpandedSession(1);
  }, [routine?.id]);

  const exercises = (routine?.exercises || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  const dayBlocks = useMemo(() => distributeExercisesByDays(exercises, routine?.daysCount || 1), [exercises, routine?.daysCount]);
  const { total: totalKcal, byExercise } = calcRoutineCalories(routine, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(18);
    doc.text('Rutina de entrenamiento', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12);
    if (displayClientName) {
      doc.text(`Cliente: ${displayClientName}`, 20, y);
      y += 8;
    }
    if (coachName) {
      doc.text(`Coach: ${coachName}`, 20, y);
      y += 8;
    }

    doc.setFontSize(14);
    doc.text(routine.name, 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Objetivo: ${routine.objective} | Nivel: ${routine.level}`, 20, y);
    y += 6;
    doc.text(`Duración: ~${routine.durationMinutes} min`, 20, y);
    y += 12;

    if (routine.description) {
      doc.text('Descripción:', 20, y);
      y += 6;
      const splitDesc = doc.splitTextToSize(routine.description, pageWidth - 40);
      doc.text(splitDesc, 20, y);
      y += splitDesc.length * 5 + 8;
    }

    doc.setFontSize(12);
    doc.text('Ejercicios', 20, y);
    y += 10;

    exercises.forEach((ex, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${i + 1}. ${ex.name}`, 20, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      doc.text(`  Series: ${ex.sets} | Reps: ${ex.reps || '-'} | Descanso: ${ex.rest || '-'}`, 20, y);
      y += 6;
      if (ex.observations) {
        doc.text(`  Obs: ${ex.observations}`, 20, y);
        y += 6;
      }
      y += 4;
    });

    y += 8;
    if (routine.recommendations) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont(undefined, 'bold');
      doc.text('Recomendaciones:', 20, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      const splitRec = doc.splitTextToSize(routine.recommendations, pageWidth - 40);
      doc.text(splitRec, 20, y);
      y += splitRec.length * 5 + 6;
    }
    if (routine.warnings) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont(undefined, 'bold');
      doc.text('Advertencias:', 20, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      const splitWar = doc.splitTextToSize(routine.warnings, pageWidth - 40);
      doc.text(splitWar, 20, y);
    }

    doc.save(`Rutina-${routine.name.replace(/\s/g, '-')}.pdf`);
  };

  const handleMarkComplete = async () => {
    if (!plannedWorkout) return;
    try {
      await plannedWorkoutsApi.update(plannedWorkout.id, {
        completed: true,
        rpe: parseInt(completeForm.rpe) || null,
        sensations: completeForm.sensations || null,
        feedback: completeForm.feedback || null,
        clientNotes: completeForm.feedback || null,
      });
      setMarkedComplete(true);
      setShowCompleteModal(false);
    } catch (err) {
      alert(err.message || 'Error al registrar');
    }
  };

  if (!routine) return null;

  const getExerciseKcal = (ex) => {
    const idx = (routine.exercises || []).findIndex(e => (e.id && e.id === ex.id) || e.name === ex.name);
    return idx >= 0 ? (byExercise[idx]?.kcal ?? 0) : 0;
  };

  return (
    <div>
      {/* Hero Header */}
      <div className="routine-detail-hero">
        <div className="routine-detail-hero-content">
          <div className="routine-detail-category">
            {routine.objective?.charAt(0).toUpperCase() + routine.objective?.slice(1)} · {getLevelLabel(routine.level)}
          </div>
          <h1 className="routine-detail-title">{routine.name}</h1>
          {routine.description && (
            <p className="routine-detail-description">{routine.description}</p>
          )}
          <div className="routine-detail-stats">
            <div className="routine-detail-stat">
              <div className="routine-detail-stat-icon"><IconTarget /></div>
              <div>
                <span className="routine-detail-stat-value">
                  {routine.estimulo ? routine.estimulo.charAt(0).toUpperCase() + routine.estimulo.slice(1) : '—'}
                </span>
                <div className="routine-detail-stat-label">Tipo de entrenamiento</div>
              </div>
            </div>
            <div className="routine-detail-stat">
              <div className="routine-detail-stat-icon"><IconClock /></div>
              <div>
                <span className="routine-detail-stat-value">~{routine.durationMinutes || 45} min</span>
                <div className="routine-detail-stat-label">Duración</div>
              </div>
            </div>
            <div className="routine-detail-stat">
              <div className="routine-detail-stat-icon"><IconFlame /></div>
              <div>
                <span className="routine-detail-stat-value">{totalKcal > 0 ? `${totalKcal} kcal` : '—'}</span>
                <div className="routine-detail-stat-label">Gasto calórico</div>
              </div>
            </div>
          </div>
          <div className="routine-detail-badges">
            {routine.objective && (
              <span className="routine-detail-badge">
                {routine.objective.charAt(0).toUpperCase() + routine.objective.slice(1)}
              </span>
            )}
            <span className="routine-detail-badge">{getLevelLabel(routine.level)}</span>
            {routine.estimulo && (
              <span className="routine-detail-badge">
                {routine.estimulo.charAt(0).toUpperCase() + routine.estimulo.slice(1)}
              </span>
            )}
          </div>
          <div className="routine-detail-actions">
            {showPdfButton && (
              <Button onClick={downloadPDF} className="btn-primary fw-medium">
                Descargar PDF
              </Button>
            )}
            {plannedWorkout && !plannedWorkout.completed && !markedComplete && (
              <Button variant="success" onClick={() => setShowCompleteModal(true)}>
                Marcar como completado
              </Button>
            )}
            {(plannedWorkout?.completed || markedComplete) && (
              <span className="routine-detail-badge" style={{ background: 'rgba(16, 185, 129, 0.3)', color: '#fff' }}>
                <IconCheck style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                Completado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recomendaciones y advertencias */}
      {routine.recommendations && (
        <div className="routine-recommendations">
          <div className="routine-info-title"><IconCheck /> Recomendaciones</div>
          <p className="mb-0 routine-exercise-description">{routine.recommendations}</p>
        </div>
      )}
      {routine.warnings && (
        <div className="routine-warnings">
          <div className="routine-info-title"><IconAlert /> Advertencias</div>
          <p className="mb-0 routine-exercise-description">{routine.warnings}</p>
        </div>
      )}

      {/* Calorías */}
      {totalKcal > 0 && (
        <div className="routine-calories-card">
          <div className="d-flex align-items-center gap-2">
            <IconFlame />
            <strong>Gasto calórico estimado:</strong> {totalKcal} kcal total
          </div>
          {byExercise.filter(e => e.kcal > 0).length > 0 && (
            <div className="small mt-1 text-muted">
              Por ejercicio: {byExercise.filter(e => e.kcal > 0).map(e => `${e.name} (${e.kcal})`).join(' · ')}
            </div>
          )}
        </div>
      )}

      {/* Bloques por día - Acordeón: primera activa por defecto */}
      {dayBlocks.map(({ day, exercises: dayExs }) => {
        const isExpanded = expandedSession === day;
        return (
        <div key={day} className={`routine-day-block ${isExpanded ? 'routine-day-block--expanded' : ''}`}>
          <button
            type="button"
            className="routine-day-header routine-day-header-btn"
            onClick={() => setExpandedSession(prev => prev === day ? null : day)}
            aria-expanded={isExpanded}
          >
            <div className="routine-day-number">{day}</div>
            <div className="routine-day-header-text">
              <div className="routine-day-title">Sesión {day}</div>
              <div className="routine-day-subtitle">
                {dayExs.length} ejercicio{dayExs.length !== 1 ? 's' : ''} · ~{Math.round((routine.durationMinutes || 45) / (routine.daysCount || 1))} min
              </div>
            </div>
            <span className={`routine-day-chevron ${isExpanded ? 'routine-day-chevron--open' : ''}`}>
              <IconChevronDown />
            </span>
          </button>
          {isExpanded && (
          <div className="routine-exercises-list">
            {dayExs.map((ex, i) => (
              <article key={ex.id || i} className="ex-detail-card">
                {/* Header: nombre + métricas integradas */}
                <header className="ex-detail-header">
                  <div className="ex-detail-header-inner">
                    <h3 className="ex-detail-name">{ex.name}</h3>
                    <div className="ex-detail-metrics">
                      <span><IconSets /> {ex.sets} series</span>
                      <span><IconReps /> {ex.reps || '—'} reps</span>
                      <span><IconRest /> {ex.rest || '—'}</span>
                      {getExerciseKcal(ex) > 0 && <span className="ex-detail-metrics-kcal"><IconFlame /> ~{getExerciseKcal(ex)} kcal</span>}
                      {ex.time && <span><IconClock /> {ex.time}s</span>}
                    </div>
                  </div>
                </header>

                {/* Contenido principal: 2 columnas en desktop */}
                <div className={`ex-detail-body ${ex.videoUrl && (ex.description || ex.instructions || ex.observations) ? 'ex-detail-body--two-cols' : ''}`}>
                  {ex.videoUrl && (
                    <div className="ex-detail-video-col">
                      <VideoCard src={ex.videoUrl} variant="compact" embedTitle={`Video: ${ex.name}`} />
                    </div>
                  )}
                  {(ex.description || ex.instructions || ex.observations) && (
                    <div className="ex-detail-info-col">
                      <div className="ex-detail-info-card">
                        <h4 className="ex-detail-info-card-title">Información del ejercicio</h4>
                        {ex.description && (
                          <div className="ex-detail-info-item">
                            <span className="ex-detail-info-label">Descripción</span>
                            <p className="ex-detail-info-text">{ex.description}</p>
                          </div>
                        )}
                        {ex.instructions && (
                          <div className="ex-detail-info-item">
                            <span className="ex-detail-info-label">Indicaciones / Técnica</span>
                            <p className="ex-detail-info-text">{ex.instructions}</p>
                          </div>
                        )}
                        {ex.observations && (
                          <div className="ex-detail-info-item ex-detail-info-obs">
                            <span className="ex-detail-info-label"><IconInfo /> Importante</span>
                            <p className="ex-detail-info-text">{ex.observations}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
          )}
        </div>
        );
      })}

      {/* Modal completar */}
      <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} fullscreen="sm-down">
        <Modal.Header closeButton><Modal.Title>Registrar entrenamiento completado</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>RPE - Carga percibida (1-10)</Form.Label>
            <Form.Control type="number" min={1} max={10} value={completeForm.rpe} onChange={e => setCompleteForm(f => ({ ...f, rpe: e.target.value }))} placeholder="1=muy fácil, 10=máximo esfuerzo" />
            <Form.Text className="text-muted">Escala de esfuerzo percibido</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Sensaciones (cómo te sentiste)</Form.Label>
            <Form.Control as="textarea" rows={2} value={completeForm.sensations} onChange={e => setCompleteForm(f => ({ ...f, sensations: e.target.value }))} placeholder="Ej: Bien, sin molestias / Algo de fatiga" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Feedback post-entreno (opcional)</Form.Label>
            <Form.Control as="textarea" rows={2} value={completeForm.feedback} onChange={e => setCompleteForm(f => ({ ...f, feedback: e.target.value }))} placeholder="Notas para tu coach" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>Cancelar</Button>
          <Button variant="success" onClick={handleMarkComplete}>Registrar</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
