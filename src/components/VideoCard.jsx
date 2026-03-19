import React, { useState } from 'react';

const IconVideo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

/**
 * VideoCard - Bloque de video embebido.
 * variant: "default" | "compact" - compact ocupa todo el ancho, sin header
 */
export default function VideoCard({ src, title = 'Video demostrativo', embedTitle, variant = 'default' }) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = src?.replace('watch?v=', 'embed/');
  const isCompact = variant === 'compact';

  if (!embedUrl) return null;

  return (
    <div className={`video-card video-card--${variant}`}>
      {!isCompact && (
        <div className="video-card-header">
          <IconVideo />
          <h4 className="video-card-title">{title}</h4>
        </div>
      )}
      <div className="video-card-wrapper">
        <div className="video-card-ratio">
          <div className={`video-card-skeleton ${loaded ? 'video-card-skeleton--hidden' : ''}`} aria-hidden>
            <div className="video-card-skeleton-pulse" />
            <div className="video-card-skeleton-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
          </div>
          <iframe
            src={embedUrl}
            title={embedTitle || title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            className={`video-card-iframe ${loaded ? 'video-card-iframe--loaded' : ''}`}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>
    </div>
  );
}
