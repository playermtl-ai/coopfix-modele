-- Applicable après 001, OU sur la base originale possédant settings et profiles.
-- Préserve le nom, les membres, les adresses et les billets existants.
begin;
create or replace function public.coopfix_is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function public.coopfix_is_admin() from public;
grant execute on function public.coopfix_is_admin() to authenticated;
create table if not exists public.coop_notification_settings (
  id integer primary key check (id=1),
  notification_email text not null default '',
  notifications_enabled boolean not null default false,
  app_url text not null default ''
);
alter table public.coop_notification_settings enable row level security;
revoke all on public.coop_notification_settings from anon,authenticated;
grant all on public.coop_notification_settings to service_role;
insert into public.coop_notification_settings(id) values (1) on conflict do nothing;
insert into public.settings(id,coop_name) values (1,'') on conflict do nothing;
create or replace function public.get_coop_settings() returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.coopfix_is_admin() then raise exception 'Administration requise' using errcode='42501'; end if;
  select jsonb_build_object('coop_name',s.coop_name,'notification_email',n.notification_email,'notifications_enabled',n.notifications_enabled,'app_url',n.app_url)
    into result from public.settings s join public.coop_notification_settings n on n.id=s.id where s.id=1;
  return result;
end;
$$;
create or replace function public.save_coop_settings(p_name text,p_email text,p_enabled boolean,p_url text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.coopfix_is_admin() then raise exception 'Administration requise' using errcode='42501'; end if;
  p_name := trim(coalesce(p_name,'')); p_email := trim(coalesce(p_email,'')); p_url := rtrim(trim(coalesce(p_url,'')),'/');
  if length(p_name) not between 1 and 80 then raise exception 'Nom requis (80 caractères maximum)'; end if;
  if p_email <> '' and (length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Courriel invalide'; end if;
  if p_url <> '' and (length(p_url)>500 or p_url !~ '^https://[a-zA-Z0-9.-]+(:[0-9]+)?$') then raise exception 'Adresse publique HTTPS invalide'; end if;
  if coalesce(p_enabled,false) and (p_email='' or p_url='') then raise exception 'Courriel et adresse du site requis'; end if;
  insert into public.settings(id,coop_name,updated_at) values(1,p_name,now()) on conflict(id) do update set coop_name=excluded.coop_name,updated_at=excluded.updated_at;
  insert into public.coop_notification_settings(id,notification_email,notifications_enabled,app_url) values(1,p_email,coalesce(p_enabled,false),p_url)
    on conflict(id) do update set notification_email=excluded.notification_email,notifications_enabled=excluded.notifications_enabled,app_url=excluded.app_url;
end;
$$;
revoke all on function public.get_coop_settings() from public,anon;
revoke all on function public.save_coop_settings(text,text,boolean,text) from public,anon;
grant execute on function public.get_coop_settings() to authenticated;
grant execute on function public.save_coop_settings(text,text,boolean,text) to authenticated;
commit;
