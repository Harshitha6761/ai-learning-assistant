-- Student results (teacher-evaluated): shown as tiles on student Profile.
-- No RLS: access only from server with service role.

create table if not exists public.student_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  exam_name text not null,
  subject text not null,
  marks numeric not null,
  max_marks numeric not null,
  pdf_url text,
  created_at timestamptz default now()
);

create index if not exists idx_student_results_user_id on public.student_results(user_id);

-- Allow server (service role) to insert/select without RLS blocking.
alter table public.student_results disable row level security;
