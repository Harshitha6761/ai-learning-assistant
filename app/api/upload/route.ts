import { NextRequest, NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

const BUCKET = 'uploads';

export async function POST(request: NextRequest) {
  const profile = await getProfileWithRole();
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'general';
    if (!file?.size) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${profile.id}/${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    await supabase.from('uploads').insert({
      user_id: profile.id,
      bucket: BUCKET,
      path: uploadData.path,
      name: file.name,
      mime_type: file.type,
      meta: { folder },
    });

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
    return NextResponse.json({ path: uploadData.path, url: urlData.publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
