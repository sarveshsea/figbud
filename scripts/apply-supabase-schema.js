#!/usr/bin/env node

/**
 * Apply Supabase Schema
 * Automatically applies the schema to your Supabase database
 */

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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySchema() {
  console.log('🔧 Applying Supabase schema for FigBud...\n');
  
  // Read the schema file
  const schemaPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split schema into individual statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    
    // Skip pure comments
    if (statement.trim().startsWith('--')) continue;
    
    // Extract statement type for logging
    const statementType = statement.trim().split(' ')[0].toUpperCase();
    const targetMatch = statement.match(/(?:TABLE|INDEX|VIEW|FUNCTION|POLICY)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?["']?(\w+)["']?/i);
    const targetName = targetMatch ? targetMatch[1] : 'unknown';
    
    try {
      console.log(`[${i + 1}/${statements.length}] Executing ${statementType} ${targetName}...`);
      
      // Execute the statement
      const { error } = await supabase.rpc('exec_sql', { sql: statement }).single();
      
      if (error) {
        // Try direct execution as fallback
        const { data, error: directError } = await supabase
          .from('_sql')
          .insert({ query: statement })
          .select();
        
        if (directError) {
          throw directError;
        }
      }
      
      console.log(`✅ ${statementType} ${targetName} - Success`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${statementType} ${targetName} - Failed:`, error.message);
      errorCount++;
      
      // Continue with other statements even if one fails
      if (statementType === 'CREATE' && error.message.includes('already exists')) {
        console.log(`   ℹ️  ${targetName} already exists, skipping...`);
      }
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Summary: ${successCount} successful, ${errorCount} failed`);
  console.log('═'.repeat(60) + '\n');
  
  // Test the tables
  console.log('🧪 Testing table access...\n');
  
  const tables = ['chat_sessions', 'components_created', 'api_cache', 'api_calls'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      console.log(`✅ ${table}: Accessible (${count || 0} rows)`);
    } catch (error) {
      console.error(`❌ ${table}: ${error.message}`);
    }
  }
  
  console.log('\n✨ Schema application complete!');
  console.log('🧪 Run "node test-supabase.js" to verify everything is working.');
}

// Alternative approach using direct SQL execution
async function applySchemaDirectly() {
  console.log('\n⚠️  Direct SQL execution not available via Supabase client.');
  console.log('📋 Please copy the SQL from "setup-supabase-tables.js" and run it in:');
  console.log(`🔗 ${supabaseUrl.replace('.supabase.co', '.supabase.com')}/sql/new`);
  console.log('\nAlternatively, you can use the Supabase CLI:');
  console.log('  npx supabase db push --db-url "postgresql://..."');
}

// Check if we can execute SQL directly
async function checkDirectSQLSupport() {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    return !error;
  } catch {
    return false;
  }
}

// Main execution
(async () => {
  const hasDirectSQL = await checkDirectSQLSupport();
  
  if (hasDirectSQL) {
    await applySchema();
  } else {
    await applySchemaDirectly();
  }
})().catch(console.error);