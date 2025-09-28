import type { Request, Response, NextFunction } from 'express';
import { verifyJWT } from './jwt';
import type { JWTPayload } from '@shared/schema';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      schoolId?: string;
      userId?: string;
    }
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const payload = verifyJWT(token);
  if (!payload) {
    // Clear invalid cookie
    res.clearCookie('auth_token');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Add user info to request
  req.user = payload;
  req.schoolId = payload.school_id;
  req.userId = payload.user_id;

  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token;

  if (token) {
    const payload = verifyJWT(token);
    if (payload) {
      req.user = payload;
      req.schoolId = payload.school_id;
      req.userId = payload.user_id;
    }
  }

  next();
}

// Middleware to validate school access
export function requireSchoolAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.schoolId) {
    return res.status(403).json({ error: 'School access required' });
  }
  next();
}