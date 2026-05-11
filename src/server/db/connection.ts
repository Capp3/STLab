import pg from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'

const { Pool } = pg

const pool = new Pool({
  host: process.env['DB_HOST'] ?? 'localhost',
  port: Number(process.env['DB_PORT'] ?? 5432),
  user: process.env['DB_USER'] ?? 'stlab',
  password: process.env['DB_PASSWORD'] ?? 'stlab',
  database: process.env['DB_NAME'] ?? 'stlab',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

pool.on('error', (err) => {
  console.error('[db] Pool error:', err.message)
})

export const db = drizzle(pool, { schema })

export async function connectDb(): Promise<void> {
  const maxRetries = 10
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      const client = await pool.connect()
      client.release()
      console.log('[db] PostgreSQL connected')
      return
    } catch (err) {
      attempt++
      const wait = Math.min(attempt * 1000, 5000)
      console.warn(`[db] Connection attempt ${attempt}/${maxRetries} failed — retrying in ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
    }
  }
  throw new Error('[db] Could not connect to PostgreSQL after maximum retries')
}

export async function closeDb(): Promise<void> {
  await pool.end()
  console.log('[db] PostgreSQL pool closed')
}

/** Optional Redis client — degrades gracefully when unavailable */
let redisClient: import('ioredis').Redis | null = null

export async function connectRedis(): Promise<import('ioredis').Redis | null> {
  const url = process.env['REDIS_URL']
  if (!url) {
    console.info('[redis] REDIS_URL not set — Redis disabled')
    return null
  }
  try {
    const { default: Redis } = await import('ioredis')
    const client = new Redis(url, { lazyConnect: true, enableReadyCheck: true })
    await client.connect()
    console.log('[redis] Connected')
    redisClient = client
    return client
  } catch (err) {
    console.warn('[redis] Could not connect — continuing without Redis:', (err as Error).message)
    return null
  }
}

export function getRedis(): import('ioredis').Redis | null {
  return redisClient
}
