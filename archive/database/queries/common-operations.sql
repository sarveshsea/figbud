-- =====================================================
-- Common SQL Queries for FigBud Operations
-- =====================================================

-- =====================================================
-- USER QUERIES
-- =====================================================

-- Get user with full context including personalization
WITH user_full_context AS (
  SELECT 
    u.id,
    u.email,
    u.display_name,
    u.figma_user_id,
    u.created_at,
    u.last_seen_at,
    -- Current preferences
    jsonb_build_object(
      'skill_level', up.skill_level,
      'design_style', up.design_style,
      'common_use_cases', up.common_use_cases,
      'preferred_tutorial_length', up.preferred_tutorial_length,
      'notifications', up.notifications,
      'theme', up.theme
    ) AS preferences,
    -- Personalization settings
    jsonb_build_object(
      'personalize_enabled', upers.personalize_enabled,
      'inspirations', upers.inspirations,
      'digest_info', upers.digest_info,
      'write_style', upers.write_style,
      'language_preference', upers.language_preference,
      'timezone', upers.timezone
    ) AS personalization,
    -- Recent activity
    jsonb_build_object(
      'last_session', (
        SELECT jsonb_build_object(
          'id', cs.id,
          'started_at', cs.started_at,
          'message_count', COUNT(cm.id)
        )
        FROM chat_sessions cs
        LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
        LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
        WHERE cs.primary_user_id = u.id
        GROUP BY cs.id
        ORDER BY cs.started_at DESC
        LIMIT 1
      ),
      'component_usage_7d', (
        SELECT COUNT(*)
        FROM component_usage cu
        WHERE cu.user_id = u.id
        AND cu.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
      ),
      'tutorials_in_progress', (
        SELECT COUNT(*)
        FROM user_tutorial_progress utp
        WHERE utp.user_id = u.id
        AND NOT utp.completed
      )
    ) AS activity
  FROM users u
  LEFT JOIN user_preferences up ON u.id = up.user_id AND up.is_current = true
  LEFT JOIN user_personalization upers ON u.id = upers.user_id
  WHERE u.id = $1  -- Pass user_id as parameter
);

-- Find users with similar preferences and learning patterns
WITH target_user AS (
  SELECT 
    up.skill_level,
    up.design_style,
    up.common_use_cases,
    upers.inspirations,
    array_agg(DISTINCT c.type) AS used_components
  FROM users u
  JOIN user_preferences up ON u.id = up.user_id AND up.is_current = true
  LEFT JOIN user_personalization upers ON u.id = upers.user_id
  LEFT JOIN component_usage cu ON u.id = cu.user_id
  LEFT JOIN components c ON cu.component_id = c.id
  WHERE u.id = $1  -- Target user_id
  GROUP BY u.id, up.skill_level, up.design_style, up.common_use_cases, upers.inspirations
),
similar_users AS (
  SELECT
    u.id,
    u.email,
    u.display_name,
    up.skill_level,
    up.design_style,
    -- Calculate similarity score
    (
      CASE WHEN up.skill_level = tu.skill_level THEN 0.3 ELSE 0 END +
      CASE WHEN up.design_style = tu.design_style THEN 0.2 ELSE 0 END +
      CASE WHEN up.common_use_cases && tu.common_use_cases THEN 0.2 ELSE 0 END +
      CASE WHEN array_agg(DISTINCT c.type) && tu.used_components THEN 0.3 ELSE 0 END
    ) AS similarity_score,
    -- Shared attributes
    jsonb_build_object(
      'same_skill_level', up.skill_level = tu.skill_level,
      'same_design_style', up.design_style = tu.design_style,
      'common_use_cases', up.common_use_cases && tu.common_use_cases,
      'shared_components', array_agg(DISTINCT c.type) FILTER (WHERE c.type = ANY(tu.used_components))
    ) AS shared_attributes
  FROM users u
  JOIN user_preferences up ON u.id = up.user_id AND up.is_current = true
  LEFT JOIN component_usage cu ON u.id = cu.user_id
  LEFT JOIN components c ON cu.component_id = c.id
  CROSS JOIN target_user tu
  WHERE u.id != $1  -- Exclude target user
  GROUP BY u.id, u.email, u.display_name, up.skill_level, up.design_style, 
           up.common_use_cases, tu.skill_level, tu.design_style, tu.common_use_cases, tu.used_components
  HAVING (
    CASE WHEN up.skill_level = tu.skill_level THEN 0.3 ELSE 0 END +
    CASE WHEN up.design_style = tu.design_style THEN 0.2 ELSE 0 END +
    CASE WHEN up.common_use_cases && tu.common_use_cases THEN 0.2 ELSE 0 END +
    CASE WHEN array_agg(DISTINCT c.type) && tu.used_components THEN 0.3 ELSE 0 END
  ) > 0.3  -- Minimum similarity threshold
)
SELECT * FROM similar_users
ORDER BY similarity_score DESC
LIMIT 10;

