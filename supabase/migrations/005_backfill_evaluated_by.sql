-- Backfill: assign existing evaluations (evaluated_by was NULL) to the first teacher.
-- Run after 004_student_results_evaluated_by.sql so your past evaluations show under "Evaluated papers".
update public.student_results
set evaluated_by = (select id from public.users where role = 'teacher' order by created_at asc limit 1)
where evaluated_by is null
  and exists (select 1 from public.users where role = 'teacher');
