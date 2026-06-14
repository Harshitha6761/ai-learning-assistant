/**
 * Groq API (free tier) – same interface as Gemini.
 * Uses llama-3.3-70b-versatile. No image support; text only.
 */

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const PROMPT_VERSION = 'v1';

async function groqComplete(prompt: string, maxTokens = 8192): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error('GROQ_API_KEY is not set');
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API ${res.status}: ${err}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}

function stripJson(raw: string): string {
  return raw.replace(/```json?\s*|\s*```/g, '').trim();
}

export async function summarizeContent(
  text: string,
  _imageParts?: Array<{ mimeType: string; data: string }>
): Promise<string> {
  const prompt = `[${PROMPT_VERSION}] Summarize the following content clearly and concisely. Return only the summary, no preamble.\n\n${text.slice(0, 120000)}`;
  return groqComplete(prompt, 2048);
}

export async function extractKeywords(text: string): Promise<{ count: number; keywords: string[] }> {
  const prompt = `[${PROMPT_VERSION}] From the following content, extract important keywords (terms, concepts). Return a JSON object with two keys: "count" (number of keywords) and "keywords" (array of strings). No other text.\n\n${text.slice(0, 80000)}`;
  const raw = await groqComplete(prompt, 1024);
  try {
    const parsed = JSON.parse(stripJson(raw));
    return {
      count: Number(parsed.count) || 0,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch {
    return { count: 0, keywords: [] };
  }
}

export type GeneratedQuestion = {
  type: 'mcq' | 'fill_blank' | 'theory';
  question: string;
  marks?: number;
  options?: string[];
  correct?: string;
  blank_answer?: string;
  model_answer?: string;
};

export type ExamQuestionType = 'all' | 'mcq' | 'fill_blank' | 'theory' | 'mid' | 'sem';

const typeSpecs: Record<ExamQuestionType, string> = {
  all: 'Include MCQs, fill-in-the-blanks, and theory. E.g. 3 MCQs, 2 fill_blank, 2 theory.',
  mcq: 'Include ONLY multiple choice questions (MCQs). Generate 6–8 MCQs. Each: "type": "mcq", "question", "options" (4 strings), "correct".',
  fill_blank: 'Include ONLY fill-in-the-blank questions. Generate 5–7 questions. Each: "type": "fill_blank", "question", "blank_answer".',
  theory: 'Include ONLY theory (long form) questions. Generate 3–4 theory questions. Each: "type": "theory", "question", "model_answer" (reference answer for evaluation).',
  mid: 'MID EXAM: Generate exactly 11 questions from the content. (1) 5 short-answer questions, 2 marks each — type "fill_blank", include "blank_answer", add "marks": 2. (2) 6 long-answer questions, 5 marks each (4 mandatory to solve) — type "theory", include "model_answer", add "marks": 5. Base all questions only on the given content.',
  sem: 'SEM EXAM: Generate exactly 20 questions from the content, spread across 5 units. (1) 10 short-answer questions, 1 mark each (2 from each unit, no optional) — type "fill_blank", "blank_answer", "marks": 1. (2) 10 long-answer questions, 10 marks each (2 from each unit, 1 optional per unit) — type "theory", "model_answer", "marks": 10. Ensure coverage from each unit. Base only on the given content.',
};

function normalizeQuestionType(t: unknown): 'mcq' | 'fill_blank' | 'theory' {
  const s = String(t ?? '').toLowerCase().replace(/\s+/g, '_');
  if (s.includes('fill') && s.includes('blank')) return 'fill_blank';
  if (s.includes('theory') || s.includes('long') || s.includes('essay')) return 'theory';
  return 'mcq';
}

function normalizeQuestion(raw: unknown): GeneratedQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const question = typeof o.question === 'string' ? o.question.trim() : '';
  if (!question) return null;
  const type = normalizeQuestionType(o.type);
  const out: GeneratedQuestion = { type, question };
  if (typeof o.marks === 'number' && !Number.isNaN(o.marks)) out.marks = o.marks;
  if (type === 'mcq') {
    const options = Array.isArray(o.options) ? o.options.map((x) => String(x).trim()).filter(Boolean) : [];
    const correct = typeof o.correct === 'string' ? o.correct.trim() : options[0];
    if (options.length >= 2) {
      out.options = options.slice(0, 4);
      out.correct = correct || out.options[0];
    } else return null;
  } else if (type === 'fill_blank') {
    out.blank_answer = typeof o.blank_answer === 'string' ? o.blank_answer.trim() : '';
    if (!out.blank_answer) out.blank_answer = typeof o.answer === 'string' ? o.answer.trim() : '';
  } else if (type === 'theory') {
    out.model_answer = typeof o.model_answer === 'string' ? o.model_answer.trim() : '';
    if (!out.model_answer) out.model_answer = typeof o.reference_answer === 'string' ? o.reference_answer.trim() : '';
  }
  return out;
}

function extractQuestionsArray(raw: string): GeneratedQuestion[] {
  const cleaned = stripJson(raw);
  let arr: unknown[] = [];
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) arr = parsed;
    else if (parsed && Array.isArray(parsed.questions)) arr = parsed.questions;
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const a = JSON.parse(arrayMatch[0]);
        arr = Array.isArray(a) ? a : [];
      } catch {
        arr = [];
      }
    }
  }
  return arr.map(normalizeQuestion).filter((q): q is GeneratedQuestion => q !== null);
}

