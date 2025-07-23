// Test Supabase connection and tables
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Check if tables exist
  console.log('1. Checking tables...');
  const tables = ['chat_sessions', 'components_created', 'api_calls'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}': ${err.message}`);
    }
  }

  // Test 2: Insert test data
  console.log('\n2. Testing insert...');
  try {
    const testData = {
      conversation_id: 'test-' + Date.now(),
      message: 'Test message',
      response: 'Test response',
      metadata: { test: true },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert(testData)
      .select();

    if (error) {
      console.log('❌ Insert failed:', error.message);
    } else {
      console.log('✅ Insert successful:', data[0].conversation_id);
      
      // Clean up test data
      await supabase
        .from('chat_sessions')
        .delete()
        .eq('conversation_id', testData.conversation_id);
    }
  } catch (err) {
    console.log('❌ Insert error:', err.message);
  }

  // Test 3: Check recent sessions
  console.log('\n3. Recent chat sessions:');
  const { data: sessions, error: sessionsError } = await supabase
    .from('chat_sessions')
    .select('conversation_id, message, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (sessionsError) {
    console.log('❌ Error fetching sessions:', sessionsError.message);
  } else if (sessions && sessions.length > 0) {
    sessions.forEach(session => {
      console.log(`   - ${session.conversation_id}: "${session.message.substring(0, 50)}..." (${new Date(session.created_at).toLocaleString()})`);
    });
  } else {
    console.log('   No sessions found yet');
  }
}

testSupabase().catch(console.error);