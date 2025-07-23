const fetch = require('node-fetch');

// Supabase Management API credentials
const SUPABASE_PROJECT_REF = 'faummrgmlwhfehylhfvx';
const SUPABASE_ACCESS_TOKEN = 'sbp_d5e6b7c8f2a34b56789012345678901234567890'; // Management API token
const SUPABASE_DB_PASSWORD = 'zFk7NhKVkMwy1e6r';

async function executeSQL(sql) {
  // Use Supabase Management API to execute SQL
  const response = await fetch(`https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to execute SQL: ${error}`);
  }

  return await response.json();
}

async function setupDatabase() {
  console.log('🚀 Setting up FigBud database using Supabase Management API...\n');

  const sqlStatements = [
    // Enable extensions
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
    
    // Create users table
    `CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    
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
    )`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_chat_sessions_widget_id ON chat_sessions(widget_session_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)`,
    
    // Create chat_conversations table
    `CREATE TABLE IF NOT EXISTS chat_conversations (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      widget_session_id TEXT NOT NULL,
      session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP WITH TIME ZONE
    )`,
    
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
    )`,
    
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
    )`,
    
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
    )`,
    
    // Enable RLS
    `ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE intent_analysis ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE figma_components ENABLE ROW LEVEL SECURITY`,
  ];

  let successCount = 0;
  let failureCount = 0;

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

  // Create functions
  console.log('Creating stored functions...\n');

  const functions = [
    {
      name: 'create_chat_session',
      sql: `CREATE OR REPLACE FUNCTION create_chat_session(
        p_user_id UUID,
        p_widget_session_id TEXT,
        p_metadata JSONB DEFAULT '{}'
      ) RETURNS UUID AS $$
      DECLARE
        v_session_id UUID;
      BEGIN
        INSERT INTO chat_sessions (user_id, widget_session_id, is_anonymous, metadata)
        VALUES (p_user_id, p_widget_session_id, p_user_id IS NULL, p_metadata)
        RETURNING id INTO v_session_id;
        
        INSERT INTO chat_conversations (user_id, widget_session_id, session_id)
        VALUES (p_user_id, p_widget_session_id, v_session_id);
        
        RETURN v_session_id;
      END;
      $$ LANGUAGE plpgsql`
    },
    {
      name: 'end_chat_session',
      sql: `CREATE OR REPLACE FUNCTION end_chat_session(p_widget_session_id TEXT) RETURNS VOID AS $$
      BEGIN
        UPDATE chat_sessions SET ended_at = CURRENT_TIMESTAMP
        WHERE widget_session_id = p_widget_session_id AND ended_at IS NULL;
        
        UPDATE chat_conversations SET is_active = false, ended_at = CURRENT_TIMESTAMP
        WHERE widget_session_id = p_widget_session_id AND is_active = true;
      END;
      $$ LANGUAGE plpgsql`
    },
    {
      name: 'store_chat_message',
      sql: `CREATE OR REPLACE FUNCTION store_chat_message(
        p_conversation_id UUID,
        p_role TEXT,
        p_content TEXT,
        p_metadata JSONB DEFAULT '{}',
        p_intent JSONB DEFAULT NULL,
        p_components JSONB DEFAULT NULL,
        p_tutorials JSONB DEFAULT NULL,
        p_provider TEXT DEFAULT NULL,
        p_model TEXT DEFAULT NULL
      ) RETURNS UUID AS $$
      DECLARE
        v_message_id UUID;
      BEGIN
        INSERT INTO chat_messages (conversation_id, role, content, metadata, intent, components, tutorials, provider, model)
        VALUES (p_conversation_id, p_role, p_content, p_metadata, p_intent, p_components, p_tutorials, p_provider, p_model)
        RETURNING id INTO v_message_id;
        
        UPDATE chat_sessions SET last_activity = CURRENT_TIMESTAMP
        WHERE id = (SELECT session_id FROM chat_conversations WHERE id = p_conversation_id);
        
        RETURN v_message_id;
      END;
      $$ LANGUAGE plpgsql`
    }
  ];

  for (const func of functions) {
    process.stdout.write(`Creating function ${func.name}... `);
    try {
      await executeSQL(func.sql);
      console.log('✅');
    } catch (error) {
      console.log('❌');
      console.error(`   Error: ${error.message}`);
    }
  }

  // Create RLS policies
  console.log('\nCreating RLS policies...\n');

  const policies = [
    `CREATE POLICY "anon_users" ON users FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "anon_sessions" ON chat_sessions FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "anon_conversations" ON chat_conversations FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "anon_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "anon_intent" ON intent_analysis FOR ALL USING (true) WITH CHECK (true)`,
    `CREATE POLICY "anon_components" ON figma_components FOR ALL USING (true) WITH CHECK (true)`
  ];

  for (const policy of policies) {
    process.stdout.write(`Creating policy... `);
    try {
      await executeSQL(policy);
      console.log('✅');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('⚠️  Already exists');
      } else {
        console.log('❌');
        console.error(`   Error: ${error.message}`);
      }
    }
  }

  // Insert sample data
  console.log('\nInserting sample data...\n');

  try {
    await executeSQL(`
      INSERT INTO users (id, email) 
      VALUES ('00000000-0000-0000-0000-000000000000', 'anonymous@figbud.com')
      ON CONFLICT (email) DO NOTHING
    `);
    console.log('✅ Created anonymous user');

    await executeSQL(`
      INSERT INTO figma_components (name, type, category, description) VALUES
        ('Primary Button', 'button', 'form', 'A primary action button'),
        ('Text Input', 'input', 'form', 'Basic text input field'),
        ('Card Component', 'card', 'layout', 'A container card with shadow')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Created sample components');

  } catch (error) {
    console.error('Error inserting sample data:', error.message);
  }

  console.log('\n✨ Database setup complete!');
}

// Alternative: Direct PostgreSQL connection with Node
async function setupViaPostgres() {
  const { Client } = require('pg');
  
  // Direct connection using the password
  const connectionString = `postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL directly...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read and execute SQL file
    const fs = require('fs');
    const path = require('path');
    const sql = fs.readFileSync(path.join(__dirname, 'supabase-complete-setup.sql'), 'utf8');
    
    // Split into statements
    const statements = sql
      .split(/;\s*$/m)
      .filter(stmt => stmt.trim() && !stmt.trim().startsWith('--'))
      .map(stmt => stmt.trim() + ';');

    console.log(`Executing ${statements.length} SQL statements...\n`);

    let success = 0;
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);
      
      try {
        await client.query(stmt);
        console.log('✅');
        success++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️  Already exists');
          success++;
        } else {
          console.log('❌');
          console.error(`   Error: ${error.message}`);
        }
      }
    }

    console.log(`\n✨ Setup complete! ${success}/${statements.length} statements successful.`);

    // Verify tables
    console.log('\n📊 Verifying tables...\n');
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTrying Management API approach instead...\n');
    await setupDatabase();
  } finally {
    await client.end();
  }
}

// Try direct PostgreSQL first, then fall back to Management API
setupViaPostgres().catch(console.error);