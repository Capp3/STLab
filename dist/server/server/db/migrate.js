import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, connectDb, closeDb } from './connection.js';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, '../../../migrations');
export async function runMigrations() {
    console.log('[migrate] Running migrations from', migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log('[migrate] Migrations complete');
}
/** Standalone runner: tsx src/server/db/migrate.ts */
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    await connectDb();
    await runMigrations();
    await closeDb();
    process.exit(0);
}