-- Track user's learning journey
WITH learning_timeline AS (
  SELECT
    'preference_change' AS event_type,
    up.created_at AS event_time,
    jsonb_build_object(
      'version', up.version,
      'skill_level', up.skill_level,
      'design_style', up.design_style
    ) AS event_data
  FROM user_preferences up
  WHERE up.user_id = $1
  
  UNION ALL
  
  SELECT
    'tutorial_completed' AS event_type,
    utp.completed_at AS event_time,
    jsonb_build_object(
      'tutorial_id', t.id,
      'title', t.title,
      'skill_level', t.skill_level,
      'duration', t.duration,
      'rating', utp.rating
    ) AS event_data
  FROM user_tutorial_progress utp
  JOIN tutorials t ON utp.tutorial_id = t.id
  WHERE utp.user_id = $1
  AND utp.completed = true
  
  UNION ALL
  
  SELECT
    'component_mastered' AS event_type,
    MAX(cu.created_at) AS event_time,
    jsonb_build_object(
      'component_type', c.type,
      'usage_count', COUNT(*),
      'first_used', MIN(cu.created_at)
    ) AS event_data
  FROM component_usage cu
  JOIN components c ON cu.component_id = c.id
  WHERE cu.user_id = $1
  GROUP BY c.type
  HAVING COUNT(*) >= 5  -- Mastery threshold
)
SELECT 
  event_type,
  event_time,
  event_data,
  -- Add relative time
  age(CURRENT_TIMESTAMP, event_time) AS time_ago
FROM learning_timeline
ORDER BY event_time DESC
LIMIT 50;

-- =====================================================
-- ANALYTICS QUERIES
-- =====================================================

-- API usage breakdown with cost analysis
WITH api_metrics AS (
  SELECT
    DATE_TRUNC('day', au.created_at) AS day,
    au.provider,
    au.model,
    COUNT(*) AS requests,
    SUM(au.tokens_input + au.tokens_output) AS total_tokens,
    SUM(au.cost_cents) AS total_cost_cents,
    AVG(au.duration_ms) AS avg_duration_ms,
    COUNT(DISTINCT au.user_id) AS unique_users,
    COUNT(*) FILTER (WHERE au.error_message IS NOT NULL) AS errors
  FROM api_usage au
  WHERE au.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  GROUP BY DATE_TRUNC('day', au.created_at), au.provider, au.model
)
SELECT
  day,
  provider,
  model,
  requests,
  total_tokens,
  total_cost_cents,
  ROUND(total_cost_cents::numeric / 100, 2) AS total_cost_dollars,
  ROUND(avg_duration_ms::numeric, 2) AS avg_duration_ms,
  unique_users,
  errors,
  ROUND((errors::numeric / requests::numeric * 100), 2) AS error_rate_percent,
  -- Running totals
  SUM(total_cost_cents) OVER (PARTITION BY provider ORDER BY day) AS cumulative_cost_cents,
  SUM(requests) OVER (PARTITION BY provider ORDER BY day) AS cumulative_requests
FROM api_metrics
ORDER BY day DESC, total_cost_cents DESC;

