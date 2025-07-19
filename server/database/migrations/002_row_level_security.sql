-- Enable Row Level Security for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorial_timestamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Service role can manage all users
CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- User subscriptions policies
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_subscriptions.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_preferences.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Users can update own preferences" ON user_preferences
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_preferences.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Service role can manage preferences" ON user_preferences
    FOR ALL USING (auth.role() = 'service_role');

-- User analytics policies
CREATE POLICY "Users can view own analytics" ON user_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = user_analytics.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Service role can manage analytics" ON user_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Sessions policies
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = sessions.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Service role can manage sessions" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

-- Tutorials policies (public read for cached tutorials)
CREATE POLICY "Anyone can view cached tutorials" ON tutorials
    FOR SELECT USING (cached = true);

CREATE POLICY "Service role can manage tutorials" ON tutorials
    FOR ALL USING (auth.role() = 'service_role');

-- Tutorial timestamps policies
CREATE POLICY "Anyone can view tutorial timestamps" ON tutorial_timestamps
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tutorials 
            WHERE tutorials.id = tutorial_timestamps.tutorial_id 
            AND tutorials.cached = true
        )
    );

CREATE POLICY "Service role can manage timestamps" ON tutorial_timestamps
    FOR ALL USING (auth.role() = 'service_role');

-- Demo templates policies (public read)
CREATE POLICY "Anyone can view demo templates" ON demo_templates
    FOR SELECT USING (true);

CREATE POLICY "Service role can manage templates" ON demo_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Chat history policies
CREATE POLICY "Users can view own chat history" ON chat_history
    FOR SELECT USING (
        user_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = chat_history.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Users can insert own chat history" ON chat_history
    FOR INSERT WITH CHECK (
        user_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = chat_history.user_id 
            AND auth.uid()::text = users.id::text
        )
    );

CREATE POLICY "Service role can manage chat history" ON chat_history
    FOR ALL USING (auth.role() = 'service_role');

-- Additional policy for anonymous access to certain operations
-- This allows the application to perform operations without auth for public features
CREATE POLICY "Anonymous can insert chat history" ON chat_history
    FOR INSERT WITH CHECK (user_id IS NULL);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON user_preferences TO authenticated;
GRANT INSERT ON chat_history TO authenticated;

-- Grant permissions to anonymous users for public features
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON tutorials, tutorial_timestamps, demo_templates TO anon;
GRANT INSERT ON chat_history TO anon;