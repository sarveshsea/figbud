-- =====================================================
-- Migration Script: Existing Schema to Master Schema
-- Version: 1.0.0
-- Description: Safely migrates data from existing tables to new master schema
-- =====================================================

-- Start transaction for atomic migration
BEGIN;

-- =====================================================
-- STEP 1: Create backup of existing data
-- =====================================================

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS backup_20240120;

-- Backup existing tables
CREATE TABLE backup_20240120.users AS SELECT * FROM users WHERE EXISTS (SELECT 1 FROM users LIMIT 1);
CREATE TABLE backup_20240120.chat_sessions AS SELECT * FROM chat_sessions WHERE EXISTS (SELECT 1 FROM chat_sessions LIMIT 1);
CREATE TABLE backup_20240120.chat_conversations AS SELECT * FROM chat_conversations WHERE EXISTS (SELECT 1 FROM chat_conversations LIMIT 1);
CREATE TABLE backup_20240120.chat_messages AS SELECT * FROM chat_messages WHERE EXISTS (SELECT 1 FROM chat_messages LIMIT 1);
CREATE TABLE backup_20240120.once_ui_components AS SELECT * FROM once_ui_components WHERE EXISTS (SELECT 1 FROM once_ui_components LIMIT 1);
CREATE TABLE backup_20240120.api_calls AS SELECT * FROM api_calls WHERE EXISTS (SELECT 1 FROM api_calls LIMIT 1);
CREATE TABLE backup_20240120.api_cache AS SELECT * FROM api_cache WHERE EXISTS (SELECT 1 FROM api_cache LIMIT 1);

-- =====================================================
-- STEP 2: Create temporary mapping tables
-- =====================================================

-- Map old user IDs to new user IDs (in case of duplicates)
CREATE TEMP TABLE user_id_mapping (
  old_id UUID,
  new_id UUID,
  email TEXT
);

-- =====================================================
-- STEP 3: Migrate users table
-- =====================================================

-- Insert users, handling potential duplicates
INSERT INTO user_id_mapping (old_id, new_id, email)
SELECT 
  COALESCE(old.id, new.id) AS old_id,
  COALESCE(new.id, gen_random_uuid()) AS new_id,
  COALESCE(old.email, new.email) AS email
FROM (
  SELECT DISTINCT ON (email) * FROM users ORDER BY email, created_at
) old
FULL OUTER JOIN (
  SELECT DISTINCT ON (email) * FROM backup_20240120.users ORDER BY email, created_at
) new ON old.email = new.email;

-- Migrate users with deduplication
INSERT INTO users (id, email, display_name, figma_user_id, created_at, updated_at)
SELECT DISTINCT ON (email)
  um.new_id,
  COALESCE(u.email, bu.email),
  COALESCE(u.display_name, bu.display_name),
  COALESCE(u.figma_user_id, bu.figma_user_id),
  LEAST(
    COALESCE(u.created_at, CURRENT_TIMESTAMP),
    COALESCE(bu.created_at, CURRENT_TIMESTAMP)
  ),
  CURRENT_TIMESTAMP
FROM user_id_mapping um
LEFT JOIN users u ON um.old_id = u.id
LEFT JOIN backup_20240120.users bu ON um.old_id = bu.id
ON CONFLICT (email) DO UPDATE
SET 
  display_name = COALESCE(EXCLUDED.display_name, users.display_name),
  figma_user_id = COALESCE(EXCLUDED.figma_user_id, users.figma_user_id),
  updated_at = CURRENT_TIMESTAMP;

-- =====================================================
-- STEP 4: Migrate user preferences
-- =====================================================

-- Migrate existing preferences or create defaults
INSERT INTO user_preferences (user_id, skill_level, design_style, common_use_cases, theme)
SELECT 
  um.new_id,
  COALESCE(
    -- Try to extract from old preferences JSON
    CASE 
      WHEN u.preferences->>'skillLevel' IS NOT NULL THEN u.preferences->>'skillLevel'
      WHEN bu.preferences->>'skillLevel' IS NOT NULL THEN bu.preferences->>'skillLevel'
      ELSE 'beginner'
    END,
    'beginner'
  )::text,
  COALESCE(
    CASE 
      WHEN u.preferences->>'designStyle' IS NOT NULL THEN u.preferences->>'designStyle'
      WHEN bu.preferences->>'designStyle' IS NOT NULL THEN bu.preferences->>'designStyle'
      ELSE 'modern'
    END,
    'modern'
  )::text,
  COALESCE(
    CASE 
      WHEN u.preferences->'commonUseCases' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(u.preferences->'commonUseCases'))
      WHEN bu.preferences->'commonUseCases' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(bu.preferences->'commonUseCases'))
      ELSE '{}'::text[]
    END,
    '{}'::text[]
  ),
  COALESCE(
    CASE 
      WHEN u.preferences->>'theme' IS NOT NULL THEN u.preferences->>'theme'
      WHEN bu.preferences->>'theme' IS NOT NULL THEN bu.preferences->>'theme'
      ELSE 'auto'
    END,
    'auto'
  )::text
