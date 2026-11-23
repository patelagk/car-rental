import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const FALLBACK_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

function getSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || FALLBACK_SESSION_SECRET;
}

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash: derived, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function timingSafeStringMatch(input: string, expected: string): boolean {
  const a = crypto.createHash('sha256').update(input).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

interface AdminTokenPayload {
  email: string;
  role: 'admin';
  exp: number;
}

export function issueAdminToken(email: string): string {
  const payload: AdminTokenPayload = {
    email,
    role: 'admin',
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as AdminTokenPayload;
    if (parsed.role !== 'admin' || !parsed.email || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  adminUser?: AdminTokenPayload;
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin authentication required.' });
    return;
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    res.status(403).json({ error: 'Invalid or expired admin session.' });
    return;
  }

  req.adminUser = payload;
  next();
}
