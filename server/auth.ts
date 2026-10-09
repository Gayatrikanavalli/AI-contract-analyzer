import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { NextFunction, Request, Response } from 'express';

export interface AuthUser {
  id: string;
  email: string;
}

type StoredUser = AuthUser & { passwordSalt: string; passwordHash: string };
type AuthenticatedRequest = Request & { user?: AuthUser };

const USERS_FILE = process.env.AUTH_USERS_FILE || path.join(process.cwd(), 'data', 'auth-users.json');
const SESSION_COOKIE = 'contract_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const SESSION_SECRET = process.env.AUTH_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const users = new Map<string, StoredUser>();

try {
  const storedUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as StoredUser[];
  storedUsers.forEach((user) => users.set(user.email, user));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    console.error('Could not load auth users:', error);
  }
}

function persistUsers() {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  const temporaryFile = `${USERS_FILE}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(Array.from(users.values()), null, 2), { mode: 0o600 });
  fs.renameSync(temporaryFile, USERS_FILE);
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createSession(user: AuthUser) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifySession(token: string): AuthUser | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest();
  let actual: Buffer;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      sub: string;
      email: string;
      exp: number;
    };
    const user = users.get(session.email);
    if (!user || user.id !== session.sub || session.exp <= Date.now() / 1000) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export function registerUser(emailInput: unknown, passwordInput: unknown): AuthUser {
  const email = typeof emailInput === 'string' ? emailInput.trim().toLowerCase() : '';
  const password = typeof passwordInput === 'string' ? passwordInput : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Enter a valid email address.');
  }
  if (password.length < 8 || password.length > 128) {
    throw new Error('Password must be between 8 and 128 characters.');
  }
  if (users.has(email)) {
    throw new Error('An account with this email already exists.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const user: StoredUser = {
    id: crypto.randomUUID(),
    email,
    passwordSalt: salt,
    passwordHash: hashPassword(password, salt),
  };
  users.set(email, user);
  try {
    persistUsers();
  } catch (error) {
    users.delete(email);
    throw error;
  }
  return { id: user.id, email: user.email };
}

export function authenticateUser(emailInput: unknown, passwordInput: unknown): AuthUser | null {
  const email = typeof emailInput === 'string' ? emailInput.trim().toLowerCase() : '';
  const password = typeof passwordInput === 'string' ? passwordInput : '';
  const user = users.get(email);
  const salt = user?.passwordSalt || 'invalid-user-salt';
  const candidate = Buffer.from(hashPassword(password.slice(0, 128), salt), 'hex');
  const expected = user ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(candidate.length);
  const matches = candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  return user && matches ? { id: user.id, email: user.email } : null;
}

export function setSessionCookie(res: Response, user: AuthUser) {
  res.cookie(SESSION_COOKIE, createSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/',
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

export function requireAuthentication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const cookieHeader = req.headers.cookie || '';
  const sessionCookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  const token = sessionCookie?.slice(SESSION_COOKIE.length + 1);
  const user = token ? verifySession(decodeURIComponent(token)) : null;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  req.user = user;
  next();
}

export function getAuthenticatedUser(req: Request): AuthUser {
  return (req as AuthenticatedRequest).user!;
}
