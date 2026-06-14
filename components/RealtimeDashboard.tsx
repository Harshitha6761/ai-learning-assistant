'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface ExamDateRow {
  id: string;
  title: string;
  exam_date: string;
  exam_type: string;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export function RealtimeDashboard({
  initialExamDates,
  initialAnnouncements,
}: {
  initialExamDates: ExamDateRow[];
  initialAnnouncements: AnnouncementRow[];
}) {
  const [examDates, setExamDates] = useState(initialExamDates);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel('dashboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_dates' },
        () => {
          supabase.from('exam_dates').select('id, title, exam_date, exam_type').order('exam_date').then(({ data }) => {
            if (data) setExamDates(data);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          supabase.from('announcements').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(5).then(({ data }) => {
            if (data) setAnnouncements(data);
          });
        }
      )
      .subscribe();
    setChannel(ch);
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  return (
    <>
      <section>
        <h2 className="text-lg font-medium text-slate-700 mb-2">Exam dates</h2>
        {examDates.length ? (
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
        {announcements.length ? (
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
    </>
  );
}
