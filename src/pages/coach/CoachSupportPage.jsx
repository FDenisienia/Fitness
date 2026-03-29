import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessagingShell } from '../../components/chat';
import { chatApi } from '../../api/chat';
import { notifyUnreadRefresh } from '../../utils/unreadMessages';

function normalizeConv(conv) {
  return [
    {
      key: conv.id,
      conversationId: conv.id,
      otherParticipant: conv.otherParticipant,
      lastMessagePreview: conv.lastMessagePreview,
      lastMessageAt: conv.lastMessageAt,
      unreadForMe: conv.coachUnreadCount,
      adminUnreadCount: conv.adminUnreadCount,
      coachUnreadCount: conv.coachUnreadCount,
    },
  ];
}

export default function CoachSupportPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadConversation = useCallback(async () => {
    const { data } = await chatApi.adminCoachConversation();
    const n = normalizeConv(data);
    setConversations(n);
    notifyUnreadRefresh();
    setSelectedKey((prev) => prev ?? n[0]?.key ?? null);
    return data;
  }, []);

  const loadMessages = useCallback(async (convId) => {
    const { data } = await chatApi.adminCoachMessages(convId);
    setMessages(data);
    notifyUnreadRefresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const conv = await loadConversation();
        if (!cancelled && conv?.id) await loadMessages(conv.id);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar soporte');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversation, loadMessages]);

  useEffect(() => {
    if (!selectedKey) return undefined;
    const tick = () => {
      loadConversation().catch(() => {});
      loadMessages(selectedKey).catch(() => {});
    };
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
  }, [selectedKey, loadConversation, loadMessages]);

  const onSendMessage = async (text) => {
    if (!selectedKey) return;
    setSending(true);
    setError(null);
    try {
      await chatApi.adminCoachSend(selectedKey, text);
      await loadMessages(selectedKey);
      await loadConversation();
    } catch (e) {
      setError(e.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messaging-page-wrap">
      <div className="mb-3">
        <h2 className="mb-0">Soporte</h2>
        <p className="text-muted small mb-0">Canal directo con administración para incidencias y dudas de la plataforma.</p>
      </div>
      <MessagingShell
        variant="admin-coach"
        role="coach"
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
        sidebarTitle="Administración"
        emptyHint="Escribí para contactar con soporte."
      />
    </div>
  );
}
