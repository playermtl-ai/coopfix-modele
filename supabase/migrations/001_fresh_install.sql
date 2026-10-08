-- Installation NEUVE uniquement. Pour une base existante, utiliser seulement 002.
begin;
create table public.settings (
  id integer primary key check (id = 1),
  coop_name text not null default '',
  updated_at timestamptz not null default now()
);
insert into public.settings(id) values (1);
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 200),
  unit_count integer check (unit_count > 0),
  created_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  role text not null default 'client' check (role in ('client','admin')),
  address_id uuid references public.addresses(id) on delete set null,
  unit text,
  created_at timestamptz not null default now()
);
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null constraint tickets_created_by_fkey references public.profiles(id),
  address_id uuid references public.addresses(id) on delete set null,
  unit text,
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null check (length(trim(description)) between 1 and 5000),
  category text not null check (category in ('plomberie','electricite','chauffage','menuiserie','exterieur','autre')),
  status text not null default 'nouveau' check (status in ('nouveau','en_cours','termine')),
  priority text check (priority in ('normal','prioritaire','urgent')),
  completed_at timestamptz,
  completed_by uuid constraint tickets_completed_by_fkey references public.profiles(id),
  created_at timestamptz not null default now()
);
create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null constraint ticket_comments_author_fkey references public.profiles(id),
  body text not null check (length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index on public.tickets(created_by);
create index on public.ticket_comments(ticket_id);
create index on public.profiles(address_id);
create function public.coopfix_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.coopfix_is_admin() from public;
grant execute on function public.coopfix_is_admin() to authenticated;
create function public.coopfix_create_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,full_name,phone,address_id,unit)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),new.raw_user_meta_data->>'phone',
    nullif(new.raw_user_meta_data->>'address_id','')::uuid,new.raw_user_meta_data->>'unit');
  return new;
end;
$$;
revoke all on function public.coopfix_create_profile() from public;
create trigger coopfix_new_user after insert on auth.users for each row execute function public.coopfix_create_profile();
-- L'administrateur initial est nommé explicitement depuis SQL Editor (voir guide).
create function public.coopfix_protect_profile() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    if new.id is distinct from old.id or new.email is distinct from old.email or new.created_at is distinct from old.created_at then
      raise exception 'Ces champs ne peuvent pas être modifiés ici';
    end if;
    if new.role is distinct from old.role and not public.coopfix_is_admin() then
      raise exception 'Administration requise';
    end if;
  end if;
  return new;
end;
$$;
create trigger coopfix_profile_guard before update on public.profiles for each row execute function public.coopfix_protect_profile();
alter table public.settings enable row level security;
alter table public.addresses enable row level security;
alter table public.profiles enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;
revoke all on public.settings,public.addresses,public.profiles,public.tickets,public.ticket_comments from anon,authenticated;
grant select on public.settings,public.addresses to anon,authenticated;
grant insert,update,delete on public.addresses to authenticated;
grant select,update on public.profiles to authenticated;
grant select,insert,update on public.tickets to authenticated;
grant select,insert on public.ticket_comments to authenticated;
grant all on public.settings,public.addresses,public.profiles,public.tickets,public.ticket_comments to service_role;
create policy settings_read on public.settings for select to anon,authenticated using (true);
create policy addresses_read on public.addresses for select to anon,authenticated using (true);
create policy addresses_admin on public.addresses for all to authenticated using (public.coopfix_is_admin()) with check (public.coopfix_is_admin());
create policy profiles_read on public.profiles for select to authenticated using (id=auth.uid() or role='admin' or public.coopfix_is_admin());
create policy profiles_update on public.profiles for update to authenticated using (id=auth.uid() or public.coopfix_is_admin()) with check (id=auth.uid() or public.coopfix_is_admin());
create policy tickets_read on public.tickets for select to authenticated using (created_by=auth.uid() or public.coopfix_is_admin());
create policy tickets_insert on public.tickets for insert to authenticated with check (created_by=auth.uid() and status='nouveau' and priority is null and completed_at is null and completed_by is null);
create policy tickets_update on public.tickets for update to authenticated using (public.coopfix_is_admin()) with check (public.coopfix_is_admin());
create policy comments_read on public.ticket_comments for select to authenticated using (exists(select 1 from public.tickets t where t.id=ticket_id and (t.created_by=auth.uid() or public.coopfix_is_admin())));
create policy comments_insert on public.ticket_comments for insert to authenticated with check (author_id=auth.uid() and exists(select 1 from public.tickets t where t.id=ticket_id and (t.created_by=auth.uid() or public.coopfix_is_admin())));
commit;
