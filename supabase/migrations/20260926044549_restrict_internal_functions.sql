begin;
revoke all on function public.coopfix_is_admin() from public,anon;
grant execute on function public.coopfix_is_admin() to authenticated;
do $$ begin
 if to_regprocedure('public.is_admin()') is not null then
  revoke all on function public.is_admin() from public,anon;
  grant execute on function public.is_admin() to authenticated;
 end if;
 if to_regprocedure('public.handle_new_user()') is not null then
  revoke all on function public.handle_new_user() from public,anon,authenticated;
 end if;
 if to_regprocedure('public.auto_confirm_email()') is not null then
  revoke all on function public.auto_confirm_email() from public,anon,authenticated;
 end if;
end $$;
commit;
