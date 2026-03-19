import React, { useState, useEffect, useRef } from 'react';
import { store, generateId } from '../data/mockData';
import '../styles/chat.css';

function formatMessageTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function formatMessageDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ChatInbox({ currentUser, role, conversations = [], singleConversation = null, onUpdate, embedded }) {
  const [selectedConv, setSelectedConv] = useState(singleConversation?.id ?? (conversations[0]?.id ?? null));

  useEffect(() => {
    if (singleConversation?.id && singleConversation.id !== selectedConv) {
      setSelectedConv(singleConversation.id);
    } else if (!selectedConv && conversations[0]?.id) {
      setSelectedConv(conversations[0].id);
    }
  }, [singleConversation?.id]);
  const [messages, setMessages] = useState(store.getChatMessages());
  const [inputText, setInputText] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const users = store.getUsers();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [selectedConv, messages]);

  const convs = singleConversation ? [singleConversation] : conversations;
  const activeConv = convs.find(c => c.id === selectedConv);
  const activeMessages = messages.filter(m => m.conversationId === selectedConv).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    if (role === 'admin') return users.find(u => u.id === conv.clientId);
    const otherId = role === 'cliente' ? conv.coachId : conv.clientId;
    return users.find(u => u.id === otherId);
  };

  const canSend = role !== 'admin';

  const unreadForCurrent = (conv) => role === 'cliente' ? conv.clientUnreadCount : conv.coachUnreadCount;

  const sendMessage = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeConv || !currentUser?.id) return;

    const newMsg = {
      id: generateId(),
      conversationId: activeConv.id,
      senderId: currentUser.id,
      senderRole: role,
      content: text,
      createdAt: new Date().toISOString(),
      readBy: [currentUser.id]
    };

    const updated = [...messages, newMsg];
    store.setChatMessages(updated);
    setMessages(updated);

    const convsData = store.getConversations();
    const updConvs = convsData.map(c => {
      if (c.id !== activeConv.id) return c;
      const otherUnread = role === 'cliente' ? 'coachUnreadCount' : 'clientUnreadCount';
      return {
        ...c,
        lastMessageAt: newMsg.createdAt,
        lastMessagePreview: text.length > 60 ? text.slice(0, 57) + '...' : text,
        [otherUnread]: (c[otherUnread] || 0) + 1
      };
    });
    store.setConversations(updConvs);
    onUpdate?.();

    setInputText('');
    scrollToBottom();
  };

  const markAsRead = () => {
    if (!activeConv || unreadForCurrent(activeConv) === 0) return;
    const convsData = store.getConversations();
    const key = role === 'cliente' ? 'clientUnreadCount' : 'coachUnreadCount';
    const updConvs = convsData.map(c => c.id === activeConv.id ? { ...c, [key]: 0 } : c);
    store.setConversations(updConvs);
  };

  useEffect(() => {
    if (activeConv) markAsRead();
  }, [selectedConv]);

  const other = getOtherParticipant(activeConv);
  const coachUser = activeConv ? users.find(u => u.id === activeConv.coachId) : null;
  const clientUser = activeConv ? users.find(u => u.id === activeConv.clientId) : null;
  const pendingReply = role === 'coach' && activeConv?.coachUnreadCount > 0;

  return (
    <div className={`chat-inbox ${embedded ? 'chat-inbox--embedded' : ''}`}>
      {/* Sidebar - lista de conversaciones */}
      {(convs.length > 1 || !singleConversation) && (
        <aside className={`chat-sidebar ${showSidebar ? 'chat-sidebar--open' : ''}`}>
          <div className="chat-sidebar-header">
            <h3 className="chat-sidebar-title">Conversaciones</h3>
            <button type="button" className="chat-sidebar-toggle" onClick={() => setShowSidebar(false)} aria-label="Ocultar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
          <div className="chat-conversation-list">
            {convs.length === 0 ? (
              <div className="chat-empty-list">No hay conversaciones</div>
            ) : (
              convs.map(conv => {
                const o = getOtherParticipant(conv);
                const unread = unreadForCurrent(conv);
                return (
                  <button
                    key={conv.id}
                    type="button"
                    className={`chat-conv-item ${selectedConv === conv.id ? 'chat-conv-item--active' : ''} ${unread > 0 ? 'chat-conv-item--unread' : ''}`}
                    onClick={() => { setSelectedConv(conv.id); setShowSidebar(false); }}
                  >
                    <div className="chat-conv-avatar">{o?.name?.[0]}{o?.lastName?.[0] || '?'}</div>
                    <div className="chat-conv-body">
                      <div className="chat-conv-name">{o ? `${o.name} ${o.lastName}` : 'Sin asignar'}</div>
                      <div className="chat-conv-preview">{conv.lastMessagePreview || 'Sin mensajes'}</div>
                      <div className="chat-conv-meta">{conv.lastMessageAt && formatMessageTime(conv.lastMessageAt)}</div>
                    </div>
                    {unread > 0 && <span className="chat-conv-badge">{unread}</span>}
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* Botón para abrir sidebar en mobile */}
      {convs.length > 1 && !showSidebar && (
        <button type="button" className="chat-open-sidebar" onClick={() => setShowSidebar(true)} aria-label="Ver conversaciones">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      )}

      {/* Panel principal del chat */}
      <div className="chat-main">
        {!activeConv ? (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">💬</div>
            <p>Selecciona una conversación</p>
            {convs.length === 0 && role === 'cliente' && <p className="text-muted small">Tu coach te asignará uno para poder chatear</p>}
          </div>
        ) : (
          <>
            <header className="chat-header">
              {convs.length > 1 && (
                <button type="button" className="chat-back-btn" onClick={() => setShowSidebar(true)} aria-label="Volver">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
              )}
              <div className="chat-header-avatar">{other?.name?.[0]}{other?.lastName?.[0] || '?'}</div>
              <div className="chat-header-info">
                <h4 className="chat-header-name">
                  {role === 'admin' && clientUser && coachUser
                    ? `${clientUser.name} ${clientUser.lastName} ↔ ${coachUser.name} ${coachUser.lastName}`
                    : other ? `${other.name} ${other.lastName}` : 'Chat'}
                </h4>
                <span className="chat-header-role">
                  {role === 'admin' ? 'Cliente / Coach' : role === 'cliente' ? 'Tu coach' : 'Alumno'}
                </span>
              </div>
              {pendingReply && <span className="chat-header-badge">Pendiente de respuesta</span>}
            </header>

            <div className="chat-messages">
              {activeMessages.length === 0 ? (
                <div className="chat-no-messages">
                  <p>Sin mensajes aún. ¡Escribe para iniciar la conversación!</p>
                </div>
              ) : (
                <>
                  {activeMessages.map((msg, i) => {
                    const prev = activeMessages[i - 1];
                    const showDate = !prev || new Date(msg.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
                    const isOwn = msg.senderId === currentUser?.id;
                    const sender = users.find(u => u.id === msg.senderId);
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="chat-date-divider">{formatMessageDate(msg.createdAt)}</div>
                        )}
                        <div className={`chat-message ${isOwn ? 'chat-message--own' : 'chat-message--other'}`}>
                          <div className="chat-message-bubble">
                            <p className="chat-message-text">{msg.content}</p>
                            <div className="chat-message-meta">
                              <span className="chat-message-sender">{isOwn ? 'Tú' : (sender ? `${sender.name} ${sender.lastName}` : msg.senderRole)}</span>
                              <span className="chat-message-time">{formatMessageTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {canSend && (
            <form className="chat-input-area" onSubmit={sendMessage}>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="chat-input"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              />
              <button type="submit" className="chat-send-btn" disabled={!inputText.trim()} aria-label="Enviar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </form>
            )}
            {!canSend && (
              <div className="chat-input-area chat-input-area--readonly">
                <span className="text-muted small">Solo lectura (vista admin)</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
