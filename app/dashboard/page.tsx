import { getProfileWithRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const profile = await getProfileWithRole();
  const supabase = await createClient();

  const { data: examDates } = await supabase
    .from('exam_dates')
    .select('id, title, exam_date, exam_type')
    .order('exam_date', { ascending: true });

  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, body, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-slate-800">
        Welcome, {profile?.email?.split('@')[0] ?? 'User'}
      </h1>

      <section>
        <h2 className="text-lg font-medium text-slate-700 mb-2">Exam dates</h2>
        {examDates?.length ? (
          <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {examDates.map((d) => (
              <li key={d.id} className="px-4 py-3 flex justify-between">
                <span>{d.title}</span>
                <span className="text-slate-500 text-sm">
                  {new Date(d.exam_date).toLocaleDateString()} ({d.exam_type})
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">No exam dates set.</p>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-700 mb-2">Announcements</h2>
        {announcements?.length ? (
          <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {announcements.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="font-medium text-slate-800">{a.title}</div>
                <div className="text-sm text-slate-600 mt-1">{a.body}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(a.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 text-sm">No announcements.</p>
        )}
      </section>
    </div>
  );
}
