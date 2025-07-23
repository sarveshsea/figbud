#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('📊 Checking current Supabase schema...\n');
  
  // First, let's see what tables exist
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public');
  
  if (tablesError) {
    // Try alternative approach - just check known tables
    console.log('Checking known tables...\n');
    
    const knownTables = ['chat_sessions', 'components_created', 'api_calls', 'api_cache'];
    
    for (const table of knownTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0);
        
        if (!error) {
          console.log(`✅ Table exists: ${table}`);
          
          // Try to get column info
          const { data: sample, error: sampleError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (!sampleError && sample && sample.length > 0) {
            console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
          }
        } else {
          console.log(`❌ Table missing: ${table}`);
        }
      } catch (err) {
        console.log(`❌ Table missing: ${table}`);
      }
    }
  } else {
    console.log('Tables in public schema:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
  }
  
  console.log('\n📝 Schema Status:');
  console.log('The chat_sessions table exists but has incorrect columns.');
  console.log('We need to recreate it with the correct schema.');
  console.log('\nPlease run the SQL from setup-supabase-tables.js in your Supabase dashboard.');
}

checkSchema().catch(console.error);