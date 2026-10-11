begin;
create or replace function public.coopfix_validate_address_unit() returns trigger language plpgsql security definer set search_path='' as $$
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
 if new.role='admin' and new.unit is null then return new; end if;
 if capacity>1 and cardinality(units)<>capacity then raise exception 'La coordination doit terminer la liste des logements'; end if;
 if cardinality(units)>0 and (new.unit is null or not new.unit=any(units)) then raise exception 'Choisissez un logement autorisé'; end if;
 if cardinality(units)=0 and new.unit is not null then raise exception 'Les logements doivent être configurés par la coordination'; end if;
 return new;
end $$;
revoke all on function public.coopfix_validate_address_unit() from public,anon,authenticated;
commit;
