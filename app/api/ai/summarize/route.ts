import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { normalizeFromBuffer } from '@/lib/content/normalize';
import { summarizeContent } from '@/lib/ai/provider';

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const text = formData.get('text') as string | null;

    let textContent = '';
    let imageParts: Array<{ mimeType: string; data: string }> | undefined;

    if (file?.size) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const normalized = await normalizeFromBuffer(buffer, file.type);
      textContent = normalized.text;
      imageParts = normalized.imageParts;
      if (!textContent && !imageParts?.length) {
        return NextResponse.json({ error: 'Could not extract content from file' }, { status: 400 });
      }
    } else if (text?.trim()) {
      textContent = text.trim();
    } else {
      return NextResponse.json({ error: 'Provide file or text' }, { status: 400 });
    }

    const summary = await summarizeContent(textContent || 'Describe this image.', imageParts);
    return NextResponse.json({ summary });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}
