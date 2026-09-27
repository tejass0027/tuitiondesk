-- =====================================================================
-- TuitionDesk: student photos, holidays, and a read-only link for parents
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Student photos
-- Files live in a PRIVATE storage bucket, one folder per centre:
--   student-photos/<centre_id>/<student_id>-<time>.jpg
-- The app shows them with short-lived signed URLs.
-- ---------------------------------------------------------------------
alter table public.students
  add column photo_path text check (photo_path is null or char_length(photo_path) <= 200);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- An owner can only touch files inside their own centre's folder
create policy "Owner reads own student photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'student-photos' and (storage.foldername(name))[1] = (select public.my_centre_id())::text);

create policy "Owner uploads own student photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'student-photos' and (storage.foldername(name))[1] = (select public.my_centre_id())::text);

create policy "Owner updates own student photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'student-photos' and (storage.foldername(name))[1] = (select public.my_centre_id())::text)
  with check (bucket_id = 'student-photos' and (storage.foldername(name))[1] = (select public.my_centre_id())::text);

create policy "Owner deletes own student photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'student-photos' and (storage.foldername(name))[1] = (select public.my_centre_id())::text);

-- ---------------------------------------------------------------------
-- 2. Holidays: days the centre is closed (Diwali, exams, …).
-- Attendance can't be marked on them, and calendars show them.
-- ---------------------------------------------------------------------
create table public.holidays (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null default public.my_centre_id()
              references public.centres (id) on delete cascade,
  date        date not null,
  name        text not null default '' check (char_length(name) <= 80),
  created_at  timestamptz not null default now(),
  unique (centre_id, date)
);

alter table public.holidays enable row level security;

create policy "Owner manages own holidays"
  on public.holidays for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

revoke all on public.holidays from anon;

-- ---------------------------------------------------------------------
-- 3. Parent link: a secret, unguessable token per student.
-- Anyone with the link sees ONE student's attendance, marks and fees,
-- read-only. The owner can turn the link off (token = null) any time.
-- The whole feature is optional: a switch in Settings, off by default.
-- Turning it off stops every link; turning it on again brings them back.
-- ---------------------------------------------------------------------
alter table public.centres
  add column parent_links_enabled boolean not null default false;

alter table public.students
  add column share_token text unique check (share_token is null or char_length(share_token) between 24 and 64);

-- Runs as the table owner (security definer) so visitors without a login
-- can read, but it only ever returns the one student whose token matches.
create or replace function public.parent_view(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with s as (
    select st.id, st.centre_id, st.name, st.class, st.joining_date, st.is_active, b.name as batch_name
      from public.students st
      join public.centres ce on ce.id = st.centre_id and ce.parent_links_enabled
      left join public.batches b on b.id = st.batch_id
     where p_token is not null
       and char_length(p_token) >= 24
       and st.share_token = p_token
  )
  select case when not exists (select 1 from s) then null else jsonb_build_object(
    'today', public.today_ist(),
    'centre', (select jsonb_build_object('name', c.name, 'phone', c.phone)
                 from public.centres c join s on c.id = s.centre_id),
    'student', (select jsonb_build_object('name', name, 'class', class, 'batch', batch_name,
                                          'joining_date', joining_date, 'is_active', is_active) from s),
    'totals', (select jsonb_build_object('total', count(*), 'present', count(*) filter (where a.status = 'present'))
                 from public.attendance a join s on a.student_id = s.id),
    'attendance', (select coalesce(jsonb_agg(jsonb_build_object('date', a.date, 'status', a.status) order by a.date), '[]'::jsonb)
                     from public.attendance a join s on a.student_id = s.id
                    where a.date > public.today_ist() - 120),
    'holidays', (select coalesce(jsonb_agg(jsonb_build_object('date', h.date, 'name', h.name) order by h.date), '[]'::jsonb)
                   from public.holidays h join s on h.centre_id = s.centre_id
                  where h.date > public.today_ist() - 120 and h.date <= public.today_ist() + 60),
    'tests', (select coalesce(jsonb_agg(x order by x ->> 'date' desc), '[]'::jsonb) from (
                select jsonb_build_object('name', t.name, 'subject', t.subject, 'date', t.test_date,
                                          'max', t.max_marks, 'marks', m.marks, 'absent', m.absent) as x
                  from public.test_marks m
                  join public.tests t on t.id = m.test_id
                  join s on m.student_id = s.id
                 order by t.test_date desc
                 limit 20) q),
    'fees', (select coalesce(jsonb_agg(jsonb_build_object('month', f.month, 'due', f.amount_due, 'paid', f.amount_paid,
                                                          'balance', f.balance, 'status', f.status) order by f.month desc), '[]'::jsonb)
               from public.fee_overview f join s on f.student_id = s.id
              where f.month > public.today_ist() - interval '12 months')
  ) end
$$;

revoke execute on function public.parent_view(text) from public;
grant  execute on function public.parent_view(text) to anon, authenticated;
