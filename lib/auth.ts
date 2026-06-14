import { cookies } from 'next/headers';
import * as jose from 'jose';
import type { Role } from '@/types/database';

const COOKIE_NAME = 'exam_prep_session';
const JWT_SECRET = process.env.JWT_SECRET || 'exam-prep-dev-secret-change-in-production';

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
}

async function getSecret() {
  return new TextEncoder().encode(JWT_SECRET);
}

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const secret = await getSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    const sub = payload.sub;
    const email = payload.email as string;
    const role = payload.role as Role;
    if (!sub || !email || !role) return null;
    return { id: sub, email, role };
  } catch {
    return null;
  }
}

export async function getProfileWithRole(): Promise<SessionUser | null> {
  return getSessionFromCookie();
}

export function requireRole(allowed: Role[]) {
  return async function check() {
    const profile = await getProfileWithRole();
    if (!profile) return { error: 'Unauthorized', status: 401 as const };
    if (!allowed.includes(profile.role)) return { error: 'Forbidden', status: 403 as const };
    return { profile };
  };
}

export const requireAdmin = requireRole(['admin']);
export const requireTeacher = requireRole(['admin', 'teacher']);
export const requireStudent = requireRole(['student']);
export const requireAny = requireRole(['admin', 'teacher', 'student']);

export async function createToken(user: SessionUser): Promise<string> {
  const secret = await getSecret();
  return new jose.SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setExpirationTime('7d')
    .sign(secret);
}

export { COOKIE_NAME };
