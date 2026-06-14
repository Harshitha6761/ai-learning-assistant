'use client';

import { useState } from 'react';

type ProfileRow = { id: string; email: string | null; full_name: string | null; role: string };
type ExamDateRow = { id: string; title: string; exam_date: string; exam_type: string };
type AnnouncementRow = { id: string; title: string; body: string };

export function AdminPanel({
  initialProfiles,
  initialExamDates,
  initialAnnouncements,
}: {
  initialProfiles: ProfileRow[];
  initialExamDates: ExamDateRow[];
  initialAnnouncements: AnnouncementRow[];
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [examDates, setExamDates] = useState(initialExamDates);
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [loading, setLoading] = useState<string | null>(null);
  const [newExam, setNewExam] = useState({ title: '', exam_date: '', exam_type: 'mid' as 'mid' | 'sem' });
  const [newAnn, setNewAnn] = useState({ title: '', body: '' });
  const [roleEdit, setRoleEdit] = useState<{ id: string; role: string } | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'student' as 'teacher' | 'student', full_name: '' });
  const [userMessage, setUserMessage] = useState('');

  async function updateRole(userId: string, role: string) {
    setLoading(userId);
    const res = await fetch('/api/admin/role', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, role }) });
    setLoading(null);
    setRoleEdit(null);
    if (res.ok) {
      setProfiles((p) => p.map((x) => (x.id === userId ? { ...x, role } : x)));
    }
  }

  async function addExamDate(e: React.FormEvent) {
    e.preventDefault();
    setLoading('exam');
    const res = await fetch('/api/admin/exam-dates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newExam) });
    setLoading(null);
    if (res.ok) {
      const data = await res.json();
      setExamDates((d) => [...d, data].sort((a, b) => a.exam_date.localeCompare(b.exam_date)));
      setNewExam({ title: '', exam_date: '', exam_type: 'mid' });
    }
  }

  async function deleteExamDate(id: string) {
    await fetch(`/api/admin/exam-dates?id=${id}`, { method: 'DELETE' });
    setExamDates((d) => d.filter((x) => x.id !== id));
  }

  async function addAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setLoading('ann');
    const res = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAnn) });
    setLoading(null);
    if (res.ok) {
      const data = await res.json();
      setAnnouncements((a) => [data, ...a]);
      setNewAnn({ title: '', body: '' });
    }
  }

  async function deleteAnnouncement(id: string) {
    await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
    setAnnouncements((a) => a.filter((x) => x.id !== id));
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setUserMessage('');
    if (!newUser.email.trim() || newUser.password.length < 6) {
      setUserMessage('Email and password (min 6 characters) required.');
      return;
    }
    setLoading('adduser');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUser.email.trim(),
        password: newUser.password,
        role: newUser.role,
        full_name: newUser.full_name.trim() || undefined,
      }),
    });
    const data = await res.json();
    setLoading(null);
    if (res.ok) {
      setProfiles((prev) => [...prev, { id: data.id, email: data.email, full_name: data.full_name ?? null, role: data.role }]);
      setNewUser({ email: '', password: '', role: 'student', full_name: '' });
      setUserMessage(`${data.role} added. They can now log in with their email and password.`);
    } else {
      setUserMessage(data.error || 'Failed to add user.');
    }
  }

  async function removeUser(userId: string) {
    if (!confirm('Remove this user? They will no longer be able to log in.')) return;
    setLoading(userId);
    const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
    setLoading(null);
    if (res.ok) {
      setProfiles((p) => p.filter((x) => x.id !== userId));
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-medium text-slate-700 mb-2">Add teacher or student</h2>
        <p className="text-slate-500 text-sm mb-3">Only users you add here can log in. They use the email and password you set.</p>
        <form onSubmit={addUser} className="flex flex-wrap items-end gap-3 mb-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser((u) => ({ ...u, email: e.target.value }))}
              required
              placeholder="teacher@school.com"
              className="rounded border border-slate-300 px-3 py-2 w-48"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser((u) => ({ ...u, password: e.target.value }))}
              required
              minLength={6}
              placeholder="min 6 characters"
              className="rounded border border-slate-300 px-3 py-2 w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((u) => ({ ...u, role: e.target.value as 'teacher' | 'student' }))}
              className="rounded border border-slate-300 px-3 py-2"
            >
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Name (optional)</label>
            <input
              type="text"
              value={newUser.full_name}
              onChange={(e) => setNewUser((u) => ({ ...u, full_name: e.target.value }))}
              placeholder="Full name"
              className="rounded border border-slate-300 px-3 py-2 w-40"
            />
          </div>
          <button type="submit" disabled={loading === 'adduser'} className="rounded bg-primary-600 px-4 py-2 text-white text-sm disabled:opacity-50">
            Add user
          </button>
        </form>
        {userMessage && <p className="text-sm mb-4 text-slate-600">{userMessage}</p>}
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-700 mb-2">Users & roles</h2>
        <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2">{p.email ?? '-'}</td>
                  <td className="px-4 py-2">{p.full_name ?? '-'}</td>
                  <td className="px-4 py-2">
                    {roleEdit?.id === p.id ? (
                      <select
                        value={roleEdit.role}
                        onChange={(e) => setRoleEdit({ ...roleEdit, role: e.target.value })}
                        className="rounded border border-slate-300 px-2 py-1"
                      >
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : (
                      <span className="rounded bg-primary-100 px-2 py-0.5 text-primary-800">{p.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {roleEdit?.id === p.id ? (
                      <>
                        <button onClick={() => updateRole(p.id, roleEdit.role)} disabled={!!loading} className="text-primary-600 mr-2">Save</button>
                        <button onClick={() => setRoleEdit(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setRoleEdit({ id: p.id, role: p.role })} className="text-slate-600 hover:text-slate-900 mr-2">Edit role</button>
                        <button onClick={() => removeUser(p.id)} disabled={!!loading} className="text-red-600 text-sm hover:underline disabled:opacity-50">Remove</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-700 mb-2">Exam dates</h2>
        <form onSubmit={addExamDate} className="flex flex-wrap gap-3 mb-4">
          <input
            placeholder="Title"
            value={newExam.title}
            onChange={(e) => setNewExam((x) => ({ ...x, title: e.target.value }))}
            required
            className="rounded border border-slate-300 px-3 py-2"
          />
          <input
            type="date"
            value={newExam.exam_date}
            onChange={(e) => setNewExam((x) => ({ ...x, exam_date: e.target.value }))}
            required
            className="rounded border border-slate-300 px-3 py-2"
          />
          <select
            value={newExam.exam_type}
            onChange={(e) => setNewExam((x) => ({ ...x, exam_type: e.target.value as 'mid' | 'sem' }))}
            className="rounded border border-slate-300 px-3 py-2"
          >
            <option value="mid">Mid</option>
            <option value="sem">Sem</option>
          </select>
          <button type="submit" disabled={loading === 'exam'} className="rounded bg-primary-600 px-4 py-2 text-white text-sm disabled:opacity-50">Add</button>
        </form>
        <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
          {examDates.map((d) => (
            <li key={d.id} className="px-4 py-3 flex justify-between items-center">
              <span>{d.title} – {new Date(d.exam_date).toLocaleDateString()} ({d.exam_type})</span>
              <button onClick={() => deleteExamDate(d.id)} className="text-red-600 text-sm">Delete</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-medium text-slate-700 mb-2">Announcements</h2>
        <form onSubmit={addAnnouncement} className="space-y-2 mb-4">
          <input
            placeholder="Title"
            value={newAnn.title}
            onChange={(e) => setNewAnn((x) => ({ ...x, title: e.target.value }))}
            required
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
          <textarea
            placeholder="Body"
            value={newAnn.body}
            onChange={(e) => setNewAnn((x) => ({ ...x, body: e.target.value }))}
            required
            rows={2}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
          <button type="submit" disabled={loading === 'ann'} className="rounded bg-primary-600 px-4 py-2 text-white text-sm disabled:opacity-50">Add</button>
        </form>
        <ul className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
          {announcements.map((a) => (
            <li key={a.id} className="px-4 py-3 flex justify-between items-start">
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-slate-600">{a.body}</div>
              </div>
              <button onClick={() => deleteAnnouncement(a.id)} className="text-red-600 text-sm">Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
