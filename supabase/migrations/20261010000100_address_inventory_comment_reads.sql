begin;
alter table public.addresses add column allowed_units text[] not null default '{}';
-- Preserve existing residents' real unit labels; never guess a building's numbering.
update public.addresses a set allowed_units = coalesce((select array_agg(distinct trim(p.unit) order by trim(p.unit)) from public.profiles p where p.address_id=a.id and nullif(trim(p.unit),'') is not null),'{}');
update public.addresses set unit_count=greatest(coalesce(unit_count,1),cardinality(allowed_units));
alter table public.addresses add constraint address_unit_capacity check (unit_count is null or (unit_count>0 and cardinality(allowed_units)<=unit_count));
create function public.coopfix_protect_address_inventory() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.unit_count>1 and cardinality(new.allowed_units)<>new.unit_count then raise exception 'La liste doit contenir tous les logements de cet immeuble'; end if;
 if exists(select 1 from unnest(new.allowed_units) u where nullif(trim(u),'') is null or u<>trim(u) or length(u)>30)
 or cardinality(new.allowed_units)<>(select count(distinct u) from unnest(new.allowed_units) u) then raise exception 'Liste de logements invalide'; end if;
 if tg_op='UPDATE' and exists(select 1 from public.profiles p where p.address_id=new.id and p.unit is not null and not p.unit=any(new.allowed_units)) then raise exception 'Un logement occupé ne peut pas être retiré de la liste'; end if;
 return new;
end $$;
revoke all on function public.coopfix_protect_address_inventory() from public,anon,authenticated;
create trigger coopfix_protect_address_inventory before insert or update on public.addresses for each row execute function public.coopfix_protect_address_inventory();
create function public.coopfix_validate_address_unit() returns trigger language plpgsql security definer set search_path='' as $$
declare units text[]; capacity integer;
begin
 if tg_op='UPDATE' and new.address_id is not distinct from old.address_id and new.unit is not distinct from old.unit then return new; end if;
 new.unit := nullif(trim(new.unit),'');
 if new.address_id is null then
   if new.unit is not null then raise exception 'Choisissez une adresse de la coopérative'; end if;
   if new.role <> 'admin' and exists(select 1 from public.addresses) then raise exception 'Choisissez une adresse de la coopérative'; end if;
   return new;
 end if;
 select allowed_units,unit_count into units,capacity from public.addresses where id=new.address_id;
 if not found then raise exception 'Adresse non autorisée'; end if;
 if capacity>1 and cardinality(units)<>capacity then raise exception 'La coordination doit terminer la liste des logements'; end if;
 if cardinality(units)>0 and (new.unit is null or not new.unit=any(units)) then raise exception 'Choisissez un logement autorisé'; end if;
 if cardinality(units)=0 and new.unit is not null then raise exception 'Les logements doivent être configurés par la coordination'; end if;
 return new;
end $$;
revoke all on function public.coopfix_validate_address_unit() from public,anon,authenticated;
create trigger coopfix_validate_address_unit before insert or update on public.profiles for each row execute function public.coopfix_validate_address_unit();
create function public.coopfix_ticket_address() returns trigger language plpgsql security definer set search_path='' as $$
declare resident public.profiles;
begin
 select * into resident from public.profiles where id=new.created_by;
 if not found then raise exception 'Profil introuvable'; end if;
 if resident.role<>'admin' and (new.address_id is distinct from resident.address_id or new.unit is distinct from resident.unit) then raise exception 'Utilisez votre adresse et votre logement enregistrés'; end if;
 return new;
end $$;
revoke all on function public.coopfix_ticket_address() from public,anon,authenticated;
create trigger coopfix_ticket_address before insert or update of address_id,unit,created_by on public.tickets for each row execute function public.coopfix_ticket_address();
revoke select on public.addresses from anon,authenticated;
grant select(id,name,allowed_units,created_at) on public.addresses to anon,authenticated;
create function public.coopfix_admin_addresses() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.coopfix_is_admin() then raise exception 'Administration requise'; end if;
 return coalesce((select jsonb_agg(to_jsonb(a) || jsonb_build_object('residents',jsonb_build_array(jsonb_build_object('count',(select count(*) from public.profiles p where p.address_id=a.id))),'tickets',jsonb_build_array(jsonb_build_object('count',(select count(*) from public.tickets t where t.address_id=a.id)))) order by a.name) from public.addresses a),'[]');
end $$;
revoke all on function public.coopfix_admin_addresses() from public,anon;
grant execute on function public.coopfix_admin_addresses() to authenticated;

create table public.ticket_comment_reads (
 user_id uuid not null references public.profiles(id) on delete cascade,
 ticket_id uuid not null references public.tickets(id) on delete cascade,
 last_read_at timestamptz not null,
 primary key(user_id,ticket_id)
);
alter table public.ticket_comment_reads enable row level security;
revoke all on public.ticket_comment_reads from public,anon,authenticated;
grant select,insert,update on public.ticket_comment_reads to authenticated;
create policy reads_own on public.ticket_comment_reads to authenticated using(user_id=auth.uid() and exists(select 1 from public.tickets t where t.id=ticket_id)) with check(user_id=auth.uid() and exists(select 1 from public.tickets t where t.id=ticket_id));
create function public.coopfix_unread_comment_tickets() returns setof uuid language sql stable security invoker set search_path='' as $$
 select distinct c.ticket_id from public.ticket_comments c left join public.ticket_comment_reads r on r.ticket_id=c.ticket_id and r.user_id=auth.uid() where c.author_id<>auth.uid() and c.created_at>coalesce(r.last_read_at,'-infinity'::timestamptz);
$$;
create function public.coopfix_read_comments(p_ticket uuid,p_through timestamptz) returns void language sql security invoker set search_path='' as $$
 insert into public.ticket_comment_reads(user_id,ticket_id,last_read_at)
 select auth.uid(),p_ticket,max(created_at) from public.ticket_comments where ticket_id=p_ticket and created_at<=p_through having count(*)>0
 on conflict(user_id,ticket_id) do update set last_read_at=greatest(public.ticket_comment_reads.last_read_at,excluded.last_read_at);
$$;
revoke all on function public.coopfix_unread_comment_tickets(),public.coopfix_read_comments(uuid,timestamptz) from public,anon;
grant execute on function public.coopfix_unread_comment_tickets(),public.coopfix_read_comments(uuid,timestamptz) to authenticated;
commit;
