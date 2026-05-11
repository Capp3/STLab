import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, connectDb, closeDb } from './connection.js';

const migrationsFolder = process.cwd() + '/migrations';

export async function runMigrations(): Promise<void> {
  console.log('[migrate] Running migrations from', migrationsFolder);
  await migrate(db, { migrationsFolder });
  console.log('[migrate] Migrations complete');
}

/** Standalone runner: tsx src/server/db/migrate.ts */
if (process.argv[1]?.endsWith('migrate.ts') || process.argv[1]?.endsWith('migrate.js')) {
  await connectDb();
  await runMigrations();
  await closeDb();
  process.exit(0);
}
