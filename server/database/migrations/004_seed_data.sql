-- Seed data for FigBud database

-- Insert sample users
INSERT INTO users (email, password_hash, figma_user_id) VALUES
('demo@figbud.com', '$2b$10$K6L8VF.Qg7YJpR6KQxLpR.6/8CgO9fYqPSfcGqGwM9Ov5kVtLrW9K', 'figma_demo_001'),
('premium@figbud.com', '$2b$10$K6L8VF.Qg7YJpR6KQxLpR.6/8CgO9fYqPSfcGqGwM9Ov5kVtLrW9K', 'figma_premium_001'),
('test@figbud.com', '$2b$10$K6L8VF.Qg7YJpR6KQxLpR.6/8CgO9fYqPSfcGqGwM9Ov5kVtLrW9K', 'figma_test_001')
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for reference
DO $$
DECLARE
  demo_user_id UUID;
  premium_user_id UUID;
  test_user_id UUID;
BEGIN
  SELECT id INTO demo_user_id FROM users WHERE email = 'demo@figbud.com';
  SELECT id INTO premium_user_id FROM users WHERE email = 'premium@figbud.com';
  SELECT id INTO test_user_id FROM users WHERE email = 'test@figbud.com';

  -- Insert user subscriptions
  INSERT INTO user_subscriptions (user_id, tier, status, stripe_customer_id, stripe_subscription_id) VALUES
  (demo_user_id, 'free', 'active', NULL, NULL),
  (premium_user_id, 'premium', 'active', 'cus_premium_test', 'sub_premium_test'),
  (test_user_id, 'free', 'active', NULL, NULL)
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert user preferences
  INSERT INTO user_preferences (user_id, skill_level, design_style, common_use_cases, preferred_tutorial_length) VALUES
  (demo_user_id, 'beginner', 'modern', '{"web design", "mobile apps"}', 'short'),
  (premium_user_id, 'advanced', 'minimalist', '{"design systems", "prototypes"}', 'any'),
  (test_user_id, 'intermediate', 'playful', '{"illustrations", "social media"}', 'medium')
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert user analytics
  INSERT INTO user_analytics (user_id, feature_usage, tutorials_watched, components_created, skill_scores, badges_earned) VALUES
  (demo_user_id, 
   '{"chat": 25, "sandbox": 10, "tutorials": 15}', 
   '["intro-to-figma", "component-basics"]', 
   '["button", "card"]',
   '{"design": 65, "prototyping": 45, "components": 70}',
   '["first_component", "tutorial_completed"]'),
  (premium_user_id, 
   '{"chat": 150, "sandbox": 75, "tutorials": 50}', 
   '["advanced-prototyping", "design-systems", "micro-interactions"]', 
   '["button", "card", "input", "modal", "navigation"]',
   '{"design": 95, "prototyping": 90, "components": 98}',
   '["power_user", "component_master", "design_system_pro"]'),
  (test_user_id, 
   '{"chat": 50, "sandbox": 20, "tutorials": 30}', 
   '["responsive-design", "color-theory"]', 
   '["button", "card", "badge"]',
   '{"design": 75, "prototyping": 60, "components": 80}',
   '["fast_learner", "creative_explorer"]')
  ON CONFLICT (user_id) DO NOTHING;

END $$;

-- Insert sample tutorials (cached YouTube data)
INSERT INTO tutorials (
  video_id, title, channel_name, description, thumbnail_url, 
  duration, view_count, skill_level, tags, category, rating
) VALUES
('dQw4w9WgXcQ', 'Figma Basics: Complete Beginner Guide', 'Design Academy', 
 'Learn Figma from scratch with this comprehensive guide for beginners', 
 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
 1200, 150000, 'beginner', '{"figma basics", "tutorial", "getting started"}', 
 'introduction', 4.8),

('FREPsMfBwJg', 'Advanced Auto Layout in Figma', 'UI Design Master', 
 'Master Figma Auto Layout with advanced techniques and best practices', 
 'https://i.ytimg.com/vi/FREPsMfBwJg/maxresdefault.jpg',
 2400, 75000, 'advanced', '{"auto layout", "responsive design", "advanced"}', 
 'layout', 4.9),

('UqjZx4K8Uz8', 'Creating a Design System in Figma', 'System Design Pro', 
 'Build a complete design system from scratch including components and tokens', 
 'https://i.ytimg.com/vi/UqjZx4K8Uz8/maxresdefault.jpg',
 3600, 120000, 'intermediate', '{"design system", "components", "tokens"}', 
 'systems', 4.7),

('Hzp3j8WRVvs', 'Mobile App Design in Figma', 'Mobile Design Hub', 
 'Design a complete mobile app from wireframes to high-fidelity mockups', 
 'https://i.ytimg.com/vi/Hzp3j8WRVvs/maxresdefault.jpg',
 4200, 200000, 'intermediate', '{"mobile design", "app design", "ui design"}', 
 'mobile', 4.6),

