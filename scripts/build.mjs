import { spawn } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { provisionPostgres, validateDatabaseTarget } from './provision-postgres.mjs';

// Only these public values are passed to Vite. Database passwords stay server-side.
const env = { ...process.env };
env.VITE_SUPABASE_URL ||= env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
env.VITE_SUPABASE_PUBLISHABLE_KEY ||= env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

try {
  const databaseUrl = env.POSTGRES_URL || env.POSTGRES_URL_NON_POOLING;
  // Preview deployments must never migrate the production database.
  if (databaseUrl && env.VERCEL_ENV === 'production') {
    validateDatabaseTarget(databaseUrl, env.VITE_SUPABASE_URL);
    if (!env.VITE_SUPABASE_PUBLISHABLE_KEY) throw new Error('Clé publique Supabase manquante.');
    const { default: pg } = await import('pg');
    // Respect system CA verification; do not disable certificate verification.
    const client = new pg.Client({ connectionString: databaseUrl, connectionTimeoutMillis: 15000, statement_timeout: 60000 });
    await client.connect();
    try {
      const directory = new URL('../supabase/migrations/', import.meta.url);
      const filenames = (await readdir(directory)).filter(name => name.endsWith('.sql')).sort();
      const migrations = await Promise.all(filenames.map(async name => ({ name, sql: await readFile(new URL(name, directory), 'utf8') })));
      const appUrl = env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined;
      const result = await provisionPostgres(client, migrations, appUrl);
      console.log(`CoopFix : installation automatique terminée (${result.installed} migration(s)).`);
    } finally { await client.end(); }
  } else {
    console.log('CoopFix : installation de la base non exécutée (connexion absente ou environnement hors production).');
  }
  const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { env, stdio: 'inherit' });
  child.on('error', () => { console.error('Impossible de lancer la construction du site.'); process.exitCode = 1; });
  child.on('exit', code => { process.exitCode = code ?? 1; });
} catch {
  console.error('CoopFix : installation automatique interrompue. Vérifiez la connexion Supabase et son historique; aucun secret n’est affiché.');
  process.exitCode = 1;
}
