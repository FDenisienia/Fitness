import React from 'react';

export default function ChatInput({ value, onChange, onSubmit, disabled, sending, placeholder }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <form className="messaging-composer" onSubmit={onSubmit}>
      <div className="messaging-composer-inner">
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder || 'Escribí un mensaje…'}
          rows={1}
          className="messaging-composer-input"
          disabled={disabled || sending}
          onKeyDown={handleKeyDown}
          aria-label="Mensaje"
        />
        <button
          type="submit"
          className="messaging-composer-send"
          disabled={!value.trim() || disabled || sending}
          aria-label="Enviar"
        >
          {sending ? (
            <span className="messaging-spinner" aria-hidden="true" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          )}
        </button>
      </div>
      <p className="messaging-composer-hint">Enter para enviar · Shift+Enter para nueva línea</p>
    </form>
  );
}
