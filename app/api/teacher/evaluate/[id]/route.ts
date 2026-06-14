import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const MID_QUESTIONS = 11;
const SEM_QUESTIONS = 20;
const MID_MAX = 30;
const SEM_MAX = 60;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfileWithRole();
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const body = await request.json();
  const examName = body?.exam_name?.trim();
  const subject = body?.subject?.trim();
  const examType = body?.exam_type === 'sem' ? 'sem' : body?.exam_type === 'mid' ? 'mid' : undefined;
  const marksBreakdown = Array.isArray(body?.marks_breakdown) ? body.marks_breakdown : undefined;

  const supabase = await createServiceClient();
  const { data: row } = await supabase
    .from('student_results')
    .select('id, evaluated_by')
    .eq('id', id)
    .maybeSingle();

  const allowed = row && (row.evaluated_by === profile.id || row.evaluated_by === null);
  if (!allowed) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });
  }

  const updates: {
    exam_name?: string;
    subject?: string;
    marks?: number;
    max_marks?: number;
    evaluated_by?: string;
    exam_type?: string;
    marks_breakdown?: number[];
  } = {};
  if (row.evaluated_by === null) updates.evaluated_by = profile.id;
  if (examName !== undefined) updates.exam_name = examName;
  if (subject !== undefined) updates.subject = subject;

  if (examType !== undefined && marksBreakdown !== undefined) {
    const len = examType === 'mid' ? MID_QUESTIONS : SEM_QUESTIONS;
    const arr = marksBreakdown.slice(0, len).map((n: unknown) => Number(n) || 0);
    while (arr.length < len) arr.push(0);
    const total = arr.reduce((s, n) => s + n, 0);
    updates.marks = total;
    updates.max_marks = examType === 'mid' ? MID_MAX : SEM_MAX;
    updates.exam_type = examType;
    updates.marks_breakdown = arr;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from('student_results').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getProfileWithRole();
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const supabase = await createServiceClient();
  const { data: row } = await supabase
    .from('student_results')
    .select('id, evaluated_by')
    .eq('id', id)
    .maybeSingle();

  const allowed = row && (row.evaluated_by === profile.id || row.evaluated_by === null);
  if (!allowed) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });
  }

  const { error } = await supabase.from('student_results').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