FROM user_id_mapping um
LEFT JOIN users u ON um.old_id = u.id
LEFT JOIN backup_20240120.users bu ON um.old_id = bu.id
ON CONFLICT (user_id) WHERE is_current = true DO NOTHING;

-- Create default personalization for all users
INSERT INTO user_personalization (user_id)
SELECT um.new_id
FROM user_id_mapping um
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- STEP 5: Migrate chat sessions
-- =====================================================

-- Migrate chat sessions with updated user references
INSERT INTO chat_sessions (
  id, 
  widget_session_id, 
  primary_user_id, 
  is_anonymous, 
  started_at, 
  last_activity, 
  ended_at, 
  metadata
)
SELECT 
  cs.id,
  cs.widget_session_id,
  um.new_id,
  cs.is_anonymous,
  cs.started_at,
  cs.last_activity,
  cs.ended_at,
  COALESCE(cs.metadata, '{}'::jsonb)
FROM chat_sessions cs
LEFT JOIN user_id_mapping um ON cs.user_id = um.old_id
ON CONFLICT (widget_session_id) DO UPDATE
SET
  primary_user_id = EXCLUDED.primary_user_id,
  last_activity = GREATEST(chat_sessions.last_activity, EXCLUDED.last_activity),
  metadata = chat_sessions.metadata || EXCLUDED.metadata;

-- Add session participants for migrated sessions
INSERT INTO session_participants (session_id, user_id, role)
SELECT DISTINCT
  cs.id,
  cs.primary_user_id,
  'host'
FROM chat_sessions cs
WHERE cs.primary_user_id IS NOT NULL
ON CONFLICT (session_id, user_id) DO NOTHING;

-- =====================================================
-- STEP 6: Migrate conversations and messages
-- =====================================================

-- Migrate conversations
INSERT INTO chat_conversations (
  id,
  session_id,
  user_id,
  title,
  is_active,
  created_at,
  ended_at
)
SELECT
  cc.id,
  cc.session_id,
  um.new_id,
  COALESCE(cc.title, 'Migrated Chat'),
  COALESCE(cc.is_active, true),
  cc.created_at,
  cc.ended_at
FROM chat_conversations cc
LEFT JOIN user_id_mapping um ON cc.user_id = um.old_id
WHERE EXISTS (
  SELECT 1 FROM chat_sessions cs WHERE cs.id = cc.session_id
)
ON CONFLICT (id) DO NOTHING;

-- Migrate messages with enriched metadata
INSERT INTO chat_messages (
  id,
  conversation_id,
  user_id,
  role,
  content,
  metadata,
  provider,
  model,
  created_at
)
SELECT
  cm.id,
  cm.conversation_id,
  CASE 
    WHEN cm.role = 'user' THEN um.new_id
    ELSE NULL
  END,
  cm.role,
  cm.content,
  COALESCE(cm.metadata, '{}'::jsonb),
  cm.provider,
  cm.model,
  cm.created_at
