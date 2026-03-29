import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessagingShell } from '../../components/chat';
import { chatApi } from '../../api/chat';
import { notifyUnreadRefresh } from '../../utils/unreadMessages';
import { usePageVisibleInterval } from '../../hooks/usePageVisibleInterval';

const CHAT_POLL_MS = 12000;

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

  const selectedKeyRef = useRef(selectedKey);
  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  const loadConversation = useCallback(async () => {
    const { data } = await chatApi.adminCoachConversation();
    const n = normalizeConv(data);
    setConversations(n);
    notifyUnreadRefresh();
    setSelectedKey((prev) => prev ?? n[0]?.key ?? null);
    return data;
  }, []);

  const loadMessagesForSelection = useCallback(async () => {
    const id = selectedKeyRef.current;
    if (!id) return;
    const { data } = await chatApi.adminCoachMessages(id);
    setMessages(data);
    notifyUnreadRefresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadConversation();
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar soporte');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadConversation]);

  useEffect(() => {
    if (!selectedKey) return undefined;
    let cancelled = false;
    (async () => {
      try {
        await loadMessagesForSelection();
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar mensajes');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedKey, loadMessagesForSelection]);

  usePageVisibleInterval(
    useCallback(() => {
      loadConversation().catch(() => {});
      if (selectedKeyRef.current) loadMessagesForSelection().catch(() => {});
    }, [loadConversation, loadMessagesForSelection]),
    CHAT_POLL_MS
  );

  const onSendMessage = async (text) => {
    const id = selectedKeyRef.current;
    if (!id) return;
    setSending(true);
    setError(null);
    try {
      await chatApi.adminCoachSend(id, text);
      await loadMessagesForSelection();
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
