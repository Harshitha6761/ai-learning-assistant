import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { createToken, COOKIE_NAME } from '@/lib/auth';

const ADMIN_EMAIL = 'admin123@gmail.com';

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; loginAs?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const email = body.email?.trim();
  const password = body.password;
  const loginAs = body.loginAs;
  if (!email || !password || !loginAs) {
    return NextResponse.json({ error: 'Email, password and loginAs required' }, { status: 400 });
  }
  const allowed: Record<string, string[]> = {
    admin: ['admin'],
    teacher: ['admin', 'teacher'],
    student: ['student'],
  };
  if (!allowed[loginAs]) {
    return NextResponse.json({ error: 'Invalid loginAs' }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, password_hash, role')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const role = user.role as string;
  if (!allowed[loginAs].includes(role)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = await createToken({ id: user.id, email: user.email, role: role as 'admin' | 'teacher' | 'student' });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
  return res;
}