FROM chat_messages cm
LEFT JOIN chat_conversations cc ON cm.conversation_id = cc.id
LEFT JOIN user_id_mapping um ON cc.user_id = um.old_id
WHERE EXISTS (
  SELECT 1 FROM chat_conversations cc2 WHERE cc2.id = cm.conversation_id
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 7: Migrate components
-- =====================================================

-- Migrate Once UI components to new components table
INSERT INTO components (
  name,
  type,
  category,
  description,
  figma_code,
  properties,
  created_at
)
SELECT
  ouc.name,
  LOWER(ouc.category), -- Use category as type initially
  ouc.category,
  ouc.example_usage,
  ouc.figma_code,
  COALESCE(ouc.properties, '{}'::jsonb),
  ouc.created_at
FROM once_ui_components ouc
ON CONFLICT DO NOTHING;

-- Migrate component usage
INSERT INTO component_usage (
  user_id,
  component_id,
  created_at
)
SELECT DISTINCT
  um.new_id,
  c.id,
  cu.used_at
FROM component_usage cu
JOIN components c ON cu.component_id = c.id
JOIN user_id_mapping um ON cu.user_id = um.old_id
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 8: Migrate API usage and cache
-- =====================================================

-- Migrate API calls to api_usage table
INSERT INTO api_usage (
  user_id,
  endpoint,
  method,
  provider,
  request_body,
  response_status,
  response_body,
  tokens_input,
  tokens_output,
  cost_cents,
  duration_ms,
  created_at
)
SELECT
  um.new_id,
  ac.endpoint,
  ac.method,
  COALESCE(ac.provider, 'unknown'),
  ac.request_body,
  ac.response_status,
  ac.response_body,
  COALESCE(ac.tokens_used, 0),
  0, -- tokens_output not tracked in old schema
  COALESCE(ac.cost_cents, 0),
  ac.duration_ms,
  ac.created_at
FROM api_calls ac
LEFT JOIN user_id_mapping um ON ac.user_id = um.old_id
ON CONFLICT DO NOTHING;

-- Migrate API cache
INSERT INTO api_cache (
  cache_key,
  response_data,
  provider,
  expires_at,
  hit_count,
  created_at,
  last_accessed_at
)
SELECT
  ac.cache_key,
  ac.response_data,
  ac.provider,
  ac.expires_at,
  COALESCE(ac.hit_count, 0),
  ac.created_at,
  COALESCE(ac.last_accessed_at, ac.created_at)
FROM api_cache ac
ON CONFLICT (cache_key) DO UPDATE
SET
  hit_count = api_cache.hit_count + EXCLUDED.hit_count,
  last_accessed_at = GREATEST(api_cache.last_accessed_at, EXCLUDED.last_accessed_at);

-- =====================================================
-- STEP 9: Migrate intent analysis from messages
-- =====================================================

-- Extract intent analysis from message metadata
INSERT INTO intent_analysis (
  message_id,
  user_id,
  detected_action,
  component_types,
  keywords,
  is_question,
  needs_guidance,
  confidence,
  created_at
)
SELECT
  cm.id,
  cm.user_id,
  cm.intent->>'action',
  ARRAY(SELECT jsonb_array_elements_text(cm.intent->'componentTypes')),
  ARRAY(SELECT jsonb_array_elements_text(cm.intent->'keywords')),
  COALESCE((cm.intent->>'isQuestion')::boolean, false),
  COALESCE((cm.intent->>'needsGuidance')::boolean, false),
  COALESCE((cm.intent->>'confidence')::decimal, 0.0),
  cm.created_at
FROM chat_messages cm
WHERE cm.intent IS NOT NULL
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 10: Create initial analytics aggregates
-- =====================================================

-- Generate initial user analytics for the last 30 days
INSERT INTO user_analytics (
  user_id,
  period_start,
  period_end,
  total_messages,
  total_sessions,
  total_api_calls,
  total_tokens_used,
  total_cost_cents,
  components_created,
  tutorials_watched
)
SELECT
  u.id,
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  COUNT(DISTINCT cm.id),
  COUNT(DISTINCT cs.id),
  COUNT(DISTINCT au.id),
  SUM(COALESCE(au.tokens_input, 0) + COALESCE(au.tokens_output, 0)),
  SUM(COALESCE(au.cost_cents, 0)),
  COUNT(DISTINCT cu.component_id),
  0 -- No tutorial data to migrate
FROM users u
LEFT JOIN chat_sessions cs ON u.id = cs.primary_user_id
  AND cs.started_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
LEFT JOIN api_usage au ON u.id = au.user_id
  AND au.created_at >= CURRENT_DATE - INTERVAL '30 days'
LEFT JOIN component_usage cu ON u.id = cu.user_id
  AND cu.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id
HAVING COUNT(DISTINCT cm.id) > 0 OR COUNT(DISTINCT cs.id) > 0;

-- =====================================================
-- STEP 11: Verification queries
-- =====================================================

-- Log migration results
DO $$
DECLARE
  v_user_count INTEGER;
  v_session_count INTEGER;
  v_message_count INTEGER;
  v_component_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM users;
  SELECT COUNT(*) INTO v_session_count FROM chat_sessions;
  SELECT COUNT(*) INTO v_message_count FROM chat_messages;
  SELECT COUNT(*) INTO v_component_count FROM components;
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  Users: %', v_user_count;
  RAISE NOTICE '  Sessions: %', v_session_count;
  RAISE NOTICE '  Messages: %', v_message_count;
  RAISE NOTICE '  Components: %', v_component_count;
  
  -- Insert audit log
  INSERT INTO audit_logs (action, resource_type, new_values)
  VALUES (
    'migration.completed',
    'database',
    jsonb_build_object(
      'version', '1.0.0',
      'users_migrated', v_user_count,
      'sessions_migrated', v_session_count,
      'messages_migrated', v_message_count,
      'components_migrated', v_component_count
    )
  );
END $$;

-- =====================================================
-- STEP 12: Create indexes if not exists
-- =====================================================

-- Ensure all indexes are created (idempotent)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_widget_id ON chat_sessions(widget_session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_created ON api_usage(user_id, created_at);

-- =====================================================
-- STEP 13: Grant appropriate permissions
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON users, user_preferences, user_personalization TO authenticated;
GRANT INSERT ON chat_sessions, chat_conversations, chat_messages TO authenticated;
GRANT INSERT ON component_usage, api_usage TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Commit the migration
COMMIT;

-- =====================================================
-- POST-MIGRATION CLEANUP (Run manually after verification)
-- =====================================================

-- After verifying the migration succeeded:
-- DROP SCHEMA backup_20240120 CASCADE;
-- DROP TABLE IF EXISTS figbud_users CASCADE;
-- DROP TABLE IF EXISTS user_subscriptions CASCADE;
-- DROP TABLE IF EXISTS usage_history CASCADE;