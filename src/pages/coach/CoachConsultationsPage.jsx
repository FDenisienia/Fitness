import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessagingShell } from '../../components/chat';
import { chatApi } from '../../api/chat';
import { notifyUnreadRefresh } from '../../utils/unreadMessages';
import { usePageVisibleInterval } from '../../hooks/usePageVisibleInterval';

const CHAT_POLL_MS = 12000;

function normalizeInboxRow(row) {
  return {
    key: `client-${row.clientId}`,
    conversationId: row.conversationId,
    clientId: row.clientId,
    otherParticipant: row.otherParticipant,
    lastMessagePreview: row.lastMessagePreview,
    lastMessageAt: row.lastMessageAt,
    unreadForMe: row.coachUnreadCount,
    coachUnreadCount: row.coachUnreadCount,
    clientUnreadCount: row.clientUnreadCount,
  };
}

export default function CoachConsultationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const conversationsRef = useRef(conversations);
  const selectedKeyRef = useRef(selectedKey);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  const loadInbox = useCallback(async () => {
    const { data } = await chatApi.coachClientInbox();
    const n = (data || []).map(normalizeInboxRow);
    setConversations(n);
    notifyUnreadRefresh();
    setSelectedKey((prev) => {
      if (prev && n.some((c) => c.key === prev)) return prev;
      return n[0]?.key ?? null;
    });
    return n;
  }, []);

  const loadMessagesForSelection = useCallback(async () => {
    const key = selectedKeyRef.current;
    const row = conversationsRef.current.find((c) => c.key === key);
    if (!row?.clientId) return;
    const params = row.conversationId
      ? { conversationId: row.conversationId }
      : { clientId: row.clientId };
    const { data } = await chatApi.coachClientMessages(params);
    setMessages(data);
    notifyUnreadRefresh();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await loadInbox();
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar conversaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadInbox]);

  useEffect(() => {
    if (!selectedKey) {
      setMessages([]);
      return undefined;
    }
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
      loadInbox().catch(() => {});
      if (selectedKeyRef.current) loadMessagesForSelection().catch(() => {});
    }, [loadInbox, loadMessagesForSelection]),
    CHAT_POLL_MS
  );

  const onSendMessage = async (text) => {
    const row = conversationsRef.current.find((c) => c.key === selectedKeyRef.current);
    if (!row?.clientId) return;
    setSending(true);
    setError(null);
    try {
      await chatApi.coachClientSend({
        content: text,
        clientId: row.clientId,
        ...(row.conversationId ? { conversationId: row.conversationId } : {}),
      });
      await loadMessagesForSelection();
      await loadInbox();
    } catch (e) {
      setError(e.message || 'No se pudo enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="messaging-page-wrap">
      <div className="mb-3">
        <h2 className="mb-0">Mensajes con alumnos</h2>
        <p className="text-muted small mb-0">Una bandeja por alumno: búsqueda y filtros.</p>
      </div>
      <MessagingShell
        variant="coach-client"
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
        sidebarTitle="Alumnos"
        emptyHint="Coordiná entrenamientos y dudas en un solo lugar."
      />
    </div>
  );
}
