-- =====================================================
-- Analytics and Aggregation Functions
-- =====================================================

-- Calculate user engagement metrics
CREATE OR REPLACE FUNCTION calculate_user_engagement(
  p_user_id UUID,
  p_period_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_metrics JSONB;
BEGIN
  WITH base_metrics AS (
    SELECT
      -- Message metrics
      COUNT(DISTINCT cm.id) AS total_messages,
      COUNT(DISTINCT DATE(cm.created_at)) AS active_days,
      COUNT(DISTINCT cc.id) AS total_conversations,
      COUNT(DISTINCT cs.id) AS total_sessions,
      
      -- Time metrics
      AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.started_at))) AS avg_session_duration_seconds,
      SUM(EXTRACT(EPOCH FROM (cs.ended_at - cs.started_at))) AS total_session_time_seconds,
      
      -- AI usage
      COUNT(DISTINCT cm.provider) AS providers_used,
      SUM(cm.tokens_used) AS total_tokens,
      AVG(cm.response_time_ms) AS avg_response_time_ms,
      
      -- Component usage
      COUNT(DISTINCT cu.component_id) AS unique_components_used,
      COUNT(cu.id) AS total_component_uses,
      
      -- Tutorial engagement
      COUNT(DISTINCT utp.tutorial_id) AS tutorials_started,
      COUNT(DISTINCT CASE WHEN utp.completed THEN utp.tutorial_id END) AS tutorials_completed,
      AVG(utp.progress_seconds) AS avg_tutorial_time
      
    FROM users u
    LEFT JOIN chat_sessions cs ON u.id = cs.primary_user_id
      AND cs.started_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days)
    LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
    LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id AND cm.role = 'user'
    LEFT JOIN component_usage cu ON u.id = cu.user_id
      AND cu.created_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days)
    LEFT JOIN user_tutorial_progress utp ON u.id = utp.user_id
      AND utp.created_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days)
    WHERE u.id = p_user_id
    GROUP BY u.id
  ),
  engagement_score AS (
    SELECT
      -- Calculate engagement score (0-100)
      LEAST(100, GREATEST(0,
        (bm.active_days::numeric / p_period_days * 30) +  -- Daily activity (30%)
        (CASE 
          WHEN bm.total_messages > 0 THEN 
            LEAST(20, bm.total_messages::numeric / 10)    -- Message volume (20%)
          ELSE 0 
        END) +
        (CASE 
          WHEN bm.avg_session_duration_seconds > 0 THEN
            LEAST(20, bm.avg_session_duration_seconds / 300) -- Session length (20%)
          ELSE 0 
        END) +
        (CASE 
          WHEN bm.tutorials_completed > 0 THEN
            LEAST(15, bm.tutorials_completed * 5)         -- Tutorial completion (15%)
          ELSE 0 
        END) +
        (CASE 
          WHEN bm.unique_components_used > 0 THEN
            LEAST(15, bm.unique_components_used * 3)      -- Component diversity (15%)
          ELSE 0 
        END)
      )) AS score
    FROM base_metrics bm
  ),
  trends AS (
    -- Compare with previous period
    SELECT
      jsonb_build_object(
        'messages', (
          SELECT COUNT(*) FROM chat_messages cm
          JOIN chat_conversations cc ON cm.conversation_id = cc.id
          JOIN chat_sessions cs ON cc.session_id = cs.id
          WHERE cs.primary_user_id = p_user_id
          AND cm.created_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days)
          AND cm.created_at < CURRENT_TIMESTAMP - make_interval(days => p_period_days/2)
        ),
        'sessions', (
          SELECT COUNT(*) FROM chat_sessions
          WHERE primary_user_id = p_user_id
          AND started_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days)
          AND started_at < CURRENT_TIMESTAMP - make_interval(days => p_period_days/2)
        )
      ) AS previous_period,
      jsonb_build_object(
        'messages', (
          SELECT COUNT(*) FROM chat_messages cm
          JOIN chat_conversations cc ON cm.conversation_id = cc.id
          JOIN chat_sessions cs ON cc.session_id = cs.id
          WHERE cs.primary_user_id = p_user_id
          AND cm.created_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days/2)
        ),
        'sessions', (
          SELECT COUNT(*) FROM chat_sessions
          WHERE primary_user_id = p_user_id
          AND started_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days/2)
        )
      ) AS current_period
  )
  SELECT jsonb_build_object(
    'period_days', p_period_days,
    'engagement_score', es.score,
    'metrics', row_to_json(bm),
    'trends', t.current_period,
    'previous_period', t.previous_period,
    'calculated_at', CURRENT_TIMESTAMP
  ) INTO v_metrics
  FROM base_metrics bm
  CROSS JOIN engagement_score es
  CROSS JOIN trends t;
  
  RETURN v_metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggregate API usage by provider and model
