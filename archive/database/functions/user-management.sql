-- =====================================================
-- User Management Functions
-- =====================================================

-- Create or update user with preferences
CREATE OR REPLACE FUNCTION create_or_update_user(
  p_email TEXT,
  p_display_name TEXT DEFAULT NULL,
  p_figma_user_id TEXT DEFAULT NULL,
  p_auth_provider TEXT DEFAULT 'email',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_is_new_user BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT id INTO v_user_id FROM users WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    -- Create new user
    INSERT INTO users (email, display_name, figma_user_id, auth_provider, metadata)
    VALUES (p_email, p_display_name, p_figma_user_id, p_auth_provider, p_metadata)
    RETURNING id INTO v_user_id;
    
    v_is_new_user := true;
    
    -- Create default preferences
    INSERT INTO user_preferences (user_id)
    VALUES (v_user_id);
    
    -- Create default personalization
    INSERT INTO user_personalization (user_id)
    VALUES (v_user_id);
    
  ELSE
    -- Update existing user
    UPDATE users 
    SET 
      display_name = COALESCE(p_display_name, display_name),
      figma_user_id = COALESCE(p_figma_user_id, figma_user_id),
      metadata = metadata || p_metadata,
      last_seen_at = CURRENT_TIMESTAMP
    WHERE id = v_user_id;
    
    v_is_new_user := false;
  END IF;
  
  -- Log the action
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    v_user_id,
    CASE WHEN v_is_new_user THEN 'user.created' ELSE 'user.updated' END,
    'user',
    v_user_id,
    jsonb_build_object(
      'email', p_email,
      'display_name', p_display_name,
      'auth_provider', p_auth_provider
    )
  );
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user with all related data
CREATE OR REPLACE FUNCTION get_user_with_context(
  p_user_id UUID
) RETURNS TABLE (
  user_data JSONB,
  preferences JSONB,
  personalization JSONB,
  current_session JSONB,
  recent_components JSONB,
  learning_progress JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_info AS (
    SELECT jsonb_build_object(
      'id', u.id,
      'email', u.email,
      'display_name', u.display_name,
      'avatar_url', u.avatar_url,
      'figma_user_id', u.figma_user_id,
      'created_at', u.created_at,
      'last_seen_at', u.last_seen_at
    ) AS user_data
    FROM users u
    WHERE u.id = p_user_id
  ),
  prefs AS (
    SELECT jsonb_build_object(
      'skill_level', up.skill_level,
      'design_style', up.design_style,
      'common_use_cases', up.common_use_cases,
      'preferred_tutorial_length', up.preferred_tutorial_length,
      'notifications', up.notifications,
      'theme', up.theme
    ) AS preferences
    FROM user_preferences up
    WHERE up.user_id = p_user_id
    AND up.is_current = true
  ),
  personal AS (
    SELECT jsonb_build_object(
      'personalize_enabled', upers.personalize_enabled,
      'inspirations', upers.inspirations,
      'digest_info', upers.digest_info,
      'write_style', upers.write_style,
      'language_preference', upers.language_preference,
      'timezone', upers.timezone
    ) AS personalization
    FROM user_personalization upers
    WHERE upers.user_id = p_user_id
  ),
  session AS (
    SELECT jsonb_build_object(
      'session_id', cs.id,
      'widget_session_id', cs.widget_session_id,
      'started_at', cs.started_at,
      'is_multi_user', cs.is_multi_user
    ) AS current_session
    FROM chat_sessions cs
    WHERE cs.primary_user_id = p_user_id
    AND cs.ended_at IS NULL
    ORDER BY cs.started_at DESC
    LIMIT 1
  ),
  components AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'component_id', c.id,
        'name', c.name,
        'type', c.type,
        'last_used', cu.created_at
      ) ORDER BY cu.created_at DESC
    ) AS recent_components
    FROM component_usage cu
    JOIN components c ON cu.component_id = c.id
    WHERE cu.user_id = p_user_id
    AND cu.created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    LIMIT 10
  ),
  progress AS (
    SELECT jsonb_build_object(
      'tutorials_completed', COUNT(*) FILTER (WHERE completed = true),
      'tutorials_in_progress', COUNT(*) FILTER (WHERE completed = false),
      'total_watch_time', SUM(progress_seconds),
      'average_rating', AVG(rating)
    ) AS learning_progress
    FROM user_tutorial_progress
    WHERE user_id = p_user_id
  )
  SELECT 
    COALESCE(ui.user_data, '{}'::jsonb),
    COALESCE(p.preferences, '{}'::jsonb),
    COALESCE(per.personalization, '{}'::jsonb),
    COALESCE(s.current_session, '{}'::jsonb),
    COALESCE(c.recent_components, '[]'::jsonb),
    COALESCE(prog.learning_progress, '{}'::jsonb)
  FROM user_info ui
  CROSS JOIN prefs p
  CROSS JOIN personal per
  LEFT JOIN session s ON true
  LEFT JOIN components c ON true
  CROSS JOIN progress prog;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user personalization settings
