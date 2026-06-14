-- Track which teacher evaluated each result (for "Evaluated papers" list).
alter table public.student_results
  add column if not exists evaluated_by uuid references public.users(id) on delete set null;

create index if not exists idx_student_results_evaluated_by on public.student_results(evaluated_by);
