import { Request, Response, NextFunction } from 'express';
import { JwtService, JwtPayload } from '../config/jwt';
import { Database } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  userId?: string;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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

  // Check if session exists and is valid
  const session = Database.findSessionByToken(token);
  if (!session) {
    res.status(403).json({ 
      success: false, 
      message: 'Session not found or expired' 
    });
    return;
  }

  // Update last accessed time
  session.lastAccessedAt = new Date();

  req.user = payload;
  req.userId = payload.userId;
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const payload = JwtService.verifyAccessToken(token);
    if (payload) {
      const session = Database.findSessionByToken(token);
      if (session) {
        req.user = payload;
        req.userId = payload.userId;
        session.lastAccessedAt = new Date();
      }
    }
  }

  next();
};

export const requirePremium = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.userId) {
    res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
    return;
  }

  const user = Database.findUserById(req.userId);
  if (!user || user.subscription.tier !== 'premium' || user.subscription.status !== 'active') {
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
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userId = req.userId || req.ip || 'anonymous';
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || userRequests.resetTime <= now) {
      requests.set(userId || 'anonymous', { count: 1, resetTime: now + windowMs });
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
  };
};