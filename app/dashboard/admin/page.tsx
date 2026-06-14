import { redirect } from 'next/navigation';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { AdminPanel } from './AdminPanel';

export default async function AdminPage() {
  const profile = await getProfileWithRole();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  const supabase = await createServiceClient();
  const { data: users } = await supabase.from('users').select('id, email, full_name, role').order('created_at', { ascending: false });
  const { data: examDates } = await supabase.from('exam_dates').select('*').order('exam_date');
  const { data: announcements } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-800">Admin</h1>
      <AdminPanel
        initialProfiles={users ?? []}
        initialExamDates={examDates ?? []}
        initialAnnouncements={announcements ?? []}
      />
    </div>
  );
}
