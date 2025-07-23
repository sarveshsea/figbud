import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../config/jwt';
import { DB } from '../config/databaseConfig';
import { RedisService } from '../services/redis';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  userId?: string;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
    return;
  }

  const payload = JwtService.verifyAccessToken(token);
  if (!payload) {
    res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
    return;
  }

  // Check Redis cache for session first
  const sessionCacheKey = RedisService.keys.userSession(token);
  let session = await RedisService.getJSON(sessionCacheKey);
  
  if (!session) {
    // Check database if not in cache
    session = await DB.findSessionByToken(token);
    if (!session) {
      res.status(403).json({ 
        success: false, 
        message: 'Session not found or expired' 
      });
      return;
    }
    // Cache the session
    await RedisService.setJSON(sessionCacheKey, session, RedisService.TTL.USER_SESSION);
  }

  req.user = payload;
  req.userId = payload.userId;
  next();
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = JwtService.verifyAccessToken(token);
    if (payload) {
      const sessionCacheKey = RedisService.keys.userSession(token);
      let session = await RedisService.getJSON(sessionCacheKey);
      
      if (!session) {
        session = await DB.findSessionByToken(token);
        if (session) {
          await RedisService.setJSON(sessionCacheKey, session, RedisService.TTL.USER_SESSION);
        }
      }
      
      if (session) {
        req.user = payload;
        req.userId = payload.userId;
      }
    }
  }

  next();
};

export const requirePremium = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.userId) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }

  // Check Redis cache for user data
  const userCacheKey = RedisService.keys.userData(req.userId);
  let user: any = await RedisService.getJSON(userCacheKey);
  
  if (!user) {
    user = await DB.findUserById(req.userId);
    if (user) {
      await RedisService.setJSON(userCacheKey, user, RedisService.TTL.USER_DATA);
    }
  }
  
  if (!user || user?.subscription?.tier !== 'premium' || user?.subscription?.status !== 'active') {
    res.status(403).json({ 
      success: false, 
      message: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    });
    return;
  }

  next();
};

export const rateLimitByUser = (maxRequests: number, windowMs: number) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.userId || req.ip || 'anonymous';
    const endpoint = req.originalUrl || req.url;
    const rateLimitKey = RedisService.keys.rateLimit(userId, endpoint);
    
    // Try Redis first, fallback to memory if Redis is not available
    if (RedisService.isAvailable()) {
      const current = await RedisService.get(rateLimitKey);
      const count = current ? parseInt(current) : 0;
      
      if (count >= maxRequests) {
        const ttl = await RedisService.client?.ttl(rateLimitKey) || 0;
        res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Try again in ${ttl} seconds.`,
          retryAfter: ttl
        });
        return;
      }
      
      await RedisService.set(rateLimitKey, (count + 1).toString(), Math.ceil(windowMs / 1000));
      next();
    } else {
      // Fallback to in-memory rate limiting
      const requests = new Map<string, { count: number; resetTime: number }>();
      const now = Date.now();
      const userRequests = requests.get(userId);

      if (!userRequests || userRequests.resetTime <= now) {
        requests.set(userId, { count: 1, resetTime: now + windowMs });
        next();
        return;
      }

      if (userRequests.count >= maxRequests) {
        const resetTime = Math.ceil((userRequests.resetTime - now) / 1000);
        res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Try again in ${resetTime} seconds.`,
          retryAfter: resetTime
        });
        return;
      }

      userRequests.count++;
      next();
    }
  };
};