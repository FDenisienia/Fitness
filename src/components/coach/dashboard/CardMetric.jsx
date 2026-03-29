import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Métrica del dashboard coach — tarjeta elevada, número como protagonista.
 */
export default function CardMetric({ to, value, label, micro, icon, ariaLabel }) {
  return (
    <Link
      to={to}
      className="coach-card-metric"
      aria-label={ariaLabel || `${label}: ${value}`}
    >
      {icon ? (
        <span className="coach-card-metric__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="coach-card-metric__value">{value}</span>
      <span className="coach-card-metric__label">{label}</span>
      {micro ? <span className="coach-card-metric__micro">{micro}</span> : null}
    </Link>
  );
}
