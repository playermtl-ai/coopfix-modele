import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
// Optional local test dependency; never included in the deployed application.
import { PGlite } from '../.verification/node_modules/@electric-sql/pglite/dist/index.js';

test('Real PostgreSQL: approved units, private capacity and per-user comment receipts', async () => {
 const db = new PGlite();
 try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
   create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  const files = (await readdir('supabase/migrations')).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) await db.exec(await readFile(`supabase/migrations/${file}`, 'utf8'));
  const admin='00000000-0000-0000-0000-000000000001', member='00000000-0000-0000-0000-000000000002', other='00000000-0000-0000-0000-000000000003';
  const address='00000000-0000-0000-0000-000000000010', ticket='00000000-0000-0000-0000-000000000020';
  await db.exec(`insert into auth.users values('${admin}','admin@example.test','{}');
   insert into public.addresses(id,name,unit_count,allowed_units) values('${address}','95 rue Exemple',2,array['101','B402']);`);
  await assert.rejects(db.exec(`insert into auth.users values('${member}','member@example.test','{"address_id":"${address}","unit":"999"}')`),/logement autorisé/);
  await db.exec(`insert into auth.users values('${member}','member@example.test','{"address_id":"${address}","unit":"B402"}'),('${other}','other@example.test','{"address_id":"${address}","unit":"101"}');`);
  await assert.rejects(db.exec(`insert into addresses(name,unit_count,allowed_units) values('Immeuble incomplet',200,array['101'])`),/tous les logements/);
  await assert.rejects(db.exec(`update addresses set unit_count=1,allowed_units=array['101'] where id='${address}'`),/occupé/);
  await db.exec(`insert into tickets(id,created_by,address_id,unit,title,description,category) values('${ticket}','${member}','${address}','B402','Fuite','Test local','plomberie');
   insert into ticket_comments(ticket_id,author_id,body,created_at) values('${ticket}','${admin}','Réponse','2026-10-10T10:00:00Z');
   set role anon;`);
  await assert.rejects(db.query('select unit_count from addresses'),/permission denied/);
  assert.equal((await db.query('select name,allowed_units from addresses')).rows.length,1);
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${member}',false);`);
  await assert.rejects(db.query('select coopfix_admin_addresses()'),/Administration requise/);
  await assert.rejects(db.exec(`update profiles set unit='101' where id='${member}'`),/administrateur/);
  await assert.rejects(db.exec(`insert into tickets(created_by,address_id,unit,title,description,category) values('${member}','${address}','999','Adresse inventée','Test','autre')`),/adresse et votre logement/);
  assert.equal((await db.query('select coopfix_unread_comment_tickets()')).rows.length,1);
  await db.exec(`select coopfix_read_comments('${ticket}','2026-10-10T10:00:00Z');`);
  assert.equal((await db.query('select coopfix_unread_comment_tickets()')).rows.length,0);
  await db.exec(`reset role; insert into ticket_comments(ticket_id,author_id,body,created_at) values('${ticket}','${admin}','Nouvelle réponse','2026-10-10T11:00:00Z'); set role authenticated;`);
  await db.exec(`select coopfix_read_comments('${ticket}','2026-10-10T10:00:00Z');`);
  assert.equal((await db.query('select coopfix_unread_comment_tickets()')).rows.length,1,'A later comment must not be marked read by a stale screen');
  await db.exec(`select coopfix_read_comments('${ticket}','2026-10-10T11:00:00Z'); select coopfix_read_comments('${ticket}','2026-10-10T10:00:00Z');`);
  assert.equal((await db.query('select coopfix_unread_comment_tickets()')).rows.length,0,'A second tab cannot move the receipt backwards');
  await db.exec(`insert into ticket_comments(ticket_id,author_id,body,created_at) values('${ticket}','${member}','Ma réponse','2026-10-10T12:00:00Z');`);
  assert.equal((await db.query('select coopfix_unread_comment_tickets()')).rows.length,0,'Own replies are not unread');
  await db.exec(`select set_config('request.jwt.claim.sub','${other}',false);`);
  assert.equal((await db.query('select coopfix_unread_comment_tickets()')).rows.length,0,'Another member cannot see the ticket');
  await db.exec(`select coopfix_read_comments('${ticket}','2026-10-10T12:00:00Z');`);
  assert.equal((await db.query('select * from ticket_comment_reads')).rows.length,0,'No receipt for an inaccessible ticket');
  await db.exec(`select set_config('request.jwt.claim.sub','${admin}',false);`);
  assert.equal((await db.query('select coopfix_unread_comment_tickets()')).rows.length,1,'Admin has an independent unread receipt');
  assert.equal((await db.query('select coopfix_admin_addresses() as addresses')).rows[0].addresses[0].unit_count,2);
 } finally { await db.close(); }
});
test('Admin can save and reload a legacy building without a unit; members remain constrained', async () => {
 const db = new PGlite();
 try {
  await db.exec("create role anon; create role authenticated; create role service_role; create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;");
  const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
  const admin='00000000-0000-0000-0000-000000000001', address='00000000-0000-0000-0000-000000000010';
  for(const file of files) {
   if(file==='20261010000100_address_inventory_comment_reads.sql') {
    await db.exec(`insert into auth.users values('${admin}','admin@example.test','{}'); update profiles set role='admin' where id='${admin}'; insert into addresses(id,name,unit_count) values('${address}','Legacy building',3);`);
   }
   if(file.endsWith('_admin_optional_unit.sql')) {
    await assert.rejects(db.exec(`update profiles set address_id='${address}' where id='${admin}'`),/terminer la liste/);
   }
   await db.exec(await readFile(`supabase/migrations/${file}`,'utf8'));
  }
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${admin}',false); update profiles set address_id='${address}',unit=null where id='${admin}';`);
  assert.equal((await db.query(`select address_id from profiles where id='${admin}'`)).rows[0].address_id,address);
  await assert.rejects(db.exec(`update profiles set unit='999' where id='${admin}'`),/terminer la liste/);
  await db.exec('reset role');
  await assert.rejects(db.exec(`insert into auth.users values('00000000-0000-0000-0000-000000000002','member@example.test','{"address_id":"${address}"}')`),/terminer la liste/);
 } finally {await db.close();}
});
