#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  try {
    console.log('🔐 Setting up first admin user...\n');

    // Get all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, is_admin')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found. Please create an account first:');
      console.log('   1. Visit http://localhost:5173 (or your deployed app)');
      console.log('   2. Sign up with an email and password');
      console.log('   3. Run this script again');
      process.exit(1);
    }

    console.log('📋 Available users:\n');
    users.forEach((user, index) => {
      const adminStatus = user.is_admin ? '✅ ADMIN' : '❌ Not admin';
      console.log(`${index + 1}. ${user.email} [${adminStatus}]`);
    });

    // Find first non-admin user to promote
    const nonAdminUser = users.find(u => !u.is_admin);

    if (!nonAdminUser) {
      console.log('\n✅ All users are already admins!');
      process.exit(0);
    }

    console.log(`\n🔄 Promoting "${nonAdminUser.email}" to admin...\n`);

    // Promote to admin
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', nonAdminUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error promoting user:', updateError);
      process.exit(1);
    }

    console.log('✅ Admin user created successfully!\n');
    console.log('Admin Details:');
    console.log(`  Email: ${updatedUser.email}`);
    console.log(`  Admin: ${updatedUser.is_admin ? '✅ Yes' : '❌ No'}`);
    console.log(`\n👉 Next steps:`);
    console.log(`  1. Login with: ${updatedUser.email}`);
    console.log(`  2. Navigate to: http://localhost:5173/admin`);
    console.log(`  3. Start approving artists and artworks!\n`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