-- Component usage patterns with user segments
WITH component_usage_patterns AS (
  SELECT
    c.type AS component_type,
    c.category,
    up.skill_level AS user_skill_level,
    up.design_style AS user_design_style,
    COUNT(DISTINCT cu.user_id) AS unique_users,
    COUNT(cu.id) AS total_uses,
    AVG(cm.rating) AS avg_rating,
    -- Time-based patterns
    jsonb_build_object(
      'morning', COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM cu.created_at) BETWEEN 6 AND 11),
      'afternoon', COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM cu.created_at) BETWEEN 12 AND 17),
      'evening', COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM cu.created_at) BETWEEN 18 AND 23),
      'night', COUNT(*) FILTER (WHERE EXTRACT(HOUR FROM cu.created_at) NOT BETWEEN 6 AND 23)
    ) AS usage_by_time,
    -- Weekly pattern
    jsonb_build_object(
      'weekday', COUNT(*) FILTER (WHERE EXTRACT(DOW FROM cu.created_at) BETWEEN 1 AND 5),
      'weekend', COUNT(*) FILTER (WHERE EXTRACT(DOW FROM cu.created_at) IN (0, 6))
    ) AS usage_by_day_type
  FROM component_usage cu
  JOIN components c ON cu.component_id = c.id
  JOIN users u ON cu.user_id = u.id
  JOIN user_preferences up ON u.id = up.user_id AND up.is_current = true
  LEFT JOIN chat_messages cm ON cm.components @> jsonb_build_array(jsonb_build_object('id', c.id::text))
  WHERE cu.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  GROUP BY c.type, c.category, up.skill_level, up.design_style
)
SELECT *
FROM component_usage_patterns
ORDER BY total_uses DESC;

