import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessagingShell } from '../../components/chat';
import { chatApi } from '../../api/chat';
import { notifyUnreadRefresh } from '../../utils/unreadMessages';

function normalizeClientConv(me) {
  return [
    {
      key: me.id,
      conversationId: me.id,
      clientId: me.clientId,
      otherParticipant: me.otherParticipant,
      lastMessagePreview: me.lastMessagePreview,
      lastMessageAt: me.lastMessageAt,
      unreadForMe: me.clientUnreadCount,
      coachUnreadCount: me.coachUnreadCount,
    },
  ];
}

export default function ClientConsultationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadMe = useCallback(async () => {
    const { data } = await chatApi.coachClientMe();
    const n = normalizeClientConv(data);
    setConversations(n);
    setSelectedKey((prev) => prev ?? n[0]?.key ?? null);
    return n;
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await chatApi.coachClientMessages({});
    setMessages(data);
    notifyUnreadRefresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadMe();
        if (!cancelled) await loadMessages();
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar el chat');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe, loadMessages]);

  useEffect(() => {
    if (!selectedKey) return undefined;
    const tick = () => {
      loadMe().catch(() => {});
      loadMessages().catch(() => {});
    };
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [selectedKey, loadMe, loadMessages]);

  const onSendMessage = async (text) => {
    setSending(true);
    setError(null);
    try {
      await chatApi.coachClientSend({ content: text });
      await loadMessages();
      await loadMe();
    } catch (e) {
      setError(e.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messaging-page-wrap">
      <div className="mb-3">
        <h2 className="mb-0">Mensajes</h2>
        <p className="text-muted small mb-0">Chat con tu coach.</p>
      </div>
      <MessagingShell
        variant="coach-client"
        role="cliente"
        currentUser={user}
        conversations={conversations}
        selectedKey={selectedKey}
        onSelectConversation={setSelectedKey}
        messages={messages}
        onSendMessage={onSendMessage}
        loading={loading}
        sending={sending}
        error={error}
        embedded
        sidebarTitle="Tu coach"
        emptyHint="Tu coach aparecerá aquí cuando tengáis conversación activa."
      />
    </div>
  );
}
