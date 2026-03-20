import React from 'react';

/**
 * Logo Athlento - muestra el PNG tal cual, sin deformar
 */
export default function AthlentoLogo({ size = 'md', layout = 'horizontal', className = '' }) {
  const iconSizes = { xs: 140, sm: 170, md: 200, lg: 240 };
  const iconSize = iconSizes[size] ?? iconSizes.md;

  return (
    <div className={`athlento-logo athlento-logo--full athlento-logo--${layout} athlento-logo--image-only ${className}`}>
      <img
        src="/logo-athlento.png"
        alt="Athlento"
        className="athlento-logo-img"
        style={{ width: iconSize, height: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}
