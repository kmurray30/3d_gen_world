import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';

export const COOKIE = 'pw_auth';
const MAX_AGE_S = 30 * 24 * 3600;

export interface AuthConfig {
  passcode: string;
  secret: string;
  secure: boolean;
}

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function issueCookie(c: Context, cfg: AuthConfig): void {
  const payload = `${Date.now()}`;
  setCookie(c, COOKIE, `${payload}.${sign(cfg.secret, payload)}`, {
    httpOnly: true,
    sameSite: 'Lax',
    secure: cfg.secure,
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

export function isAuthed(c: Context, cfg: AuthConfig): boolean {
  if (!cfg.passcode) return true;
  const raw = getCookie(c, COOKIE);
  if (!raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return false;
  const payload = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!safeEqual(sig, sign(cfg.secret, payload))) return false;
  const issued = Number(payload);
  return Number.isFinite(issued) && Date.now() - issued < MAX_AGE_S * 1000;
}

export function checkPasscode(given: string, cfg: AuthConfig): boolean {
  return !!cfg.passcode && safeEqual(given.trim(), cfg.passcode);
}

export function requireAuth(cfg: AuthConfig): MiddlewareHandler {
  return async (c, next) => {
    if (!isAuthed(c, cfg)) return c.json({ error: 'passcode required' }, 401);
    await next();
  };
}
