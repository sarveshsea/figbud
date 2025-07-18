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

export default router;