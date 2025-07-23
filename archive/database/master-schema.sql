-- =====================================================
-- FigBud Master Database Schema
-- Version: 1.0.0
-- Description: Comprehensive database schema for multi-user support,
--              personalization, and advanced analytics
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- =====================================================
-- CORE USER MANAGEMENT
-- =====================================================

-- Users table (can integrate with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  figma_user_id TEXT UNIQUE,
  auth_provider TEXT DEFAULT 'email', -- email, google, figma
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User personalization settings (from MinimalChatView)
CREATE TABLE IF NOT EXISTS user_personalization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  personalize_enabled BOOLEAN DEFAULT true,
  inspirations TEXT, -- "Who inspires you or shapes your taste?"
  digest_info TEXT, -- "How do you best digest information?"
  write_style TEXT, -- "How do you want Dia to write?"
  language_preference TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Versioned user preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  design_style TEXT CHECK (design_style IN ('minimal', 'modern', 'playful', 'professional')) DEFAULT 'modern',
  common_use_cases TEXT[] DEFAULT '{}',
  preferred_tutorial_length TEXT CHECK (preferred_tutorial_length IN ('short', 'medium', 'long', 'any')) DEFAULT 'any',
  notifications JSONB DEFAULT '{"email": true, "in_app": true, "weekly": true}'::jsonb,
  theme TEXT CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'auto',
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Add constraint to ensure only one current version per user
  CONSTRAINT unique_current_preference UNIQUE (user_id, is_current) WHERE is_current = true
);

-- User workspace memberships
CREATE TABLE IF NOT EXISTS workspace_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  invited_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, workspace_id)
);

-- =====================================================
-- CHAT AND SESSION MANAGEMENT
-- =====================================================

-- Enhanced chat sessions with multi-user support
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_session_id TEXT NOT NULL UNIQUE,
  primary_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_multi_user BOOLEAN DEFAULT false,
  workspace_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  figma_file_key TEXT,
  figma_node_ids TEXT[] DEFAULT '{}'
);

-- Session participants for multi-user sessions
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  role TEXT DEFAULT 'participant', -- host, participant, observer
  UNIQUE(session_id, user_id)
);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enhanced chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  -- Enhanced metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  intent JSONB, -- Parsed intent from ResponseParser
  components JSONB, -- Suggested components
  tutorials JSONB, -- Related tutorials
  action_items JSONB, -- Actionable steps
  -- AI provider info
  provider TEXT,
  model TEXT,
  tokens_used INTEGER,
  response_time_ms INTEGER,
  -- User feedback
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMPONENT AND DESIGN SYSTEM
-- =====================================================

-- Component library
CREATE TABLE IF NOT EXISTS components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- button, card, input, etc.
  category TEXT, -- basic, layout, form, etc.
  description TEXT,
  thumbnail_url TEXT,
  figma_code TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  design_tokens JSONB DEFAULT '{}'::jsonb,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', name), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED
);

-- User-created components
CREATE TABLE IF NOT EXISTS user_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  component_id UUID REFERENCES components(id),
  name TEXT NOT NULL,
  customizations JSONB DEFAULT '{}'::jsonb,
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, component_id)
);

-- Component usage tracking
CREATE TABLE IF NOT EXISTS component_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE SET NULL,
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TUTORIALS AND LEARNING
-- =====================================================

-- Enhanced tutorials table
CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  duration INTEGER, -- in seconds
  channel_id TEXT,
  channel_title TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  rating DECIMAL(2,1),
  is_official BOOLEAN DEFAULT false, -- Official Figma tutorials
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
  ) STORED
);

-- Tutorial timestamps (chapters)
CREATE TABLE IF NOT EXISTS tutorial_timestamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  time_seconds INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tutorial_id, time_seconds)
);

-- User tutorial progress
CREATE TABLE IF NOT EXISTS user_tutorial_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tutorial_id UUID NOT NULL REFERENCES tutorials(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tutorial_id)
);

-- =====================================================
-- API USAGE AND ANALYTICS
-- =====================================================

-- Detailed API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  provider TEXT, -- openai, deepseek, openrouter, etc.
  model TEXT,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated user analytics
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_messages INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_api_calls INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  components_created INTEGER DEFAULT 0,
  tutorials_watched INTEGER DEFAULT 0,
  average_session_duration_seconds INTEGER DEFAULT 0,
  feature_usage JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, period_start, period_end)
);

-- Intent analysis for improving AI responses
CREATE TABLE IF NOT EXISTS intent_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  detected_action TEXT,
  component_types TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  tutorial_requests TEXT[] DEFAULT '{}',
  is_question BOOLEAN DEFAULT false,
  needs_guidance BOOLEAN DEFAULT false,
  confidence DECIMAL(3,2) DEFAULT 0.00,
  response_helpful BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CACHING AND PERFORMANCE
-- =====================================================

