/**
 * Script to fix database schema issues
 * This will update the existing tables to match the expected schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema...\n');

  try {
    // First, check if conversation_id column exists
    const { data: chatTest, error: chatError } = await supabase
      .from('chat_sessions')
      .select('conversation_id')
      .limit(0);
    
    if (chatError && chatError.message.includes('conversation_id')) {
      console.log('⚠️  conversation_id column missing, adding it...');
      
      // Read the SQL to add the column
      const addColumnSQL = `
        -- Add conversation_id column if it doesn't exist
        ALTER TABLE chat_sessions 
        ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(255) NOT NULL DEFAULT '';
        
        -- Create index on conversation_id
        CREATE INDEX IF NOT EXISTS idx_chat_conversation_id ON chat_sessions(conversation_id);
      `;
      
      // Execute via Supabase SQL editor API (if available) or log instructions
      console.log('📝 Please run this SQL in your Supabase SQL editor:\n');
      console.log(addColumnSQL);
      console.log('\n✅ After running the SQL, the schema should be fixed.');
      
      // Alternative: Try to detect actual column structure
      const { data: sample, error: sampleError } = await supabase
        .from('chat_sessions')
        .select('*')
        .limit(1);
      
      if (!sampleError && sample && sample.length > 0) {
        console.log('\n📊 Current chat_sessions columns:');
        console.log(Object.keys(sample[0]));
      }
    } else if (!chatError) {
      console.log('✅ conversation_id column already exists');
      
      // Check for other potential issues
      const { count, error: countError } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`📊 chat_sessions table has ${count} records`);
      }
    }
    
    // Check components_created table
    const { data: compTest, error: compError } = await supabase
      .from('components_created')
      .select('*')
      .limit(0);
    
    if (compError) {
      console.log('\n⚠️  components_created table issue:', compError.message);
      console.log('📝 Please ensure the table exists with the correct schema');
    } else {
      console.log('✅ components_created table is accessible');
    }
    
    console.log('\n💡 Additional steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to the SQL editor');
    console.log('3. Run the full schema from supabase-schema.sql');
    console.log('4. Restart your server after fixing the schema');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixDatabaseSchema();