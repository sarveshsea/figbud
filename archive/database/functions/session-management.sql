-- =====================================================
-- Session Management Functions
-- =====================================================

-- Create multi-user session
CREATE OR REPLACE FUNCTION create_multi_user_session(
  p_widget_session_id TEXT,
  p_primary_user_id UUID DEFAULT NULL,
  p_workspace_id UUID DEFAULT NULL,
  p_figma_file_key TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_conversation_id UUID;
  v_is_anonymous BOOLEAN;
  v_is_multi_user BOOLEAN;
BEGIN
  -- Check if session already exists
  SELECT id INTO v_session_id
  FROM chat_sessions
  WHERE widget_session_id = p_widget_session_id;
  
  IF v_session_id IS NOT NULL THEN
    -- Update existing session
    UPDATE chat_sessions
    SET 
      last_activity = CURRENT_TIMESTAMP,
      metadata = metadata || p_metadata
    WHERE id = v_session_id;
    
    RETURN v_session_id;
  END IF;
  
  -- Determine session type
  v_is_anonymous := p_primary_user_id IS NULL;
  v_is_multi_user := p_workspace_id IS NOT NULL;
  
  -- Create new session
  INSERT INTO chat_sessions (
    widget_session_id,
    primary_user_id,
    is_anonymous,
    is_multi_user,
    workspace_id,
    figma_file_key,
    metadata
  ) VALUES (
    p_widget_session_id,
    p_primary_user_id,
    v_is_anonymous,
    v_is_multi_user,
    p_workspace_id,
    p_figma_file_key,
    p_metadata
  ) RETURNING id INTO v_session_id;
  
  -- Add primary user as participant if not anonymous
  IF p_primary_user_id IS NOT NULL THEN
    INSERT INTO session_participants (session_id, user_id, role)
    VALUES (v_session_id, p_primary_user_id, 'host');
  END IF;
  
  -- Create initial conversation
  INSERT INTO chat_conversations (
    session_id,
    user_id,
    title,
    metadata
  ) VALUES (
    v_session_id,
    p_primary_user_id,
    'Chat ' || to_char(CURRENT_TIMESTAMP, 'Mon DD, HH24:MI'),
    jsonb_build_object('auto_created', true)
  ) RETURNING id INTO v_conversation_id;
  
  -- Log session creation
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    p_primary_user_id,
    'session.created',
    'chat_session',
    v_session_id,
    jsonb_build_object(
      'widget_session_id', p_widget_session_id,
      'is_multi_user', v_is_multi_user,
      'workspace_id', p_workspace_id
    )
  );
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add user to multi-user session
CREATE OR REPLACE FUNCTION add_user_to_session(
  p_session_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'participant'
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_multi_user BOOLEAN;
  v_participant_count INTEGER;
BEGIN
  -- Check if session exists and is multi-user
  SELECT is_multi_user INTO v_is_multi_user
  FROM chat_sessions
  WHERE id = p_session_id
  AND ended_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found or already ended';
  END IF;
  
  IF NOT v_is_multi_user THEN
    RAISE EXCEPTION 'Session is not configured for multiple users';
  END IF;
  
  -- Check if user is already a participant
  IF EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND is_active = true
  ) THEN
    RETURN false; -- Already a participant
  END IF;
  
  -- Add or reactivate participant
  INSERT INTO session_participants (session_id, user_id, role)
  VALUES (p_session_id, p_user_id, p_role)
  ON CONFLICT (session_id, user_id) DO UPDATE
  SET 
    is_active = true,
    joined_at = CURRENT_TIMESTAMP,
    left_at = NULL,
    role = p_role;
  
  -- Update session metadata
  SELECT COUNT(*) INTO v_participant_count
  FROM session_participants
  WHERE session_id = p_session_id
  AND is_active = true;
  
  UPDATE chat_sessions
  SET 
    metadata = jsonb_set(
      metadata,
      '{participant_count}',
      to_jsonb(v_participant_count)
    ),
    last_activity = CURRENT_TIMESTAMP
  WHERE id = p_session_id;
  
  -- Log the action
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    p_user_id,
    'session.user_joined',
    'session_participant',
    p_session_id,
    jsonb_build_object('role', p_role)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Switch active user in session
