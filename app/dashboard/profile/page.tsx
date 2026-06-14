import { redirect } from 'next/navigation';
import { getProfileWithRole } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export default async function ProfilePage() {
  const profile = await getProfileWithRole();
  if (!profile) redirect('/login');

  const supabase = await createServiceClient();
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name, role, created_at')
    .eq('id', profile.id)
    .maybeSingle();

  const { data: results } = await supabase
    .from('student_results')
    .select('id, exam_name, subject, marks, max_marks, pdf_url, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  const email = user?.email ?? profile.email;
  const fullName = user?.full_name ?? null;
  const role = user?.role ?? profile.role;
  const createdAt = user?.created_at;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-800">Profile</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
        {fullName && (
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</div>
            <div className="text-slate-800 mt-0.5">{fullName}</div>
          </div>
        )}
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</div>
          <div className="text-slate-800 mt-0.5">{email}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</div>
          <div className="mt-0.5">
            <span className="rounded bg-primary-100 px-2 py-0.5 text-sm font-medium text-primary-800 capitalize">
              {role}
            </span>
          </div>
        </div>
        {createdAt && (
          <div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Member since</div>
            <div className="text-slate-600 text-sm mt-0.5">{new Date(createdAt).toLocaleDateString()}</div>
          </div>
        )}
      </div>

      {results && results.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-slate-700 mb-3">Results</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-primary-200 transition"
              >
                <div className="font-medium text-slate-800">{r.exam_name}</div>
                <div className="text-sm text-slate-500 mt-0.5">{r.subject}</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xl font-semibold text-primary-600">{r.marks} / {r.max_marks}</span>
                  {r.pdf_url && (
                    <a
                      href={r.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline"
                    >
                      View script
                    </a>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
