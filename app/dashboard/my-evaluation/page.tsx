import { createClient } from '@/lib/supabase/server';
import { getProfileWithRole } from '@/lib/auth';
import Link from 'next/link';

export default async function MyEvaluationPage() {
  const profile = await getProfileWithRole();
  if (!profile) return null;

  const supabase = await createClient();
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('id, assignment_id, roll_number, marks, feedback, reference_links, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Evaluation</h1>
      <p className="text-slate-600 text-sm">After exams, AI evaluates your answers. View your marks, feedback, and learning references here.</p>
      {evaluations?.length ? (
        <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
          {evaluations.map((e) => {
            let maxTotal: number | null = null;
            let questionMarks: number[] | null = null;
            let examType: string | null = null;
            if (e.feedback) {
              try {
                const parsed = JSON.parse(e.feedback);
                if (parsed && typeof parsed.maxTotal === 'number') {
                  maxTotal = parsed.maxTotal;
                  questionMarks = Array.isArray(parsed.questionMarks) ? parsed.questionMarks : null;
                  examType = parsed.examType || null;
                }
              } catch {
                /* plain text feedback */
              }
            }
            const pdfUrl = e.reference_links?.[0] && e.reference_links[0].startsWith('http') ? e.reference_links[0] : null;
            const otherLinks = pdfUrl ? e.reference_links?.slice(1) ?? [] : (e.reference_links ?? []);
            return (
              <li key={e.id} className="px-4 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium text-slate-800">{examType ? `${examType === 'mid' ? 'Mid' : 'Sem'} evaluation` : `Assignment ${e.assignment_id.slice(0, 8)}…`}</span>
                    {e.roll_number && <span className="text-slate-500 text-sm ml-2">({e.roll_number})</span>}
                  </div>
                  <span className="text-lg font-semibold text-primary-600">
                    {e.marks}{maxTotal != null ? ` / ${maxTotal}` : '/10'}
                  </span>
                </div>
                {pdfUrl && (
                  <p className="mt-2">
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline font-medium">View your answer script (PDF)</a>
                  </p>
                )}
                {questionMarks && questionMarks.length > 0 && (
                  <p className="mt-1 text-slate-600 text-sm">Per question: {questionMarks.join(', ')}</p>
                )}
                {e.feedback && !maxTotal && <p className="mt-2 text-slate-600 text-sm">{e.feedback}</p>}
                {otherLinks.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-slate-600">References:</span>
                    <ul className="mt-1 text-sm text-primary-600">
                      {otherLinks.map((link, i) => (
                        <li key={i}>
                          <a href={link.startsWith('http') ? link : `https://www.youtube.com/results?search_query=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {link}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-xs text-slate-400 mt-2">{new Date(e.created_at).toLocaleString()}</div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-slate-500">No evaluations yet. Complete exams and use “Evaluate with AI” on theory answers, or submit answers through your teacher.</p>
      )}
    </div>
  );
}