CREATE OR REPLACE FUNCTION aggregate_api_usage(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  provider TEXT,
  model TEXT,
  request_count INTEGER,
  total_tokens INTEGER,
  total_cost_cents INTEGER,
  avg_response_time_ms NUMERIC,
  error_rate NUMERIC,
  user_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.provider,
    au.model,
    COUNT(*)::INTEGER AS request_count,
    SUM(au.tokens_input + au.tokens_output)::INTEGER AS total_tokens,
    SUM(au.cost_cents)::INTEGER AS total_cost_cents,
    AVG(au.duration_ms)::NUMERIC AS avg_response_time_ms,
    (COUNT(*) FILTER (WHERE au.error_message IS NOT NULL)::NUMERIC / COUNT(*)::NUMERIC * 100) AS error_rate,
    COUNT(DISTINCT au.user_id)::INTEGER AS user_count
  FROM api_usage au
  WHERE au.created_at::DATE BETWEEN p_start_date AND p_end_date
  AND (p_user_id IS NULL OR au.user_id = p_user_id)
  GROUP BY au.provider, au.model
  ORDER BY request_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get popular components with usage patterns
CREATE OR REPLACE FUNCTION get_popular_components(
  p_limit INTEGER DEFAULT 20,
  p_period_days INTEGER DEFAULT 30
) RETURNS TABLE (
  component_id UUID,
  name TEXT,
  type TEXT,
  category TEXT,
  usage_count BIGINT,
  unique_users INTEGER,
  avg_user_rating NUMERIC,
  usage_trend JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH usage_data AS (
    SELECT
      c.id,
      c.name,
      c.type,
      c.category,
      COUNT(cu.id) AS usage_count,
      COUNT(DISTINCT cu.user_id) AS unique_users,
      AVG(cm.rating) AS avg_rating
    FROM components c
    LEFT JOIN component_usage cu ON c.id = cu.component_id
      AND cu.created_at >= CURRENT_TIMESTAMP - make_interval(days => p_period_days)
    LEFT JOIN chat_messages cm ON cm.components @> jsonb_build_array(jsonb_build_object('id', c.id::text))
      AND cm.rating IS NOT NULL
    GROUP BY c.id, c.name, c.type, c.category
  ),
  usage_trend AS (
    SELECT
      cu.component_id,
      jsonb_agg(
        jsonb_build_object(
          'date', DATE(cu.created_at),
          'count', COUNT(*)
        ) ORDER BY DATE(cu.created_at)
      ) AS daily_usage
    FROM component_usage cu
    WHERE cu.created_at >= CURRENT_TIMESTAMP - make_interval(days => 7)
    GROUP BY cu.component_id
  )
  SELECT
    ud.id AS component_id,
    ud.name,
    ud.type,
    ud.category,
    ud.usage_count,
    ud.unique_users,
    ud.avg_rating AS avg_user_rating,
    COALESCE(ut.daily_usage, '[]'::jsonb) AS usage_trend
  FROM usage_data ud
  LEFT JOIN usage_trend ut ON ud.id = ut.component_id
  WHERE ud.usage_count > 0
  ORDER BY ud.usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Track user learning progress
CREATE OR REPLACE FUNCTION track_learning_progress(
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_progress JSONB;
BEGIN
  WITH skill_progression AS (
    -- Track skill level changes over time
    SELECT
      up.skill_level,
      up.created_at,
      LAG(up.skill_level) OVER (ORDER BY up.created_at) AS previous_level
    FROM user_preferences up
    WHERE up.user_id = p_user_id
    ORDER BY up.version
  ),
  tutorial_stats AS (
    SELECT
      COUNT(*) FILTER (WHERE completed) AS completed_count,
      COUNT(*) FILTER (WHERE NOT completed) AS in_progress_count,
      SUM(progress_seconds) / 3600.0 AS total_hours,
      AVG(rating) FILTER (WHERE rating IS NOT NULL) AS avg_rating,
      array_agg(DISTINCT t.skill_level) AS skill_levels_covered
    FROM user_tutorial_progress utp
    JOIN tutorials t ON utp.tutorial_id = t.id
    WHERE utp.user_id = p_user_id
  ),
  component_mastery AS (
    SELECT
      c.type,
      COUNT(DISTINCT cu.id) AS usage_count,
      COUNT(DISTINCT DATE(cu.created_at)) AS days_used,
      MAX(cu.created_at) AS last_used
    FROM component_usage cu
    JOIN components c ON cu.component_id = c.id
    WHERE cu.user_id = p_user_id
    GROUP BY c.type
  ),
  learning_velocity AS (
    -- Calculate learning speed
    SELECT
      COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days') AS tutorials_last_week,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') AS tutorials_last_month,
      AVG(CASE 
        WHEN completed THEN 
          EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400.0 
        ELSE NULL 
      END) AS avg_completion_days
    FROM user_tutorial_progress
    WHERE user_id = p_user_id
  ),
  achievements AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'type', achievement_type,
        'earned_at', earned_at,
        'details', details
      )
    ) AS list
    FROM (
      -- First tutorial completed
      SELECT 
        'first_tutorial' AS achievement_type,
        MIN(completed_at) AS earned_at,
        jsonb_build_object('tutorial_count', 1) AS details
      FROM user_tutorial_progress
      WHERE user_id = p_user_id AND completed = true
      HAVING MIN(completed_at) IS NOT NULL
      
      UNION ALL
      
      -- 10 tutorials milestone
      SELECT 
        'tutorial_milestone_10' AS achievement_type,
        MIN(completed_at) AS earned_at,
        jsonb_build_object('tutorial_count', 10) AS details
      FROM (
        SELECT completed_at, ROW_NUMBER() OVER (ORDER BY completed_at) AS rn
        FROM user_tutorial_progress
        WHERE user_id = p_user_id AND completed = true
      ) t
      WHERE rn = 10
      
      UNION ALL
      
      -- Component diversity
      SELECT 
        'component_explorer' AS achievement_type,
        MIN(created_at) AS earned_at,
        jsonb_build_object('component_types', 5) AS details
      FROM (
        SELECT cu.created_at, COUNT(DISTINCT c.type) OVER (ORDER BY cu.created_at) AS types
        FROM component_usage cu
        JOIN components c ON cu.component_id = c.id
        WHERE cu.user_id = p_user_id
      ) t
      WHERE types >= 5
    ) achievements
  )
  SELECT jsonb_build_object(
    'current_skill_level', (
      SELECT skill_level FROM user_preferences 
      WHERE user_id = p_user_id AND is_current = true
    ),
    'skill_progression', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'level', skill_level,
          'date', created_at::date
        ) ORDER BY created_at
      ) FROM skill_progression
    ),
    'tutorials', row_to_json(ts),
    'component_mastery', (
      SELECT jsonb_object_agg(type, jsonb_build_object(
        'usage_count', usage_count,
        'days_used', days_used,
        'last_used', last_used
      )) FROM component_mastery
    ),
    'learning_velocity', row_to_json(lv),
    'achievements', COALESCE(a.list, '[]'::jsonb),
    'next_recommendations', (
      SELECT jsonb_agg(row_to_json(r))
      FROM get_learning_recommendations(p_user_id, 3) r
    )
  ) INTO v_progress
  FROM tutorial_stats ts
  CROSS JOIN learning_velocity lv
  LEFT JOIN achievements a ON true;
  
  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cost analysis per user
