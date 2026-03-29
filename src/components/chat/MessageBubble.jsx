import React from 'react';
import { formatMessageTime } from '../../utils/chatFormatters';

export default function MessageBubble({ message, isOwn, groupedWithPrev, senderShortLabel }) {
  return (
    <div
      className={`messaging-msg ${isOwn ? 'messaging-msg--own' : 'messaging-msg--other'} ${
        groupedWithPrev ? 'messaging-msg--grouped' : ''
      }`}
    >
      {!isOwn &&
        (groupedWithPrev ? (
          <div className="messaging-msg-avatar messaging-msg-avatar--spacer" aria-hidden="true" />
        ) : (
          <div className="messaging-msg-avatar" aria-hidden="true">
            {senderShortLabel?.slice(0, 2) || '·'}
          </div>
        ))}
      <div className="messaging-msg-col">
        {!isOwn && !groupedWithPrev && (
          <div className="messaging-msg-label">
            <span className="messaging-msg-sender">{senderShortLabel}</span>
          </div>
        )}
        <div className="messaging-msg-bubble">
          <p className="messaging-msg-text">{message.content}</p>
          <time className="messaging-msg-time" dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </time>
        </div>
      </div>
    </div>
  );
}
