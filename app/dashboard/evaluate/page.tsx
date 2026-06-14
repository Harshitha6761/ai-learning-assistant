'use client';

import { useState, useMemo } from 'react';

const MID_QUESTIONS = 11;
const SEM_QUESTIONS = 20;
const MID_MAX = 30;
const SEM_MAX = 60;

export default function EvaluatePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [examType, setExamType] = useState<'mid' | 'sem'>('mid');
  const [marks, setMarks] = useState<number[]>(() => Array(MID_QUESTIONS).fill(0));
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [examName, setExamName] = useState('');
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const questionCount = examType === 'mid' ? MID_QUESTIONS : SEM_QUESTIONS;
  const maxTotal = examType === 'mid' ? MID_MAX : SEM_MAX;

  const total = useMemo(() => marks.slice(0, questionCount).reduce((s, n) => s + (Number(n) || 0), 0), [marks, questionCount]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
    setPdfFile(file || null);
    if (file) setPdfPreviewUrl(URL.createObjectURL(file));
  }

  function handleExamTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value as 'mid' | 'sem';
    setExamType(v);
    setMarks(Array(v === 'mid' ? MID_QUESTIONS : SEM_QUESTIONS).fill(0));
  }

  function setMark(index: number, value: string) {
    const n = parseFloat(value);
    setMarks((prev) => {
      const next = [...prev];
      next[index] = Number.isNaN(n) ? 0 : n;
      return next;
    });
  }

  async function handleSave() {
    if (!studentEmail.trim()) {
      setSaveError('Enter student email');
      return;
    }
    if (!examName.trim()) {
      setSaveError('Enter exam name');
      return;
    }
    if (!subject.trim()) {
      setSaveError('Enter subject');
      return;
    }
    if (!pdfFile) {
      setSaveError('No PDF uploaded');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('examType', examType);
      formData.append('studentEmail', studentEmail.trim());
      formData.append('examName', examName.trim());
      formData.append('subject', subject.trim());
      formData.append('marks', JSON.stringify(marks.slice(0, questionCount)));
      const res = await fetch('/api/teacher/evaluate', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        setShowSaveModal(false);
        setStudentEmail('');
        setExamName('');
        setSubject('');
      } else {
        setSaveError(data.error || 'Save failed');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Evaluate answers</h1>
      <p className="text-slate-600 text-sm">Upload the student&apos;s answer script (PDF), select exam type, enter marks per question, then save with the student&apos;s email.</p>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-2">Answer script (PDF)</label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-primary-700"
          />
          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 min-h-[320px] overflow-hidden">
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                title="PDF preview"
                className="w-full h-[480px]"
              />
            ) : (
              <div className="flex items-center justify-center h-[320px] text-slate-500 text-sm">Upload a PDF to preview</div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Evaluate for</label>
            <select
              value={examType}
              onChange={handleExamTypeChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="mid">Mid ({MID_QUESTIONS} questions, max {MID_MAX})</option>
              <option value="sem">Sem ({SEM_QUESTIONS} questions, max {SEM_MAX})</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-2">Marks per question</h3>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: questionCount }, (_, i) => (
                <div key={i} className="flex flex-col">
                  <label className="text-xs text-slate-500">Q{i + 1}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={marks[i] === 0 ? '' : marks[i]}
                    onChange={(e) => setMark(i, e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1.5 text-sm w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-700">Total</span>
              <span className="text-xl font-semibold text-primary-600">{total} / {maxTotal}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setSaveSuccess(false); setShowSaveModal(true); }}
            disabled={!pdfFile}
            className="w-full rounded-lg bg-primary-600 py-2.5 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            Save evaluation
          </button>
        </div>
      </div>

      {saveSuccess && (
        <p className="text-green-600 text-sm">Evaluation saved. The student can view it in their Evaluation page.</p>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setShowSaveModal(false)}>
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Save evaluation</h3>
            <p className="text-slate-600 text-sm mb-4">Student will see this result as a tile on their Profile.</p>
            <div className="space-y-3 mb-4">
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => { setStudentEmail(e.target.value); setSaveError(null); }}
                placeholder="Student email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="text"
                value={examName}
                onChange={(e) => { setExamName(e.target.value); setSaveError(null); }}
                placeholder="Exam name (e.g. Mid-term, Semester)"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <input
                type="text"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setSaveError(null); }}
                placeholder="Subject"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <p className="text-slate-500 text-sm">Marks: {total} / {maxTotal}</p>
            </div>
            {saveError && <p className="text-red-600 text-sm mb-2">{saveError}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => !saving && setShowSaveModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
