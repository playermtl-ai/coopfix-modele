-- À exécuter uniquement APRÈS configuration et test du service SMTP.
-- Activer également « Confirm email » dans Authentication > Sign In / Providers.
-- Renseigner Site URL = URL publique du site et autoriser son URL /login.
-- Ne modifie pas les comptes déjà créés. Le premier compte reste administrateur.
begin;
drop trigger if exists on_auth_user_auto_confirm on auth.users;
commit;
