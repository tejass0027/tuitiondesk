-- =====================================================================
-- TuitionDesk: let reminders go to BOTH parents
-- contact_parent can now be 'father', 'mother' or 'both'.
-- parent_name / parent_whatsapp stay filled with one "main" parent
-- (father if he has a phone, else mother) for places that need a single one.
-- =====================================================================

alter table public.students drop constraint if exists students_contact_parent_check;
alter table public.students
  add constraint students_contact_parent_check check (contact_parent in ('father', 'mother', 'both'));

create or replace function public.sync_contact_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Fall back to the other parent if the chosen one has no phone
  if new.contact_parent = 'mother' and new.mother_phone is null and new.father_phone is not null then
    new.contact_parent := 'father';
  elsif new.contact_parent = 'father' and new.father_phone is null and new.mother_phone is not null then
    new.contact_parent := 'mother';
  elsif new.contact_parent = 'both' and (new.father_phone is null or new.mother_phone is null) then
    new.contact_parent := case when new.father_phone is not null then 'father' else 'mother' end;
  end if;

  if new.contact_parent = 'mother' then
    new.parent_name     := new.mother_name;
    new.parent_whatsapp := new.mother_phone;
  else
    -- 'father' and 'both' use the father as the main contact
    new.parent_name     := new.father_name;
    new.parent_whatsapp := new.father_phone;
  end if;

  if new.parent_whatsapp is null then
    raise exception 'Enter at least one parent''s phone number'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- Same view as before, plus both parents' details at the end
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
  end as status,
  s.father_name,
  s.father_phone,
  s.mother_name,
  s.mother_phone,
  s.contact_parent
from public.fee_records f
join public.students s on s.id = f.student_id
left join public.batches b on b.id = s.batch_id
left join lateral (
  select sum(pay.amount) as paid, max(pay.paid_on) as last_paid_on
  from public.payments pay
  where pay.fee_record_id = f.id
) p on true;
