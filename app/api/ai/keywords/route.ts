import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { normalizeFromBuffer } from '@/lib/content/normalize';
import { extractKeywords } from '@/lib/ai/provider';

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

    if (file?.size) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const normalized = await normalizeFromBuffer(buffer, file.type);
      textContent = normalized.text;
      if (!textContent && !normalized.imageParts?.length) {
        return NextResponse.json({ error: 'Could not extract text from file (images need OCR)' }, { status: 400 });
      }
    } else if (text?.trim()) {
      textContent = text.trim();
    } else {
      return NextResponse.json({ error: 'Provide file or text' }, { status: 400 });
    }

    if (!textContent) {
      return NextResponse.json({ count: 0, keywords: [] });
    }

    const result = await extractKeywords(textContent);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Keyword extraction failed' }, { status: 500 });
  }
}
