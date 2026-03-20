import React from 'react';

/**
 * Logo Athlento - icono estilizado A con swoosh naranja
 * Diseño: fondo blanco/gris claro + naranja (#FF5C00)
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
      {/* Base blanca: A con triángulo superior y pata izquierda */}
      <path
        fill="#FFFFFF"
        d="M24 2 L6 54 L16 54 L22 32 L26 32 L32 54 L42 54 Z M20 24 L28 24 L24 16 Z"
      />
      {/* Swoosh naranja: arco dinámico + pata derecha del A */}
      <path
        fill="var(--orange, #FF5C00)"
        d="M14 52 Q24 8 42 4 L38 22 Q24 26 18 48 Z"
      />
    </svg>
  );
}

/**
 * Logo completo: icono + texto "Athlento"
 * Variante: full (fondo negro, centrado) | inline (para navbar)
 */
export default function AthlentoLogo({ variant = 'full', size = 'md', className = '' }) {
  const iconSizes = { sm: 28, md: 36, lg: 48 };
  const iconSize = iconSizes[size] ?? iconSizes.md;

  const content = (
    <>
      <LogoIcon size={iconSize} />
      <span className="athlento-logo-text">Athlento</span>
    </>
  );

  if (variant === 'inline') {
    return (
      <div className={`athlento-logo athlento-logo--inline ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`athlento-logo athlento-logo--full ${className}`}>
      {content}
    </div>
  );
}
