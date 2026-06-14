export type Role = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

export interface ExamDate {
  id: string;
  title: string;
  exam_date: string;
  exam_type: 'mid' | 'sem';
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface UploadRecord {
  id: string;
  user_id: string;
  bucket: string;
  path: string;
  name: string;
  mime_type: string;
  meta?: Record<string, unknown>;
  created_at: string;
}

export interface QuestionSet {
  id: string;
  created_by: string;
  title: string;
  exam_type: 'mid' | 'sem';
  content_json: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationRecord {
  id: string;
  assignment_id: string;
  user_id: string;
  roll_number: string;
  marks: number;
  feedback: string | null;
  reference_links: string[] | null;
  created_at: string;
  updated_at: string;
}
