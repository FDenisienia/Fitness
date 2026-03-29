import { Router } from 'express';
import * as chatController from '../controllers/chatController.js';
import { authMiddleware, attachUser, requireRole } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware, attachUser);

router.get(
  '/unread-summary',
  requireRole('cliente', 'coach', 'admin'),
  chatController.unreadSummary
);

/** Chat coach ↔ cliente */
router.get('/coach-client/me', requireRole('cliente'), chatController.coachClientMe);
router.get('/coach-client/inbox', requireRole('coach'), chatController.coachClientInbox);
router.get(
  '/coach-client/messages',
  requireRole('cliente', 'coach'),
  chatController.coachClientMessages
);
router.post(
  '/coach-client/messages',
  requireRole('cliente', 'coach'),
  chatController.coachClientSend
);

/** Chat admin ↔ coach */
router.get(
  '/admin-coach/conversation',
  requireRole('coach'),
  chatController.adminCoachMyConversation
);
router.get(
  '/admin-coach/inbox',
  requireRole('admin'),
  chatController.adminCoachInbox
);
router.get(
  '/admin-coach/conversations/:conversationId/messages',
  requireRole('admin', 'coach'),
  chatController.adminCoachMessages
);
router.post(
  '/admin-coach/conversations/:conversationId/messages',
  requireRole('admin', 'coach'),
  chatController.adminCoachSend
);

export default router;