CREATE OR REPLACE FUNCTION update_user_personalization(
  p_user_id UUID,
  p_personalize_enabled BOOLEAN DEFAULT NULL,
  p_inspirations TEXT DEFAULT NULL,
  p_digest_info TEXT DEFAULT NULL,
  p_write_style TEXT DEFAULT NULL,
  p_language_preference TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
  v_old_values JSONB;
  v_new_values JSONB;
BEGIN
  -- Check if personalization exists
  SELECT EXISTS(
    SELECT 1 FROM user_personalization WHERE user_id = p_user_id
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    -- Create new personalization
    INSERT INTO user_personalization (
      user_id,
      personalize_enabled,
      inspirations,
      digest_info,
      write_style,
      language_preference,
      timezone
    ) VALUES (
      p_user_id,
      COALESCE(p_personalize_enabled, true),
      p_inspirations,
      p_digest_info,
      p_write_style,
      COALESCE(p_language_preference, 'en'),
      COALESCE(p_timezone, 'UTC')
    );
  ELSE
    -- Get old values for audit
    SELECT jsonb_build_object(
      'personalize_enabled', personalize_enabled,
      'inspirations', inspirations,
      'digest_info', digest_info,
      'write_style', write_style,
      'language_preference', language_preference,
      'timezone', timezone
    ) INTO v_old_values
    FROM user_personalization
    WHERE user_id = p_user_id;
    
    -- Update existing personalization
    UPDATE user_personalization
    SET
      personalize_enabled = COALESCE(p_personalize_enabled, personalize_enabled),
      inspirations = COALESCE(p_inspirations, inspirations),
      digest_info = COALESCE(p_digest_info, digest_info),
      write_style = COALESCE(p_write_style, write_style),
      language_preference = COALESCE(p_language_preference, language_preference),
      timezone = COALESCE(p_timezone, timezone),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = p_user_id;
    
    -- Get new values for audit
    SELECT jsonb_build_object(
      'personalize_enabled', personalize_enabled,
      'inspirations', inspirations,
      'digest_info', digest_info,
      'write_style', write_style,
      'language_preference', language_preference,
      'timezone', timezone
    ) INTO v_new_values
    FROM user_personalization
    WHERE user_id = p_user_id;
  END IF;
  
  -- Log the update
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (
    p_user_id,
    'personalization.updated',
    'user_personalization',
    p_user_id,
    v_old_values,
    v_new_values
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update user preferences with versioning
CREATE OR REPLACE FUNCTION update_user_preferences(
  p_user_id UUID,
  p_skill_level TEXT DEFAULT NULL,
  p_design_style TEXT DEFAULT NULL,
  p_common_use_cases TEXT[] DEFAULT NULL,
  p_preferred_tutorial_length TEXT DEFAULT NULL,
  p_notifications JSONB DEFAULT NULL,
  p_theme TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_current_version INTEGER;
  v_new_version INTEGER;
BEGIN
  -- Get current version
  SELECT COALESCE(MAX(version), 0) INTO v_current_version
  FROM user_preferences
  WHERE user_id = p_user_id;
  
  v_new_version := v_current_version + 1;
  
  -- Mark current preferences as non-current
  UPDATE user_preferences
  SET is_current = false
  WHERE user_id = p_user_id
  AND is_current = true;
  
  -- Insert new version
  INSERT INTO user_preferences (
    user_id,
    version,
    skill_level,
    design_style,
    common_use_cases,
    preferred_tutorial_length,
    notifications,
    theme,
    is_current
  )
  SELECT
    p_user_id,
    v_new_version,
    COALESCE(p_skill_level, up.skill_level, 'beginner'),
    COALESCE(p_design_style, up.design_style, 'modern'),
    COALESCE(p_common_use_cases, up.common_use_cases, '{}'),
    COALESCE(p_preferred_tutorial_length, up.preferred_tutorial_length, 'any'),
    COALESCE(p_notifications, up.notifications, '{"email": true, "in_app": true, "weekly": true}'::jsonb),
    COALESCE(p_theme, up.theme, 'auto'),
    true
  FROM user_preferences up
  WHERE up.user_id = p_user_id
  AND up.version = v_current_version
  UNION ALL
  SELECT
    p_user_id,
    v_new_version,
    COALESCE(p_skill_level, 'beginner'),
    COALESCE(p_design_style, 'modern'),
    COALESCE(p_common_use_cases, '{}'),
    COALESCE(p_preferred_tutorial_length, 'any'),
    COALESCE(p_notifications, '{"email": true, "in_app": true, "weekly": true}'::jsonb),
    COALESCE(p_theme, 'auto'),
    true
  WHERE NOT EXISTS (
    SELECT 1 FROM user_preferences WHERE user_id = p_user_id
  )
  LIMIT 1;
  
  RETURN v_new_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find similar users for recommendations
CREATE OR REPLACE FUNCTION find_similar_users(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  similar_user_id UUID,
  similarity_score NUMERIC,
  common_attributes JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH user_profile AS (
    SELECT 
      up.skill_level,
      up.design_style,
      up.common_use_cases,
      upers.inspirations,
      upers.digest_info
    FROM user_preferences up
    LEFT JOIN user_personalization upers ON up.user_id = upers.user_id
    WHERE up.user_id = p_user_id
    AND up.is_current = true
  ),
  similarities AS (
    SELECT
      up2.user_id,
      -- Calculate similarity score based on matching attributes
      (
        CASE WHEN up2.skill_level = up.skill_level THEN 0.3 ELSE 0 END +
        CASE WHEN up2.design_style = up.design_style THEN 0.3 ELSE 0 END +
        CASE WHEN up2.common_use_cases && up.common_use_cases THEN 0.2 ELSE 0 END +
        CASE WHEN upers2.inspirations IS NOT NULL AND up.inspirations IS NOT NULL 
             AND similarity(upers2.inspirations, up.inspirations) > 0.3 THEN 0.2 
        ELSE 0 END
      ) AS similarity_score,
      jsonb_build_object(
        'skill_level', up2.skill_level = up.skill_level,
        'design_style', up2.design_style = up.design_style,
        'common_use_cases', up2.common_use_cases && up.common_use_cases,
        'has_similar_inspirations', 
          CASE WHEN upers2.inspirations IS NOT NULL AND up.inspirations IS NOT NULL 
               THEN similarity(upers2.inspirations, up.inspirations) > 0.3 
          ELSE false END
      ) AS common_attributes
    FROM user_preferences up2
    LEFT JOIN user_personalization upers2 ON up2.user_id = upers2.user_id
    CROSS JOIN user_profile up
    WHERE up2.user_id != p_user_id
    AND up2.is_current = true
  )
  SELECT 
    user_id AS similar_user_id,
    similarity_score,
    common_attributes
  FROM similarities
  WHERE similarity_score > 0.3
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user learning path recommendations
CREATE OR REPLACE FUNCTION get_learning_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
  tutorial_id UUID,
  title TEXT,
  skill_level TEXT,
  relevance_score NUMERIC,
  reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_data AS (
    SELECT 
      up.skill_level,
      up.common_use_cases,
      array_agg(DISTINCT t.tags ORDER BY t.tags) AS watched_tags
    FROM user_preferences up
    LEFT JOIN user_tutorial_progress utp ON up.user_id = utp.user_id
    LEFT JOIN tutorials t ON utp.tutorial_id = t.id
    WHERE up.user_id = p_user_id
    AND up.is_current = true
    GROUP BY up.skill_level, up.common_use_cases
  ),
  scored_tutorials AS (
    SELECT
      t.id,
      t.title,
      t.skill_level,
      -- Calculate relevance score
      (
        -- Skill level match
        CASE 
          WHEN t.skill_level = ud.skill_level THEN 0.4
          WHEN ud.skill_level = 'beginner' AND t.skill_level = 'intermediate' THEN 0.3
          WHEN ud.skill_level = 'intermediate' AND t.skill_level IN ('beginner', 'advanced') THEN 0.2
          ELSE 0.1
        END +
        -- Tag overlap
        CASE 
          WHEN t.tags && ud.watched_tags THEN 0.3
          ELSE 0
        END +
        -- Use case relevance
        CASE 
          WHEN array_to_string(ud.common_use_cases, ' ') ILIKE '%' || t.title || '%' THEN 0.2
          ELSE 0
        END +
        -- Popularity factor
        LEAST(t.views::numeric / 100000, 0.1)
      ) AS relevance_score,
      -- Generate reason
      CASE
        WHEN t.skill_level = ud.skill_level THEN 'Matches your skill level'
        WHEN t.tags && ud.watched_tags THEN 'Similar to tutorials you''ve watched'
        WHEN array_to_string(ud.common_use_cases, ' ') ILIKE '%' || t.title || '%' THEN 'Relates to your use cases'
        ELSE 'Popular tutorial'
      END AS reason
    FROM tutorials t
    CROSS JOIN user_data ud
    WHERE NOT EXISTS (
      -- Exclude already watched
      SELECT 1 FROM user_tutorial_progress utp
      WHERE utp.user_id = p_user_id
      AND utp.tutorial_id = t.id
      AND utp.completed = true
    )
  )
  SELECT 
    id AS tutorial_id,
    title,
    skill_level,
    relevance_score,
    reason
  FROM scored_tutorials
  WHERE relevance_score > 0.2
  ORDER BY relevance_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;