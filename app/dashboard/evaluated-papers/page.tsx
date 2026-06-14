'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

const MID_QUESTIONS = 11;
const SEM_QUESTIONS = 20;
const MID_MAX = 30;
const SEM_MAX = 60;

type ResultRow = {
  id: string;
  user_id: string;
  exam_name: string;
  subject: string;
  marks: number;
  max_marks: number;
  pdf_url: string | null;
  created_at: string;
  student_email: string;
  exam_type?: string | null;
  marks_breakdown?: number[] | null;
};

export default function EvaluatedPapersPage() {
  const [list, setList] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    exam_name: '',
    subject: '',
    exam_type: 'mid' as 'mid' | 'sem',
    marks: [0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const questionCount = editForm.exam_type === 'mid' ? MID_QUESTIONS : SEM_QUESTIONS;
  const maxTotal = editForm.exam_type === 'mid' ? MID_MAX : SEM_MAX;
  const total = useMemo(
    () => editForm.marks.slice(0, questionCount).reduce((s, n) => s + (Number(n) || 0), 0),
    [editForm.marks, questionCount]
  );

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/evaluate');
      const data = await res.json();
      if (res.ok) setList(Array.isArray(data) ? data : []);
      else setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  const pdfBlobUrlRef = useRef<string | null>(null);

  function loadPdfForEdit(resultId: string) {
    if (pdfBlobUrlRef.current) {
      URL.revokeObjectURL(pdfBlobUrlRef.current);
      pdfBlobUrlRef.current = null;
    }
    setPdfBlobUrl(null);
    setPdfError(null);
    setPdfLoading(true);
    fetch(`/api/teacher/evaluate/${resultId}/pdf`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? 'Not allowed' : res.status === 404 ? 'No PDF' : 'Failed to load PDF');
        return res.blob();
      })
      .then((blob) => {
        if (pdfBlobUrlRef.current) URL.revokeObjectURL(pdfBlobUrlRef.current);
        const url = URL.createObjectURL(blob);
        pdfBlobUrlRef.current = url;
        setPdfBlobUrl(url);
        setPdfLoading(false);
      })
      .catch((err) => {
        setPdfError(err?.message || 'Could not load PDF');
        setPdfBlobUrl(null);
        setPdfLoading(false);
      });
  }

  // Clean up blob URL when closing modal or when editId changes
  useEffect(() => {
    if (!editId) {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
      setPdfBlobUrl(null);
      setPdfError(null);
      setPdfLoading(false);
    }
  }, [editId]);

  const editingRow = editId ? list.find((r) => r.id === editId) : null;

  function openEdit(row: ResultRow) {
    setEditId(row.id);
    setPdfBlobUrl(null);
    setPdfError(null);
    if (row.pdf_url) {
      loadPdfForEdit(row.id);
    } else {
      setPdfLoading(false);
    }
    const examType = row.exam_type === 'sem' ? 'sem' : 'mid';
    const len = examType === 'mid' ? MID_QUESTIONS : SEM_QUESTIONS;
    let marks: number[];
    if (Array.isArray(row.marks_breakdown) && row.marks_breakdown.length >= len) {
      marks = row.marks_breakdown.slice(0, len).map((n) => Number(n) || 0);
    } else {
      marks = Array(len).fill(0);
      if (row.marks > 0) marks[0] = row.marks;
    }
    while (marks.length < len) marks.push(0);
    setEditForm({
      exam_name: row.exam_name,
      subject: row.subject,
      exam_type: examType,
      marks,
    });
    setError(null);
  }

  function setMark(index: number, value: string) {
    const n = parseFloat(value);
    setEditForm((f) => {
      const next = [...f.marks];
      next[index] = Number.isNaN(n) ? 0 : n;
      return { ...f, marks: next };
    });
  }

  async function handleSaveEdit() {
    if (!editId) return;
    setSaving(true);
    setError(null);
    try {
      const arr = editForm.marks.slice(0, questionCount);
      const res = await fetch(`/api/teacher/evaluate/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_name: editForm.exam_name.trim() || 'Exam',
          subject: editForm.subject.trim() || '—',
          exam_type: editForm.exam_type,
          marks_breakdown: arr,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditId(null);
        fetchList();
      } else {
        setError(data.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this evaluated paper? The student will no longer see it on their profile.')) return;
    try {
      const res = await fetch(`/api/teacher/evaluate/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setList((prev) => prev.filter((r) => r.id !== id));
        if (editId === id) setEditId(null);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Evaluated papers</h1>
      <p className="text-slate-600 text-sm">Papers you have evaluated. Edit marks per question or delete.</p>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-slate-500">No evaluated papers yet. Use Evaluate to add some.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="font-medium text-slate-800">{row.exam_name}</div>
              <div className="text-sm text-slate-500">{row.subject}</div>
              <div className="mt-1 text-sm text-slate-600">{row.student_email}</div>
              <div className="mt-2 text-lg font-semibold text-primary-600">
                {row.marks} / {row.max_marks}
              </div>
              {row.pdf_url && (
                <a href={row.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
                  View PDF
                </a>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row.id)}
                  className="rounded bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editId && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto" onClick={() => !saving && setEditId(null)}>
          <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full my-4 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 p-4 border-b">Edit result — {editingRow.student_email}</h3>
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
                <div className="p-2 text-sm text-slate-600 flex items-center justify-between">
                  <span>Answer script</span>
                  {editingRow.pdf_url && (
                    <a href={`/api/teacher/evaluate/${editId}/pdf`} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-sm hover:underline">Open in new tab</a>
                  )}
                </div>
                <div className="flex-1 bg-slate-100 min-h-[360px] h-[360px]">
                  {!editingRow.pdf_url ? (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">No PDF</div>
                  ) : pdfLoading ? (
                    <div className="flex items-center justify-center h-full text-slate-600 text-sm">Loading PDF…</div>
                  ) : pdfError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-600 text-sm">
                      <span>{pdfError}</span>
                      <a href={`/api/teacher/evaluate/${editId}/pdf`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Open PDF in new tab</a>
                    </div>
                  ) : pdfBlobUrl ? (
                    <iframe
                      key={pdfBlobUrl}
                      src={pdfBlobUrl}
                      title="PDF preview"
                      className="w-full h-full border-0"
                    />
                  ) : null}
                </div>
              </div>
              <div className="lg:w-1/2 p-4 overflow-auto space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Exam name</label>
                  <input
                    type="text"
                    value={editForm.exam_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, exam_name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Exam type</label>
                  <select
                    value={editForm.exam_type}
                    onChange={(e) => {
                      const v = e.target.value as 'mid' | 'sem';
                      const len = v === 'mid' ? MID_QUESTIONS : SEM_QUESTIONS;
                      setEditForm((f) => {
                        const next = f.marks.slice(0, len);
                        while (next.length < len) next.push(0);
                        return { ...f, exam_type: v, marks: next };
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  >
                    <option value="mid">Mid ({MID_QUESTIONS} questions, max {MID_MAX})</option>
                    <option value="sem">Sem ({SEM_QUESTIONS} questions, max {SEM_MAX})</option>
                  </select>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Marks per question</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {Array.from({ length: questionCount }, (_, i) => (
                      <div key={i} className="flex flex-col">
                        <label className="text-xs text-slate-500">Q{i + 1}</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={editForm.marks[i] === 0 ? '' : editForm.marks[i]}
                          onChange={(e) => setMark(i, e.target.value)}
                          className="rounded border border-slate-300 px-2 py-1.5 text-sm w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <span className="font-medium text-slate-700">Total </span>
                  <span className="text-xl font-semibold text-primary-600">{total} / {maxTotal}</span>
                </div>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <div className="flex gap-2 justify-end pt-2">
                  <button type="button" onClick={() => !saving && setEditId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                  <button type="button" onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