-- User engagement over time
WITH daily_engagement AS (
  SELECT
    DATE(cs.started_at) AS day,
    COUNT(DISTINCT cs.primary_user_id) AS active_users,
    COUNT(DISTINCT cs.id) AS sessions,
    COUNT(DISTINCT cm.id) AS messages,
    AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.started_at))) AS avg_session_duration_seconds,
    COUNT(DISTINCT cu.component_id) AS unique_components_used,
    COUNT(DISTINCT utp.tutorial_id) AS tutorials_watched
  FROM chat_sessions cs
  LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
  LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
  LEFT JOIN component_usage cu ON DATE(cu.created_at) = DATE(cs.started_at)
  LEFT JOIN user_tutorial_progress utp ON DATE(utp.created_at) = DATE(cs.started_at)
  WHERE cs.started_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  GROUP BY DATE(cs.started_at)
),
moving_averages AS (
  SELECT
    day,
    active_users,
    sessions,
    messages,
    -- 7-day moving averages
    AVG(active_users) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS active_users_7d_ma,
    AVG(sessions) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS sessions_7d_ma,
    AVG(messages) OVER (ORDER BY day ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS messages_7d_ma,
    -- Week-over-week growth
    LAG(active_users, 7) OVER (ORDER BY day) AS active_users_prev_week,
    LAG(sessions, 7) OVER (ORDER BY day) AS sessions_prev_week
  FROM daily_engagement
)
SELECT
  day,
  active_users,
  sessions,
  messages,
  ROUND(active_users_7d_ma::numeric, 1) AS active_users_7d_ma,
  ROUND(sessions_7d_ma::numeric, 1) AS sessions_7d_ma,
  ROUND(messages_7d_ma::numeric, 1) AS messages_7d_ma,
  -- Growth rates
  CASE 
    WHEN active_users_prev_week > 0 THEN 
      ROUND(((active_users::numeric - active_users_prev_week) / active_users_prev_week * 100), 1)
    ELSE NULL 
  END AS active_users_wow_growth_percent,
  CASE 
    WHEN sessions_prev_week > 0 THEN 
      ROUND(((sessions::numeric - sessions_prev_week) / sessions_prev_week * 100), 1)
    ELSE NULL 
  END AS sessions_wow_growth_percent
FROM moving_averages
ORDER BY day DESC;

-- Cost optimization opportunities
WITH user_api_patterns AS (
  SELECT
    u.id AS user_id,
    u.email,
    up.skill_level,
    COUNT(DISTINCT au.provider) AS providers_used,
    COUNT(au.id) AS total_requests,
    SUM(au.cost_cents) AS total_cost_cents,
    AVG(au.cost_cents) AS avg_cost_per_request,
    jsonb_object_agg(
      au.provider,
      jsonb_build_object(
        'requests', COUNT(*),
        'cost_cents', SUM(au.cost_cents),
        'avg_tokens', AVG(au.tokens_input + au.tokens_output)
      )
    ) AS provider_breakdown,
    -- Identify expensive patterns
    COUNT(*) FILTER (WHERE au.tokens_input + au.tokens_output > 1000) AS high_token_requests,
    COUNT(*) FILTER (WHERE au.error_message IS NOT NULL) AS failed_requests
  FROM users u
  JOIN user_preferences up ON u.id = up.user_id AND up.is_current = true
  JOIN api_usage au ON u.id = au.user_id
  WHERE au.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  GROUP BY u.id, u.email, up.skill_level
),
optimization_suggestions AS (
  SELECT
    user_id,
    email,
    skill_level,
    total_cost_cents,
    ROUND(total_cost_cents::numeric / 100, 2) AS total_cost_dollars,
    -- Identify optimization opportunities
    CASE
      WHEN providers_used = 1 AND total_cost_cents > 1000 THEN 'Consider using multiple providers for cost optimization'
      WHEN high_token_requests::numeric / total_requests > 0.3 THEN 'Many requests use high token counts - consider prompt optimization'
      WHEN failed_requests::numeric / total_requests > 0.1 THEN 'High error rate - review error patterns'
      WHEN avg_cost_per_request > 50 THEN 'High average cost per request - review usage patterns'
      ELSE 'Usage patterns appear optimal'
    END AS optimization_suggestion,
    provider_breakdown
  FROM user_api_patterns
)
SELECT * FROM optimization_suggestions
WHERE total_cost_cents > 100  -- Focus on users with meaningful usage
ORDER BY total_cost_cents DESC
LIMIT 20;

-- =====================================================
-- MULTI-USER SESSION QUERIES
-- =====================================================

-- Get active multi-user sessions with participants
WITH active_sessions AS (
  SELECT
    cs.id AS session_id,
    cs.widget_session_id,
    cs.started_at,
    cs.figma_file_key,
    COUNT(DISTINCT sp.user_id) AS participant_count,
    jsonb_agg(
      jsonb_build_object(
        'user_id', u.id,
        'display_name', u.display_name,
        'role', sp.role,
        'joined_at', sp.joined_at,
        'is_primary', u.id = cs.primary_user_id
      ) ORDER BY sp.joined_at
    ) AS participants,
    COUNT(DISTINCT cm.id) AS total_messages,
    MAX(cm.created_at) AS last_message_at
  FROM chat_sessions cs
  JOIN session_participants sp ON cs.id = sp.session_id AND sp.is_active = true
  JOIN users u ON sp.user_id = u.id
  LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
  LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
  WHERE cs.is_multi_user = true
  AND cs.ended_at IS NULL
  GROUP BY cs.id, cs.widget_session_id, cs.started_at, cs.figma_file_key
)
SELECT *
FROM active_sessions
ORDER BY last_message_at DESC;

-- Session handoff patterns
WITH session_handoffs AS (
  SELECT
    cs.id AS session_id,
    jsonb_agg(
      jsonb_build_object(
        'timestamp', al.created_at,
        'from_user', al.old_values->>'previous_user_id',
        'to_user', al.new_values->>'new_user_id',
        'from_name', u1.display_name,
        'to_name', u2.display_name
      ) ORDER BY al.created_at
    ) AS handoffs,
    COUNT(*) AS handoff_count,
    MIN(al.created_at) AS first_handoff,
    MAX(al.created_at) AS last_handoff
  FROM chat_sessions cs
  JOIN audit_logs al ON al.resource_id = cs.id
    AND al.action = 'session.user_switched'
  LEFT JOIN users u1 ON (al.old_values->>'previous_user_id')::uuid = u1.id
  LEFT JOIN users u2 ON (al.new_values->>'new_user_id')::uuid = u2.id
  WHERE cs.is_multi_user = true
  GROUP BY cs.id
)
SELECT
  sh.*,
  cs.widget_session_id,
  cs.started_at AS session_started,
  cs.ended_at AS session_ended,
  EXTRACT(EPOCH FROM (sh.last_handoff - sh.first_handoff)) / 3600 AS handoff_span_hours
FROM session_handoffs sh
JOIN chat_sessions cs ON sh.session_id = cs.id
ORDER BY sh.handoff_count DESC;

-- =====================================================
-- PERSONALIZATION IMPACT QUERIES
-- =====================================================

-- Measure personalization effectiveness
WITH personalized_users AS (
  SELECT
    u.id AS user_id,
    upers.personalize_enabled,
    upers.inspirations IS NOT NULL AS has_inspirations,
    upers.digest_info IS NOT NULL AS has_digest_info,
    upers.write_style IS NOT NULL AS has_write_style,
    -- Calculate personalization score (0-4)
    (
      CASE WHEN upers.personalize_enabled THEN 1 ELSE 0 END +
      CASE WHEN upers.inspirations IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN upers.digest_info IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN upers.write_style IS NOT NULL THEN 1 ELSE 0 END
    ) AS personalization_score
  FROM users u
  JOIN user_personalization upers ON u.id = upers.user_id
),
user_metrics AS (
  SELECT
    pu.user_id,
    pu.personalization_score,
    COUNT(DISTINCT cs.id) AS sessions_30d,
    COUNT(DISTINCT cm.id) AS messages_30d,
    AVG(cm.rating) AS avg_message_rating,
    COUNT(DISTINCT DATE(cs.started_at)) AS active_days_30d,
    AVG(EXTRACT(EPOCH FROM (cs.ended_at - cs.started_at))) AS avg_session_duration
  FROM personalized_users pu
  LEFT JOIN chat_sessions cs ON pu.user_id = cs.primary_user_id
    AND cs.started_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  LEFT JOIN chat_conversations cc ON cs.id = cc.session_id
  LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
  GROUP BY pu.user_id, pu.personalization_score
)
SELECT
  personalization_score,
  COUNT(*) AS user_count,
  AVG(sessions_30d) AS avg_sessions,
  AVG(messages_30d) AS avg_messages,
  AVG(avg_message_rating) AS avg_satisfaction_rating,
  AVG(active_days_30d) AS avg_active_days,
  AVG(avg_session_duration) / 60 AS avg_session_minutes
FROM user_metrics
GROUP BY personalization_score
ORDER BY personalization_score;

-- =====================================================
-- COMPONENT RECOMMENDATION ENGINE
-- =====================================================

-- Get personalized component recommendations
WITH user_context AS (
  SELECT
    up.skill_level,
    up.design_style,
    up.common_use_cases,
    array_agg(DISTINCT c.type) AS used_component_types,
    array_agg(DISTINCT c.category) AS used_categories
  FROM users u
  JOIN user_preferences up ON u.id = up.user_id AND up.is_current = true
  LEFT JOIN component_usage cu ON u.id = cu.user_id
    AND cu.created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  LEFT JOIN components c ON cu.component_id = c.id
  WHERE u.id = $1  -- Target user
  GROUP BY up.skill_level, up.design_style, up.common_use_cases
),
component_scores AS (
  SELECT
    c.id,
    c.name,
    c.type,
    c.category,
    c.description,
    c.usage_count,
    -- Calculate relevance score
    (
      -- Category match
      CASE WHEN c.category = ANY(uc.used_categories) THEN 0.2 ELSE 0 END +
      -- Not yet used bonus
      CASE WHEN c.type != ALL(uc.used_component_types) THEN 0.3 ELSE 0 END +
      -- Design style compatibility (simplified)
      CASE 
        WHEN uc.design_style = 'minimal' AND c.name ILIKE '%minimal%' THEN 0.2
        WHEN uc.design_style = 'modern' AND c.name ILIKE '%modern%' THEN 0.2
        ELSE 0.1
      END +
      -- Popularity factor
      LEAST(c.usage_count::numeric / 1000, 0.2) +
      -- Use case relevance
      CASE WHEN array_to_string(uc.common_use_cases, ' ') ILIKE '%' || c.type || '%' THEN 0.1 ELSE 0 END
    ) AS relevance_score
  FROM components c
  CROSS JOIN user_context uc
  WHERE c.is_public = true
)
SELECT
  id,
  name,
  type,
  category,
  description,
  usage_count,
  relevance_score,
  -- Recommendation reason
  CASE
    WHEN relevance_score >= 0.7 THEN 'Highly recommended based on your profile'
    WHEN relevance_score >= 0.5 THEN 'Recommended for your skill level'
    WHEN relevance_score >= 0.3 THEN 'Popular with similar users'
    ELSE 'Trending component'
  END AS recommendation_reason
FROM component_scores
WHERE relevance_score > 0.2
ORDER BY relevance_score DESC, usage_count DESC
LIMIT 10;