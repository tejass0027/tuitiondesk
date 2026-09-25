-- =====================================================================
-- TuitionDesk: tests & marks
-- A test belongs to one batch (e.g. "Unit Test 1 – Algebra", out of 50).
-- test_marks holds one row per student per test.
-- =====================================================================

create table public.tests (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null default public.my_centre_id()
              references public.centres (id) on delete cascade,
  batch_id    uuid not null,
  name        text not null check (char_length(name) between 1 and 120),
  subject     text not null default '' check (char_length(subject) <= 60),
  test_date   date not null default public.today_ist(),
  max_marks   numeric(6, 2) not null check (max_marks > 0 and max_marks <= 1000),
  created_at  timestamptz not null default now(),
  unique (id, centre_id),
  foreign key (batch_id, centre_id)
    references public.batches (id, centre_id) on delete cascade
);

create index tests_centre_date_idx on public.tests (centre_id, test_date desc);
create index tests_batch_id_idx    on public.tests (batch_id);

create table public.test_marks (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null default public.my_centre_id()
              references public.centres (id) on delete cascade,
  test_id     uuid not null,
  student_id  uuid not null,
  -- null marks + absent = true means the student missed the test
  marks       numeric(6, 2) check (marks >= 0),
  absent      boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique (test_id, student_id),
  check (absent or marks is not null),
  foreign key (test_id, centre_id)
    references public.tests (id, centre_id) on delete cascade,
  foreign key (student_id, centre_id)
    references public.students (id, centre_id) on delete cascade
);

create index test_marks_student_id_idx on public.test_marks (student_id);

-- Marks can never be more than the test's maximum (checked in the database too)
create or replace function public.check_marks_within_max()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_max numeric;
begin
  if new.marks is null then
    return new;
  end if;
  select max_marks into v_max from public.tests where id = new.test_id;
  if new.marks > v_max then
    raise exception 'Marks (%) cannot be more than the maximum (%)', new.marks, v_max
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger test_marks_within_max
  before insert or update on public.test_marks
  for each row execute function public.check_marks_within_max();

-- ...and the maximum can't be lowered below marks that are already entered
create or replace function public.check_max_above_existing_marks()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.test_marks where test_id = new.id and marks > new.max_marks) then
    raise exception 'Some marks are already more than the new maximum (%)', new.max_marks
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger tests_max_above_existing_marks
  before update of max_marks on public.tests
  for each row execute function public.check_max_above_existing_marks();

-- Row-level security: same rule as everything else
alter table public.tests      enable row level security;
alter table public.test_marks enable row level security;

create policy "Owner manages own tests"
  on public.tests for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

create policy "Owner manages own test marks"
  on public.test_marks for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

revoke all on public.tests, public.test_marks from anon;

-- Result messages to parents are logged like other reminders
alter type public.reminder_type add value if not exists 'result';
