import React, { useEffect, useRef } from 'react';
import { formatMessageDate } from '../../utils/chatFormatters';
import MessageBubble from './MessageBubble';
import { EmptyNoMessages } from './EmptyStates';

function shortSenderLabel(name) {
  if (!name) return '…';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 14);
  return `${parts[0]} ${parts[1]?.[0] || ''}.`.trim();
}

function sameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function shouldGroup(prev, curr) {
  if (!prev) return false;
  if (prev.senderId !== curr.senderId) return false;
  const dt = new Date(curr.createdAt) - new Date(prev.createdAt);
  return dt < 5 * 60 * 1000;
}

export default function MessageList({
  messages,
  currentUserId,
  otherLabel,
  loading,
  emptyHint,
}) {
  const endRef = useRef(null);
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sorted.length]);

  if (loading && sorted.length === 0) {
    return (
      <div className="messaging-thread-body messaging-thread-body--loading">
        <div className="messaging-loading-dots" aria-busy="true">
          <span />
          <span />
          <span />
        </div>
        <p className="messaging-loading-text">Cargando mensajes…</p>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="messaging-thread-body">
        <EmptyNoMessages onHint={emptyHint} />
      </div>
    );
  }

  return (
    <div className="messaging-thread-body messaging-thread-scroll">
      {sorted.map((msg, i) => {
        const prev = sorted[i - 1];
        const showDate = !prev || !sameDay(prev.createdAt, msg.createdAt);
        const isOwn = msg.senderId === currentUserId;
        const grouped = shouldGroup(prev, msg);
        const senderLabel = isOwn ? 'Tú' : otherLabel;

        return (
          <React.Fragment key={msg.id}>
            {showDate && (
              <div className="messaging-date-sep">
                <span>{formatMessageDate(msg.createdAt)}</span>
              </div>
            )}
            <MessageBubble
              message={msg}
              isOwn={isOwn}
              senderShortLabel={shortSenderLabel(senderLabel)}
              groupedWithPrev={grouped}
            />
          </React.Fragment>
        );
      })}
      <div ref={endRef} className="messaging-scroll-anchor" />
    </div>
  );
}
