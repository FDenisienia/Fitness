import React, { useMemo, useState } from 'react';
import ConversationItem from './ConversationItem';
import { EmptySearch, EmptyInboxFirst } from './EmptyStates';

export default function ConversationList({
  conversations,
  selectedKey,
  onSelectConversation,
  loading,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  filterTabs,
  sortRecentFirst,
  onSortChange,
  getUnread,
  getContextLabel,
  getOtherRoleLabel,
  isArchived,
  emptyFirstMessage,
}) {
  const [localQuery, setLocalQuery] = useState('');
  const q = searchQuery !== undefined ? searchQuery : localQuery;
  const setQ = onSearchChange || ((v) => setLocalQuery(v));

  const filtered = useMemo(() => {
    let list = [...conversations];

    if (activeFilter === 'unread') {
      list = list.filter((c) => (getUnread(c) ?? 0) > 0);
    } else if (activeFilter === 'clients') {
      list = list.filter((c) => c.otherRole === 'cliente');
    } else if (activeFilter === 'coaches') {
      list = list.filter((c) => c.otherRole === 'coach');
    } else if (activeFilter === 'archived') {
      list = list.filter((c) => isArchived(c.key));
    } else {
      list = list.filter((c) => !isArchived(c.key));
    }

    const term = (typeof q === 'string' ? q : '').trim().toLowerCase();
    if (term) {
      list = list.filter((c) => {
        const name = [c.otherParticipant?.name, c.otherParticipant?.lastName].filter(Boolean).join(' ').toLowerCase();
        const prev = (c.lastMessagePreview || '').toLowerCase();
        return name.includes(term) || prev.includes(term);
      });
    }

    list.sort((a, b) => {
      const ta = new Date(a.lastMessageAt || 0).getTime();
      const tb = new Date(b.lastMessageAt || 0).getTime();
      return sortRecentFirst ? tb - ta : ta - tb;
    });

    return list;
  }, [conversations, activeFilter, q, getUnread, isArchived, sortRecentFirst]);

  return (
    <div className="messaging-sidebar-inner">
      <div className="messaging-sidebar-toolbar">
        <div className="messaging-search-wrap">
          <span className="messaging-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="search"
            className="messaging-search-input"
            placeholder="Buscar por nombre o mensaje…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar conversaciones"
          />
        </div>

        <div className="messaging-filter-row" role="tablist" aria-label="Filtros de conversaciones">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeFilter === tab.id}
              className={`messaging-filter-tab ${activeFilter === tab.id ? 'messaging-filter-tab--active' : ''}`}
              onClick={() => onFilterChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="messaging-sort-row">
          <label className="messaging-sort-label">
            <input type="checkbox" checked={sortRecentFirst} onChange={(e) => onSortChange(e.target.checked)} />
            <span>Recientes primero</span>
          </label>
        </div>
      </div>

      <div className="messaging-conv-list" role="list">
        {loading && conversations.length === 0 ? (
          <div className="messaging-skeleton-list" aria-busy="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="messaging-skeleton-item" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyInboxFirst />
        ) : filtered.length === 0 ? (
          <EmptySearch />
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.key}
              conv={conv}
              selected={selectedKey === conv.key}
              unread={getUnread(conv)}
              contextLabel={getContextLabel(conv)}
              otherRoleLabel={getOtherRoleLabel(conv)}
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>

      {!loading && conversations.length > 0 && emptyFirstMessage && (
        <p className="messaging-sidebar-footnote">{emptyFirstMessage}</p>
      )}
    </div>
  );
}
