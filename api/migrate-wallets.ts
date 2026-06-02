import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { generateDeterministicWallet } from './wallet.ts';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'collectibles_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function migrateWallets() {
  const client = await pool.connect();
  try {
    console.log('🔄 Migrating users to have wallet addresses...');
    
    // Get all users without wallet addresses
    const result = await client.query(
      'SELECT id, email FROM users WHERE wallet_address IS NULL OR wallet_address = \'\''
    );
    
    console.log(`Found ${result.rows.length} users without wallet addresses`);
    
    // Update each user with a generated wallet
    for (const user of result.rows) {
      try {
        const { address } = generateDeterministicWallet(user.email);
        await client.query(
          'UPDATE users SET wallet_address = $1 WHERE id = $2',
          [address, user.id]
        );
        console.log(`✅ Generated wallet for ${user.email}: ${address}`);
      } catch (err) {
        console.error(`❌ Failed to generate wallet for ${user.email}:`, err);
      }
    }
    
    console.log('✨ Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateWallets();
