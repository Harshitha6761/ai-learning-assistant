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
  const exam_date = body?.exam_date;
  const exam_type = body?.exam_type === 'sem' ? 'sem' : 'mid';
  if (!title || !exam_date) {
    return NextResponse.json({ error: 'title and exam_date required' }, { status: 400 });
  }
  const supabase = await createServiceClient();
  const { data, error } = await supabase.from('exam_dates').insert({ title, exam_date, exam_type }).select().single();
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
  await supabase.from('exam_dates').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
