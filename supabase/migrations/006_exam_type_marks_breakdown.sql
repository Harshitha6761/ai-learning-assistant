-- Store exam type (mid/sem) and per-question marks for editing.
alter table public.student_results
  add column if not exists exam_type text check (exam_type is null or exam_type in ('mid', 'sem'));
alter table public.student_results
  add column if not exists marks_breakdown jsonb;

comment on column public.student_results.exam_type is 'mid = 11 questions/30 marks, sem = 20 questions/60 marks';
comment on column public.student_results.marks_breakdown is 'Array of numbers: marks per question';
