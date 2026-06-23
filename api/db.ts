import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Use DATABASE_URL for Supabase connection, fall back to individual env vars for local dev
const databaseUrl = 'postgresql://postgres.tezhvgyffjvfwricgohv:ollectibles0%40@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
let pool: Pool | null = null;
let useMockDb = false;

// Initialize pool with connection attempt
try {
  pool = new Pool({
    connectionString: databaseUrl || undefined,
    host: databaseUrl ? undefined : 'aws-0-eu-west-1.pooler.supabase.com',
    port: databaseUrl ? undefined : 6543,
    database: databaseUrl ? undefined : 'postgres',
    user: databaseUrl ? undefined : 'postgres.tezhvgyffjvfwricgohv',
    password: databaseUrl ? undefined : 'ollectibles0@',
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
  users: [
    {
      id: 'mock-test-user',
      email: 'test@example.com',
      password: 'hashed_test_password_123', // In real app, use bcrypt
      name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      avatar: null,
      gender: null,
      user_type: 'collector',
      wallet_balance: 0,
      wallet_address: null,
      artist_status: 'collector',
      privy_id: null,
      is_admin: false,
      onboarding_completed: false,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ],
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
  // Handle SELECT from users by email (login query)
  else if (text.includes('FROM users') && text.includes('WHERE email = $1')) {
    result.rows = mockData.users.filter((u) => u.email === params?.[0]);
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
  // Handle INSERT (mock insert and return data)
  else if (text.includes('INSERT')) {
    if (text.includes('INSERT INTO users')) {
      const newUser = {
        id: `mock-user-${Date.now()}`,
        email: params?.[0],
        password: params?.[1],
        name: params?.[2],
        avatar: params?.[3],
        wallet_balance: params?.[4],
        wallet_address: params?.[5],
        artist_status: params?.[6],
        privy_id: params?.[7],
        is_admin: params?.[8],
        onboarding_completed: params?.[9] ?? false,
        username: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.users.push(newUser);
      result.rows = [newUser];
      result.rowCount = 1;
    } else {
      result.rowCount = 0;
    }
  }
  // Handle UPDATE users (onboarding)
  else if (text.includes('UPDATE users') && text.includes('onboarding_completed')) {
    const user = mockData.users.find((u: any) => u.id === params?.[2]);
    if (user) {
      user.name = params?.[0];
      user.username = params?.[1];
      user.onboarding_completed = true;
      result.rows = [user];
      result.rowCount = 1;
    } else {
      result.rowCount = 0;
    }
  }
  // Handle UPDATE users (sync)
  else if (text.includes('UPDATE users')) {
    const user = mockData.users.find((u: any) => u.id === params?.[3]);
    if (user) {
      user.privy_id = params?.[0];
      user.wallet_address = params?.[1] || user.wallet_address;
      user.is_admin = params?.[2];
      result.rows = [user];
      result.rowCount = 1;
    } else {
      result.rowCount = 0;
    }
  }
  // Handle username check
  else if (text.includes('SELECT id FROM users WHERE username = $1')) {
    const user = mockData.users.find((u: any) => u.username === params?.[0] && u.id !== params?.[1]);
    result.rows = user ? [user] : [];
    result.rowCount = user ? 1 : 0;
  }
  // Handle sync search
  else if (text.includes('SELECT * FROM users WHERE privy_id = $1 OR email = $2')) {
    const user = mockData.users.find((u: any) => u.privy_id === params?.[0] || u.email === params?.[1]);
    if (user) {
      result.rows = [user];
      result.rowCount = 1;
    }
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

