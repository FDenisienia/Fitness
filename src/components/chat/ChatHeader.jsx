import React, { useState, useRef, useEffect } from 'react';
import { contextBadgeLabel, inferConversationKind } from './chatTypes';

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function ChatHeader({
  variant,
  viewerRole,
  otherParticipant,
  displayName,
  otherRoleLabel,
  pendingHighlight,
  showBack,
  onBack,
  onArchive,
  archived,
  onOpenDetails,
  detailsOpen,
  compact,
  showContextBadge = true,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const kind = inferConversationKind(variant, viewerRole);
  const badge = contextBadgeLabel(kind, viewerRole);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const initials = otherParticipant
    ? `${otherParticipant.name?.[0] || ''}${otherParticipant.lastName?.[0] || ''}`.trim() || '?'
    : '?';

  return (
    <header className={`messaging-thread-header ${compact ? 'messaging-thread-header--compact' : ''}`}>
      <div className="messaging-thread-header-left">
        {showBack && (
          <button type="button" className="messaging-icon-btn messaging-back-btn" onClick={onBack} aria-label="Volver al listado">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <div className="messaging-thread-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="messaging-thread-titles">
          <div className="messaging-thread-name-row">
            <h2 className="messaging-thread-name">{displayName}</h2>
            {pendingHighlight && (
              <span className="messaging-pill messaging-pill--warn">Requiere respuesta</span>
            )}
          </div>
          <div className="messaging-thread-sub">
            <span className="messaging-thread-role">{otherRoleLabel}</span>
            {showContextBadge && (
              <>
                <span className="messaging-thread-dot" aria-hidden="true">
                  ·
                </span>
                <span className="messaging-thread-ctx">{badge}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="messaging-thread-actions">
        {onOpenDetails && (
          <button
            type="button"
            className={`messaging-btn-ghost messaging-hide-mobile ${detailsOpen ? 'messaging-btn-ghost--active' : ''}`}
            onClick={onOpenDetails}
          >
            Contexto
          </button>
        )}
        <div className="messaging-actions-menu" ref={menuRef}>
          <button
            type="button"
            className="messaging-icon-btn"
            aria-label="Más acciones"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MenuIcon />
          </button>
          {menuOpen && (
            <div className="messaging-dropdown" role="menu">
              {onArchive && (
                <button type="button" className="messaging-dropdown-item" role="menuitem" onClick={() => { onArchive(); setMenuOpen(false); }}>
                  {archived ? 'Desarchivar' : 'Archivar conversación'}
                </button>
              )}
              {onOpenDetails && (
                <button
                  type="button"
                  className="messaging-dropdown-item messaging-show-mobile-only"
                  role="menuitem"
                  onClick={() => { onOpenDetails(); setMenuOpen(false); }}
                >
                  Ver contexto
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
