import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessagingShell } from '../../components/chat';
import { chatApi } from '../../api/chat';
import { notifyUnreadRefresh } from '../../utils/unreadMessages';
import { usePageVisibleInterval } from '../../hooks/usePageVisibleInterval';

const CHAT_POLL_MS = 12000;

const DRAFT_COACH_KEY = 'draft-coach';

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

function buildDraftCoachConv(user) {
  const cu = user?.coachUser;
  if (!cu?.id || !user?.clientId) return [];
  return [
    {
      key: DRAFT_COACH_KEY,
      conversationId: null,
      clientId: user.clientId,
      otherParticipant: {
        id: cu.id,
        name: cu.name,
        lastName: cu.lastName,
      },
      lastMessagePreview: null,
      lastMessageAt: null,
      unreadForMe: 0,
      coachUnreadCount: 0,
      hideFromList: true,
    },
  ];
}

export default function ClientConsultationsPage() {
  const { user, refreshUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const hasDraftTarget = conversations.some((c) => c.hideFromList);

  const loadMe = useCallback(async () => {
    const { data } = await chatApi.coachClientMe();
    const n = data ? normalizeClientConv(data) : buildDraftCoachConv(user);
    setConversations(n);
    setSelectedKey((prev) => {
      if (!n.length) return null;
      if (prev === DRAFT_COACH_KEY && n[0]?.key && n[0].key !== DRAFT_COACH_KEY) return n[0].key;
      if (prev && n.some((c) => c.key === prev)) return prev;
      return n[0]?.key ?? null;
    });
    return n;
  }, [user?.id, user?.clientId, user?.coachUser?.id, user?.coachUser?.name, user?.coachUser?.lastName]);

  const loadMessages = useCallback(async () => {
    const { data } = await chatApi.coachClientMessages({});
    setMessages(data);
    notifyUnreadRefresh();
  }, []);

  useEffect(() => {
    if (user?.role === 'cliente' && user?.clientId && !user?.coachUser) {
      refreshUser();
    }
  }, [user?.role, user?.clientId, user?.coachUser, refreshUser]);

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

  usePageVisibleInterval(
    useCallback(() => {
      if (!selectedKey) return;
      loadMe().catch(() => {});
      loadMessages().catch(() => {});
    }, [selectedKey, loadMe, loadMessages]),
    CHAT_POLL_MS
  );

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
        sidebarListEmpty={
          hasDraftTarget ? (
            <div className="messaging-empty messaging-empty--inline">
              <p className="messaging-empty-title messaging-empty-title--sm mb-1">Aún no hay mensajes</p>
              <p className="messaging-empty-text">
                Cuando envíes o recibas un mensaje, el hilo aparecerá aquí. Usá el panel de la derecha para
                escribir a tu coach.
              </p>
            </div>
          ) : undefined
        }
        emptyHint="Tu coach aparecerá aquí cuando tengáis conversación activa."
      />
    </div>
  );
}
