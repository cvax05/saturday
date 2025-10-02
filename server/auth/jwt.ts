import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import type { JWTPayload } from '@shared/schema';

// Mandatory JWT secret - fail startup if not provided
const JWT_SECRET = process.env.SESSION_SECRET as string;
if (!JWT_SECRET) {
  console.error('CRITICAL: SESSION_SECRET environment variable is required for JWT authentication');
  console.error('Please set a strong, random SESSION_SECRET before starting the server');
  process.exit(1);
}

const JWT_EXPIRES_IN = '7d'; // 7 days
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function signJWT(payload: Omit<JWTPayload, 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    console.error('JWT decode failed:', error);
    return null;
  }
}

/**
 * Set auth cookie with consistent options across all auth routes
 * Uses httpOnly for security, lax sameSite for cross-page navigation,
 * and secure only in production (behind HTTPS proxy)
 */
export function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction, // Only use secure in production (requires HTTPS)
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}