'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const ADMIN_EMAIL = 'admin123@gmail.com';

type LoginAs = 'admin' | 'teacher' | 'student';

function LoginForm() {
  const [loginAs, setLoginAs] = useState<LoginAs | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const messageFromUrl = searchParams.get('message');

  function selectOption(option: LoginAs) {
    setLoginAs(option);
    setMessage('');
    setEmail('');
    setPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loginAs) return;
    setLoading(true);
    setMessage('');
    const submitEmail = loginAs === 'admin' ? (email.trim() || ADMIN_EMAIL) : email.trim();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: submitEmail,
        password,
        loginAs,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.replace('/dashboard');
      return;
    }
    setLoading(false);
    setMessage(data.error || 'Login failed. Try again.');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[linear-gradient(to_bottom_right,#f8fafc_0%,#f1f5f9_100%)]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">ExamPrep</Link>
          <p className="mt-2 text-slate-500 text-sm">Sign in with your role</p>
        </div>
        {(error === 'auth' || error === 'session') && (
          <p className="rounded-lg bg-amber-50 text-amber-800 text-sm p-3 mb-4 border border-amber-200">Authentication failed. Try again.</p>
        )}
        {error === 'role' && messageFromUrl && (
          <p className="rounded-lg bg-amber-50 text-amber-800 text-sm p-3 mb-4 border border-amber-200">{decodeURIComponent(messageFromUrl)}</p>
        )}

        {!loginAs ? (
          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => selectOption('admin')}
              className="w-full rounded-xl border-2 border-slate-200 py-3.5 px-4 text-left font-semibold text-slate-800 hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
            >
              Login as Admin
            </button>
            <button
              type="button"
              onClick={() => selectOption('teacher')}
              className="w-full rounded-xl border-2 border-slate-200 py-3.5 px-4 text-left font-semibold text-slate-800 hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
            >
              Login as Teacher
            </button>
            <button
              type="button"
              onClick={() => selectOption('student')}
              className="w-full rounded-xl border-2 border-slate-200 py-3.5 px-4 text-left font-semibold text-slate-800 hover:border-primary-400 hover:bg-primary-50/50 transition-colors"
            >
              Login as Student
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-primary-100 px-3 py-1.5 text-sm font-semibold text-primary-800 capitalize">
                {loginAs}
              </span>
              <button
                type="button"
                onClick={() => setLoginAs(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Change role
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={loginAs !== 'admin'}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            {message && <p className="rounded-lg bg-red-50 text-red-700 text-sm p-3 border border-red-100">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-lg shadow-slate-900/20"
            >
              {loading ? 'Signing in…' : `Sign in as ${loginAs}`}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-primary-600 hover:text-primary-700 hover:underline transition-colors">Back to home</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}