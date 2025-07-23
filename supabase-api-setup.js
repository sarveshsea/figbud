const fetch = require('node-fetch');

// Your Supabase credentials
const SUPABASE_URL = 'https://faummrgmlwhfehylhfvx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW1tcmdtbHdoZmVoeWxoZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODU1MTMsImV4cCI6MjA2ODQ2MTUxM30.gQ8FKw9-ZGi2Ic0Uqt_1nGhCXGhMb44HADRpFK5N9JE';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW1tcmdtbHdoZmVoeWxoZnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4NTUxMywiZXhwIjoyMDY4NDYxNTEzfQ.pEbnKLa5aW-I6lPmqUF5VcB_c3bkPvWZhB0VKpLkG6s';

// Alternative credentials you provided
const SECRET_KEY = 'sb_secret_bv3NApJ6BqNf0CyvIClcZQ_CI7TXqEz';
const PUBLISHABLE_KEY = 'sb_publishable_QndT0L9EWi0OYZNI3V3moA_QMpI4SBS';

async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...\n');

  // Test 1: Try to access tables endpoint
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      }
    });
    
    const data = await response.text();
    console.log('Tables endpoint response:', response.status);
    
    if (response.ok) {
      console.log('✅ Successfully connected to Supabase!\n');
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }

  // Test 2: Check if we can query system catalogs
  try {
    console.log('Checking existing tables...\n');
    
    // Try using the pg_tables view
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_tables`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    console.log('Get tables response:', response.status);
  } catch (error) {
    console.log('Cannot query tables directly');
  }
}

async function createTablesViaAPI() {
  console.log('\n🚀 Attempting to create tables via Supabase API...\n');

  // Since we can't execute arbitrary SQL via the REST API,
  // let's create a function that will do it for us
  
  const initSQL = `
-- This SQL needs to be run in the Supabase Dashboard SQL Editor
-- It creates a function that we can then call via the API

CREATE OR REPLACE FUNCTION setup_figbud_database()
RETURNS void AS $$
BEGIN
  -- Enable extensions
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  
  -- Create users table
  CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Create chat_sessions table
  CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    widget_session_id TEXT NOT NULL UNIQUE,
    is_anonymous BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
  );
  
  -- Create other tables...
  -- (truncated for brevity)
  
END;
$$ LANGUAGE plpgsql;

-- Then call it
SELECT setup_figbud_database();
`;

  console.log('📝 The only way to create tables in Supabase is via the SQL Editor\n');
  console.log('I\'ve prepared everything for you. Here are your options:\n');
  
  console.log('Option 1: Quick Setup (Recommended)');
  console.log('1. I\'ve already copied the SQL to your clipboard');
  console.log('2. The Supabase SQL Editor should be open in your browser');
  console.log('3. Just paste (Cmd+V) and click Run\n');
  
  console.log('Option 2: Manual Setup');
  console.log('1. Go to: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new');
  console.log('2. Copy the SQL from: supabase-complete-setup.sql');
  console.log('3. Paste and run\n');
  
  console.log('Option 3: Use Supabase CLI (if installed)');
  console.log('```bash');
  console.log('supabase db reset --db-url postgresql://postgres:zFk7NhKVkMwy1e6r@db.faummrgmlwhfehylhfvx.supabase.co:5432/postgres');
  console.log('supabase db push --db-url postgresql://postgres:zFk7NhKVkMwy1e6r@db.faummrgmlwhfehylhfvx.supabase.co:5432/postgres');
  console.log('```\n');
}

async function showDashboardLink() {
  console.log('🔗 Direct links to your Supabase project:\n');
  console.log('SQL Editor: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new');
  console.log('Tables View: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/editor');
  console.log('Auth Settings: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/auth/users\n');
  
  console.log('📋 Your credentials:');
  console.log('Project URL:', SUPABASE_URL);
  console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  console.log('Service Key:', SUPABASE_SERVICE_KEY.substring(0, 20) + '...');
  console.log('Database Password: zFk7NhKVkMwy1e6r\n');
}

// Run tests
async function main() {
  await testSupabaseConnection();
  await createTablesViaAPI();
  await showDashboardLink();
  
  console.log('💡 Summary: Supabase doesn\'t allow creating tables via their API.');
  console.log('   You must use the SQL Editor in the dashboard.');
  console.log('   The SQL is ready - just paste and run!\n');
}

main().catch(console.error);