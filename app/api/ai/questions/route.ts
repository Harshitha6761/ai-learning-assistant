import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { normalizeFromBuffer } from '@/lib/content/normalize';
import { generateQuestions } from '@/lib/ai/provider';

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let textContent = '';
  let examType = 'all';

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;
    examType = (formData.get('examType') as string) || 'all';
    const allowed: string[] = ['all', 'mcq', 'fill_blank', 'theory', 'mid', 'sem'];
    if (!allowed.includes(examType)) {
      return NextResponse.json({ error: 'examType must be all, mcq, fill_blank, theory, mid, or sem' }, { status: 400 });
    }

    if (file?.size) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || (file.name?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'text/plain');
      const normalized = await normalizeFromBuffer(buffer, mimeType);
      textContent = normalized.text;
      if (!textContent.trim()) {
        return NextResponse.json(
          { error: 'PDF has no extractable text (e.g. scanned/image PDF). Try pasting the text below or use a text-based PDF.' },
          { status: 400 }
        );
      }
    } else if (text?.trim()) {
      textContent = text.trim();
    } else {
      return NextResponse.json({ error: 'Provide a PDF file or paste text' }, { status: 400 });
    }

    if (!textContent.trim()) {
      return NextResponse.json({ error: 'No text content to generate questions from' }, { status: 400 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ questions: [], error: 'Invalid request. Try again.', examType: 'all' });
  }

  let lastError: string = 'Question generation failed';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const questions = await generateQuestions(textContent, examType as 'all' | 'mcq' | 'fill_blank' | 'theory' | 'mid' | 'sem');
      if (questions?.length) {
        return NextResponse.json({ questions, examType });
      }
      lastError = 'No questions were generated. Try again.';
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Service error';
      lastError = msg.includes('429') ? 'Too many requests. Wait a moment and try again.' : msg.includes('API') ? 'Service temporarily unavailable. Try again.' : 'Generation failed. Try again.';
      console.warn(`Questions attempt ${attempt}/${MAX_ATTEMPTS} failed:`, msg);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }
  }

  return NextResponse.json({ questions: [], error: lastError, examType });
}