('YkPpRDL5WNs', 'Figma Prototyping Masterclass', 'Interactive Design', 
 'Create advanced interactive prototypes with smart animate and variants', 
 'https://i.ytimg.com/vi/YkPpRDL5WNs/maxresdefault.jpg',
 3000, 90000, 'advanced', '{"prototyping", "interactions", "animation"}', 
 'prototyping', 4.8)
ON CONFLICT (video_id) DO NOTHING;

-- Insert tutorial timestamps
INSERT INTO tutorial_timestamps (tutorial_id, timestamp, topic, description) 
SELECT 
  t.id,
  ts.timestamp,
  ts.topic,
  ts.description
FROM tutorials t
CROSS JOIN LATERAL (
  VALUES 
    (0, 'Introduction', 'Course overview and what you will learn'),
    (120, 'Interface Tour', 'Getting familiar with Figma interface'),
    (300, 'Basic Shapes', 'Working with rectangles, circles, and other shapes'),
    (600, 'Text and Typography', 'Adding and styling text in your designs'),
    (900, 'Components', 'Creating and using reusable components')
) AS ts(timestamp, topic, description)
WHERE t.title LIKE '%Beginner Guide%'
ON CONFLICT DO NOTHING;

-- Insert demo templates
INSERT INTO demo_templates (
  name, description, category, thumbnail_url, figma_file_url, 
  tags, is_premium, usage_count, rating
) VALUES
('E-commerce Landing Page', 
 'Modern e-commerce homepage with hero section, product grid, and CTA sections',
 'ecommerce', 'https://example.com/ecommerce-thumb.jpg',
 'https://www.figma.com/file/abc123/ecommerce-template',
 '{"landing page", "ecommerce", "marketing"}', false, 1250, 4.7),

('Mobile Banking App', 
 'Complete mobile banking app UI kit with 50+ screens',
 'mobile app', 'https://example.com/banking-thumb.jpg',
 'https://www.figma.com/file/def456/banking-app',
 '{"mobile", "fintech", "app design"}', true, 850, 4.9),

('SaaS Dashboard', 
 'Analytics dashboard template with charts, tables, and data visualization',
 'dashboard', 'https://example.com/dashboard-thumb.jpg',
 'https://www.figma.com/file/ghi789/saas-dashboard',
 '{"dashboard", "analytics", "saas"}', true, 920, 4.8),

('Design System Starter', 
 'Foundation for building your own design system with basic components',
 'design system', 'https://example.com/design-system-thumb.jpg',
 'https://www.figma.com/file/jkl012/design-system',
 '{"design system", "components", "ui kit"}', false, 2100, 4.6),

('Social Media Kit', 
 'Templates for Instagram posts, stories, and social media graphics',
 'marketing', 'https://example.com/social-thumb.jpg',
 'https://www.figma.com/file/mno345/social-media',
 '{"social media", "instagram", "marketing"}', false, 1650, 4.5)
ON CONFLICT (name) DO NOTHING;

-- Insert sample chat history
DO $$
DECLARE
  demo_user_id UUID;
BEGIN
  SELECT id INTO demo_user_id FROM users WHERE email = 'demo@figbud.com';

  INSERT INTO chat_history (user_id, message, response, context, metadata) VALUES
  (demo_user_id, 
   'How do I create a button component?',
   'To create a button component in Figma, follow these steps: 1) Create a frame with Auto Layout, 2) Add padding for spacing, 3) Insert text for the label, 4) Apply fills and corner radius for styling, 5) Convert to component using Ctrl/Cmd + Alt + K',
   '{"page": "Design System", "selection": []}',
   '{"intent": "component_creation", "suggested_tutorials": ["component-basics"]}'),
   
  (demo_user_id, 
   'Show me tutorials about prototyping',
   'Here are some great prototyping tutorials I found for you...',
   '{"page": "Prototypes", "selection": []}',
   '{"intent": "tutorial_search", "tutorials_shown": 3}'),
   
  (demo_user_id, 
   'Can you help me with Auto Layout?',
   'Auto Layout is a powerful feature in Figma that helps create responsive designs. Let me guide you through the basics...',
   '{"page": "Homepage", "selection": ["frame_123"]}',
   '{"intent": "feature_help", "topic": "auto_layout"}')
  ON CONFLICT DO NOTHING;
END $$;

-- Create some API cache entries
INSERT INTO api_cache (cache_key, response_data, provider, expires_at) VALUES
('openai:button_component_guide', 
 '{"text": "Creating button components involves several key steps...", "metadata": {"components": ["button"], "difficulty": "beginner"}}',
 'openai', NOW() + INTERVAL '24 hours'),
 
('openai:design_system_basics',
 '{"text": "A design system is a collection of reusable components...", "metadata": {"topics": ["design systems", "components", "tokens"]}}',
 'openai', NOW() + INTERVAL '24 hours'),
 
('youtube:figma_tutorials_beginner',
 '{"tutorials": [{"id": "abc123", "title": "Figma for Beginners"}, {"id": "def456", "title": "Getting Started with Figma"}]}',
 'youtube', NOW() + INTERVAL '7 days')
ON CONFLICT (cache_key) DO NOTHING;