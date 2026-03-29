import React from 'react';

export function EmptyNoConversation({ loading }) {
  return (
    <div className="messaging-empty messaging-empty--center">
      <div className="messaging-empty-visual" aria-hidden="true">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 className="messaging-empty-title">{loading ? 'Cargando bandeja…' : 'Selecciona una conversación'}</h3>
      <p className="messaging-empty-text">
        {loading
          ? 'Obteniendo tus conversaciones recientes.'
          : 'Elige un chat de la lista para ver el historial y responder.'}
      </p>
    </div>
  );
}

export function EmptyNoMessages({ onHint }) {
  return (
    <div className="messaging-empty messaging-empty--messages">
      <div className="messaging-empty-visual messaging-empty-visual--sm" aria-hidden="true">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <p className="messaging-empty-title messaging-empty-title--sm">Sin mensajes aún</p>
      <p className="messaging-empty-text">Escribí el primer mensaje para abrir el hilo.</p>
      {onHint && <p className="messaging-empty-hint">{onHint}</p>}
    </div>
  );
}

export function EmptySearch() {
  return (
    <div className="messaging-empty messaging-empty--inline">
      <p className="messaging-empty-title messaging-empty-title--sm mb-1">Sin resultados</p>
      <p className="messaging-empty-text">Probá con otro nombre o limpiá la búsqueda.</p>
    </div>
  );
}

export function EmptyInboxFirst() {
  return (
    <div className="messaging-empty messaging-empty--inline">
      <p className="messaging-empty-title messaging-empty-title--sm mb-1">Todavía no hay conversaciones</p>
      <p className="messaging-empty-text">Cuando lleguen mensajes, aparecerán aquí ordenados por actividad.</p>
    </div>
  );
}
