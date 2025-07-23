#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTables() {
  console.log('🚀 Setting up Supabase tables automatically...\n');

  // Read the SQL statements
  const schemaPath = path.join(__dirname, 'supabase-schema-fixed.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split into individual statements (be careful with this approach)
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

  // For Supabase, we'll use the REST API to check if tables exist
  console.log('🔍 Checking existing tables...');
  
  try {
    // Test if tables exist by trying to query them
    const tables = ['chat_sessions', 'components_created', 'api_cache', 'api_calls'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error && error.code === '42P01') {
        console.log(`❌ Table '${table}' does not exist`);
      } else if (error) {
        console.log(`⚠️  Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' already exists`);
      }
    }
    
    console.log('\n📝 Manual Setup Required:');
    console.log('Since Supabase client doesn\'t support DDL operations,');
    console.log('please run the SQL in your Supabase dashboard:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new');
    console.log('2. The SQL has been copied to your clipboard');
    console.log('3. Paste and click "Run"\n');
    
    // Copy to clipboard
    const { exec } = require('child_process');
    if (process.platform === 'darwin') {
      exec('pbcopy', (err) => {
        if (!err) {
          console.log('✅ SQL copied to clipboard!');
        }
      }).stdin.end(schema);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupTables().catch(console.error);