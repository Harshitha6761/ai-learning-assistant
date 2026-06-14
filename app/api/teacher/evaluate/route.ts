import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

const BUCKET = 'uploads';

export async function GET() {
  const profile = await getProfileWithRole();
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const supabase = await createServiceClient();
  // Include rows you evaluated (evaluated_by = you) and legacy rows (evaluated_by null, saved before this feature)
  const { data: rows, error } = await supabase
    .from('student_results')
    .select('id, user_id, exam_name, subject, marks, max_marks, pdf_url, created_at, evaluated_by, exam_type, marks_breakdown')
    .or(`evaluated_by.eq.${profile.id},evaluated_by.is.null`)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const userIds = [...new Set((rows ?? []).map((r) => r.user_id))];
  const { data: users } = await supabase.from('users').select('id, email').in('id', userIds);
  const emailBy = (users ?? []).reduce((acc, u) => ({ ...acc, [u.id]: u.email }), {} as Record<string, string>);
  const list = (rows ?? []).map((r) => ({ ...r, student_email: emailBy[r.user_id] ?? '—' }));
  return NextResponse.json(list);
}
const MID_QUESTIONS = 11;
const SEM_QUESTIONS = 20;
const MID_MAX = 30;
const SEM_MAX = 60;

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile || (profile.role !== 'teacher' && profile.role !== 'admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File | null;
    const examType = (formData.get('examType') as string) || 'mid';
    const studentEmail = (formData.get('studentEmail') as string)?.trim()?.toLowerCase();
    const examName = (formData.get('examName') as string)?.trim() || 'Exam';
    const subject = (formData.get('subject') as string)?.trim() || '—';
    const marksJson = formData.get('marks') as string;

    if (!file?.size || !studentEmail) {
      return NextResponse.json({ error: 'PDF file and student email are required' }, { status: 400 });
    }
    if (examType !== 'mid' && examType !== 'sem') {
      return NextResponse.json({ error: 'examType must be mid or sem' }, { status: 400 });
    }

    let marks: number[];
    try {
      marks = JSON.parse(marksJson);
    } catch {
      return NextResponse.json({ error: 'Invalid marks array' }, { status: 400 });
    }

    const expectedLen = examType === 'mid' ? MID_QUESTIONS : SEM_QUESTIONS;
    if (!Array.isArray(marks) || marks.length !== expectedLen) {
      return NextResponse.json({ error: `Exactly ${expectedLen} question marks required for ${examType}` }, { status: 400 });
    }

    const total = marks.reduce((s, n) => s + (Number(n) || 0), 0);
    const maxTotal = examType === 'mid' ? MID_MAX : SEM_MAX;

    const supabase = await createServiceClient();
    const { data: student } = await supabase
      .from('users')
      .select('id')
      .eq('email', studentEmail)
      .eq('role', 'student')
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: 'No student found with that email' }, { status: 400 });
    }

    const resultId = randomUUID();
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `evaluations/${profile.id}/${resultId}.${ext}`;

    let pdfUrl: string | null = null;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type || 'application/pdf', upsert: false });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError.message);
      // Continue without PDF URL so insert can succeed; user can fix bucket policy later
    } else {
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      pdfUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('student_results').insert({
      id: resultId,
      user_id: student.id,
      evaluated_by: profile.id,
      exam_name: examName,
      subject,
      marks: total,
      max_marks: maxTotal,
      pdf_url: pdfUrl,
      exam_type: examType,
      marks_breakdown: marks.slice(0, expectedLen),
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      total,
      maxTotal,
      studentEmail,
      pdfSaved: !!pdfUrl,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}
