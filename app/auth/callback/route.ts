import { NextResponse } from 'next/server';

// Auth is email/password via DB and JWT. OAuth callback is not used; redirect to login.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
