#!/usr/bin/env node
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migration...\n');

    // Add is_admin column if it doesn't exist
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false
    `);

    console.log('✅ Migration complete!\n');

    // Check users
    const result = await client.query('SELECT id, email, is_admin FROM users ORDER BY created_at ASC');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found. Please create an account first:\n');
      console.log('   1. Start the dev server: npm run dev');
      console.log('   2. Visit http://localhost:5173');
      console.log('   3. Sign up with an email and password');
      console.log('   4. Run this migration again\n');
      process.exit(0);
    }

    console.log('📋 Users in database:\n');
    result.rows.forEach((user, index) => {
      const status = user.is_admin ? '✅ ADMIN' : '⬜ User';
      console.log(`${index + 1}. ${user.email} [${status}]`);
    });

    // Promote first non-admin user
    const nonAdminUser = result.rows.find(u => !u.is_admin);
    
    if (nonAdminUser) {
      console.log(`\n🔄 Promoting "${nonAdminUser.email}" to admin...\n`);
      
      await client.query(
        'UPDATE users SET is_admin = true WHERE id = $1',
        [nonAdminUser.id]
      );

      console.log('✅ Admin user created!\n');
      console.log('📝 Admin Details:');
      console.log(`   Email: ${nonAdminUser.email}`);
      console.log(`\n👉 Next steps:`);
      console.log(`   1. Start dev server: npm run dev`);
      console.log(`   2. Login with: ${nonAdminUser.email}`);
      console.log(`   3. Visit: http://localhost:5173/admin\n`);
    } else {
      console.log('\n✅ You already have an admin user!\n');
    }

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
