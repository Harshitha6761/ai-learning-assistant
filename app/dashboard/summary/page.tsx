'use client';

import { useState } from 'react';

export default function SummaryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !text.trim()) return;
    setLoading(true);
    setSummary('');
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (text.trim()) formData.append('text', text.trim());
      const res = await fetch('/api/ai/summarize', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.summary) setSummary(data.summary);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Summary</h1>
      <p className="text-slate-600 text-sm">Upload PDF, text, or photo for an AI summary.</p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">File or text</label>
          <input
            type="file"
            accept=".pdf,.txt,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-primary-700"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Or paste text"
            rows={4}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Summarizing…' : 'Summarize'}
        </button>
      </form>
      {summary && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 max-w-2xl">
          <h2 className="text-lg font-medium text-slate-700 mb-2">Summary</h2>
          <p className="text-slate-700 whitespace-pre-wrap">{summary}</p>
        </div>
      )}
    </div>
  );
}
