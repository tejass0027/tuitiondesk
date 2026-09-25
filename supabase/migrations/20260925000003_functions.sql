-- =====================================================================
-- TuitionDesk: helpers, signup trigger, monthly fee generator, views
-- =====================================================================

-- ---------------------------------------------------------------------
-- "Today" in India. The database server runs in UTC, so plain
-- current_date would still be yesterday until 5:30 AM IST.
-- ---------------------------------------------------------------------
create or replace function public.today_ist()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Asia/Kolkata')::date
$$;

-- ---------------------------------------------------------------------
-- centre_id fills itself in, so the app never has to send it.
-- (RLS still checks it on every write.)
-- ---------------------------------------------------------------------
alter table public.batches       alter column centre_id set default public.my_centre_id();
alter table public.students      alter column centre_id set default public.my_centre_id();
alter table public.attendance    alter column centre_id set default public.my_centre_id();
alter table public.fee_records   alter column centre_id set default public.my_centre_id();
alter table public.payments      alter column centre_id set default public.my_centre_id();
alter table public.reminder_logs alter column centre_id set default public.my_centre_id();

alter table public.students   alter column joining_date set default public.today_ist();
alter table public.payments   alter column paid_on      set default public.today_ist();

-- ---------------------------------------------------------------------
-- Signup: when a new auth user is created, create their centre using the
-- details typed on the signup form (sent as user metadata).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.centres (owner_id, name, phone, address)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'centre_name'), ''), 'My Tuition Centre'),
    coalesce(trim(new.raw_user_meta_data ->> 'phone'), ''),
    coalesce(trim(new.raw_user_meta_data ->> 'address'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Monthly fees: create a "due" fee record for every active student for
-- every month up to p_month that doesn't have one yet.
--
-- * Safe to call many times: the unique (student_id, month) key skips
--   months that already exist. The app calls it when Fees/Home open,
--   so no cron job is needed.
-- * Starts from the month the student was added to the app (or their
--   joining month, whichever is later) so adding an old student does not
--   create years of back-dated dues.
-- * Runs as the caller, so RLS keeps it inside the owner's centre.
-- ---------------------------------------------------------------------
create or replace function public.generate_monthly_fees(p_month date default null)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_centre  public.centres;
  v_target  date := date_trunc('month', coalesce(p_month, public.today_ist()))::date;
  v_count   integer;
begin
  select * into v_centre from public.centres where id = public.my_centre_id();
  if v_centre.id is null then
    raise exception 'No centre found for the current user';
  end if;

  insert into public.fee_records (centre_id, student_id, month, amount_due, due_date)
  select
    s.centre_id,
    s.id,
    m.month::date,
    s.monthly_fee,
    -- due on the centre's due day, but never before the student joined
    greatest(
      make_date(extract(year from m.month)::int, extract(month from m.month)::int, v_centre.fee_due_day),
      s.joining_date
    )
  from public.students s
  cross join lateral generate_series(
    date_trunc('month', greatest(s.joining_date, (s.created_at at time zone 'Asia/Kolkata')::date)),
    v_target,
    interval '1 month'
  ) as m(month)
  where s.centre_id = v_centre.id
    and s.is_active
    and s.monthly_fee > 0
  on conflict (student_id, month) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.generate_monthly_fees(date) from public, anon;
grant  execute on function public.generate_monthly_fees(date) to authenticated;

-- ---------------------------------------------------------------------
-- fee_overview: each fee record + student info + how much is paid.
-- status: 'paid' (nothing left), 'overdue' (balance after due date), else 'due'.
-- security_invoker = the view obeys the caller's RLS.
-- ---------------------------------------------------------------------
create or replace view public.fee_overview
with (security_invoker = true)
as
select
  f.id,
  f.centre_id,
  f.student_id,
  f.month,
  f.amount_due,
  f.due_date,
  f.created_at,
  s.name              as student_name,
  s.class             as student_class,
  s.parent_name,
  s.parent_whatsapp,
  s.batch_id,
  b.name              as batch_name,
  coalesce(p.paid, 0)::numeric(10, 2)                              as amount_paid,
  greatest(f.amount_due - coalesce(p.paid, 0), 0)::numeric(10, 2) as balance,
  p.last_paid_on,
  case
    when coalesce(p.paid, 0) >= f.amount_due then 'paid'
    when f.due_date < public.today_ist()      then 'overdue'
    else 'due'
  end as status
from public.fee_records f
join public.students s on s.id = f.student_id
left join public.batches b on b.id = s.batch_id
left join lateral (
  select sum(pay.amount) as paid, max(pay.paid_on) as last_paid_on
  from public.payments pay
  where pay.fee_record_id = f.id
) p on true;

-- ---------------------------------------------------------------------
-- student_attendance_stats: attendance % per student, overall and for
-- the last 30 days (used for the "low attendance" list on Home).
-- ---------------------------------------------------------------------
create or replace view public.student_attendance_stats
with (security_invoker = true)
as
select
  s.id        as student_id,
  s.centre_id,
  s.name      as student_name,
  s.batch_id,
  s.is_active,
  count(a.id)                                         as total_days,
  count(a.id) filter (where a.status = 'present')     as present_days,
  count(a.id) filter (where a.date > public.today_ist() - 30)                          as recent_total,
  count(a.id) filter (where a.date > public.today_ist() - 30 and a.status = 'present') as recent_present
from public.students s
left join public.attendance a on a.student_id = s.id
group by s.id;

revoke all on public.fee_overview, public.student_attendance_stats from anon;
grant select on public.fee_overview, public.student_attendance_stats to authenticated;
