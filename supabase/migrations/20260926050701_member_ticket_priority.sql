begin;
drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert to authenticated
with check (
 created_by=auth.uid() and status='nouveau'
 and (priority is null or priority in ('normal','prioritaire','urgent'))
 and completed_at is null and completed_by is null
);
commit;
