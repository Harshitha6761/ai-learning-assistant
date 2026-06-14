/**
 * AI provider: use Groq (free) when GROQ_API_KEY is set, otherwise Gemini.
 * Same API surface for all features.
 */

import * as gemini from './gemini';
import * as groq from './groq';

export type { GeneratedQuestion, ExamQuestionType } from './gemini';

function isGroqEnabled(): boolean {
  return typeof process.env.GROQ_API_KEY === 'string' && process.env.GROQ_API_KEY.length > 0;
}

export async function summarizeContent(
  text: string,
  imageParts?: Array<{ mimeType: string; data: string }>
): Promise<string> {
  if (isGroqEnabled()) return groq.summarizeContent(text, imageParts);
  return gemini.summarizeContent(text, imageParts);
}

export async function extractKeywords(text: string): Promise<{ count: number; keywords: string[] }> {
  if (isGroqEnabled()) return groq.extractKeywords(text);
  return gemini.extractKeywords(text);
}

export async function generateQuestions(
  text: string,
  examType: import('./gemini').ExamQuestionType
): Promise<import('./gemini').GeneratedQuestion[]> {
  if (isGroqEnabled()) return groq.generateQuestions(text, examType as groq.ExamQuestionType);
  return gemini.generateQuestions(text, examType);
}

export async function evaluateAnswer(
  referenceText: string,
  studentAnswer: string,
  questionContext?: string
): Promise<{ marks: number; feedback: string; referenceLinks: string[] }> {
  if (isGroqEnabled()) return groq.evaluateAnswer(referenceText, studentAnswer, questionContext);
  return gemini.evaluateAnswer(referenceText, studentAnswer, questionContext);
}

export async function exploreTopic(
  topic: string
): Promise<{ videos: Array<{ title: string; url: string }>; websites: Array<{ title: string; url: string }> }> {
  if (isGroqEnabled()) return groq.exploreTopic(topic);
  return gemini.exploreTopic(topic);
}

export async function getExploreWebsites(topic: string): Promise<Array<{ title: string; url: string }>> {
  if (isGroqEnabled()) return groq.getExploreWebsites(topic);
  return gemini.getExploreWebsites(topic);
}