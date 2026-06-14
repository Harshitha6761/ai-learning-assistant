'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Profile {
  id: string;
  email: string;
  role: string;
}

export function DashboardClientAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      for (let attempt = 0; attempt < 5 && !cancelled; attempt++) {
        try {
          const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
          if (cancelled) return;
          if (res.ok) {
            const data = await res.json();
            setProfile(data);
            setLoading(false);
            return;
          }
        } catch {
          if (cancelled) return;
        }
        await new Promise((r) => setTimeout(r, 600));
      }
      if (!cancelled) {
        setLoading(false);
        router.replace('/login');
      }
    }
    check();
    return () => { cancelled = true; };
  }, [router]);

  async function handleSignOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (_) {}
    window.location.href = '/';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">Loading…</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-slate-900">ExamPrep</Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <span className="hidden sm:inline text-sm text-slate-500 truncate max-w-[140px]">{profile.email}</span>
            <span className="rounded-md bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">{profile.role}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
              Sign out
            </button>
          </nav>
        </div>
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 pb-3 flex flex-wrap items-center gap-1 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Home</Link>
          {profile.role === 'admin' && <Link href="/dashboard/admin" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Admin</Link>}
          {profile.role === 'teacher' && (
            <>
              <Link href="/dashboard/explore" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Explore</Link>
              <Link href="/dashboard/generate" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Generate paper</Link>
              <Link href="/dashboard/evaluate" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Evaluate</Link>
              <Link href="/dashboard/evaluated-papers" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Evaluated papers</Link>
            </>
          )}
          {profile.role === 'student' && (
            <>
              <Link href="/dashboard/summary" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate.900 font-medium transition-colors">Summary</Link>
              <Link href="/dashboard/keywords" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Keywords</Link>
              <Link href="/dashboard/exam" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Exams</Link>
            </>
          )}
          <Link href="/dashboard/profile" className="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium transition-colors">Profile</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
    </div>
  );
}