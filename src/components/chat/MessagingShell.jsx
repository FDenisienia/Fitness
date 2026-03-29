import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ConversationList from './ConversationList';
import ConversationItem from './ConversationItem';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ConversationDetails from './ConversationDetails';
import { EmptyNoConversation } from './EmptyStates';
import { contextBadgeLabel, inferConversationKind, roleLabelForOther } from './chatTypes';
import { CHAT_STATUS, getConvEntry, loadConvPrefs, setConvEntry } from '../../utils/chatLocalState';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import '../../styles/messaging.css';

function enrichConversation(conv, variant, viewerRole) {
  let otherRole;
  if (variant === 'admin-coach') {
    otherRole = viewerRole === 'admin' ? 'coach' : 'admin';
  } else {
    otherRole = viewerRole === 'cliente' ? 'coach' : 'cliente';
  }
  return { ...conv, otherRole };
}

function nameOf(p, fallback) {
  if (!p) return fallback;
  return [p.name, p.lastName].filter(Boolean).join(' ') || fallback;
}

function buildFilterTabs(variant, viewerRole) {
  const tabs = [
    { id: 'all', label: 'Todos' },
    { id: 'unread', label: 'No leídos' },
  ];
  if (variant === 'coach-client' && viewerRole === 'coach') {
    tabs.push({ id: 'clients', label: 'Clientes' });
  }
  if (variant === 'admin-coach') {
    tabs.push({ id: 'coaches', label: 'Coaches' });
  }
  tabs.push({ id: 'archived', label: 'Archivados' });
  return tabs;
}

