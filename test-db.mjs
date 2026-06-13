import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl ? { rejectUnauthorized: false } : false,
});

async function test() {
  try {
    console.log('Connecting to database...');
    const result = await pool.query('SELECT version()');
    console.log('✅ Connected to PostgreSQL');
    console.log('Version:', result.rows[0].version.substring(0, 50));
    
    // Check users table
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `);
    
    console.log('✅ Users table exists:', tableCheck.rows[0].exists);
    
    // Try to insert a user
    const email = `test${Date.now()}@example.com`;
    const password = 'hashedpassword123';
    const name = 'Test User';
    const walletAddress = '0x' + 'a'.repeat(40);
    
    console.log('\nAttempting to insert user with email:', email);
    
    const insertResult = await pool.query(`
      INSERT INTO users (email, password, name, wallet_address, artist_status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, name
    `, [email, password, name, walletAddress, 'collector']);
    
    console.log('✅ User inserted successfully');
    console.log('Result:', insertResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

test();
