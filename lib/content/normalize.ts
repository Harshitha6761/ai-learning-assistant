/**
 * Normalize uploads to text + optional images for AI.
 * PDF: extract text (and optionally images) server-side.
 * Photos: pass through as base64 for Gemini.
 */

export interface NormalizedContent {
  text: string;
  imageParts?: Array<{ mimeType: string; data: string }>;
}

export async function normalizePdf(buffer: Buffer): Promise<NormalizedContent> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return { text: data.text ?? '' };
  } catch {
    return { text: '' };
  }
}

export async function normalizeText(raw: string): Promise<NormalizedContent> {
  return { text: raw.trim() };
}

export async function normalizeImage(
  buffer: Buffer,
  mimeType: string
): Promise<NormalizedContent> {
  const base64 = buffer.toString('base64');
  return {
    text: '',
    imageParts: [{ mimeType: mimeType || 'image/jpeg', data: base64 }],
  };
}

export async function normalizeFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<NormalizedContent> {
  if (mimeType === 'application/pdf') return normalizePdf(buffer);
  if (mimeType.startsWith('image/')) return normalizeImage(buffer, mimeType);
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return normalizeText(buffer.toString('utf-8'));
  }
  return normalizeText(buffer.toString('utf-8'));
}