CREATE OR REPLACE FUNCTION switch_session_user(
  p_widget_session_id TEXT,
  p_new_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_session_id UUID;
  v_old_user_id UUID;
  v_conversation_id UUID;
  v_user_context JSONB;
BEGIN
  -- Get session
  SELECT id, primary_user_id INTO v_session_id, v_old_user_id
  FROM chat_sessions
  WHERE widget_session_id = p_widget_session_id
  AND ended_at IS NULL;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active session not found';
  END IF;
  
  -- Update primary user
  UPDATE chat_sessions
  SET 
    primary_user_id = p_new_user_id,
    last_activity = CURRENT_TIMESTAMP
  WHERE id = v_session_id;
  
  -- Ensure user is a participant
  PERFORM add_user_to_session(v_session_id, p_new_user_id, 'participant');
  
  -- Create new conversation for the user if needed
  SELECT id INTO v_conversation_id
  FROM chat_conversations
  WHERE session_id = v_session_id
  AND user_id = p_new_user_id
  AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_conversation_id IS NULL THEN
    INSERT INTO chat_conversations (session_id, user_id, title)
    VALUES (
      v_session_id,
      p_new_user_id,
      'Chat ' || to_char(CURRENT_TIMESTAMP, 'Mon DD, HH24:MI')
    )
    RETURNING id INTO v_conversation_id;
  END IF;
  
  -- Get user context
  SELECT * INTO v_user_context
  FROM get_user_with_context(p_new_user_id);
  
  -- Log the switch
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (
    p_new_user_id,
    'session.user_switched',
    'chat_session',
    v_session_id,
    jsonb_build_object('previous_user_id', v_old_user_id),
    jsonb_build_object('new_user_id', p_new_user_id)
  );
  
  RETURN jsonb_build_object(
    'session_id', v_session_id,
    'conversation_id', v_conversation_id,
    'user_context', v_user_context
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Merge anonymous session to user session
CREATE OR REPLACE FUNCTION merge_anonymous_to_user(
  p_anonymous_session_id UUID,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  v_is_anonymous BOOLEAN;
  v_message_count INTEGER;
BEGIN
  -- Verify session is anonymous
  SELECT is_anonymous INTO v_is_anonymous
  FROM chat_sessions
  WHERE id = p_anonymous_session_id;
  
  IF NOT v_is_anonymous THEN
    RAISE EXCEPTION 'Session is not anonymous';
  END IF;
  
  -- Update session
  UPDATE chat_sessions
  SET 
    primary_user_id = p_user_id,
    is_anonymous = false,
    metadata = metadata || jsonb_build_object('merged_at', CURRENT_TIMESTAMP)
  WHERE id = p_anonymous_session_id;
  
  -- Update conversations
  UPDATE chat_conversations
  SET user_id = p_user_id
  WHERE session_id = p_anonymous_session_id
  AND user_id IS NULL;
  
  -- Update messages
  UPDATE chat_messages cm
  SET user_id = p_user_id
  FROM chat_conversations cc
  WHERE cc.id = cm.conversation_id
  AND cc.session_id = p_anonymous_session_id
  AND cm.user_id IS NULL
  AND cm.role = 'user';
  
  -- Count merged messages
  SELECT COUNT(*) INTO v_message_count
  FROM chat_messages cm
  JOIN chat_conversations cc ON cm.conversation_id = cc.id
  WHERE cc.session_id = p_anonymous_session_id;
  
  -- Add user as participant
  INSERT INTO session_participants (session_id, user_id, role)
  VALUES (p_anonymous_session_id, p_user_id, 'host');
  
  -- Log the merge
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    p_user_id,
    'session.anonymous_merged',
    'chat_session',
    p_anonymous_session_id,
    jsonb_build_object('message_count', v_message_count)
  );
  
  RETURN p_anonymous_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- End session and cleanup
CREATE OR REPLACE FUNCTION end_chat_session(
  p_widget_session_id TEXT
) RETURNS VOID AS $$
DECLARE
  v_session_id UUID;
  v_participant_count INTEGER;
  v_message_count INTEGER;
  v_duration_seconds INTEGER;
BEGIN
  -- Get session
  SELECT id INTO v_session_id
  FROM chat_sessions
  WHERE widget_session_id = p_widget_session_id
  AND ended_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN; -- Session already ended or doesn't exist
  END IF;
  
  -- Calculate session stats
  SELECT 
    COUNT(DISTINCT sp.user_id),
    COUNT(DISTINCT cm.id),
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - cs.started_at))::INTEGER
  INTO v_participant_count, v_message_count, v_duration_seconds
  FROM chat_sessions cs
  LEFT JOIN session_participants sp ON cs.id = sp.session_id
  LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
  LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
  WHERE cs.id = v_session_id
  GROUP BY cs.started_at;
  
  -- End session
  UPDATE chat_sessions
  SET 
    ended_at = CURRENT_TIMESTAMP,
    metadata = metadata || jsonb_build_object(
      'final_stats', jsonb_build_object(
        'participant_count', v_participant_count,
        'message_count', v_message_count,
        'duration_seconds', v_duration_seconds
      )
    )
  WHERE id = v_session_id;
  
  -- End all conversations
  UPDATE chat_conversations
  SET 
    is_active = false,
    ended_at = CURRENT_TIMESTAMP
  WHERE session_id = v_session_id
  AND is_active = true;
  
  -- Mark all participants as left
  UPDATE session_participants
  SET 
    is_active = false,
    left_at = CURRENT_TIMESTAMP
  WHERE session_id = v_session_id
  AND is_active = true;
  
  -- Log session end
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    (SELECT primary_user_id FROM chat_sessions WHERE id = v_session_id),
    'session.ended',
    'chat_session',
    v_session_id,
    jsonb_build_object(
      'duration_seconds', v_duration_seconds,
      'message_count', v_message_count,
      'participant_count', v_participant_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Store enriched chat message
CREATE OR REPLACE FUNCTION store_enriched_message(
  p_conversation_id UUID,
  p_user_id UUID,
  p_role TEXT,
  p_content TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_intent JSONB DEFAULT NULL,
  p_components JSONB DEFAULT NULL,
  p_tutorials JSONB DEFAULT NULL,
  p_action_items JSONB DEFAULT NULL,
  p_provider TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_tokens_used INTEGER DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
  v_session_id UUID;
BEGIN
  -- Insert message
  INSERT INTO chat_messages (
    conversation_id,
    user_id,
    role,
    content,
    metadata,
    intent,
    components,
    tutorials,
    action_items,
    provider,
    model,
    tokens_used,
    response_time_ms
  ) VALUES (
    p_conversation_id,
    p_user_id,
    p_role,
    p_content,
    p_metadata,
    p_intent,
    p_components,
    p_tutorials,
    p_action_items,
    p_provider,
    p_model,
    p_tokens_used,
    p_response_time_ms
  ) RETURNING id INTO v_message_id;
  
  -- Store intent analysis if provided
  IF p_intent IS NOT NULL THEN
    INSERT INTO intent_analysis (
      message_id,
      user_id,
      detected_action,
      component_types,
      keywords,
      tutorial_requests,
      is_question,
      needs_guidance,
      confidence
    ) VALUES (
      v_message_id,
      p_user_id,
      p_intent->>'action',
      ARRAY(SELECT jsonb_array_elements_text(p_intent->'componentTypes')),
      ARRAY(SELECT jsonb_array_elements_text(p_intent->'keywords')),
      ARRAY(SELECT jsonb_array_elements_text(p_intent->'tutorialRequests')),
      (p_intent->>'isQuestion')::boolean,
      (p_intent->>'needsGuidance')::boolean,
      (p_intent->>'confidence')::decimal
    );
  END IF;
  
  -- Track component usage if components were suggested
  IF p_components IS NOT NULL AND jsonb_array_length(p_components) > 0 THEN
    INSERT INTO component_usage (user_id, component_id, session_id, conversation_id, context)
    SELECT 
      p_user_id,
      (comp->>'id')::uuid,
      cc.session_id,
      p_conversation_id,
      jsonb_build_object('suggested', true, 'message_id', v_message_id)
    FROM jsonb_array_elements(p_components) AS comp
    JOIN chat_conversations cc ON cc.id = p_conversation_id
    WHERE comp->>'id' IS NOT NULL;
  END IF;
  
  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get session context for AI
CREATE OR REPLACE FUNCTION get_session_context(
  p_session_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
  v_context JSONB;
BEGIN
  WITH session_info AS (
    SELECT jsonb_build_object(
      'session_id', cs.id,
      'started_at', cs.started_at,
      'is_multi_user', cs.is_multi_user,
      'participant_count', (
        SELECT COUNT(*) FROM session_participants
        WHERE session_id = cs.id AND is_active = true
      ),
      'figma_file_key', cs.figma_file_key
    ) AS session_data
    FROM chat_sessions cs
    WHERE cs.id = p_session_id
  ),
  recent_messages AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'role', cm.role,
        'content', cm.content,
        'user_name', u.display_name,
        'timestamp', cm.created_at,
        'intent', cm.intent
      ) ORDER BY cm.created_at DESC
    ) AS messages
    FROM chat_messages cm
    JOIN chat_conversations cc ON cm.conversation_id = cc.id
    LEFT JOIN users u ON cm.user_id = u.id
    WHERE cc.session_id = p_session_id
    AND cm.created_at > CURRENT_TIMESTAMP - INTERVAL '1 hour'
    LIMIT p_limit
  ),
  active_users AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'user_id', u.id,
        'display_name', u.display_name,
        'skill_level', up.skill_level,
        'personalization', jsonb_build_object(
          'personalize_enabled', upers.personalize_enabled,
          'write_style', upers.write_style
        )
      )
    ) AS users
    FROM session_participants sp
    JOIN users u ON sp.user_id = u.id
    LEFT JOIN user_preferences up ON u.id = up.user_id AND up.is_current = true
    LEFT JOIN user_personalization upers ON u.id = upers.user_id
    WHERE sp.session_id = p_session_id
    AND sp.is_active = true
  ),
  used_components AS (
    SELECT jsonb_agg(DISTINCT
      jsonb_build_object(
        'component_id', c.id,
        'name', c.name,
        'type', c.type
      )
    ) AS components
    FROM component_usage cu
    JOIN components c ON cu.component_id = c.id
    WHERE cu.session_id = p_session_id
  )
  SELECT jsonb_build_object(
    'session', si.session_data,
    'recent_messages', COALESCE(rm.messages, '[]'::jsonb),
    'active_users', COALESCE(au.users, '[]'::jsonb),
    'used_components', COALESCE(uc.components, '[]'::jsonb)
  ) INTO v_context
  FROM session_info si
  CROSS JOIN recent_messages rm
  CROSS JOIN active_users au
  CROSS JOIN used_components uc;
  
  RETURN v_context;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup expired sessions (for cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions(
  p_hours_inactive INTEGER DEFAULT 24
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH expired_sessions AS (
    UPDATE chat_sessions
    SET ended_at = CURRENT_TIMESTAMP
    WHERE ended_at IS NULL
    AND last_activity < CURRENT_TIMESTAMP - make_interval(hours => p_hours_inactive)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM expired_sessions;
  
  -- Also cleanup related data
  UPDATE chat_conversations cc
  SET is_active = false, ended_at = CURRENT_TIMESTAMP
  FROM chat_sessions cs
  WHERE cc.session_id = cs.id
  AND cs.ended_at IS NOT NULL
  AND cc.is_active = true;
  
  UPDATE session_participants sp
  SET is_active = false, left_at = CURRENT_TIMESTAMP
  FROM chat_sessions cs
  WHERE sp.session_id = cs.id
  AND cs.ended_at IS NOT NULL
  AND sp.is_active = true;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;