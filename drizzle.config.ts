import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: Number(process.env['DB_PORT'] ?? 5432),
    user: process.env['DB_USER'] ?? 'stlab',
    password: process.env['DB_PASSWORD'] ?? 'stlab',
    database: process.env['DB_NAME'] ?? 'stlab',
    ssl: false,
  },
})
