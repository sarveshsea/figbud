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

console.log('🔧 Setting up Supabase tables for FigBud...\n');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

// Read the SQL schema
const schemaPath = path.join(__dirname, 'supabase-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('\n📋 SQL Schema loaded');
console.log('⚠️  Please run this SQL in your Supabase SQL Editor:\n');
console.log('1. Go to: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new');
console.log('2. Copy and paste the following SQL:');
console.log('3. Click "Run" to execute\n');
console.log('═'.repeat(80));
console.log(schema);
console.log('═'.repeat(80));

console.log('\n✅ After running the SQL, test with:');
console.log('   node test-supabase.js');

// Also save to clipboard if possible
try {
  const { exec } = require('child_process');
  
  // Try to copy to clipboard on macOS
  if (process.platform === 'darwin') {
    exec('pbcopy', (err, stdout, stderr) => {
      if (!err) {
        console.log('\n📋 SQL has been copied to your clipboard!');
      }
    }).stdin.end(schema);
  }
} catch (err) {
  // Ignore clipboard errors
}