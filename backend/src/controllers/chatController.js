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

function firstQueryParam(val) {
  if (val == null) return undefined;
  const v = Array.isArray(val) ? val[0] : val;
  const s = String(v).trim();
  return s === '' ? undefined : s;
}

export async function coachClientMessages(req, res, next) {
  try {
    const conversationId = firstQueryParam(req.query?.conversationId);
    const clientId = firstQueryParam(req.query?.clientId);
    const limit = firstQueryParam(req.query?.limit);
    const data = await chatCoachClient.listMessages({
      userId: req.userId,
      role: req.userRole,
      conversationId,
      clientId,
      limit,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function coachClientSend(req, res, next) {
  try {
    const body = req.body || {};
    const content = body.content;
    const conversationId = firstQueryParam(body.conversationId);
    const clientId = firstQueryParam(body.clientId);
    const data = await chatCoachClient.sendMessage({
      userId: req.userId,
      role: req.userRole,
      conversationId,
      clientId,
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
    const limit = firstQueryParam(req.query?.limit);
    const data = await chatAdminCoach.listMessages({
      userId: req.userId,
      role: req.userRole,
      conversationId,
      limit,
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
