-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  figma_user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{
    "skillLevel": "beginner",
    "designStyle": "modern",
    "commonUseCases": [],
    "preferredTutorialLength": "any",
    "notifications": {
      "email": true,
      "inApp": true,
      "weekly": true
    },
    "theme": "auto"
  }'::jsonb,
  subscription JSONB DEFAULT '{
    "tier": "free",
    "status": "active",
    "features": {
      "apiCallsPerMonth": 100,
      "customTemplates": false,
      "prioritySupport": false,
      "advancedTutorials": false,
      "teamCollaboration": false
    }
  }'::jsonb
);

-- Create once_ui_components table
CREATE TABLE IF NOT EXISTS once_ui_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  figma_code TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  example_usage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create api_calls table
CREATE TABLE IF NOT EXISTS api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_payload JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create api_cache table
CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create component_usage table
CREATE TABLE IF NOT EXISTS component_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  component_id UUID REFERENCES once_ui_components(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  context JSONB DEFAULT '{}'
);

-- Create tutorials table
CREATE TABLE IF NOT EXISTS tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty VARCHAR(50),
  duration INTEGER,
  content JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample Once UI components
INSERT INTO once_ui_components (name, category, figma_code, properties, example_usage) VALUES
('Button', 'basic', 'const button = figma.createFrame();
button.resize(120, 48);
button.cornerRadius = 8;
button.fills = [{type: ''SOLID'', color: {r: 0.388, g: 0.4, b: 0.965}}];
button.layoutMode = ''HORIZONTAL'';
button.paddingLeft = 24;
button.paddingRight = 24;
button.paddingTop = 12;
button.paddingBottom = 12;
button.primaryAxisAlignItems = ''CENTER'';
button.counterAxisAlignItems = ''CENTER'';

const text = figma.createText();
text.characters = "Click me";
text.fontSize = 16;
text.fontName = {family: "Inter", style: "Medium"};
text.fills = [{type: ''SOLID'', color: {r: 1, g: 1, b: 1}}];

button.appendChild(text);', 
'{"variant": ["primary", "secondary", "tertiary"], "size": ["s", "m", "l"], "fillWidth": "boolean"}', 
'<Button variant="primary" size="m">Click me</Button>'),

('Card', 'layout', 'const card = figma.createFrame();
card.resize(320, 200);
card.cornerRadius = 16;
card.fills = [{type: ''SOLID'', color: {r: 1, g: 1, b: 1}}];
card.layoutMode = ''VERTICAL'';
card.padding = 24;
card.itemSpacing = 16;', 
'{"padding": ["s", "m", "l", "xl"], "radius": ["s", "m", "l", "xl"], "align": ["start", "center", "end"]}', 
'<Card padding="l" radius="m">Content</Card>'),

('Input', 'form', 'const input = figma.createFrame();
input.resize(320, 48);
input.cornerRadius = 8;
input.strokeWeight = 1;
input.strokes = [{type: ''SOLID'', color: {r: 0.8, g: 0.8, b: 0.8}}];
input.fills = [{type: ''SOLID'', color: {r: 1, g: 1, b: 1}}];
input.paddingLeft = 16;
input.paddingRight = 16;', 
'{"type": ["text", "email", "password", "number"], "label": "string", "placeholder": "string", "disabled": "boolean"}', 
'<Input label="Email" type="email" placeholder="Enter email" />'),

('Badge', 'basic', 'const badge = figma.createFrame();
badge.cornerRadius = 999;
badge.fills = [{type: ''SOLID'', color: {r: 0.9, g: 0.9, b: 0.95}}];
badge.layoutMode = ''HORIZONTAL'';
badge.paddingLeft = 12;
badge.paddingRight = 12;
badge.paddingTop = 4;
badge.paddingBottom = 4;
badge.primaryAxisAlignItems = ''CENTER'';
badge.counterAxisAlignItems = ''CENTER'';',
'{"color": ["neutral", "brand", "warning", "danger", "success", "info"], "size": ["s", "m"]}',
'<Badge color="brand">New</Badge>'),

('Flex', 'layout', 'const flex = figma.createFrame();
flex.layoutMode = ''HORIZONTAL'';
flex.primaryAxisAlignItems = ''CENTER'';
flex.counterAxisAlignItems = ''CENTER'';
flex.itemSpacing = 16;',
'{"direction": ["row", "column"], "gap": ["xs", "s", "m", "l", "xl"], "horizontal": ["start", "center", "end", "space-between"], "vertical": ["start", "center", "end"]}',
'<Flex direction="row" gap="m" horizontal="center">Content</Flex>');

-- Insert sample tutorials
INSERT INTO tutorials (title, description, category, difficulty, duration, content) VALUES
('Getting Started with Once UI', 'Learn the basics of Once UI design system', 'basics', 'beginner', 10, 
'{"steps": ["Install Once UI components", "Import required components", "Use theme variables", "Build your first component"]}'),

('Building Responsive Layouts', 'Create responsive designs with Flex and Grid', 'layout', 'intermediate', 20,
'{"steps": ["Understanding Flex component", "Grid system basics", "Responsive breakpoints", "Mobile-first approach"]}'),

('Form Design Best Practices', 'Create accessible and user-friendly forms', 'forms', 'intermediate', 15,
'{"steps": ["Input field states", "Validation patterns", "Error handling", "Accessibility guidelines"]}');

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE once_ui_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for demo purposes)
CREATE POLICY "Public read access to components" ON once_ui_components FOR SELECT USING (true);
CREATE POLICY "Public read access to tutorials" ON tutorials FOR SELECT USING (true);
CREATE POLICY "Public insert access to users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text OR true); -- For demo, allow all