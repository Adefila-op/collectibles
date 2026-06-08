import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use DATABASE_URL for Supabase connection, fall back to individual env vars for local dev
const databaseUrl = process.env.DATABASE_URL;
let pool: Pool | null = null;
let useMockDb = false;

// Initialize pool with connection attempt
try {
  pool = new Pool({
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
    useMockDb = true;
  });
} catch (error) {
  useMockDb = true;
}

// Mock in-memory database for development
const mockData: Record<string, any[]> = {
  users: [],
  artworks: [],
  holdings: [],
  transactions: [],
  offers: [],
};

export async function query(text: string, params?: any[]) {
  if (useMockDb || !pool) {
    return handleMockQuery(text, params);
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    return result;
  } catch (error: any) {
    console.warn('Database query failed, switching to mock mode:', error.message);
    useMockDb = true;
    return handleMockQuery(text, params);
  }
}

function handleMockQuery(text: string, params?: any[]) {
  // Simple mock query handler
  const result: { rows: any[]; rowCount: number } = { rows: [], rowCount: 0 };

  // Handle SELECT NOW()
  if (text.includes('SELECT NOW()')) {
    result.rows = [{ now: new Date() }];
    result.rowCount = 1;
  }
  // Handle complex artworks query with LEFT JOIN
  else if (text.includes('FROM artworks') && text.includes('LEFT JOIN LATERAL')) {
    // Return artworks with mock holding data
    result.rows = mockData.artworks.map((art) => ({
      ...art,
      holding_id: 'holding-001',
      current_owner_id: art.current_owner_id,
      holding_status: 'owned',
      listed_price: null,
      receipt_status: 'active',
      transfer_status: 'settled',
      acquired_at: art.created_at,
      listed_at: null,
      market_price: art.price,
    }));
    result.rowCount = result.rows.length;
  }
  // Handle SELECT from artworks (simple)
  else if (text.includes('FROM artworks') && text.includes('SELECT')) {
    result.rows = mockData.artworks;
    result.rowCount = mockData.artworks.length;
  }
  // Handle SELECT artwork by ID
  else if (text.includes('FROM artworks') && text.includes('WHERE') && params?.[0]) {
    result.rows = mockData.artworks.filter((art) => art.id === params[0]);
    result.rowCount = result.rows.length;
  }
  // Handle SELECT from users with is_admin check
  else if (text.includes('FROM users') && text.includes('is_admin') && params?.[0]) {
    result.rows = mockData.users.filter((u) => u.id === params[0]);
    result.rowCount = result.rows.length;
  }
  // Handle SELECT from users (general)
  else if (text.includes('FROM users') && text.includes('SELECT')) {
    result.rows = mockData.users;
    result.rowCount = mockData.users.length;
  }
  // Handle SELECT from holdings
  else if (text.includes('FROM holdings') && text.includes('SELECT')) {
    if (text.includes('WHERE user_id')) {
      result.rows = mockData.holdings.filter((h) => h.user_id === params?.[0]);
    } else {
      result.rows = mockData.holdings;
    }
    result.rowCount = result.rows.length;
  }
  // Handle ALTER TABLE (ignore in mock mode)
  else if (text.includes('ALTER TABLE')) {
    result.rowCount = 0;
  }
  // Handle INSERT (ignore in mock mode to prevent duplicates)
  else if (text.includes('INSERT')) {
    result.rowCount = 0;
  }
  // Default response
  else {
    result.rows = [];
    result.rowCount = 0;
  }

  return result;
}

export async function getClient(): Promise<PoolClient> {
  if (!pool || useMockDb) {
    throw new Error('Mock database does not support client connections');
  }
  return pool.connect();
}

export async function closePool() {
  if (pool) {
    await pool.end();
  }
}

export default pool;

