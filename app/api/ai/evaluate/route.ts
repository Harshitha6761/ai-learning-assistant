import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { normalizeFromBuffer } from '@/lib/content/normalize';
import { evaluateAnswer } from '@/lib/ai/provider';

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const referenceFile = formData.get('reference') as File | null;
    const referenceText = formData.get('referenceText') as string | null;
    const answerFile = formData.get('answer') as File | null;
    const answerText = formData.get('answerText') as string | null;
    const questionContext = formData.get('questionContext') as string | null;

    let reference = referenceText?.trim() ?? '';
    if (!reference && referenceFile?.size) {
      const buffer = Buffer.from(await referenceFile.arrayBuffer());
      const normalized = await normalizeFromBuffer(buffer, referenceFile.type);
      reference = normalized.text;
    }

    let answer = answerText?.trim() ?? '';
    if (!answer && answerFile?.size) {
      const buffer = Buffer.from(await answerFile.arrayBuffer());
      const normalized = await normalizeFromBuffer(buffer, answerFile.type);
      answer = normalized.text;
    }

    if (!reference || !answer) {
      return NextResponse.json(
        { error: 'Provide reference material and student answer (file or text)' },
        { status: 400 }
      );
    }

    const result = await evaluateAnswer(reference, answer, questionContext ?? undefined);
    return NextResponse.json({
      marks: result.marks,
      feedback: result.feedback,
      referenceLinks: result.referenceLinks,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
