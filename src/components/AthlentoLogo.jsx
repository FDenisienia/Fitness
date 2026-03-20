import React from 'react';

/**
 * Logo Athlento - muestra el PNG tal cual, sin deformar
 */
export default function AthlentoLogo({ size = 'md', layout = 'horizontal', className = '' }) {
  const iconSizes = { xs: 72, sm: 96, md: 120, lg: 168 };
  const iconSize = iconSizes[size] ?? iconSizes.md;

  return (
    <div className={`athlento-logo athlento-logo--full athlento-logo--${layout} ${className}`}>
      <img
        src="/logo-athlento.png"
        alt="Athlento"
        className="athlento-logo-img"
        width={iconSize}
        height={iconSize}
        style={{ objectFit: 'contain' }}
      />
      <span className="athlento-logo-text">Athlento</span>
    </div>
  );
}
