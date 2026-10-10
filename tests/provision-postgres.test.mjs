import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { migrationBody, validateDatabaseTarget, provisionPostgres } from '../scripts/provision-postgres.mjs';

const migration = { name: '001.sql', sql: 'begin; select 42; commit;' };
function mock({ existing = [], history = [], fail = false } = {}) {
  const calls = [];
  return { calls, async query(sql, params) {
    calls.push([sql, params]);
    if (sql.includes('to_regclass')) return { rows: [{ ledger: history.length ? 'migrations' : null }] };
    if (sql.includes('from pg_tables')) return { rows: existing };
    if (sql.startsWith('select name')) return { rows: history };
    if (fail && sql.includes('select 42')) throw new Error('SQL failure');
    return { rows: [] };
  } };
}
test('refuses a different Supabase project before connecting', () => {
  assert.throws(() => validateDatabaseTarget('postgres://postgres:secret@db.bbbbbbbbbbbbbbbbbbbb.supabase.co/postgres', 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co'));
  assert.equal(validateDatabaseTarget('postgres://postgres.aaaaaaaaaaaaaaaaaaaa:secret@aws-0.pooler.supabase.com/postgres', 'https://aaaaaaaaaaaaaaaaaaaa.supabase.co'), 'aaaaaaaaaaaaaaaaaaaa');
});
test('validates SQL transaction wrappers', () => {
  assert.equal(migrationBody('-- comment\nbegin; select 42; commit;').trim(), 'select 42;');
  assert.throws(() => migrationBody('select 42;'));
});
test('installs fresh database in one transaction', async () => {
  const db = mock();
  assert.deepEqual(await provisionPostgres(db, [migration]), { installed: 1 });
  assert.equal(db.calls.at(-1)[0], 'commit');
  assert.ok(db.calls.some(([sql]) => sql.startsWith('insert into')));
});
test('repeat deployment skips unchanged migration', async () => {
  const db = mock({ history: [{ name: migration.name, checksum: createHash('sha256').update(migration.sql).digest('hex') }] });
  assert.deepEqual(await provisionPostgres(db, [migration]), { installed: 0 });
  assert.ok(!db.calls.some(([sql]) => sql.includes('select 42')));
});
test('protects an existing database without installation history', async () => {
  const db = mock({ existing: [{ tablename: 'important_data' }] });
  await assert.rejects(provisionPostgres(db, [migration]));
  assert.equal(db.calls.at(-1)[0], 'rollback');
  assert.ok(!db.calls.some(([sql]) => sql.startsWith('create')));
});
test('SQL failure rolls back the entire installation', async () => {
  const db = mock({ fail: true });
  await assert.rejects(provisionPostgres(db, [migration]));
  assert.equal(db.calls.at(-1)[0], 'rollback');
  assert.ok(!db.calls.some(([sql]) => sql === 'commit'));
});
test('changed installed migration aborts publication', async () => {
  const db = mock({ history: [{ name: migration.name, checksum: 'changed' }] });
  await assert.rejects(provisionPostgres(db, [migration]));
  assert.equal(db.calls.at(-1)[0], 'rollback');
});
