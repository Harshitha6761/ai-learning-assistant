'use client';

export function SignOutButton() {
  async function handleSignOut() {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch (_) {}
    window.location.href = '/';
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
      Sign out
    </button>
  );
}