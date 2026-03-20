import React from 'react';

/**
 * Logo Athlento - A estilizada: blanco + naranja (#FF5500)
 * Base blanca con cutout, swoosh naranja curvo + pata derecha
 */
function LogoIcon({ className, size = 48 }) {
  return (
    <svg
      viewBox="0 0 48 56"
      width={size}
      height={size * (56 / 48)}
      className={className}
      aria-hidden="true"
    >
      {/* Base blanca: A con triángulo y cutout central (barra horizontal) */}
      <path
        fill="#FFFFFF"
        d="M24 0 L4 56 L18 56 L22 36 L26 36 L30 56 L44 56 Z M20 26 L28 26 L24 18 Z"
      />
      {/* Swoosh naranja: arco curvo ascendente + pata diagonal derecha */}
      <path
        fill="#FF5500"
        d="M10 48 Q24 4 44 2 L40 20 Q26 24 20 44 L18 54 L28 54 Z"
      />
    </svg>
  );
}

/**
 * Logo completo: icono + texto "Athlento"
 * Colores: blanco + naranja #FF5500, fondo gris claro #F5F5F5
 */
export default function AthlentoLogo({ size = 'md', className = '' }) {
  const iconSizes = { xs: 20, sm: 28, md: 36, lg: 48 };
  const iconSize = iconSizes[size] ?? iconSizes.md;

  return (
    <div className={`athlento-logo athlento-logo--full ${className}`}>
      <LogoIcon size={iconSize} />
      <span className="athlento-logo-text">Athlento</span>
    </div>
  );
}
