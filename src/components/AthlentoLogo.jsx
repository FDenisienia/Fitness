import React, { useState } from 'react';

const LOGO_IMG_SRC = '/logo-athlento.png';

function LogoSvg({ size }) {
  return (
    <svg viewBox="0 0 48 56" width={size} height={size * (56 / 48)} aria-hidden="true">
      <path fill="#FFFFFF" d="M24 0 L4 56 L18 56 L22 36 L26 36 L30 56 L44 56 Z M20 26 L28 26 L24 18 Z" />
      <path fill="#FF4500" d="M10 48 Q24 4 44 2 L40 20 Q26 24 20 44 L18 54 L28 54 Z" />
    </svg>
  );
}

/**
 * Logo Athlento - usa imagen PNG (public/logo-athlento.png) o fallback SVG
 */
export default function AthlentoLogo({ size = 'md', className = '' }) {
  const [imgError, setImgError] = useState(false);
  const iconSizes = { xs: 24, sm: 32, md: 40, lg: 56 };
  const iconSize = iconSizes[size] ?? iconSizes.md;

  return (
    <div className={`athlento-logo athlento-logo--full ${className}`}>
      {imgError ? (
        <LogoSvg size={iconSize} />
      ) : (
        <img
          src={LOGO_IMG_SRC}
          alt="Athlento"
          className="athlento-logo-img"
          width={iconSize}
          height={iconSize}
          style={{ objectFit: 'contain' }}
          onError={() => setImgError(true)}
        />
      )}
      <span className="athlento-logo-text">Athlento</span>
    </div>
  );
}
