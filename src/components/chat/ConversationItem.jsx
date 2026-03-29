import React from 'react';
import { formatConversationListTime } from '../../utils/chatFormatters';

function initials(participant) {
  if (!participant) return '?';
  const a = participant.name?.[0] || '';
  const b = participant.lastName?.[0] || '';
  return `${a}${b}`.trim() || '?';
}

function displayName(participant, fallback) {
  if (!participant) return fallback;
  return [participant.name, participant.lastName].filter(Boolean).join(' ') || fallback;
}

export default function ConversationItem({
  conv,
  selected,
  unread,
  contextLabel,
  otherRoleLabel,
  lastTimeLabel,
  onSelect,
}) {
  const name = displayName(conv.otherParticipant, 'Sin nombre');
  const time = lastTimeLabel ?? (conv.lastMessageAt ? formatConversationListTime(conv.lastMessageAt) : '');

  return (
    <button
      type="button"
      className={`messaging-conv-item ${selected ? 'messaging-conv-item--active' : ''} ${
        unread > 0 ? 'messaging-conv-item--unread' : ''
      }`}
      onClick={() => onSelect(conv.key)}
    >
      <div className="messaging-conv-avatar" aria-hidden="true">
        {initials(conv.otherParticipant)}
      </div>
      <div className="messaging-conv-main">
        <div className="messaging-conv-top">
          <span className="messaging-conv-name">{name}</span>
          {time && <span className="messaging-conv-time">{time}</span>}
        </div>
        <div className="messaging-conv-badges">
          <span className="messaging-chip messaging-chip--role">{otherRoleLabel}</span>
          {contextLabel ? (
            <span className="messaging-chip messaging-chip--ctx">{contextLabel}</span>
          ) : null}
        </div>
        <p className="messaging-conv-preview">{conv.lastMessagePreview || 'Sin mensajes'}</p>
      </div>
      {unread > 0 && (
        <span className="messaging-conv-unread" aria-label={`${unread} sin leer`}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
