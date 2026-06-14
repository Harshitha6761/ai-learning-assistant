import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const ADMIN_EMAIL = 'admin123@gmail.com';

export async function PUT(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const userId = body?.userId;
  const role = body?.role;
  if (!userId || !['admin', 'teacher', 'student'].includes(role)) {
    return NextResponse.json({ error: 'Invalid userId or role' }, { status: 400 });
  }
  const supabase = await createServiceClient();
  const { data: target } = await supabase.from('users').select('email').eq('id', userId).maybeSingle();
  if (target?.email === ADMIN_EMAIL && role !== 'admin') {
    return NextResponse.json({ error: 'Cannot change the default admin role' }, { status: 400 });
  }
  const { error } = await supabase.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
