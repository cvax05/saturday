import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@shared/schema';

const JWT_SECRET = process.env.SESSION_SECRET || 'your-default-jwt-secret';
const JWT_EXPIRES_IN = '7d'; // 7 days

export function signJWT(payload: Omit<JWTPayload, 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
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