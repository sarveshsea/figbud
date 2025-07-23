const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faummrgmlwhfehylhfvx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW1tcmdtbHdoZmVoeWxoZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODU1MTMsImV4cCI6MjA2ODQ2MTUxM30.gQ8FKw9-ZGi2Ic0Uqt_1nGhCXGhMb44HADRpFK5N9JE';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW1tcmdtbHdoZmVoeWxoZnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4NTUxMywiZXhwIjoyMDY4NDYxNTEzfQ.pEbnKLa5aW-I6lPmqUF5VcB_c3bkPvWZhB0VKpLkG6s';

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function executeSQLStatements() {
  console.log('🚀 Setting up FigBud database using Supabase client...\n');

  // Since Supabase JS client doesn't directly support DDL, we'll use the SQL RPC endpoint
  const sqlStatements = [
    // Enable extensions
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
    
    // Create users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Create chat_sessions table
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      widget_session_id TEXT NOT NULL UNIQUE,
      is_anonymous BOOLEAN DEFAULT false,
      started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP WITH TIME ZONE,
      metadata JSONB DEFAULT '{}'
    );`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_chat_sessions_widget_id ON chat_sessions(widget_session_id);`,
    
    // Create chat_conversations table
    `CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      widget_session_id TEXT NOT NULL,
      session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP WITH TIME ZONE
    );`,
    
    // Create chat_messages table
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      intent JSONB,
      components JSONB,
      tutorials JSONB,
      provider TEXT,
      model TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Create intent_analysis table
    `CREATE TABLE IF NOT EXISTS intent_analysis (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
      conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      detected_action VARCHAR(50),
      component_types TEXT[] DEFAULT '{}',
      keywords TEXT[] DEFAULT '{}',
      tutorial_requests TEXT[] DEFAULT '{}',
      is_question BOOLEAN DEFAULT false,
      needs_guidance BOOLEAN DEFAULT false,
      confidence DECIMAL(3,2) DEFAULT 0.00,
      response_time_ms INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Create figma_components table
    `CREATE TABLE IF NOT EXISTS figma_components (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(100) NOT NULL,
      category VARCHAR(50),
      description TEXT,
      thumbnail_url TEXT,
      figma_properties JSONB NOT NULL DEFAULT '{}',
      usage_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );`,
    
    // Enable RLS
    `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE intent_analysis ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE figma_components ENABLE ROW LEVEL SECURITY;`,
  ];

  // Execute SQL via Supabase Management API
  const executeSQL = async (sql) => {
    try {
      // Use fetch to call Supabase's internal SQL execution endpoint
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        // Try alternative approach - direct REST API
        const dbResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.pgrst.object+json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ query: sql })
        });
        
        if (!dbResponse.ok) {
          throw new Error(`Failed to execute SQL: ${await dbResponse.text()}`);
        }
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  let successCount = 0;
  let failureCount = 0;

  // Execute each statement
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i];
    const preview = sql.substring(0, 50).replace(/\s+/g, ' ');
    
    process.stdout.write(`[${i + 1}/${sqlStatements.length}] ${preview}... `);
    
    try {
      await executeSQL(sql);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log('❌');
      console.error(`   Error: ${error.message}`);
      failureCount++;
    }
  }

  console.log(`\n📊 Results: ${successCount} successful, ${failureCount} failed\n`);

  // Since direct SQL execution might not work, let's create tables using Supabase operations
  console.log('Attempting alternative approach using Supabase operations...\n');

  // Check if tables exist by trying to query them
  const tables = ['users', 'chat_sessions', 'chat_conversations', 'chat_messages', 'intent_analysis', 'figma_components'];
  
  for (const table of tables) {
    process.stdout.write(`Checking table '${table}'... `);
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.log('❌ Does not exist');
        
        // Table doesn't exist, provide SQL for this specific table
        console.log(`\n📝 Please create '${table}' table using Supabase Dashboard SQL Editor`);
      } else {
        console.log('✅ Exists');
      }
    } catch (e) {
      console.log('❌ Error checking');
    }
  }

  // Create RLS policies using Supabase client
  console.log('\n🔐 Setting up RLS policies...\n');
  
  try {
    // For testing, we'll create permissive policies
    const policies = [
      { table: 'users', name: 'Enable all access for users', definition: 'true' },
      { table: 'chat_sessions', name: 'Enable all access for chat_sessions', definition: 'true' },
      { table: 'chat_conversations', name: 'Enable all access for chat_conversations', definition: 'true' },
      { table: 'chat_messages', name: 'Enable all access for chat_messages', definition: 'true' },
      { table: 'intent_analysis', name: 'Enable all access for intent_analysis', definition: 'true' },
      { table: 'figma_components', name: 'Enable all access for figma_components', definition: 'true' }
    ];

    // Note: Policies need to be created via SQL
    console.log('RLS policies need to be created via SQL Editor');
    
  } catch (error) {
    console.error('Error setting up policies:', error);
  }

  // Insert test data
  console.log('\n🌱 Attempting to insert sample data...\n');
  
  try {
    // Insert anonymous user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([
        { id: '00000000-0000-0000-0000-000000000000', email: 'anonymous@figbud.com' }
      ], { onConflict: 'email' });
    
    if (userError) {
      console.log('❌ Could not insert user:', userError.message);
    } else {
      console.log('✅ Created anonymous user');
    }
    
    // Insert sample components
    const { data: compData, error: compError } = await supabase
      .from('figma_components')
      .insert([
        { name: 'Primary Button', type: 'button', category: 'form', description: 'A primary action button' },
        { name: 'Text Input', type: 'input', category: 'form', description: 'Basic text input field' },
        { name: 'Card Component', type: 'card', category: 'layout', description: 'A container card with shadow' }
      ]);
    
    if (compError) {
      console.log('❌ Could not insert components:', compError.message);
    } else {
      console.log('✅ Created sample components');
    }
    
  } catch (error) {
    console.error('Error inserting data:', error);
  }

  console.log('\n📌 Next Steps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new');
  console.log('2. Copy and run the SQL from: supabase-complete-setup.sql');
  console.log('3. This will create all tables, functions, and policies needed\n');
  
  console.log('The SQL file contains everything needed to set up your database properly.');
  console.log('Once run, your FigBud chat data will be stored in Supabase!');
}

// Run the setup
executeSQLStatements().catch(console.error);