'use client';

import { useState } from 'react';

interface Question {
  type: string;
  question: string;
  marks?: number;
  options?: string[];
  correct?: string;
  blank_answer?: string;
  model_answer?: string;
}

export default function GeneratePage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [examType, setExamType] = useState<'mid' | 'sem'>('mid');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !text.trim()) {
      setError('Upload a PDF or paste some text.');
      return;
    }
    setLoading(true);
    setQuestions([]);
    setError(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (text.trim()) formData.append('text', text.trim());
      formData.append('examType', examType);
      const res = await fetch('/api/ai/questions', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        const list = data.questions ?? [];
        setQuestions(Array.isArray(list) ? list : []);
        if (list.length === 0) setError('No questions were generated. Try more content or a different PDF.');
      } else {
        setError(data.error || 'Generation failed. Try again.');
      }
    } catch {
      setError('Request failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Generate question paper</h1>
      <p className="text-slate-600 text-sm">Upload notes or PDFs to generate Mid or Sem question paper.</p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Upload PDF / text</label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-primary-700"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Or paste text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            placeholder="Paste content here…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Exam type</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value as 'mid' | 'sem')}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="mid">Mid (e.g. 5×2, 6×5)</option>
            <option value="sem">Sem (e.g. 10×1, 11×10)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
      </form>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {questions.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-medium text-slate-700 mb-4">Generated questions</h2>
          <ol className="list-decimal list-inside space-y-4">
            {questions.map((q, i) => (
              <li key={i} className="text-slate-800">
                <span className="font-medium">{q.question}</span>
                {q.marks != null && <span className="ml-2 text-sm text-slate-500">({q.marks} mark{q.marks !== 1 ? 's' : ''})</span>}
                {q.type === 'mcq' && q.options?.length && (
                  <ul className="mt-2 ml-4 list-disc text-slate-600">
                    {q.options.map((o, j) => (
                      <li key={j}>{o}{q.correct === o ? ' ✓' : ''}</li>
                    ))}
                  </ul>
                )}
                {q.type === 'fill_blank' && q.blank_answer && (
                  <p className="mt-1 text-sm text-slate-500">Answer: {q.blank_answer}</p>
                )}
                {q.type === 'theory' && q.model_answer && (
                  <p className="mt-1 text-sm text-slate-500">Model answer: {q.model_answer}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
