'use client';

import { useState, useEffect } from 'react';

interface Question {
  type: string;
  question: string;
  options?: string[];
  correct?: string;
  blank_answer?: string;
  model_answer?: string;
}

export default function ExamPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [examType, setExamType] = useState<'all' | 'mcq' | 'fill_blank' | 'theory'>('all');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [theoryEvals, setTheoryEvals] = useState<Record<number, { marks: number; feedback: string; referenceLinks: string[] }>>({});
  const [evaluatingIndex, setEvaluatingIndex] = useState<number | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleGenerate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!file && !text.trim()) {
      setGenerateError('Upload a PDF or paste text first.');
      return;
    }
    setGenerateError(null);
    setLoading(true);
    setQuestions([]);
    setAnswers({});
    setSubmitted(false);
    setTheoryEvals({});
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (text.trim()) formData.append('text', text.trim());
      formData.append('examType', examType);
      const res = await fetch('/api/ai/questions', { method: 'POST', body: formData });
      const data = await res.json();
      const list = Array.isArray(data.questions) ? data.questions : [];
      if (list.length > 0) {
        setQuestions(list);
      } else {
        setGenerateError(data?.error || 'No questions generated. Try again.');
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  // After submit, automatically run AI evaluation for all theory answers
  useEffect(() => {
    if (!submitted || questions.length === 0) return;
    const theoryIndices = questions
      .map((q, i) => ({ q, i }))
      .filter(({ q }) => q.type === 'theory' && q.model_answer);
    if (theoryIndices.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const { q, i } of theoryIndices) {
        if (cancelled) return;
        const answer = answers[i]?.trim();
        if (!answer) continue;
        setEvaluatingIndex(i);
        try {
          const formData = new FormData();
          formData.append('referenceText', q.model_answer!);
          formData.append('answerText', answer);
          formData.append('questionContext', q.question);
          const res = await fetch('/api/ai/evaluate', { method: 'POST', body: formData });
          const data = await res.json();
          if (res.ok && !cancelled)
            setTheoryEvals((prev) => ({
              ...prev,
              [i]: { marks: data.marks ?? 0, feedback: data.feedback ?? '', referenceLinks: data.referenceLinks ?? [] },
            }));
        } finally {
          if (!cancelled) setEvaluatingIndex(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submitted]); // eslint-disable-line react-hooks/exhaustive-deps -- run once when submitted; questions/answers are stable

  const mcqFillScore = questions.filter((q, i) => {
    if (q.type === 'theory') return false;
    const a = answers[i]?.trim();
    if (q.type === 'mcq') return a === q.correct;
    if (q.type === 'fill_blank') return a?.toLowerCase() === q.blank_answer?.toLowerCase();
    return false;
  }).length;
  const mcqFillTotal = questions.filter((q) => q.type === 'mcq' || q.type === 'fill_blank').length;
  const theoryCount = questions.filter((q) => q.type === 'theory').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">Exams</h1>
      <p className="text-slate-600 text-sm">MCQs, fill in the blanks, and theory. After you submit, theory answers are evaluated automatically by AI.</p>
      <form onSubmit={handleGenerate} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Upload PDF / text</label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-primary-700"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Or paste text"
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Exam type</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value as 'all' | 'mcq' | 'fill_blank' | 'theory')}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="all">All (Theory, MCQs, fill in the blanks)</option>
            <option value="theory">Theory</option>
            <option value="mcq">MCQs</option>
            <option value="fill_blank">Fill in the blanks</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate & take exam'}
          </button>
          {questions.length > 0 && !loading && (
            <button
              type="button"
              onClick={() => handleGenerate()}
              className="rounded-lg border border-slate-300 bg-white px-6 py-2 text-slate-700 font-medium hover:bg-slate-50"
            >
              Generate new set
            </button>
          )}
        </div>
        {generateError && (
          <p className="text-red-600 text-sm">{generateError}</p>
        )}
      </form>
      {questions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 max-w-2xl">
          <h2 className="text-lg font-medium text-slate-700 mb-4">Exam</h2>
          {!submitted ? (
            <>
              <ol className="list-decimal list-inside space-y-4">
                {questions.map((q, i) => (
                  <li key={i} className="text-slate-800">
                    <span className="font-medium">{q.question}</span>
                    {q.type === 'mcq' && q.options?.length ? (
                      <ul className="mt-2 ml-4 space-y-1">
                        {q.options.map((o, j) => (
                          <li key={j}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`q-${i}`}
                                value={o}
                                checked={answers[i] === o}
                                onChange={() => setAnswers((a) => ({ ...a, [i]: o }))}
                                className="rounded border-slate-300 text-primary-600"
                              />
                              {o}
                            </label>
                          </li>
                        ))}
                      </ul>
                    ) : q.type === 'theory' ? (
                      <textarea
                        value={answers[i] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                        placeholder="Your answer (theory)"
                        rows={4}
                        className="mt-2 ml-4 w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={answers[i] ?? ''}
                        onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                        placeholder="Your answer"
                        className="mt-2 ml-4 w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                    )}
                  </li>
                ))}
              </ol>
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="mt-6 rounded-lg bg-primary-600 px-6 py-2 text-white font-medium hover:bg-primary-700"
              >
                Submit
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-xl font-semibold text-primary-600">
                Score (MCQs & fill in blanks): {mcqFillScore} / {mcqFillTotal}
                {theoryCount > 0 && (evaluatingIndex !== null || Object.keys(theoryEvals).length < theoryCount)
                  ? ' · Evaluating theory answers…'
                  : theoryCount > 0
                    ? ` · Theory evaluated`
                    : ''}
              </p>
              <ol className="list-decimal list-inside space-y-4 border-t border-slate-200 pt-4">
                {questions.map((q, i) => (
                  <li key={i} className="text-slate-800">
                    <span className="font-medium">{q.question}</span>
                    <div className="mt-1 ml-4 text-slate-600 text-sm">Your answer: {answers[i] || '—'}</div>
                    {q.type === 'theory' && q.model_answer && (
                      <div className="mt-2 ml-4">
                        {theoryEvals[i] ? (
                          <div className="rounded bg-slate-50 p-3 text-sm">
                            <p className="font-medium text-primary-600">Marks: {theoryEvals[i].marks}/10</p>
                            <p className="mt-1 text-slate-700">{theoryEvals[i].feedback}</p>
                            {theoryEvals[i].referenceLinks?.length > 0 && (
                              <ul className="mt-2 text-primary-600">
                                {theoryEvals[i].referenceLinks.map((link, j) => (
                                  <li key={j}>
                                    <a href={link.startsWith('http') ? link : `https://www.youtube.com/results?search_query=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{link}</a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-sm">{evaluatingIndex === i ? 'Evaluating…' : '…'}</p>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
