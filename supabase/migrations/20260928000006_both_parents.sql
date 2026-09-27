-- =====================================================================
-- TuitionDesk: father AND mother details for every student
--
-- parent_name / parent_whatsapp stay as "the parent we message" and are now
-- filled in automatically from the chosen parent (contact_parent), so
-- reminders, fee views and report cards keep working unchanged.
-- =====================================================================

alter table public.students
  add column father_name    text not null default '' check (char_length(father_name) <= 120),
  add column father_phone   text check (father_phone ~ '^[0-9]{10,15}$'),
  add column mother_name    text not null default '' check (char_length(mother_name) <= 120),
  add column mother_phone   text check (mother_phone ~ '^[0-9]{10,15}$'),
  add column contact_parent text not null default 'father' check (contact_parent in ('father', 'mother'));

-- Existing students: the parent we already have goes into the father slot
update public.students
   set father_name  = parent_name,
       father_phone = parent_whatsapp;

-- Keep parent_name / parent_whatsapp in step with the chosen parent
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
  end if;

  if new.contact_parent = 'mother' then
    new.parent_name     := new.mother_name;
    new.parent_whatsapp := new.mother_phone;
  else
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

create trigger students_sync_contact_parent
  before insert or update on public.students
  for each row execute function public.sync_contact_parent();