CREATE OR REPLACE FUNCTION analyze_user_costs(
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_top_users INTEGER DEFAULT 10
) RETURNS TABLE (
  user_id UUID,
  email TEXT,
  total_cost_cents INTEGER,
  api_calls INTEGER,
  tokens_used INTEGER,
  cost_by_provider JSONB,
  daily_average_cents NUMERIC,
  is_premium BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH user_costs AS (
    SELECT
      u.id,
      u.email,
      SUM(au.cost_cents) AS total_cost_cents,
      COUNT(au.id) AS api_calls,
      SUM(au.tokens_input + au.tokens_output) AS tokens_used,
      jsonb_object_agg(
        au.provider, 
        jsonb_build_object(
          'cost_cents', SUM(au.cost_cents),
          'calls', COUNT(*),
          'tokens', SUM(au.tokens_input + au.tokens_output)
        )
      ) AS cost_by_provider,
      (p_end_date - p_start_date + 1) AS period_days
    FROM users u
    JOIN api_usage au ON u.id = au.user_id
    WHERE au.created_at::DATE BETWEEN p_start_date AND p_end_date
    GROUP BY u.id, u.email
  )
  SELECT
    uc.id AS user_id,
    uc.email,
    uc.total_cost_cents::INTEGER,
    uc.api_calls::INTEGER,
    uc.tokens_used::INTEGER,
    uc.cost_by_provider,
    (uc.total_cost_cents::NUMERIC / uc.period_days) AS daily_average_cents,
    EXISTS(
      SELECT 1 FROM user_preferences up 
      WHERE up.user_id = uc.id 
      AND up.is_current = true
    ) AS is_premium
  FROM user_costs uc
  ORDER BY uc.total_cost_cents DESC
  LIMIT p_top_users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate analytics dashboard data
CREATE OR REPLACE FUNCTION get_analytics_dashboard(
  p_period TEXT DEFAULT '30d' -- 24h, 7d, 30d, 90d
) RETURNS JSONB AS $$
DECLARE
  v_interval INTERVAL;
  v_dashboard JSONB;
BEGIN
  -- Parse period
  v_interval := CASE p_period
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
    WHEN '90d' THEN INTERVAL '90 days'
    ELSE INTERVAL '30 days'
  END;
  
  WITH overview AS (
    SELECT
      COUNT(DISTINCT u.id) AS total_users,
      COUNT(DISTINCT cs.id) AS total_sessions,
      COUNT(DISTINCT cm.id) AS total_messages,
      COUNT(DISTINCT cu.component_id) AS unique_components_used
    FROM users u
    LEFT JOIN chat_sessions cs ON u.id = cs.primary_user_id
      AND cs.started_at >= CURRENT_TIMESTAMP - v_interval
    LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
    LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
    LEFT JOIN component_usage cu ON cu.created_at >= CURRENT_TIMESTAMP - v_interval
  ),
  api_stats AS (
    SELECT
      COUNT(*) AS total_calls,
      SUM(tokens_input + tokens_output) AS total_tokens,
      SUM(cost_cents) AS total_cost_cents,
      AVG(duration_ms) AS avg_response_time,
      COUNT(DISTINCT provider) AS providers_used,
      COUNT(*) FILTER (WHERE error_message IS NOT NULL)::NUMERIC / COUNT(*)::NUMERIC * 100 AS error_rate
    FROM api_usage
    WHERE created_at >= CURRENT_TIMESTAMP - v_interval
  ),
  user_activity AS (
    SELECT
      DATE(cs.started_at) AS date,
      COUNT(DISTINCT cs.primary_user_id) AS active_users,
      COUNT(DISTINCT cs.id) AS sessions,
      COUNT(DISTINCT cm.id) AS messages
    FROM chat_sessions cs
    LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
    LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
    WHERE cs.started_at >= CURRENT_TIMESTAMP - v_interval
    GROUP BY DATE(cs.started_at)
    ORDER BY date
  ),
  top_components AS (
    SELECT jsonb_agg(row_to_json(pc) ORDER BY pc.usage_count DESC) AS list
    FROM get_popular_components(5, EXTRACT(DAY FROM v_interval)::INTEGER) pc
  ),
  provider_breakdown AS (
    SELECT jsonb_object_agg(
      provider,
      jsonb_build_object(
        'calls', request_count,
        'tokens', total_tokens,
        'cost_cents', total_cost_cents,
        'avg_response_ms', avg_response_time_ms
      )
    ) AS data
    FROM aggregate_api_usage(
      CURRENT_DATE - v_interval::INTERVAL,
      CURRENT_DATE
    )
  )
  SELECT jsonb_build_object(
    'period', p_period,
    'generated_at', CURRENT_TIMESTAMP,
    'overview', row_to_json(o),
    'api_stats', row_to_json(apis),
    'user_activity_timeline', (
      SELECT jsonb_agg(row_to_json(ua) ORDER BY ua.date)
      FROM user_activity ua
    ),
    'top_components', tc.list,
    'provider_breakdown', pb.data,
    'active_users_today', (
      SELECT COUNT(DISTINCT primary_user_id)
      FROM chat_sessions
      WHERE started_at >= CURRENT_DATE
    ),
    'new_users_period', (
      SELECT COUNT(*)
      FROM users
      WHERE created_at >= CURRENT_TIMESTAMP - v_interval
    )
  ) INTO v_dashboard
  FROM overview o
  CROSS JOIN api_stats apis
  CROSS JOIN top_components tc
  CROSS JOIN provider_breakdown pb;
  
  RETURN v_dashboard;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update aggregated analytics (for scheduled jobs)
CREATE OR REPLACE FUNCTION update_user_analytics_aggregates(
  p_date DATE DEFAULT CURRENT_DATE - 1
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert or update daily aggregates for each user
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
    tutorials_watched,
    average_session_duration_seconds,
    feature_usage
  )
  SELECT
    u.id AS user_id,
    p_date AS period_start,
    p_date AS period_end,
    COUNT(DISTINCT cm.id) AS total_messages,
    COUNT(DISTINCT cs.id) AS total_sessions,
    COUNT(DISTINCT au.id) AS total_api_calls,
    SUM(au.tokens_input + au.tokens_output) AS total_tokens_used,
    SUM(au.cost_cents) AS total_cost_cents,
    COUNT(DISTINCT cu.component_id) AS components_created,
    COUNT(DISTINCT utp.tutorial_id) AS tutorials_watched,
    AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.started_at)))::INTEGER AS average_session_duration_seconds,
    jsonb_build_object(
      'providers_used', array_agg(DISTINCT au.provider),
      'component_types', array_agg(DISTINCT c.type),
      'message_intents', array_agg(DISTINCT ia.detected_action)
    ) AS feature_usage
  FROM users u
  LEFT JOIN chat_sessions cs ON u.id = cs.primary_user_id
    AND DATE(cs.started_at) = p_date
  LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
  LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
    AND DATE(cm.created_at) = p_date
  LEFT JOIN api_usage au ON u.id = au.user_id
    AND DATE(au.created_at) = p_date
  LEFT JOIN component_usage cu ON u.id = cu.user_id
    AND DATE(cu.created_at) = p_date
  LEFT JOIN components c ON cu.component_id = c.id
  LEFT JOIN user_tutorial_progress utp ON u.id = utp.user_id
    AND DATE(utp.created_at) = p_date
  LEFT JOIN intent_analysis ia ON cm.id = ia.message_id
  GROUP BY u.id
  HAVING COUNT(DISTINCT cm.id) > 0 OR COUNT(DISTINCT cs.id) > 0
  ON CONFLICT (user_id, period_start, period_end) DO UPDATE
  SET
    total_messages = EXCLUDED.total_messages,
    total_sessions = EXCLUDED.total_sessions,
    total_api_calls = EXCLUDED.total_api_calls,
    total_tokens_used = EXCLUDED.total_tokens_used,
    total_cost_cents = EXCLUDED.total_cost_cents,
    components_created = EXCLUDED.components_created,
    tutorials_watched = EXCLUDED.tutorials_watched,
    average_session_duration_seconds = EXCLUDED.average_session_duration_seconds,
    feature_usage = EXCLUDED.feature_usage,
    created_at = CURRENT_TIMESTAMP;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Log the aggregation
  INSERT INTO audit_logs (action, resource_type, new_values)
  VALUES (
    'analytics.aggregated',
    'user_analytics',
    jsonb_build_object(
      'date', p_date,
      'users_processed', v_count
    )
  );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;