import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@shared/schema';

// Mandatory JWT secret - fail startup if not provided
const JWT_SECRET = process.env.SESSION_SECRET as string;
if (!JWT_SECRET) {
  console.error('CRITICAL: SESSION_SECRET environment variable is required for JWT authentication');
  console.error('Please set a strong, random SESSION_SECRET before starting the server');
  process.exit(1);
}

const JWT_EXPIRES_IN = '7d'; // 7 days

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