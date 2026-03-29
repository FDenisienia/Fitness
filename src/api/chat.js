import { api } from './client.js';

function qs(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const chatApi = {
  unreadSummary: () => api.get('/chat/unread-summary'),
  coachClientMe: () => api.get('/chat/coach-client/me'),
  coachClientInbox: () => api.get('/chat/coach-client/inbox'),
  coachClientMessages: (params) => api.get(`/chat/coach-client/messages${qs(params)}`),
  coachClientSend: (body) => api.post('/chat/coach-client/messages', body),

  adminCoachConversation: () => api.get('/chat/admin-coach/conversation'),
  adminCoachInbox: () => api.get('/chat/admin-coach/inbox'),
  adminCoachMessages: (conversationId) =>
    api.get(`/chat/admin-coach/conversations/${encodeURIComponent(conversationId)}/messages`),
  adminCoachSend: (conversationId, content) =>
    api.post(`/chat/admin-coach/conversations/${encodeURIComponent(conversationId)}/messages`, { content }),
};
