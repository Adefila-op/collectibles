import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use DATABASE_URL for Supabase connection, fall back to individual env vars for local dev
const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: databaseUrl || undefined,
  host: databaseUrl ? undefined : (process.env.DB_HOST || 'localhost'),
  port: databaseUrl ? undefined : parseInt(process.env.DB_PORT || '5432'),
  database: databaseUrl ? undefined : (process.env.DB_NAME || 'collectibles_db'),
  user: databaseUrl ? undefined : (process.env.DB_USER || 'postgres'),
  password: databaseUrl ? undefined : (process.env.DB_PASSWORD || 'postgres'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: databaseUrl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database error', { text, error });
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

export async function closePool() {
  await pool.end();
}

export default pool;

