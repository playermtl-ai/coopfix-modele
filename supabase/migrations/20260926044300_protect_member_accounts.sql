begin;
-- One atomic claim per installation, including simultaneous registrations.
create table if not exists public.coop_installation_state (
 id integer primary key check (id=1), admin_claimed boolean not null default false
);
alter table public.coop_installation_state enable row level security;
revoke all on public.coop_installation_state from public,anon,authenticated;
insert into public.coop_installation_state(id,admin_claimed)
 values(1,exists(select 1 from public.profiles)) on conflict(id) do nothing;
create or replace function public.coopfix_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
declare first_account boolean := false;
begin
 update public.coop_installation_state set admin_claimed=true
 where id=1 and not admin_claimed returning true into first_account;
 insert into public.profiles(id,email,full_name,phone,role,address_id,unit)
 values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name',''),
 new.raw_user_meta_data->>'phone',case when coalesce(first_account,false) then 'admin' else 'client' end,
 nullif(new.raw_user_meta_data->>'address_id','')::uuid,new.raw_user_meta_data->>'unit');
 return new;
end;
$$;
revoke all on function public.coopfix_create_profile() from public,anon,authenticated;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists coopfix_new_user on auth.users;
create trigger coopfix_new_user after insert on auth.users for each row execute function public.coopfix_create_profile();
create or replace function public.coopfix_protect_profile() returns trigger language plpgsql set search_path = '' as $$
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
drop trigger if exists coopfix_profile_guard on public.profiles;
create trigger coopfix_profile_guard before update on public.profiles for each row execute function public.coopfix_protect_profile();

revoke insert on public.profiles from anon,authenticated;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_select_all on public.profiles;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
 using(id=auth.uid() or role='admin' or public.coopfix_is_admin());
drop policy if exists tickets_insert_own on public.tickets;
drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert to authenticated
 with check(created_by=auth.uid() and status='nouveau' and priority is null and completed_at is null and completed_by is null);
commit;
