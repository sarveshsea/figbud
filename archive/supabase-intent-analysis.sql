-- FigBud Intent Analysis Schema
-- This schema stores parsed intents and keywords from user messages

-- Intent analysis table
CREATE TABLE IF NOT EXISTS intent_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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
);

-- Keyword frequency table for analytics
CREATE TABLE IF NOT EXISTS keyword_frequency (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword VARCHAR(100) NOT NULL UNIQUE,
  frequency INTEGER DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  associated_components TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Component request analytics
CREATE TABLE IF NOT EXISTS component_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  component_type VARCHAR(50) NOT NULL,
  context JSONB,
  fulfilled BOOLEAN DEFAULT false,
  fulfillment_method VARCHAR(50), -- 'generated', 'template', 'tutorial'
  confidence DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Model usage tracking (for smart AI provider)
CREATE TABLE IF NOT EXISTS model_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  success BOOLEAN DEFAULT true,
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  response_time_ms INTEGER,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_intent_analysis_user_id ON intent_analysis(user_id);
CREATE INDEX idx_intent_analysis_created ON intent_analysis(created_at);
CREATE INDEX idx_intent_analysis_action ON intent_analysis(detected_action);
CREATE INDEX idx_intent_analysis_components ON intent_analysis USING GIN(component_types);
CREATE INDEX idx_intent_analysis_keywords ON intent_analysis USING GIN(keywords);

CREATE INDEX idx_keyword_frequency_keyword ON keyword_frequency(keyword);
CREATE INDEX idx_keyword_frequency_frequency ON keyword_frequency(frequency DESC);

CREATE INDEX idx_component_requests_user_id ON component_requests(user_id);
CREATE INDEX idx_component_requests_type ON component_requests(component_type);
CREATE INDEX idx_component_requests_created ON component_requests(created_at);

CREATE INDEX idx_model_usage_provider ON model_usage(provider, model_name);
CREATE INDEX idx_model_usage_timestamp ON model_usage(timestamp);
CREATE INDEX idx_model_usage_success ON model_usage(success);

-- Function to update keyword frequency
CREATE OR REPLACE FUNCTION update_keyword_frequency(
  p_keywords TEXT[],
  p_components TEXT[]
) RETURNS VOID AS $$
DECLARE
  keyword TEXT;
BEGIN
  FOREACH keyword IN ARRAY p_keywords
  LOOP
    INSERT INTO keyword_frequency (keyword, frequency, associated_components)
    VALUES (keyword, 1, p_components)
    ON CONFLICT (keyword) DO UPDATE
    SET 
      frequency = keyword_frequency.frequency + 1,
      last_seen = CURRENT_TIMESTAMP,
      associated_components = array_cat(
        keyword_frequency.associated_components,
        EXCLUDED.associated_components
      ),
      updated_at = CURRENT_TIMESTAMP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending keywords
CREATE OR REPLACE FUNCTION get_trending_keywords(
  p_limit INTEGER DEFAULT 10,
  p_days INTEGER DEFAULT 7
) RETURNS TABLE(
  keyword VARCHAR(100),
  frequency INTEGER,
  recent_uses INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kf.keyword,
    kf.frequency,
    COUNT(ia.id)::INTEGER as recent_uses
  FROM keyword_frequency kf
  LEFT JOIN intent_analysis ia ON kf.keyword = ANY(ia.keywords)
    AND ia.created_at > CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days
  GROUP BY kf.keyword, kf.frequency
  ORDER BY recent_uses DESC, kf.frequency DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE intent_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_frequency ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_usage ENABLE ROW LEVEL SECURITY;

-- Policies for intent_analysis
CREATE POLICY "Users can view own intent analysis" ON intent_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert intent analysis" ON intent_analysis
  FOR INSERT WITH CHECK (true);

-- Policies for keyword_frequency (public read)
CREATE POLICY "Public read access to keyword frequency" ON keyword_frequency
  FOR SELECT USING (true);

-- Policies for component_requests
CREATE POLICY "Users can view own component requests" ON component_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert component requests" ON component_requests
  FOR INSERT WITH CHECK (true);

-- Policies for model_usage (admin only)
CREATE POLICY "Admin read access to model usage" ON model_usage
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger to update keyword frequency
CREATE OR REPLACE FUNCTION trigger_update_keyword_frequency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.keywords IS NOT NULL AND array_length(NEW.keywords, 1) > 0 THEN
    PERFORM update_keyword_frequency(NEW.keywords, NEW.component_types);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_keyword_freq_on_intent
  AFTER INSERT ON intent_analysis
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_keyword_frequency();

-- Function to increment component usage in figma_components
CREATE OR REPLACE FUNCTION increment_component_usage(component_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE figma_components
  SET usage_count = usage_count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = component_id;
END;
$$ LANGUAGE plpgsql;