-- API response cache
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  provider TEXT,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- YouTube timestamp cache (enhanced)
CREATE TABLE IF NOT EXISTS youtube_timestamps_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT UNIQUE NOT NULL,
  video_title TEXT,
  channel_name TEXT,
  timestamps JSONB DEFAULT '[]'::jsonb,
  extraction_method TEXT CHECK (extraction_method IN ('description', 'api', 'ai_generated', 'manual')),
  is_verified BOOLEAN DEFAULT false,
  access_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT AND COMPLIANCE
-- =====================================================

-- Comprehensive audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_figma_user_id ON users(figma_user_id) WHERE figma_user_id IS NOT NULL;
CREATE INDEX idx_users_last_seen ON users(last_seen_at);

-- Session indexes
CREATE INDEX idx_chat_sessions_widget_id ON chat_sessions(widget_session_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(primary_user_id);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(ended_at) WHERE ended_at IS NULL;
CREATE INDEX idx_session_participants_active ON session_participants(session_id, user_id) WHERE is_active = true;

-- Message indexes
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id) WHERE user_id IS NOT NULL;

-- Component indexes
CREATE INDEX idx_components_type_category ON components(type, category);
CREATE INDEX idx_components_search ON components USING GIN(search_vector);
CREATE INDEX idx_component_usage_user ON component_usage(user_id, created_at);

-- Tutorial indexes
CREATE INDEX idx_tutorials_skill_level ON tutorials(skill_level);
CREATE INDEX idx_tutorials_search ON tutorials USING GIN(search_vector);
CREATE INDEX idx_tutorial_progress_user ON user_tutorial_progress(user_id, completed);

-- Analytics indexes
CREATE INDEX idx_api_usage_user_created ON api_usage(user_id, created_at);
CREATE INDEX idx_api_usage_provider_model ON api_usage(provider, model);
CREATE INDEX idx_user_analytics_period ON user_analytics(user_id, period_start, period_end);

-- Cache indexes
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX idx_youtube_cache_accessed ON youtube_timestamps_cache(last_accessed_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_personalization_updated_at BEFORE UPDATE ON user_personalization
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutorials_updated_at BEFORE UPDATE ON tutorials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update last activity on session
CREATE OR REPLACE FUNCTION update_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions
  SET last_activity = CURRENT_TIMESTAMP
  WHERE id = (
    SELECT session_id 
    FROM chat_conversations 
    WHERE id = NEW.conversation_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_activity_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_session_last_activity();

-- Increment component usage count
CREATE OR REPLACE FUNCTION increment_component_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE components
  SET usage_count = usage_count + 1
  WHERE id = NEW.component_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_usage_on_component_use
  AFTER INSERT ON component_usage
  FOR EACH ROW EXECUTE FUNCTION increment_component_usage();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_timestamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Personalization policies
CREATE POLICY "Users can view own personalization" ON user_personalization
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own personalization" ON user_personalization
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Session policies (allow anonymous access for widget sessions)
CREATE POLICY "Users can view own sessions" ON chat_sessions
  FOR SELECT USING (
    primary_user_id IS NULL OR 
    auth.uid()::text = primary_user_id::text OR
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_id = chat_sessions.id
      AND user_id::text = auth.uid()::text
    )
  );

-- Message policies
CREATE POLICY "Users can view messages in their conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations cc
      JOIN chat_sessions cs ON cc.session_id = cs.id
      WHERE cc.id = chat_messages.conversation_id
      AND (
        cs.primary_user_id IS NULL OR
        cs.primary_user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM session_participants sp
          WHERE sp.session_id = cs.id
          AND sp.user_id::text = auth.uid()::text
        )
      )
    )
  );

-- Component policies
CREATE POLICY "Public components are viewable by all" ON components
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own components" ON components
  FOR ALL USING (created_by::text = auth.uid()::text);

-- Tutorial policies (public access)
CREATE POLICY "Tutorials are publicly viewable" ON tutorials
  FOR SELECT USING (true);

CREATE POLICY "Users can track own tutorial progress" ON user_tutorial_progress
  FOR ALL USING (user_id::text = auth.uid()::text);

-- Analytics policies
CREATE POLICY "Users can view own analytics" ON user_analytics
  FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can view own API usage" ON api_usage
  FOR SELECT USING (user_id::text = auth.uid()::text);

-- =====================================================
-- INITIAL DATA AND DEFAULTS
-- =====================================================

-- Insert default components (Once UI components)
INSERT INTO components (name, type, category, description, figma_code, properties, is_public)
VALUES 
  ('Primary Button', 'button', 'basic', 'A primary action button with hover states', 
   '/* Figma code for primary button */', 
   '{"variant": "primary", "size": ["s", "m", "l"], "fullWidth": false}'::jsonb, true),
  
  ('Card Container', 'card', 'layout', 'A flexible card container with padding options',
   '/* Figma code for card */',
   '{"padding": ["s", "m", "l"], "radius": ["s", "m", "l"], "elevation": ["none", "small", "medium"]}'::jsonb, true),
  
  ('Text Input', 'input', 'form', 'A text input field with label and validation states',
   '/* Figma code for input */',
   '{"type": "text", "label": true, "helper": true, "error": false}'::jsonb, true)
ON CONFLICT DO NOTHING;