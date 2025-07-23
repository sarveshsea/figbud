import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticateToken, optionalAuth, rateLimitByUser } from '../middleware/auth';

const router = Router();

// Chat endpoints with rate limiting
router.post('/message', 
  optionalAuth, 
  rateLimitByUser(20, 60000), // 20 requests per minute
  ChatController.processMessage
);

router.get('/tutorials', 
  optionalAuth,
  rateLimitByUser(10, 60000), // 10 requests per minute
  ChatController.searchTutorials
);

router.post('/create-demo', 
  optionalAuth,
  rateLimitByUser(5, 60000), // 5 requests per minute
  ChatController.createDemo
);

router.post('/guidance', 
  optionalAuth,
  rateLimitByUser(15, 60000), // 15 requests per minute
  ChatController.getGuidance
);

router.post('/analyze', 
  optionalAuth,
  rateLimitByUser(10, 60000), // 10 requests per minute
  ChatController.analyzeDesign
);

router.post('/components/search',
  optionalAuth,
  rateLimitByUser(20, 60000), // 20 requests per minute
  ChatController.searchComponents
);

router.get('/components/:componentId/code',
  optionalAuth,
  rateLimitByUser(15, 60000), // 15 requests per minute
  ChatController.getComponentCode
);

router.get('/history',
  authenticateToken,
  rateLimitByUser(10, 60000), // 10 requests per minute
  ChatController.getChatHistory
);

router.post('/session/end',
  optionalAuth,
  rateLimitByUser(5, 60000), // 5 requests per minute
  ChatController.endChatSession
);

router.get('/conversations/:conversationId/messages',
  optionalAuth,
  rateLimitByUser(20, 60000), // 20 requests per minute
  ChatController.getConversationMessages
);

export default router;