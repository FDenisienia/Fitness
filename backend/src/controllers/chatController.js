import * as chatCoachClient from '../services/chatCoachClientService.js';
import * as chatAdminCoach from '../services/chatAdminCoachService.js';
import * as chatUnread from '../services/chatUnreadService.js';

/** Coach–cliente */
export async function coachClientMe(req, res, next) {
  try {
    if (req.userRole !== 'cliente') {
      return res.status(403).json({ success: false, error: 'Solo para clientes' });
    }
    const data = await chatCoachClient.getMyConversationClient(req.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function coachClientInbox(req, res, next) {
  try {
    if (req.userRole !== 'coach') {
      return res.status(403).json({ success: false, error: 'Solo para coaches' });
    }
    const data = await chatCoachClient.listInboxForCoach(req.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function coachClientMessages(req, res, next) {
  try {
    const { conversationId, clientId } = req.query;
    const data = await chatCoachClient.listMessages({
      userId: req.userId,
      role: req.userRole,
      conversationId: conversationId || undefined,
      clientId: clientId || undefined,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function coachClientSend(req, res, next) {
  try {
    const { content, conversationId, clientId } = req.body || {};
    const data = await chatCoachClient.sendMessage({
      userId: req.userId,
      role: req.userRole,
      conversationId: conversationId || undefined,
      clientId: clientId || undefined,
      content,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/** Admin–coach */
export async function adminCoachMyConversation(req, res, next) {
  try {
    if (req.userRole !== 'coach') {
      return res.status(403).json({ success: false, error: 'Solo para coaches' });
    }
    const data = await chatAdminCoach.getOrCreateConversationForCoach(req.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function adminCoachInbox(req, res, next) {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Solo para administradores' });
    }
    const data = await chatAdminCoach.listConversationsForAdmin(req.userId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function adminCoachMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const data = await chatAdminCoach.listMessages({
      userId: req.userId,
      role: req.userRole,
      conversationId,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function adminCoachSend(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { content } = req.body || {};
    const data = await chatAdminCoach.sendMessage({
      userId: req.userId,
      role: req.userRole,
      conversationId,
      content,
    });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function unreadSummary(req, res, next) {
  try {
    const data = await chatUnread.getUnreadSummary(req.userId, req.userRole);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