export default function MessagingShell({
  variant,
  role: viewerRole,
  currentUser,
  conversations: rawConversations,
  selectedKey,
  onSelectConversation,
  messages,
  onSendMessage,
  loading,
  sending,
  error,
  embedded,
  sidebarTitle,
  emptyHint,
  emptyFootnote,
}) {
  const isMobile = useMediaQuery('(max-width: 991px)');
  const [mobileStage, setMobileStage] = useState('list');
  const [detailsOpen, setDetailsOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth > 991
  );
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortRecentFirst, setSortRecentFirst] = useState(true);
  const [localPrefs, setLocalPrefs] = useState({});

  const userId = currentUser?.id;
  const storageVariant = variant;

  useEffect(() => {
    setLocalPrefs(loadConvPrefs(userId, storageVariant));
  }, [userId, storageVariant]);

  const persist = useCallback(
    (key, partial) => {
      const next = setConvEntry(userId, storageVariant, key, partial);
      setLocalPrefs(next);
    },
    [userId, storageVariant]
  );

  const conversations = useMemo(
    () => (rawConversations || []).map((c) => enrichConversation(c, variant, viewerRole)),
    [rawConversations, variant, viewerRole]
  );

  const filterTabs = useMemo(() => buildFilterTabs(variant, viewerRole), [variant, viewerRole]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.key === selectedKey),
    [conversations, selectedKey]
  );

  const kind = inferConversationKind(variant, viewerRole);
  const contextLabelStr = useMemo(() => contextBadgeLabel(kind, viewerRole), [kind, viewerRole]);

  const getOtherRoleLabel = useCallback(
    (conv) => roleLabelForOther(conv.otherRole),
    []
  );

  const getUnread = useCallback((c) => c.unreadForMe ?? 0, []);

  const isArchived = useCallback(
    (key) => !!getConvEntry(localPrefs, key).archived,
    [localPrefs]
  );

  const handleSelect = useCallback(
    (key) => {
      onSelectConversation?.(key);
      if (isMobile) setMobileStage('chat');
    },
    [onSelectConversation, isMobile]
  );

  const handleBack = useCallback(() => {
    setMobileStage('list');
    setDetailsOpen(false);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setMobileStage('list');
    } else {
      setDetailsOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && selectedKey && mobileStage === 'list') {
      /* keep list on first paint if user navigated without tap */
    }
  }, [isMobile, selectedKey, mobileStage]);

  const otherLabel = nameOf(activeConv?.otherParticipant, variant === 'admin-coach' ? 'Contacto' : 'Contacto');

  const pendingHighlight =
    activeConv &&
    ((variant === 'coach-client' &&
      viewerRole === 'coach' &&
      (activeConv.coachUnreadCount ?? 0) > 0) ||
      (variant === 'admin-coach' && viewerRole === 'admin' && (activeConv.adminUnreadCount ?? 0) > 0));

  const entry = activeConv ? getConvEntry(localPrefs, activeConv.key) : {};
  const archived = !!entry.archived;
  const localStatus = entry.status || CHAT_STATUS.OPEN;

  const onArchive = () => {
    if (!activeConv) return;
    persist(activeConv.key, { archived: !archived });
  };

  const notes = entry.notes || '';

  const hideDetails = variant === 'coach-client' || variant === 'admin-coach';
  const showContextMeta = !hideDetails;
  const showDetailsPanel = !hideDetails && !isMobile && detailsOpen;
  const showDetailsOverlay = !hideDetails && isMobile && detailsOpen;

  const sendMessage = (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || !activeConv || !currentUser?.id || sending) return;
    onSendMessage?.(text);
    setInputText('');
  };

  const sidebarHeader = sidebarTitle || (variant === 'admin-coach' ? 'Consultas' : 'Mensajes');

  const hideFilters = viewerRole === 'cliente' && variant === 'coach-client' && conversations.length <= 1;

  return (
    <div className={`messaging-app ${embedded ? 'messaging-app--embedded' : ''}`}>
      <div
        className={`messaging-col messaging-col--list ${
          isMobile && mobileStage !== 'list' ? 'messaging-col--hidden-mobile' : ''
        }`}
      >
        <div className="messaging-sidebar-header">
          <h2 className="messaging-sidebar-title">{sidebarHeader}</h2>
          <p className="messaging-sidebar-sub">Bandeja ordenada</p>
        </div>
        {hideFilters ? (
          <div className="messaging-sidebar-inner messaging-sidebar-inner--simple">
            <div className="messaging-conv-list">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.key}
                  conv={conv}
                  selected={selectedKey === conv.key}
                  unread={getUnread(conv)}
                  contextLabel={showContextMeta ? contextLabelStr : null}
                  otherRoleLabel={getOtherRoleLabel(conv)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedKey={selectedKey}
            onSelectConversation={handleSelect}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filterTabs={filterTabs}
            sortRecentFirst={sortRecentFirst}
            onSortChange={setSortRecentFirst}
            getUnread={getUnread}
            getContextLabel={() => (showContextMeta ? contextLabelStr : '')}
            getOtherRoleLabel={getOtherRoleLabel}
            isArchived={isArchived}
            emptyFirstMessage={emptyFootnote}
          />
        )}
      </div>

      <div
        className={`messaging-col messaging-col--thread ${
          isMobile && mobileStage !== 'chat' ? 'messaging-col--hidden-mobile' : ''
        }`}
      >
        {error && (
          <div className="messaging-alert" role="alert">
            {error}
          </div>
        )}

        {!activeConv ? (
          <EmptyNoConversation loading={loading} />
        ) : (
          <>
            <ChatHeader
              variant={variant}
              viewerRole={viewerRole}
              otherParticipant={activeConv.otherParticipant}
              displayName={otherLabel}
              otherRoleLabel={getOtherRoleLabel(activeConv)}
              pendingHighlight={pendingHighlight}
              showBack={isMobile}
              onBack={handleBack}
              onArchive={onArchive}
              archived={archived}
              onOpenDetails={hideDetails ? undefined : () => setDetailsOpen((d) => !d)}
              detailsOpen={detailsOpen}
              compact={isMobile}
              showContextBadge={showContextMeta}
            />
            <MessageList
              messages={messages}
              currentUserId={currentUser?.id}
              otherLabel={otherLabel}
              loading={loading}
              emptyHint={emptyHint}
            />
            <ChatInput
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onSubmit={sendMessage}
              disabled={!activeConv}
              sending={sending}
            />
          </>
        )}
      </div>

      {!isMobile && showDetailsPanel && activeConv && (
        <div className="messaging-col messaging-col--details">
          <ConversationDetails
            variant={variant}
            viewerRole={viewerRole}
            otherParticipant={activeConv.otherParticipant}
            displayName={otherLabel}
            otherRoleLabel={getOtherRoleLabel(activeConv)}
            email={activeConv.otherParticipant?.email}
            phone={activeConv.otherParticipant?.phone}
            lastMessageAt={activeConv.lastMessageAt}
            messageCount={messages?.length}
            localStatus={localStatus}
            archived={archived}
            notes={notes}
            onNotesChange={(v) => persist(activeConv.key, { notes: v })}
            onClose={() => setDetailsOpen(false)}
          />
        </div>
      )}

      {showDetailsOverlay && activeConv && (
        <div className="messaging-details-overlay" role="dialog" aria-modal="true">
          <div className="messaging-details-overlay-backdrop" onClick={() => setDetailsOpen(false)} aria-hidden="true" />
          <div className="messaging-details-overlay-sheet">
            <ConversationDetails
              variant={variant}
              viewerRole={viewerRole}
              otherParticipant={activeConv.otherParticipant}
              displayName={otherLabel}
              otherRoleLabel={getOtherRoleLabel(activeConv)}
              email={activeConv.otherParticipant?.email}
              phone={activeConv.otherParticipant?.phone}
              lastMessageAt={activeConv.lastMessageAt}
              messageCount={messages?.length}
              localStatus={localStatus}
              archived={archived}
              notes={notes}
              onNotesChange={(v) => persist(activeConv.key, { notes: v })}
              onClose={() => setDetailsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
