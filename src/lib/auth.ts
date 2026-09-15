import * as jose from 'jose';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import type { User } from './types';
import { SERVER_ENV } from './server-env';
// JWT Secret (in production, use environment variable)
const JWT_SECRET = SERVER_ENV.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SESSION_EXPIRY_DAYS = 30;

export interface JWTPayload {
  userId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

// Password hashing (Removed)


// JWT Token generation
export async function generateJWT(payload: { userId: string; sessionId: string }): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_EXPIRY_DAYS}d`)
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Session token generation
export function generateSessionToken(): string {
  return nanoid(64);
}

// Cookie helpers
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: true, // Đảm bảo cookie chạy được trên Pi Browser (yêu cầu HTTPS)
    sameSite: 'none', // Chống lỗi mất session khi chạy trên Safari/điện thoại
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 30 days in seconds
    path: '/',
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth-token')?.value;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

// Session expiry calculation
export function getSessionExpiryDate(): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS);
  return expiryDate;
}

// User sanitization (remove sensitive data and normalize fields)
export function sanitizeUser(user: any): User {
  return {
    id: user.id,
    name: user.name || user.username || 'Pioneer',
    pi_uid: user.pi_uid,
    username: user.username,
    avatar_url: user.avatar_url || null,
    credits: Number(user.credits ?? 3),
    is_vip: Boolean(user.is_vip),
    remove_ads: Boolean(user.remove_ads || user.is_vip),
    remote_render_until: user.remote_render_until ? new Date(user.remote_render_until) : null,
    email: user.email || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login: user.last_login || null,
  };
}

// Validation helpers
export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 50;
}
