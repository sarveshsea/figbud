-- FigBud Supabase Schema (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversation_id ON chat_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_sessions(created_at);

-- Components created table
CREATE TABLE IF NOT EXISTS components_created (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_type VARCHAR(50) NOT NULL,
  properties JSONB,
  prompt TEXT,
  teacher_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  conversation_id VARCHAR(255)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_component_type ON components_created(component_type);
CREATE INDEX IF NOT EXISTS idx_component_created_at ON components_created(created_at);

-- API cache table (for caching AI responses)
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  provider VARCHAR(50),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- API calls logging
CREATE TABLE IF NOT EXISTS api_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  provider VARCHAR(50),
  tokens_used INTEGER,
  cost_cents INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component usage statistics (materialized view)
CREATE MATERIALIZED VIEW IF NOT EXISTS component_stats AS
SELECT 
  component_type,
  COUNT(*) as count,
  DATE_TRUNC('day', created_at) as date
FROM components_created
GROUP BY component_type, DATE_TRUNC('day', created_at)
ORDER BY date DESC, count DESC;

-- Enable Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE components_created ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for chat_sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Allow all operations for components_created" ON components_created;
DROP POLICY IF EXISTS "Allow all operations for api_cache" ON api_cache;
DROP POLICY IF EXISTS "Allow all operations for api_calls" ON api_calls;

-- Create new policies
-- For development, allow all operations
CREATE POLICY "Allow all operations for chat_sessions" 
  ON chat_sessions 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for components_created" 
  ON components_created 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for api_cache" 
  ON api_cache 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for api_calls" 
  ON api_calls 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_component_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW component_stats;
END;
$$ LANGUAGE plpgsql;

-- Create function for dynamic component stats calculation
CREATE OR REPLACE FUNCTION get_component_stats()
RETURNS TABLE(component_type VARCHAR(50), count BIGINT)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cc.component_type,
    COUNT(*) as count
  FROM components_created cc
  GROUP BY cc.component_type
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a trigger to auto-refresh stats (or schedule this)
-- You can call this function periodically or after inserts