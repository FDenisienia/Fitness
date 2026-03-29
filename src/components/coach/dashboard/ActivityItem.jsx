import React from 'react';
import { Link } from 'react-router-dom';

function statusCopy(status) {
  if (status === 'completed') return 'Completado';
  if (status === 'pending') return 'Pendiente';
  return 'Sin sesión hoy';
}

/**
 * Fila tipo feed — alumnos del día (nombre destacado, meta secundaria).
 */
export default function ActivityItem({ alumno, routinesIcon, messageIcon }) {
  const fullName = [alumno.name, alumno.lastName].filter(Boolean).join(' ').trim() || 'Alumno';

  return (
    <div className="coach-activity-item">
      <div className="coach-activity-item__avatar" aria-hidden>
        {alumno.initials}
      </div>
      <div className="coach-activity-item__main">
        <div className="coach-activity-item__name">{fullName}</div>
        <div className="coach-activity-item__meta">
          <span className="coach-activity-item__objective">{alumno.objective || 'Sin objetivo'}</span>
          <span className="coach-activity-item__dot" aria-hidden>·</span>
          <span className={`coach-activity-item__status coach-activity-item__status--${alumno.status}`}>
            {statusCopy(alumno.status)}
          </span>
          {alumno.lastActivity ? (
            <>
              <span className="coach-activity-item__dot" aria-hidden>·</span>
              <span className="coach-activity-item__date">
                Última actividad {String(alumno.lastActivity).slice(0, 10)}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="coach-activity-item__actions">
        <Link to={`/coach/usuarios/${alumno.id}`} className="coach-activity-item__action" title="Ver perfil">
          {routinesIcon}
        </Link>
        <Link to="/coach/consultas" className="coach-activity-item__action" title="Mensajes">
          {messageIcon}
        </Link>
      </div>
    </div>
  );
}
