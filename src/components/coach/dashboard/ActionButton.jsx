import React from 'react';
import { Link } from 'react-router-dom';

/**
 * @param {'primary' | 'secondary'} variant — solo una acción principal en sólido naranja
 */
export default function ActionButton({ to, variant = 'secondary', icon, children }) {
  return (
    <Link to={to} className={`coach-action-btn coach-action-btn--${variant}`}>
      {icon ? (
        <span className="coach-action-btn__icon" aria-hidden>
          {icon}
        </span>
      ) : null}
      <span className="coach-action-btn__text">{children}</span>
    </Link>
  );
}
