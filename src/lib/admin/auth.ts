import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';

// Self-contained admin auth: email/password from env + an HMAC-signed cookie.
// Intentionally independent of the (Phase 6) end-user auth system.

const COOKIE = 'bx_admin';
const MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || `${process.env.ADMIN_PASSWORD ?? 'insecure'}::botbrix`;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function checkCredentials(email: string, password: string): boolean {
  if (!isAdminConfigured()) return false;
  const okEmail = safeEqual(email.trim().toLowerCase(), (process.env.ADMIN_EMAIL ?? '').toLowerCase());
  const okPass = safeEqual(password, process.env.ADMIN_PASSWORD ?? '');
  return okEmail && okPass;
}

function makeToken(): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', iat: Date.now(), exp: Date.now() + MAX_AGE_S * 1000 })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function tokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return false;
  if (!safeEqual(sig, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export async function startAdminSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, makeToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_S
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return tokenValid(store.get(COOKIE)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}
