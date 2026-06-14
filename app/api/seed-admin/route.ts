import { NextResponse } from 'next/server';

// Admin is created in DB migration (users table). This endpoint is a no-op.
export async function POST() {
  return NextResponse.json({ ok: true, message: 'Admin is managed via database (migration).' });
}
