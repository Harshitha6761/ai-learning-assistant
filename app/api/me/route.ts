import { NextResponse } from 'next/server';
import { getProfileWithRole } from '@/lib/auth';

export async function GET() {
  const profile = await getProfileWithRole();
  if (!profile) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ id: profile.id, email: profile.email, role: profile.role });
}
