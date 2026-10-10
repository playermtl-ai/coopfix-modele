import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installDatabase } from '../scripts/install-database.mjs';

const config = { token: 'test-only', projectRef: 'abcdefghijklmnopqrst', publicUrl: 'https://abcdefghijklmnopqrst.supabase.co', migrations: [{ name: 'coopfix_001', sql: 'select 1;' }, { name: 'coopfix_002', sql: 'select 2;' }] };
const response = (data, status = 200) => ({ ok: status === 200, status, json: async () => data });

test('rejects a mismatched project before making any request', async () => {
  await assert.rejects(installDatabase({ ...config, publicUrl: 'https://another.supabase.co', request: () => assert.fail('No request allowed') }), /correspond/);
});
test('installs in order and stops immediately if a migration fails', async () => {
  const calls = [];
  await assert.rejects(installDatabase({ ...config, request: async (url, options) => {
    calls.push([url, options.body]);
    if (options.method === 'GET') return response([]);
    if (url.endsWith('/query')) return response([]);
    return response({}, 403);
  } }), /403/);
  assert.equal(calls.length, 3);
  assert.equal(JSON.parse(calls[2][1]).name, 'coopfix_001');
});
test('resumes without repeating already installed migrations', async () => {
  const writes = [];
  const result = await installDatabase({ ...config, request: async (_url, options) => {
    if (options.method === 'GET') return response([{ name: 'coopfix_001' }]);
    writes.push(JSON.parse(options.body)); return response({});
  } });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].name, 'coopfix_002');
  assert.deepEqual(result, { installed: 1, alreadyInstalled: 1 });
});
test('refuses an existing untracked database', async () => {
  let calls = 0;
  await assert.rejects(installDatabase({ ...config, request: async () => response(++calls === 1 ? [] : [{ tablename: 'profiles' }]) }), /vide/);
  assert.equal(calls, 2);
});
