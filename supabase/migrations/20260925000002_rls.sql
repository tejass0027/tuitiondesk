-- =====================================================================
-- TuitionDesk: row-level security
-- Rule: a signed-in owner can only touch rows whose centre_id is their centre.
-- Even if the app code had a bug, Postgres itself refuses other rows.
-- =====================================================================

-- Returns the centre id of the signed-in user (or null when signed out).
-- security definer lets it read centres without recursing into centres' own RLS.
create or replace function public.my_centre_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.centres where owner_id = auth.uid()
$$;

revoke execute on function public.my_centre_id() from public, anon;
grant  execute on function public.my_centre_id() to authenticated;

alter table public.centres       enable row level security;
alter table public.batches       enable row level security;
alter table public.students      enable row level security;
alter table public.attendance    enable row level security;
alter table public.fee_records   enable row level security;
alter table public.payments      enable row level security;
alter table public.reminder_logs enable row level security;

-- centres: owners can read and edit their own centre.
-- Rows are created by the signup trigger, and never deleted from the app.
create policy "Owner can view own centre"
  on public.centres for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "Owner can update own centre"
  on public.centres for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Everything else: full access, but only inside the owner's centre.
-- `(select ...)` makes Postgres run the lookup once per query, not once per row.
create policy "Owner manages own batches"
  on public.batches for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

create policy "Owner manages own students"
  on public.students for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

create policy "Owner manages own attendance"
  on public.attendance for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

create policy "Owner manages own fee records"
  on public.fee_records for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

create policy "Owner manages own payments"
  on public.payments for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

create policy "Owner manages own reminder logs"
  on public.reminder_logs for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

-- Signed-out visitors get nothing at all.
revoke all on
  public.centres, public.batches, public.students, public.attendance,
  public.fee_records, public.payments, public.reminder_logs
from anon;
