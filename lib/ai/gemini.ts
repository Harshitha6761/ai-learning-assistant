import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';

const PROMPT_VERSION = 'v1';

// gemini-2.0-flash-lite has free-tier quota (15 RPM, 1000/day). gemini-2.0-flash often has 0 free quota.
const DEFAULT_MODEL = 'gemini-2.0-flash-lite';

function getModel(): GenerativeModel {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY is not set');
  const genAI = new GoogleGenerativeAI(key);
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  return genAI.getGenerativeModel({ model: modelName });
}

export async function summarizeContent(text: string, imageParts?: Array<{ mimeType: string; data: string }>): Promise<string> {
  const model = getModel();
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
    { text: `[${PROMPT_VERSION}] Summarize the following content clearly and concisely. Return only the summary, no preamble.\n\n${text}` },
  ];
  if (imageParts?.length) {
    imageParts.forEach((img) => parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } }));
  }
  const result = await model.generateContent(parts);
  const response = result.response;
  return response.text() ?? '';
}

export async function extractKeywords(text: string): Promise<{ count: number; keywords: string[] }> {
  const model = getModel();
  const prompt = `[${PROMPT_VERSION}] From the following content, extract important keywords (terms, concepts). Return a JSON object with two keys: "count" (number of keywords) and "keywords" (array of strings). No other text.\n\n${text.slice(0, 80000)}`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text() ?? '{}';
  try {
    const parsed = JSON.parse(raw.replace(/```json?\s*|\s*```/g, '').trim());
    return {
      count: Number(parsed.count) || 0,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
    };
  } catch {
    return { count: 0, keywords: [] };
  }
}

export interface GeneratedQuestion {
  type: 'mcq' | 'fill_blank' | 'theory';
  question: string;
  marks?: number;
  options?: string[];
  correct?: string;
  blank_answer?: string;
  model_answer?: string; // for theory: reference answer for AI evaluation
}

export type ExamQuestionType = 'all' | 'mcq' | 'fill_blank' | 'theory' | 'mid' | 'sem';

function stripJson(raw: string): string {
  return raw.replace(/```json?\s*|\s*```/g, '').trim();
}

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

export async function generateQuestions(
  text: string,
  examType: ExamQuestionType
): Promise<GeneratedQuestion[]> {
  const model = getModel();
  const typeSpecs: Record<ExamQuestionType, string> = {
    all: 'Include MCQs, fill-in-the-blanks, and theory. E.g. 3 MCQs, 2 fill_blank, 2 theory.',
    mcq: 'Include ONLY multiple choice questions (MCQs). Generate 6–8 MCQs. Each: "type": "mcq", "question", "options" (4 strings), "correct".',
    fill_blank: 'Include ONLY fill-in-the-blank questions. Generate 5–7 questions. Each: "type": "fill_blank", "question", "blank_answer".',
    theory: 'Include ONLY theory (long form) questions. Generate 3–4 theory questions. Each: "type": "theory", "question", "model_answer" (reference answer for evaluation).',
    mid: 'MID EXAM: Generate exactly 11 questions from the content. (1) 5 short-answer questions, 2 marks each — type "fill_blank", include "blank_answer", add "marks": 2. (2) 6 long-answer questions, 5 marks each (4 mandatory to solve) — type "theory", include "model_answer", add "marks": 5. Base all questions only on the given content.',
    sem: 'SEM EXAM: Generate exactly 20 questions from the content, spread across 5 units. (1) 10 short-answer questions, 1 mark each (2 from each unit, no optional) — type "fill_blank", "blank_answer", "marks": 1. (2) 10 long-answer questions, 10 marks each (2 from each unit, 1 optional per unit) — type "theory", "model_answer", "marks": 10. Ensure coverage from each unit. Base only on the given content.',
  };
  const spec = typeSpecs[examType] ?? typeSpecs.all;
  const content = text.slice(0, 120000);
  const prompt = `[${PROMPT_VERSION}] Use the ENTIRE content below. Read every section; do not skip. Generate a FRESH set of questions—vary topics and phrasing each time.

Format: ${spec}

Return a JSON array of objects. Each object must have "type" ("mcq", "fill_blank", or "theory"), "question", and "marks" when specified.
- For type "mcq": also "options" (array of 4 strings), "correct" (the correct option string).
- For type "fill_blank": also "blank_answer" (expected word or phrase).
- For type "theory": also "model_answer" (reference answer for grading).
No other text. Only the JSON array.

Content:
${content}`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text() ?? '[]';
  return extractQuestionsArray(raw);
}

export async function evaluateAnswer(
  referenceText: string,
  studentAnswer: string,
  questionContext?: string
): Promise<{ marks: number; feedback: string; referenceLinks: string[] }> {
  const model = getModel();
  const context = questionContext ? `Question/context: ${questionContext}\n\n` : '';
  const prompt = `[${PROMPT_VERSION}] You are evaluating a student's answer against the reference material.
${context}Reference material:\n${referenceText.slice(0, 30000)}\n\nStudent's answer:\n${studentAnswer.slice(0, 15000)}

Return a JSON object with: "marks" (number 0-10), "feedback" (short string), "referenceLinks" (array of suggested learning links, e.g. YouTube URLs or topic names). No other text.`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text() ?? '{}';
  try {
    const parsed = JSON.parse(raw.replace(/```json?\s*|\s*```/g, '').trim());
    return {
      marks: Math.min(10, Math.max(0, Number(parsed.marks) || 0)),
      feedback: String(parsed.feedback ?? ''),
      referenceLinks: Array.isArray(parsed.referenceLinks) ? parsed.referenceLinks : [],
    };
  } catch {
    return { marks: 0, feedback: 'Could not evaluate.', referenceLinks: [] };
  }
}

export async function getExploreVideoSearchQueries(topic: string): Promise<string[]> {
  const model = getModel();
  const prompt = `[${PROMPT_VERSION}] For someone learning "${topic}", give 6 short YouTube search phrases that would find real, educational tutorial videos. Return ONLY a JSON object: "queries": ["phrase 1", "phrase 2", ...]. Phrases should be specific and likely to return good tutorials. No URLs. No other text.`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text() ?? '{}';
  try {
    const parsed = JSON.parse(raw.replace(/```json?\s*|\s*```/g, '').trim());
    const arr = Array.isArray(parsed.queries) ? parsed.queries : [];
    return arr.slice(0, 6).filter((q: unknown) => typeof q === 'string' && (q as string).trim().length > 0);
  } catch {
    return [topic, `${topic} tutorial`, `${topic} explained`];
  }
}

export async function getExploreWebsites(topic: string): Promise<Array<{ title: string; url: string }>> {
  const model = getModel();
  const prompt = `[${PROMPT_VERSION}] List 5–6 real educational websites that teach "${topic}". Only sites that actually teach the topic (Khan Academy, Britannica, MIT OpenCourseWare, university .edu, Coursera, edX, etc.). Use EXACT real URLs that exist. Return ONLY a JSON object: "websites": [{"title": "Site name", "url": "https://..."}]. No other text.`;
  const result = await model.generateContent(prompt);
  const raw = result.response.text() ?? '{}';
  try {
    const parsed = JSON.parse(raw.replace(/```json?\s*|\s*```/g, '').trim());
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

export async function exploreTopic(topic: string): Promise<{ videos: Array<{ title: string; url: string }>; websites: Array<{ title: string; url: string }> }> {
  const [queries, websites] = await Promise.all([getExploreVideoSearchQueries(topic), getExploreWebsites(topic)]);
  const videos = queries.map((q) => ({
    title: q,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
  }));
  return { videos, websites };
}
