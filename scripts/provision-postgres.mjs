import { createHash } from 'node:crypto';

export function migrationBody(sql) {
  const clean = sql.replace(/^(?:\s*--[^\n]*(?:\n|$))*/, '').trim();
  if (!/^begin\s*;/i.test(clean) || !/commit\s*;\s*$/i.test(clean)) throw new Error('Migration sans transaction explicite.');
  return clean.replace(/^begin\s*;/i, '').replace(/commit\s*;\s*$/i, '');
}

export function validateDatabaseTarget(connectionString, publicUrl) {
  const database = new URL(connectionString);
  const api = new URL(publicUrl);
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('Connexion PostgreSQL requise.');
  if (api.protocol !== 'https:' || !/^[a-z]{20}\.supabase\.co$/.test(api.hostname)) throw new Error('Adresse Supabase invalide.');
  const ref = api.hostname.split('.')[0];
  const matchesDirect = database.hostname === `db.${ref}.supabase.co`;
  const matchesPooler = database.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(database.username) === `postgres.${ref}`;
  if (!matchesDirect && !matchesPooler) throw new Error('La base et le site ne correspondent pas au même projet Supabase.');
  return ref;
}

export async function provisionPostgres(client, migrations, appUrl) {
  // Validate every migration before changing the database.
  const prepared = migrations.map(m => ({ ...m, body: migrationBody(m.sql), hash: createHash('sha256').update(m.sql.replace(/\r\n/g, '\n')).digest('hex') }));
  await client.query('begin');
  try {
    await client.query("select pg_advisory_xact_lock(hashtext('coopfix_installation'))");
    const tracked = await client.query("select to_regclass('coopfix_installation.migrations') as ledger");
    if (!tracked.rows[0]?.ledger) {
      const existing = await client.query("select tablename from pg_tables where schemaname = 'public'");
      if (existing.rows.length) throw new Error('Base existante sans historique CoopFix : installation interrompue pour protéger ses données.');
      await client.query('create schema coopfix_installation');
      await client.query('revoke all on schema coopfix_installation from public, anon, authenticated');
      await client.query('create table coopfix_installation.migrations (name text primary key, checksum text not null, installed_at timestamptz not null default now())');
      await client.query('revoke all on coopfix_installation.migrations from public, anon, authenticated');
    }
    const history = await client.query('select name, checksum from coopfix_installation.migrations');
    const applied = new Map(history.rows.map(row => [row.name, row.checksum]));
    if (history.rows.some(row => !prepared.some(m => m.name === row.name))) throw new Error('Historique plus récent ou différent du modèle : publication interrompue.');
    let installed = 0;
    for (const migration of prepared) {
      if (applied.has(migration.name)) {
        if (applied.get(migration.name) !== migration.hash) throw new Error('Une migration déjà installée a été modifiée.');
        continue;
      }
      await client.query(migration.body);
      await client.query('insert into coopfix_installation.migrations(name, checksum) values ($1,$2)', [migration.name, migration.hash]);
      installed++;
    }
    if (appUrl) {
      const url = new URL(appUrl);
      if (url.protocol !== 'https:' || url.pathname !== '/') throw new Error('Adresse publique HTTPS sans chemin requise.');
      await client.query("insert into public.coop_notification_settings(id,app_url) values(1,$1) on conflict(id) do update set app_url=excluded.app_url where public.coop_notification_settings.app_url=''", [url.origin]);
    }
    await client.query('commit');
    return { installed };
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}
