import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Server-side only. Never import this file into the browser application.
export async function installDatabase({ token, projectRef, publicUrl, request = fetch, migrations }) {
  if (!token || !/^[a-z]{20}$/.test(projectRef ?? '')) throw new Error('Autorisation Supabase et projet requis.');
  if (publicUrl !== `https://${projectRef}.supabase.co`) throw new Error('Le projet ne correspond pas au site à installer.');
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database`;
  const call = async (path, body) => {
    const response = await request(`${endpoint}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(60000),
    });
    // Do not echo provider responses: they may contain credentials or user data.
    if (!response.ok) throw new Error(`Installation refusée par Supabase (${response.status}).`);
    return response.json();
  };
  const history = await call('/migrations');
  if (!Array.isArray(history)) throw new Error('Historique des migrations inattendu.');
  const applied = new Set(history.map(entry => entry.name));
  const knownNames = new Set(migrations.map(entry => entry.name));
  if (history.some(entry => !knownNames.has(entry.name))) throw new Error('Cette base contient des migrations étrangères au modèle.');
  // Refuse to adopt an existing untracked schema. This installer is for a new coop.
  if (history.length === 0) {
    const tables = await call('/query', { query: "select tablename from pg_tables where schemaname = 'public'", read_only: true });
    if (!Array.isArray(tables) || tables.length > 0) throw new Error('Une base neuve et vide est requise.');
  }
  let installed = 0;
  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    await call('/migrations', { name: migration.name, query: migration.sql });
    installed++;
  }
  return { installed, alreadyInstalled: applied.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const directory = new URL('../supabase/migrations/', import.meta.url);
    const filenames = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
    const migrations = await Promise.all(filenames.map(async name => ({
      name: `coopfix_${name.replace(/\.sql$/, '')}`,
      sql: await readFile(new URL(name, directory), 'utf8'),
    })));
    const result = await installDatabase({
      token: process.env.SUPABASE_ACCESS_TOKEN,
      projectRef: process.env.COOPFIX_SUPABASE_PROJECT_REF,
      publicUrl: process.env.VITE_SUPABASE_URL,
      migrations,
    });
    console.log(`CoopFix : ${result.installed} migration(s) installée(s), ${result.alreadyInstalled} déjà installée(s).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
