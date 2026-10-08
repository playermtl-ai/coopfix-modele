begin;
create or replace function public.coopfix_guard_member_address() returns trigger
language plpgsql set search_path = '' as $$
begin
 if current_user in ('anon','authenticated')
 and (new.address_id is distinct from old.address_id or new.unit is distinct from old.unit)
 and not public.coopfix_is_admin() then
  raise exception 'Seul un administrateur peut modifier votre adresse ou votre logement.' using errcode='42501';
 end if;
 return new;
end;
$$;
revoke all on function public.coopfix_guard_member_address() from public,anon,authenticated;
drop trigger if exists coopfix_member_address_guard on public.profiles;
create trigger coopfix_member_address_guard before update of address_id,unit on public.profiles
for each row execute function public.coopfix_guard_member_address();
commit;
