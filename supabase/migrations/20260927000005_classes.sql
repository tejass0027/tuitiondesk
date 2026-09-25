-- =====================================================================
-- TuitionDesk: the centre's list of classes (Class 1 … 12, JEE, NEET …)
-- Students keep their class as text (students.class); this list is what the
-- owner picks from, and what screens filter by.
-- =====================================================================

create table public.classes (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null default public.my_centre_id()
              references public.centres (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 40),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- One "Class 10" per centre, whatever the capital letters
create unique index classes_centre_name_key on public.classes (centre_id, lower(name));
create index classes_centre_order_idx on public.classes (centre_id, sort_order, name);

alter table public.classes enable row level security;

create policy "Owner manages own classes"
  on public.classes for all to authenticated
  using (centre_id = (select public.my_centre_id()))
  with check (centre_id = (select public.my_centre_id()));

revoke all on public.classes from anon;

-- Renaming a class should rename it on every student in one go
create or replace function public.rename_class(p_class_id uuid, p_new_name text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old text;
begin
  select name into v_old from public.classes where id = p_class_id;
  if v_old is null then
    raise exception 'Class not found';
  end if;
  update public.classes set name = trim(p_new_name) where id = p_class_id;
  update public.students set class = trim(p_new_name)
   where centre_id = public.my_centre_id() and class = v_old;
end;
$$;

revoke execute on function public.rename_class(uuid, text) from public, anon;
grant  execute on function public.rename_class(uuid, text) to authenticated;
