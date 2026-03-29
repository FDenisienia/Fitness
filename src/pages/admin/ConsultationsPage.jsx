import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessagingShell } from '../../components/chat';
import { chatApi } from '../../api/chat';
import { notifyUnreadRefresh } from '../../utils/unreadMessages';
import { usePageVisibleInterval } from '../../hooks/usePageVisibleInterval';

const CHAT_POLL_MS = 12000;

function normalizeInboxRow(row) {
  return {
    key: row.id,
    conversationId: row.id,
    otherParticipant: row.otherParticipant,
    lastMessagePreview: row.lastMessagePreview,
    lastMessageAt: row.lastMessageAt,
    unreadForMe: row.adminUnreadCount,
    adminUnreadCount: row.adminUnreadCount,
    coachUnreadCount: row.coachUnreadCount,
  };
}

export default function ConsultationsPage() {
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

  const loadInbox = useCallback(async () => {
    const { data } = await chatApi.adminCoachInbox();
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
        await loadInbox();
      } catch (e) {
        if (!cancelled) setError(e.message || 'Error al cargar consultas');
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
    const convId = selectedKeyRef.current;
    if (!convId) return;
    setSending(true);
    setError(null);
    try {
      await chatApi.adminCoachSend(convId, text);
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
        <h2 className="mb-0">Consultas de coaches</h2>
        <p className="text-muted small mb-0">Bandeja tipo soporte: filtros y alto volumen de conversaciones.</p>
      </div>
      <MessagingShell
        variant="admin-coach"
        role="admin"
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
        sidebarTitle="Coaches"
        emptyFootnote="Los hilos se ordenan por última actividad."
      />
    </div>
  );
}
