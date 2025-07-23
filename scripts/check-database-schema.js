/**
 * Script to check the actual database schema in Supabase
 * This helps diagnose schema mismatches between the SQL files and the actual database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking Supabase database schema...\n');

  try {
    // Check if chat_sessions table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['chat_sessions', 'components_created']);

    if (tablesError) {
      // Try a simpler approach - just query the tables
      console.log('ℹ️  Cannot access information_schema, trying direct table queries...\n');
      
      // Test chat_sessions table
      const { data: chatTest, error: chatError } = await supabase
        .from('chat_sessions')
        .select('*')
        .limit(0);
      
      if (chatError) {
        console.log('❌ chat_sessions table:', chatError.message);
      } else {
        console.log('✅ chat_sessions table exists');
        
        // Try to get column info by inserting and then deleting a test record
        const testRecord = {
          conversation_id: 'test-schema-check',
          message: 'test',
          response: 'test'
        };
        
        const { error: insertError } = await supabase
          .from('chat_sessions')
          .insert(testRecord);
        
        if (insertError) {
          console.log('   ❌ Column issue:', insertError.message);
          
          // Try without conversation_id to see if it's the problematic column
          const { error: insertError2 } = await supabase
            .from('chat_sessions')
            .insert({
              message: 'test',
              response: 'test'
            });
          
          if (!insertError2) {
            console.log('   ⚠️  Table exists but conversation_id column is missing!');
          }
        } else {
          console.log('   ✅ conversation_id column exists');
          
          // Clean up test record
          await supabase
            .from('chat_sessions')
            .delete()
            .eq('conversation_id', 'test-schema-check');
        }
      }
      
      // Test components_created table
      const { data: compTest, error: compError } = await supabase
        .from('components_created')
        .select('*')
        .limit(0);
      
      if (compError) {
        console.log('❌ components_created table:', compError.message);
      } else {
        console.log('✅ components_created table exists');
      }
      
    } else {
      console.log('📋 Tables found in database:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }
    
    console.log('\n💡 Recommendations:');
    console.log('1. If tables are missing, run: npm run db:setup');
    console.log('2. If columns are missing, you may need to recreate the tables');
    console.log('3. Check Supabase dashboard for the actual table structure');
    console.log('4. Ensure your Supabase project URL and keys are correct');
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

checkDatabaseSchema();