import React from 'react';
import { CHAT_STATUS } from '../../utils/chatLocalState';
import { contextBadgeLabel, inferConversationKind } from './chatTypes';

function Row({ label, children }) {
  return (
    <div className="messaging-detail-row">
      <span className="messaging-detail-label">{label}</span>
      <div className="messaging-detail-value">{children}</div>
    </div>
  );
}

const STATUS_LABEL = {
  [CHAT_STATUS.OPEN]: 'Abierta',
  [CHAT_STATUS.PENDING]: 'Pendiente',
  [CHAT_STATUS.RESPONDED]: 'Respondida',
};

export default function ConversationDetails({
  variant,
  viewerRole,
  otherParticipant,
  displayName,
  otherRoleLabel,
  email,
  phone,
  lastMessageAt,
  messageCount,
  localStatus,
  archived,
  notes,
  onNotesChange,
  onClose,
  extraRows,
}) {
  const kind = inferConversationKind(variant, viewerRole);
  const ctx = contextBadgeLabel(kind, viewerRole);

  let statusLabel = STATUS_LABEL[localStatus] || 'Abierta';
  if (archived) statusLabel = 'Archivada';

  return (
    <aside className="messaging-details-panel">
      <div className="messaging-details-head">
        <h3 className="messaging-details-title">Contexto</h3>
        {onClose && (
          <button type="button" className="messaging-icon-btn messaging-details-close" onClick={onClose} aria-label="Cerrar panel">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="messaging-details-body">
        <div className="messaging-details-hero">
          <div className="messaging-details-avatar">
            {(displayName || '?')
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || '?'}
          </div>
          <div>
            <p className="messaging-details-name">{displayName}</p>
            <span className="messaging-chip messaging-chip--role">{otherRoleLabel}</span>
          </div>
        </div>

        <Row label="Clasificación">{ctx}</Row>
        <Row label="Estado">
          <span className="messaging-status-pill">{statusLabel}</span>
        </Row>
        <Row label="Email">{email || '—'}</Row>
        <Row label="Teléfono">{phone || '—'}</Row>
        {extraRows}
        <Row label="Último mensaje">{lastMessageAt ? new Date(lastMessageAt).toLocaleString('es-ES') : '—'}</Row>
        <Row label="Mensajes en hilo">{messageCount ?? '—'}</Row>

        <div className="messaging-notes">
          <label className="messaging-detail-label" htmlFor="messaging-internal-notes">
            Notas internas
          </label>
          <textarea
            id="messaging-internal-notes"
            className="messaging-notes-input"
            rows={4}
            placeholder="Solo visible en este dispositivo (local). Próx.: sincronizar con servidor."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>
      </div>
    </aside>
  );
}
