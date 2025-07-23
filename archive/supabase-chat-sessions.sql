-- FigBud Chat Sessions Schema
-- This schema manages chat sessions and user-specific data

-- Chat sessions table (tracks active widget sessions)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  widget_session_id TEXT NOT NULL UNIQUE,
  is_anonymous BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  
  -- Index for cleanup queries
  INDEX idx_chat_sessions_ended_at (ended_at),
  INDEX idx_chat_sessions_user_id (user_id),
  INDEX idx_chat_sessions_widget_id (widget_session_id)
);

-- Update chat_conversations to link with sessions
ALTER TABLE chat_conversations 
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;

-- Update chat_messages to include enriched metadata
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS intent JSONB,
  ADD COLUMN IF NOT EXISTS components JSONB,
  ADD COLUMN IF NOT EXISTS tutorials JSONB,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT;

-- Update intent_analysis to include user context
ALTER TABLE intent_analysis
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE;

-- Create index for intent analysis queries
CREATE INDEX IF NOT EXISTS idx_intent_analysis_session ON intent_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_intent_analysis_conversation ON intent_analysis(conversation_id);

-- Function to create a new chat session
CREATE OR REPLACE FUNCTION create_chat_session(
  p_user_id UUID,
  p_widget_session_id TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_is_anonymous BOOLEAN;
BEGIN
  -- Check if user_id is provided
  v_is_anonymous := p_user_id IS NULL;
  
  -- Create the session
  INSERT INTO chat_sessions (user_id, widget_session_id, is_anonymous, metadata)
  VALUES (p_user_id, p_widget_session_id, v_is_anonymous, p_metadata)
  RETURNING id INTO v_session_id;
  
  -- Create initial conversation
  INSERT INTO chat_conversations (user_id, widget_session_id, session_id)
  VALUES (p_user_id, p_widget_session_id, v_session_id);
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to end a chat session
CREATE OR REPLACE FUNCTION end_chat_session(
  p_widget_session_id TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update session
  UPDATE chat_sessions
  SET ended_at = CURRENT_TIMESTAMP
  WHERE widget_session_id = p_widget_session_id
    AND ended_at IS NULL;
  
  -- Update conversations
  UPDATE chat_conversations
  SET is_active = false,
      ended_at = CURRENT_TIMESTAMP
  WHERE widget_session_id = p_widget_session_id
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to store chat message with enriched data
CREATE OR REPLACE FUNCTION store_chat_message(
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
  INSERT INTO chat_messages (
    conversation_id,
    role,
    content,
    metadata,
    intent,
    components,
    tutorials,
    provider,
    model
  )
  VALUES (
    p_conversation_id,
    p_role,
    p_content,
    p_metadata,
    p_intent,
    p_components,
    p_tutorials,
    p_provider,
    p_model
  )
  RETURNING id INTO v_message_id;
  
  -- Update session last activity
  UPDATE chat_sessions
  SET last_activity = CURRENT_TIMESTAMP
  WHERE id = (
    SELECT session_id 
    FROM chat_conversations 
    WHERE id = p_conversation_id
  );
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions(
  p_hours_inactive INTEGER DEFAULT 24
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- End sessions that have been inactive
  WITH expired_sessions AS (
    UPDATE chat_sessions
    SET ended_at = CURRENT_TIMESTAMP
    WHERE ended_at IS NULL
      AND last_activity < CURRENT_TIMESTAMP - INTERVAL '1 hour' * p_hours_inactive
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM expired_sessions;
  
  -- Cleanup anonymous sessions older than 7 days
  DELETE FROM chat_sessions
  WHERE is_anonymous = true
    AND ended_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's chat history
CREATE OR REPLACE FUNCTION get_user_chat_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
  conversation_id UUID,
  session_id UUID,
  messages JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.session_id,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', m.id,
          'role', m.role,
          'content', m.content,
          'metadata', m.metadata,
          'intent', m.intent,
          'components', m.components,
          'tutorials', m.tutorials,
          'created_at', m.created_at
        ) ORDER BY m.created_at
      ) FILTER (WHERE m.id IS NOT NULL),
      '[]'::jsonb
    ) as messages,
    c.created_at as started_at,
    c.ended_at
  FROM chat_conversations c
  LEFT JOIN chat_messages m ON m.conversation_id = c.id
  WHERE c.user_id = p_user_id
  GROUP BY c.id, c.session_id, c.created_at, c.ended_at
  ORDER BY c.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security for chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
CREATE POLICY "Users can view own sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id OR is_anonymous = true);

CREATE POLICY "Users can create own sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id OR is_anonymous = true);

-- Update chat_conversations policies
DROP POLICY IF EXISTS "Users can view own conversations" ON chat_conversations;
CREATE POLICY "Users can view own conversations" ON chat_conversations
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM chat_sessions s 
    WHERE s.id = chat_conversations.session_id 
    AND s.is_anonymous = true
  ));

-- Update chat_messages policies
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON chat_messages;
CREATE POLICY "Users can view messages in own conversations" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations c
      JOIN chat_sessions s ON s.id = c.session_id
      WHERE c.id = chat_messages.conversation_id
      AND (s.user_id = auth.uid() OR s.is_anonymous = true)
    )
  );

-- Create trigger to update last_activity
CREATE OR REPLACE FUNCTION update_session_activity()
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

CREATE TRIGGER trigger_update_session_activity
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();