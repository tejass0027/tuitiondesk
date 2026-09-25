-- =====================================================================
-- TuitionDesk: core tables
-- One owner (auth user) = one centre. Every other table carries centre_id
-- so row-level security can check ownership with a single comparison.
-- =====================================================================

create type public.attendance_status as enum ('present', 'absent');
create type public.payment_mode      as enum ('cash', 'upi', 'bank_transfer');
create type public.reminder_type     as enum ('fee', 'absence', 'custom');

-- ---------------------------------------------------------------------
-- centres: the coaching centre owned by a signed-up user
-- ---------------------------------------------------------------------
create table public.centres (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null unique references auth.users (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  phone        text not null default '',
  address      text not null default '',
  -- fee becomes "overdue" after this day of the month (kept <= 28 so it exists in February)
  fee_due_day  smallint not null default 10 check (fee_due_day between 1 and 28),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- batches: e.g. "Class 10 Maths - Evening", Mon/Wed/Fri 5-6 PM
-- ---------------------------------------------------------------------
create table public.batches (
  id           uuid primary key default gen_random_uuid(),
  centre_id    uuid not null references public.centres (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 120),
  days         text[] not null default '{}'
               check (days <@ array['mon','tue','wed','thu','fri','sat','sun']),
  start_time   time,
  end_time     time,
  monthly_fee  numeric(10, 2) not null default 0 check (monthly_fee >= 0),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  -- lets child tables reference (id, centre_id) so a row can never point
  -- at a batch that belongs to a different centre
  unique (id, centre_id)
);

create index batches_centre_id_idx on public.batches (centre_id);

-- ---------------------------------------------------------------------
-- students
-- ---------------------------------------------------------------------
create table public.students (
  id               uuid primary key default gen_random_uuid(),
  centre_id        uuid not null references public.centres (id) on delete cascade,
  batch_id         uuid,
  name             text not null check (char_length(name) between 1 and 120),
  class            text not null default '',
  parent_name      text not null default '',
  -- digits only, with country code, e.g. 919876543210 (what wa.me expects)
  parent_whatsapp  text not null check (parent_whatsapp ~ '^[0-9]{10,15}$'),
  joining_date     date not null default current_date,
  -- starts as the batch fee, can be lowered for discounts
  monthly_fee      numeric(10, 2) not null default 0 check (monthly_fee >= 0),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (id, centre_id),
  foreign key (batch_id, centre_id)
    references public.batches (id, centre_id) on delete restrict
);

create index students_centre_id_name_idx on public.students (centre_id, name);
create index students_batch_id_idx       on public.students (batch_id);

-- ---------------------------------------------------------------------
-- attendance: one row per student per batch per day
-- ---------------------------------------------------------------------
create table public.attendance (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null references public.centres (id) on delete cascade,
  batch_id    uuid not null,
  student_id  uuid not null,
  date        date not null,
  status      public.attendance_status not null default 'present',
  marked_at   timestamptz not null default now(),
  -- saving the same day twice updates the row instead of duplicating it
  unique (student_id, batch_id, date),
  foreign key (student_id, centre_id)
    references public.students (id, centre_id) on delete cascade,
  foreign key (batch_id, centre_id)
    references public.batches (id, centre_id) on delete cascade
);

create index attendance_batch_date_idx   on public.attendance (batch_id, date);
create index attendance_student_date_idx on public.attendance (student_id, date);
create index attendance_centre_date_idx  on public.attendance (centre_id, date);

-- ---------------------------------------------------------------------
-- fee_records: what a student owes for one month
-- ---------------------------------------------------------------------
create table public.fee_records (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null references public.centres (id) on delete cascade,
  student_id  uuid not null,
  month       date not null check (extract(day from month) = 1), -- always the 1st
  amount_due  numeric(10, 2) not null check (amount_due >= 0),
  due_date    date not null,
  created_at  timestamptz not null default now(),
  unique (student_id, month),
  unique (id, centre_id),
  foreign key (student_id, centre_id)
    references public.students (id, centre_id) on delete cascade
);

create index fee_records_centre_month_idx on public.fee_records (centre_id, month);

-- ---------------------------------------------------------------------
-- payments: money received against a fee record (many = partial payments)
-- ---------------------------------------------------------------------
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  centre_id      uuid not null references public.centres (id) on delete cascade,
  fee_record_id  uuid not null,
  amount         numeric(10, 2) not null check (amount > 0),
  paid_on        date not null default current_date,
  mode           public.payment_mode not null default 'cash',
  note           text not null default '',
  created_at     timestamptz not null default now(),
  foreign key (fee_record_id, centre_id)
    references public.fee_records (id, centre_id) on delete cascade
);

create index payments_fee_record_id_idx  on public.payments (fee_record_id);
create index payments_centre_paid_on_idx on public.payments (centre_id, paid_on);

-- ---------------------------------------------------------------------
-- reminder_logs: every WhatsApp reminder the owner opened
-- ---------------------------------------------------------------------
create table public.reminder_logs (
  id             uuid primary key default gen_random_uuid(),
  centre_id      uuid not null references public.centres (id) on delete cascade,
  student_id     uuid not null,
  type           public.reminder_type not null,
  message        text not null,
  fee_record_id  uuid references public.fee_records (id) on delete set null,
  sent_at        timestamptz not null default now(),
  foreign key (student_id, centre_id)
    references public.students (id, centre_id) on delete cascade
);

create index reminder_logs_centre_sent_at_idx on public.reminder_logs (centre_id, sent_at desc);
create index reminder_logs_student_id_idx     on public.reminder_logs (student_id);
create index reminder_logs_fee_record_id_idx  on public.reminder_logs (fee_record_id);
