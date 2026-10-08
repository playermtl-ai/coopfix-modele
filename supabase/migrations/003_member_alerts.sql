-- Alertes membres. À appliquer après 002, y compris sur une base existante.
begin;
alter table public.ticket_comments add column if not exists is_info_request boolean not null default false;
create or replace function public.coopfix_guard_info_request() returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_info_request and current_user in ('anon','authenticated') and not public.coopfix_is_admin() then
    raise exception 'Seul un administrateur peut demander des précisions' using errcode='42501';
  end if;
  return new;
end;
$$;
drop trigger if exists coopfix_info_guard on public.ticket_comments;
create trigger coopfix_info_guard before insert or update on public.ticket_comments for each row execute function public.coopfix_guard_info_request();
commit;
