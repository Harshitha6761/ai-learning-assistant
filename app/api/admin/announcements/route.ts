import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const title = body?.title?.trim();
  const bodyText = body?.body?.trim();
  if (!title || !bodyText) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from('announcements').insert({ title, body: bodyText }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const supabase = await createServiceClient();
  await supabase.from('announcements').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
