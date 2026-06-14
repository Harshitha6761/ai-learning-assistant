import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin123@gmail.com';

export async function GET() {
  const profile = await getProfileWithRole();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const email = body?.email?.trim()?.toLowerCase();
  const password = body?.password;
  const role = body?.role === 'teacher' ? 'teacher' : 'student';
  const full_name = body?.full_name?.trim() || null;

  if (!email || !password || password.length < 6) {
    return NextResponse.json({ error: 'Email and password (min 6 chars) required' }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 10);
  const supabase = await createServiceClient();
  const { data: user, error } = await supabase
    .from('users')
    .insert({ email, password_hash: hash, role, full_name })
    .select('id, email, role')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ id: user.id, email: user.email, full_name: user.full_name, role: user.role });
}

export async function DELETE(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }
  if (userId === profile.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data: target } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
  if (target?.email === ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Cannot remove the default admin account' }, { status: 400 });
  }

  await supabase.from('users').delete().eq('id', userId);
  return NextResponse.json({ ok: true });
}
