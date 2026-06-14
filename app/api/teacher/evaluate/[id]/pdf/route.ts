import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const BUCKET = 'uploads';

export async function GET(
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
  const { data: row, error } = await supabase
    .from('student_results')
    .select('id, pdf_url, evaluated_by')
    .eq('id', id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const allowed = row.evaluated_by === profile.id || row.evaluated_by === null;
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!row.pdf_url) {
    return NextResponse.json({ error: 'No PDF' }, { status: 404 });
  }

  // Extract storage path from public URL (e.g. .../uploads/evaluations/... -> evaluations/...)
  const urlPath = new URL(row.pdf_url).pathname;
  const bucketSegment = `${BUCKET}/`;
  const idx = urlPath.indexOf(bucketSegment);
  const path = idx >= 0 ? urlPath.slice(idx + bucketSegment.length) : null;

  if (!path || path.length === 0) {
    return NextResponse.json({ error: 'Invalid PDF URL' }, { status: 400 });
  }

  let buffer: ArrayBuffer;
  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (!downloadError && blob) {
    buffer = await blob.arrayBuffer();
  } else {
    // Fallback: fetch the public URL (works if bucket is public and path was wrong)
    console.warn('Storage download failed, trying public URL:', downloadError?.message);
    const res = await fetch(row.pdf_url, { cache: 'no-store', headers: { Accept: 'application/pdf' } });
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to load PDF' }, { status: 502 });
    }
    buffer = await res.arrayBuffer();
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'private, max-age=60',
    },
  });
}
