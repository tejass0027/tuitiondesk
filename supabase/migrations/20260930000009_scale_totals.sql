-- =====================================================================
-- TuitionDesk: totals computed inside Postgres, for big centres
--
-- The API returns at most 1000 rows per request. Screens that used to
-- download every fee / student and add them up in the app now call these
-- functions instead: the database does the counting and sends back a
-- handful of rows, so totals stay correct (and fast) at 1000+ students.
--
-- All are SECURITY INVOKER: they run as the logged-in owner, so the
-- normal row-level security still limits them to the owner's centre.
-- =====================================================================

-- Fees per month: expected / collected / pending and how many are due,
-- overdue or paid. Optional class filter (any capitalisation).
create or replace function public.fee_month_totals(p_from date, p_to date, p_class text default null)
returns table (
  month          date,
  expected       numeric,
  collected      numeric,
  pending        numeric,
  due_count      integer,
  overdue_count  integer,
  paid_count     integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select f.month,
         sum(f.amount_due),
         sum(least(f.amount_paid, f.amount_due)),
         sum(f.balance),
         (count(*) filter (where f.status = 'due'))::integer,
         (count(*) filter (where f.status = 'overdue'))::integer,
         (count(*) filter (where f.status = 'paid'))::integer
    from public.fee_overview f
   where f.month between p_from and p_to
     and (p_class is null or lower(trim(f.student_class)) = lower(trim(p_class)))
   group by f.month
   order by f.month
$$;

-- Everything overdue up to a month: how many students / fees / rupees,
-- and how much of it is from months before p_month.
create or replace function public.overdue_totals(p_month date, p_class text default null)
returns table (
  students      integer,
  fees          integer,
  amount        numeric,
  older_fees    integer,
  older_amount  numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(distinct f.student_id)::integer,
         count(*)::integer,
         coalesce(sum(f.balance), 0),
         (count(*) filter (where f.month < p_month))::integer,
         coalesce(sum(f.balance) filter (where f.month < p_month), 0)
    from public.fee_overview f
   where f.status = 'overdue'
     and f.month <= p_month
     and (p_class is null or lower(trim(f.student_class)) = lower(trim(p_class)))
$$;

-- One row per student with overdue fees: total, which months, and the
-- parents to message. Callers sort / page it (e.g. biggest total first).
create or replace function public.overdue_students()
returns table (
  student_id       uuid,
  student_name     text,
  parent_name      text,
  parent_whatsapp  text,
  batch_name       text,
  father_name      text,
  father_phone     text,
  mother_name      text,
  mother_phone     text,
  contact_parent   text,
  months           date[],
  total            numeric,
  latest_fee_id    uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  select f.student_id,
         min(f.student_name),
         min(f.parent_name),
         min(f.parent_whatsapp),
         min(f.batch_name),
         min(f.father_name),
         min(f.father_phone),
         min(f.mother_name),
         min(f.mother_phone),
         min(f.contact_parent),
         array_agg(f.month order by f.month),
         sum(f.balance),
         (array_agg(f.id order by f.month desc))[1]
    from public.fee_overview f
   where f.status = 'overdue'
   group by f.student_id
$$;

-- For each active batch on a day: how many students it has (who had
-- joined by then) and how many were marked.
create or replace function public.batch_day_counts(p_date date)
returns table (batch_id uuid, size integer, marked integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select b.id,
         (select count(*) from public.students s
           where s.batch_id = b.id and s.is_active and s.joining_date <= p_date)::integer,
         (select count(distinct a.student_id) from public.attendance a
           where a.batch_id = b.id and a.date = p_date)::integer
    from public.batches b
   where b.is_active
$$;

-- Active students per class name (lower-cased, trimmed).
create or replace function public.class_counts()
returns table (class_key text, students integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select lower(trim(s.class)), count(*)::integer
    from public.students s
   where s.is_active
   group by 1
$$;

-- Active students below p_threshold % attendance over the last 30 days, worst first.
create or replace function public.low_attendance(p_threshold integer default 75)
returns table (student_id uuid, student_name text, recent_total integer, recent_present integer, percent integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select st.student_id, st.student_name, st.recent_total::integer, st.recent_present::integer,
         round(100.0 * st.recent_present / st.recent_total)::integer as percent
    from public.student_attendance_stats st
   where st.is_active
     and st.recent_total > 0
     and round(100.0 * st.recent_present / st.recent_total) < p_threshold
   order by percent, st.student_name
$$;

-- Fast lookups used by these totals and by the class filter
create index if not exists fee_records_student_id_idx on public.fee_records (student_id);
create index if not exists students_centre_class_idx  on public.students (centre_id, lower(trim(class)));

do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.fee_month_totals(date, date, text)',
    'public.overdue_totals(date, text)',
    'public.overdue_students()',
    'public.batch_day_counts(date)',
    'public.class_counts()',
    'public.low_attendance(integer)'
  ] loop
    execute format('revoke execute on function %s from public, anon', fn);
    execute format('grant execute on function %s to authenticated', fn);
  end loop;
end $$;
