'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

const ALLOWED: Record<string, string[]> = {
  admin: ['admin'],
  teacher: ['admin', 'teacher'],
  student: ['student'],
};

export function LoginRoleGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!pathname?.startsWith('/dashboard')) return;
    const loginAs = typeof window !== 'undefined' ? sessionStorage.getItem('loginAs') : null;
    if (!loginAs) {
      setChecked(true);
      return;
    }
    fetch('/api/me', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) {
          sessionStorage.removeItem('loginAs');
          createClient().auth.signOut().then(() => {
            router.replace('/login?error=session');
          });
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const allowed = ALLOWED[loginAs];
        if (!allowed?.includes(data.role)) {
          sessionStorage.removeItem('loginAs');
          createClient().auth.signOut().then(() => {
            const msg = loginAs === 'admin' ? 'Invalid admin credentials.' : loginAs === 'teacher' ? 'You are not registered as a teacher.' : 'You are not registered as a student.';
            router.replace(`/login?error=role&message=${encodeURIComponent(msg)}`);
          });
          return;
        }
        sessionStorage.removeItem('loginAs');
        setChecked(true);
      })
      .catch(() => {
        sessionStorage.removeItem('loginAs');
        setChecked(true);
      });
  }, [pathname, router]);

  return null;
}
