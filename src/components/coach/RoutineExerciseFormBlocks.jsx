import React, { useMemo } from 'react';
import { Button, Form } from 'react-bootstrap';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ExerciseAutocomplete from '../ExerciseAutocomplete';
import {
  getSessionDisplayName,
  getSessionIndicesFromExercises,
  getLastSessionIndex,
  getNextSessionIndex,
} from '../../utils/sessionNames';
import {
  exercisesForSession,
  moveExerciseInSession,
  normalizeExercisesFlatOrder,
  replaceSessionOrder,
} from '../../utils/routineExerciseOrder';

const IconGrip = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <circle cx="9" cy="8" r="1.5" />
    <circle cx="15" cy="8" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="16" r="1.5" />
    <circle cx="15" cy="16" r="1.5" />
  </svg>
);

function SortableExerciseRow({
  exercise,
  exerciseLibrary,
  sessionNames,
  isFirstInSession,
  isLastInSession,
  onUpdateField,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSessionIndexChange,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.72 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`exercise-row-card${isDragging ? ' exercise-row-card--dragging' : ''}`}
    >
      <div className="exercise-row-grid">
        <div className="exercise-col-reorder">
          <Form.Label className="d-md-none small">Orden</Form.Label>
          <div className="exercise-reorder-inner">
            <button
              type="button"
              className="exercise-drag-handle"
              aria-label="Arrastrar para reordenar"
              {...attributes}
              {...listeners}
            >
              <IconGrip />
            </button>
            <div className="exercise-move-btns">
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                className="exercise-move-btn"
                disabled={isFirstInSession}
                onClick={onMoveUp}
                aria-label="Subir ejercicio"
                title="Subir"
              >
                ↑
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline-secondary"
                className="exercise-move-btn"
                disabled={isLastInSession}
                onClick={onMoveDown}
                aria-label="Bajar ejercicio"
                title="Bajar"
              >
                ↓
              </Button>
            </div>
          </div>
        </div>
        <div className="exercise-col-name">
          <Form.Label className="d-md-none small">Ejercicio</Form.Label>
          <ExerciseAutocomplete
            value={exercise.name}
            libraryExerciseId={exercise.exerciseId}
            library={exerciseLibrary}
            placeholder="Buscar o escribir..."
            onChange={(name) => onUpdateField({ name })}
            onSelectFromLibrary={(libEx) => {
              if (!libEx) {
                onUpdateField({ exerciseId: null });
                return;
              }
              onUpdateField({
                name: libEx.name,
                videoUrl: libEx.videoUrl ?? exercise.videoUrl,
                exerciseId: libEx.id,
              });
            }}
          />
        </div>
        <div>
          <Form.Label className="d-md-none small">Bloque</Form.Label>
          <Form.Select
            value={String(exercise.sessionIndex ?? 1)}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10) || 1;
              onSessionIndexChange(v);
            }}
          >
            {Array.from({ length: 12 }, (_, n) => n + 1).map((num) => {
              const label = getSessionDisplayName(num, sessionNames);
              return (
                <option key={num} value={num}>
                  {label} (Bloque {num})
                </option>
              );
            })}
          </Form.Select>
        </div>
        <div>
          <Form.Label className="d-md-none small">Series</Form.Label>
          <Form.Control
            placeholder="S"
            value={exercise.sets}
            onChange={(e) => onUpdateField({ sets: e.target.value })}
          />
        </div>
        <div>
          <Form.Label className="d-md-none small">Reps</Form.Label>
          <Form.Control
            placeholder="R"
            value={exercise.reps}
            onChange={(e) => onUpdateField({ reps: e.target.value })}
          />
        </div>
        <div>
          <Form.Label className="d-md-none small">Descanso</Form.Label>
          <Form.Control
            placeholder="60 seg"
            value={exercise.rest}
            onChange={(e) => onUpdateField({ rest: e.target.value })}
          />
        </div>
        <div className="exercise-col-video">
          <Form.Label className="d-md-none small">URL video</Form.Label>
          <Form.Control
            placeholder="https://..."
            value={exercise.videoUrl || ''}
            onChange={(e) => onUpdateField({ videoUrl: e.target.value })}
          />
        </div>
        <div className="exercise-col-delete d-flex align-items-end">
          <Button
            size="sm"
            variant="outline-danger"
            className="w-100"
            onClick={onRemove}
            title="Eliminar ejercicio"
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function RoutineExerciseFormBlocks({
  exercises,
  patchExercises,
  sessionNames,
  exerciseLibrary,
  getEmptyExercise,
}) {
  const sessionIndices = useMemo(() => getSessionIndicesFromExercises(exercises), [exercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (sessionIndex, event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const list = exercisesForSession(exercises, sessionIndex);
    const oldIndex = list.findIndex((e) => e.id === active.id);
    const newIndex = list.findIndex((e) => e.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    patchExercises((prev) => normalizeExercisesFlatOrder(replaceSessionOrder(prev, sessionIndex, reordered)));
  };

  const updateExerciseById = (id, partial) => {
    patchExercises((prev) =>
      normalizeExercisesFlatOrder(prev.map((ex) => (ex.id === id ? { ...ex, ...partial } : ex)))
    );
  };

  const removeExerciseById = (id) => {
    patchExercises((prev) => {
      const next = prev.filter((ex) => ex.id !== id);
      return next.length ? next : [getEmptyExercise(1)];
    });
  };

  const changeSessionIndexForId = (id, newSessionIndex) => {
    patchExercises((prev) => {
      const next = prev.map((ex) => (ex.id === id ? { ...ex, sessionIndex: newSessionIndex } : ex));
      return normalizeExercisesFlatOrder(next);
    });
  };

  return (
    <div className="routine-exercise-blocks">
      {sessionIndices.map((sessionIndex) => {
        const blockExercises = exercisesForSession(exercises, sessionIndex);
        const ids = blockExercises.map((e) => e.id);
        const displayName = getSessionDisplayName(sessionIndex, sessionNames);

        return (
          <div key={sessionIndex} className="routine-session-block">
            <div className="routine-session-block-header">
              <div>
                <span className="routine-session-block-title">Bloque {sessionIndex}</span>
                <span className="routine-session-block-subtitle text-muted ms-2">{displayName}</span>
              </div>
              <span className="routine-session-block-count small text-muted">
                {blockExercises.length} ejercicio{blockExercises.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="exercise-row-header">
              <span></span>
              <span>Ejercicio</span>
              <span>Bloque</span>
              <span>Series</span>
              <span>Reps</span>
              <span>Descanso</span>
              <span>URL video</span>
              <span></span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(sessionIndex, e)}
            >
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {blockExercises.map((ex, idx) => (
                  <SortableExerciseRow
                    key={ex.id}
                    exercise={ex}
                    exerciseLibrary={exerciseLibrary}
                    sessionNames={sessionNames}
                    isFirstInSession={idx === 0}
                    isLastInSession={idx === blockExercises.length - 1}
                    onUpdateField={(partial) => updateExerciseById(ex.id, partial)}
                    onRemove={() => removeExerciseById(ex.id)}
                    onMoveUp={() =>
                      patchExercises((prev) =>
                        normalizeExercisesFlatOrder(moveExerciseInSession(prev, sessionIndex, ex.id, -1))
                      )
                    }
                    onMoveDown={() =>
                      patchExercises((prev) =>
                        normalizeExercisesFlatOrder(moveExerciseInSession(prev, sessionIndex, ex.id, 1))
                      )
                    }
                    onSessionIndexChange={(v) => changeSessionIndexForId(ex.id, v)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <Button
              size="sm"
              variant="outline-primary"
              className="btn-add-exercise-session mb-3"
              type="button"
              onClick={() =>
                patchExercises((prev) => {
                  const next = [...prev, getEmptyExercise(sessionIndex)];
                  return normalizeExercisesFlatOrder(next);
                })
              }
            >
              + Añadir ejercicio a este bloque
            </Button>
          </div>
        );
      })}

      <div className="routine-exercise-blocks-actions d-flex flex-wrap gap-2 align-items-center mt-2">
        <Button
          size="sm"
          variant="primary"
          className="btn-add-block"
          type="button"
          onClick={() =>
            patchExercises((prev) => {
              const nextIdx = getNextSessionIndex(prev);
              return normalizeExercisesFlatOrder([...prev, getEmptyExercise(nextIdx)]);
            })
          }
        >
          + Añadir bloque
        </Button>
        <Button
          size="sm"
          variant="outline-primary"
          className="btn-add-exercise"
          type="button"
          onClick={() =>
            patchExercises((prev) => {
              const lastIdx = getLastSessionIndex(prev);
              return normalizeExercisesFlatOrder([...prev, getEmptyExercise(lastIdx)]);
            })
          }
        >
          + Añadir ejercicio al último bloque
        </Button>
      </div>
    </div>
  );
}
