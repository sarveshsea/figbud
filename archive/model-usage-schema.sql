-- Create table for tracking AI model usage
CREATE TABLE IF NOT EXISTS model_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  model_name VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_model_usage_timestamp ON model_usage(timestamp DESC);
CREATE INDEX idx_model_usage_model ON model_usage(model_name);
CREATE INDEX idx_model_usage_success ON model_usage(success);

-- Create a view for daily statistics
CREATE VIEW daily_model_stats AS
SELECT 
  DATE(timestamp) as date,
  model_name,
  provider,
  COUNT(*) as total_requests,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
  SUM(tokens_used) as total_tokens,
  SUM(cost_cents) / 100.0 as total_cost_dollars,
  AVG(tokens_used) as avg_tokens_per_request
FROM model_usage
GROUP BY DATE(timestamp), model_name, provider
ORDER BY date DESC, total_requests DESC;

-- Create a view for model performance
CREATE VIEW model_performance AS
SELECT 
  model_name,
  provider,
  COUNT(*) as total_attempts,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_attempts,
  ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
  SUM(cost_cents) / 100.0 as total_cost,
  AVG(tokens_used) as avg_tokens,
  MAX(timestamp) as last_used
FROM model_usage
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY model_name, provider
ORDER BY success_rate DESC, total_attempts DESC;