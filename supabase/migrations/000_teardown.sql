-- ExamPrep: remove all tables (run before 001_initial when resetting).

alter publication supabase_realtime drop table if exists public.exam_dates;
alter publication supabase_realtime drop table if exists public.announcements;

drop table if exists public.evaluations;
drop table if exists public.question_sets;
drop table if exists public.uploads;
drop table if exists public.announcements;
drop table if exists public.exam_dates;
drop table if exists public.users;
