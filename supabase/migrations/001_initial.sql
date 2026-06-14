-- ExamPrep: simple DB auth (no Supabase Auth)
-- Admin: admin123@gmail.com / admin123. Teachers and students added by admin.

-- ========== USERS (email + password, role) ==========
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin', 'teacher', 'student')),
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create extension if not exists pgcrypto;
insert into public.users (email, password_hash, role)
values ('admin123@gmail.com', crypt('admin123', gen_salt('bf')), 'admin')
on conflict (email) do nothing;

-- ========== EXAM DATES (Realtime) ==========
create table if not exists public.exam_dates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  exam_date date not null,
  exam_type text not null check (exam_type in ('mid', 'sem')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== ANNOUNCEMENTS (Realtime) ==========
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== UPLOADS ==========
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  bucket text not null,
  path text not null,
  name text not null,
  mime_type text,
  meta jsonb,
  created_at timestamptz default now(),
  unique(bucket, path)
);

-- ========== QUESTION SETS ==========
create table if not exists public.question_sets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  exam_type text not null check (exam_type in ('mid', 'sem')),
  content_json text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== EVALUATIONS ==========
create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null,
  user_id uuid not null references public.users(id) on delete cascade,
  roll_number text not null,
  marks numeric not null default 0,
  feedback text,
  reference_links text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========== REALTIME ==========
alter publication supabase_realtime add table public.exam_dates;
alter publication supabase_realtime add table public.announcements;