export async function generateQuestions(text: string, examType: ExamQuestionType): Promise<GeneratedQuestion[]> {
  const spec = typeSpecs[examType] ?? typeSpecs.all;
  const content = text.slice(0, 120000);
  const prompt = `You are an exam paper generator. Use the ENTIRE content below. Read every section; do not skip or summarize. Create a FRESH set of questions each time—never repeat the same questions; vary topics, phrasing, and difficulty.

Content:
${content}

Instructions: ${spec}

Return ONLY a valid JSON array of question objects. No markdown, no explanation. Each object must have:
- "type": exactly one of "mcq", "fill_blank", or "theory"
- "question": string
- "marks": number (when specified in instructions)
- For type "mcq": "options" (array of 4 strings), "correct" (one of the options)
- For type "fill_blank": "blank_answer" (expected word or short phrase)
- For type "theory": "model_answer" (reference answer for grading, 2–4 sentences)

Output only the JSON array, nothing else.`;
  const raw = await groqComplete(prompt, 8192);
  return extractQuestionsArray(raw);
}

export async function evaluateAnswer(
  referenceText: string,
  studentAnswer: string,
  questionContext?: string
): Promise<{ marks: number; feedback: string; referenceLinks: string[] }> {
  const context = questionContext ? `Question/context: ${questionContext}\n\n` : '';
  const prompt = `[${PROMPT_VERSION}] You are evaluating a student's answer against the reference material.
${context}Reference material:\n${referenceText.slice(0, 30000)}\n\nStudent's answer:\n${studentAnswer.slice(0, 15000)}

Return a JSON object with: "marks" (number 0-10), "feedback" (short string), "referenceLinks" (array of suggested learning links, e.g. YouTube URLs or topic names). No other text.`;
  const raw = await groqComplete(prompt, 1024);
  try {
    const parsed = JSON.parse(stripJson(raw));
    return {
      marks: Math.min(10, Math.max(0, Number(parsed.marks) || 0)),
      feedback: String(parsed.feedback ?? ''),
      referenceLinks: Array.isArray(parsed.referenceLinks) ? parsed.referenceLinks : [],
    };
  } catch {
    return { marks: 0, feedback: 'Could not evaluate.', referenceLinks: [] };
  }
}

/** Returns 5–6 short search phrases to use on YouTube (e.g. "Newton's laws explained"). */
export async function getExploreVideoSearchQueries(topic: string): Promise<string[]> {
  const prompt = `[${PROMPT_VERSION}] For someone learning "${topic}", give 6 short YouTube search phrases that would find real, educational tutorial videos. Return ONLY a JSON object: "queries": ["phrase 1", "phrase 2", ...]. Phrases should be specific and likely to return good tutorials (e.g. "topic name explained", "topic name for beginners"). No URLs. No other text.`;
  const raw = await groqComplete(prompt, 512);
  try {
    const parsed = JSON.parse(stripJson(raw));
    const arr = Array.isArray(parsed.queries) ? parsed.queries : [];
    return arr.slice(0, 6).filter((q: unknown) => typeof q === 'string' && q.trim().length > 0);
  } catch {
    return [topic, `${topic} tutorial`, `${topic} explained`];
  }
}

/** Returns only real, well-known educational websites that teach the topic. */
export async function getExploreWebsites(topic: string): Promise<Array<{ title: string; url: string }>> {
  const prompt = `[${PROMPT_VERSION}] List 5–6 real educational websites that teach "${topic}". Rules:
- Only sites that actually teach or explain the topic (Khan Academy, Britannica, MIT OpenCourseWare, university .edu, official docs, Coursera, edX, etc.).
- Use EXACT real URLs (https://...) that exist. No made-up URLs.
- Prefer recent, reliable sources. Return ONLY a JSON object: "websites": [{"title": "Site name", "url": "https://..."}]. No other text.`;
  const raw = await groqComplete(prompt, 1024);
  try {
    const parsed = JSON.parse(stripJson(raw));
    const arr = Array.isArray(parsed.websites) ? parsed.websites : [];
    return arr
      .slice(0, 6)
      .filter((w: unknown) => w && typeof w === 'object' && typeof (w as { url?: string }).url === 'string')
      .map((w: { title?: string; url: string }) => ({
        title: typeof (w as { title?: string }).title === 'string' ? (w as { title: string }).title : (w as { url: string }).url,
        url: (w as { url: string }).url,
      }));
  } catch {
    return [];
  }
}

export async function exploreTopic(
  topic: string
): Promise<{ videos: Array<{ title: string; url: string }>; websites: Array<{ title: string; url: string }> }> {
  const [queries, websites] = await Promise.all([getExploreVideoSearchQueries(topic), getExploreWebsites(topic)]);
  const videos = queries.map((q) => ({
    title: q,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  }));
  return { videos, websites };
}
