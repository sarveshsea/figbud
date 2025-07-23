-- Create Once UI components library table
CREATE TABLE IF NOT EXISTS once_ui_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- button, input, card, navigation, etc.
  component_type VARCHAR(50) NOT NULL, -- basic, form, layout, data, feedback
  description TEXT,
  figma_code TEXT NOT NULL, -- Figma API code to create the component
  properties JSONB DEFAULT '{}', -- Component properties and variants
  usage_example TEXT,
  design_tokens JSONB DEFAULT '{}', -- Colors, spacing, typography tokens
  difficulty VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced
  tags TEXT[] DEFAULT '{}',
  preview_image_url TEXT,
  documentation_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast lookup
CREATE INDEX idx_once_ui_components_category ON once_ui_components(category);
CREATE INDEX idx_once_ui_components_type ON once_ui_components(component_type);
CREATE INDEX idx_once_ui_components_difficulty ON once_ui_components(difficulty);
CREATE INDEX idx_once_ui_components_tags ON once_ui_components USING GIN(tags);

-- Create API optimization tables
CREATE TABLE IF NOT EXISTS api_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  provider VARCHAR(50), -- openai, openrouter, deepseek
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  response_data JSONB NOT NULL,
  provider VARCHAR(50),
  expires_at TIMESTAMPTZ NOT NULL,
  hit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS component_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  component_id UUID REFERENCES once_ui_components(id) ON DELETE CASCADE,
  template_id VARCHAR(100),
  step_id VARCHAR(100),
  completed BOOLEAN DEFAULT FALSE,
  figma_node_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for API optimization
CREATE INDEX idx_api_calls_user_id ON api_calls(user_id);
CREATE INDEX idx_api_calls_endpoint ON api_calls(endpoint);
CREATE INDEX idx_api_calls_created_at ON api_calls(created_at);
CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
CREATE INDEX idx_component_usage_user ON component_usage(user_id);
CREATE INDEX idx_component_usage_component ON component_usage(component_id);

-- Update trigger for once_ui_components
CREATE TRIGGER update_once_ui_components_updated_at
  BEFORE UPDATE ON once_ui_components
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert Once UI component templates
INSERT INTO once_ui_components (name, category, component_type, description, figma_code, properties, difficulty, tags) VALUES
-- Button Component
('Button', 'button', 'basic', 'A versatile button component with multiple variants and states', 
'const button = figma.createFrame();
button.name = "Button";
button.resize(120, 40);
button.cornerRadius = 8;
button.layoutMode = "HORIZONTAL";
button.primaryAxisAlignItems = "CENTER";
button.counterAxisAlignItems = "CENTER";
button.paddingLeft = 16;
button.paddingRight = 16;
button.paddingTop = 8;
button.paddingBottom = 8;
button.fills = [{type: "SOLID", color: {r: 0.388, g: 0.4, b: 0.965}}];

const text = figma.createText();
text.characters = "Button";
text.fontSize = 14;
text.fontName = {family: "Inter", style: "Medium"};
text.fills = [{type: "SOLID", color: {r: 1, g: 1, b: 1}}];
button.appendChild(text);',
'{"variants": ["primary", "secondary", "ghost", "danger"], "sizes": ["s", "m", "l"], "states": ["default", "hover", "active", "disabled"]}',
'beginner',
'{"button", "interactive", "cta", "action"}'),

-- Input Component
('Input', 'input', 'form', 'Text input field with label and validation states',
'const inputContainer = figma.createFrame();
inputContainer.name = "Input";
inputContainer.layoutMode = "VERTICAL";
inputContainer.itemSpacing = 8;
inputContainer.layoutAlign = "STRETCH";

const label = figma.createText();
label.characters = "Label";
label.fontSize = 12;
label.fontName = {family: "Inter", style: "Medium"};
label.fills = [{type: "SOLID", color: {r: 0.4, g: 0.4, b: 0.4}}];
inputContainer.appendChild(label);

const inputField = figma.createFrame();
inputField.resize(240, 40);
inputField.cornerRadius = 8;
inputField.strokeWeight = 1;
inputField.strokes = [{type: "SOLID", color: {r: 0.8, g: 0.8, b: 0.8}}];
inputField.fills = [{type: "SOLID", color: {r: 1, g: 1, b: 1}}];
inputField.paddingLeft = 12;
inputField.paddingRight = 12;
inputContainer.appendChild(inputField);',
'{"types": ["text", "email", "password", "number"], "states": ["default", "focus", "error", "disabled"], "features": ["label", "placeholder", "helper text", "icon"]}',
'beginner',
'{"input", "form", "text field", "user input"}'),

-- Card Component
('Card', 'card', 'layout', 'Content container with flexible layout options',
'const card = figma.createFrame();
card.name = "Card";
card.resize(320, 400);
card.cornerRadius = 16;
card.fills = [{type: "SOLID", color: {r: 1, g: 1, b: 1}}];
card.effects = [{
  type: "DROP_SHADOW",
  color: {r: 0, g: 0, b: 0, a: 0.1},
  offset: {x: 0, y: 4},
  radius: 16,
  visible: true,
  blendMode: "NORMAL"
}];
card.layoutMode = "VERTICAL";
card.padding = 24;
card.itemSpacing = 16;',
'{"layouts": ["vertical", "horizontal", "grid"], "padding": ["s", "m", "l", "xl"], "elevation": ["none", "low", "medium", "high"]}',
'beginner',
'{"card", "container", "content", "layout"}'),

-- Badge Component
('Badge', 'badge', 'basic', 'Small label for status or category indication',
'const badge = figma.createFrame();
badge.name = "Badge";
badge.layoutMode = "HORIZONTAL";
badge.primaryAxisAlignItems = "CENTER";
badge.paddingLeft = 8;
badge.paddingRight = 8;
badge.paddingTop = 4;
badge.paddingBottom = 4;
badge.cornerRadius = 12;
badge.fills = [{type: "SOLID", color: {r: 0.9, g: 0.95, b: 1}}];

const text = figma.createText();
text.characters = "Badge";
text.fontSize = 11;
text.fontName = {family: "Inter", style: "Medium"};
text.fills = [{type: "SOLID", color: {r: 0.2, g: 0.4, b: 0.8}}];
badge.appendChild(text);',
'{"variants": ["neutral", "brand", "success", "warning", "danger"], "sizes": ["s", "m"], "shapes": ["rounded", "square"]}',
'beginner',
'{"badge", "label", "tag", "status"}'),

-- Navigation Component
('Navigation', 'navigation', 'navigation', 'Horizontal navigation bar with links',
'const nav = figma.createFrame();
nav.name = "Navigation";
nav.layoutMode = "HORIZONTAL";
nav.primaryAxisAlignItems = "CENTER";
nav.itemSpacing = 32;
nav.paddingLeft = 24;
nav.paddingRight = 24;
nav.paddingTop = 16;
nav.paddingBottom = 16;
nav.fills = [{type: "SOLID", color: {r: 0.98, g: 0.98, b: 0.98}}];

// Add nav items
const items = ["Home", "Products", "About", "Contact"];
items.forEach(item => {
  const link = figma.createText();
  link.characters = item;
  link.fontSize = 14;
  link.fontName = {family: "Inter", style: "Regular"};
  link.fills = [{type: "SOLID", color: {r: 0.2, g: 0.2, b: 0.2}}];
  nav.appendChild(link);
});',
'{"alignment": ["left", "center", "right"], "style": ["horizontal", "vertical"], "items": ["text", "icon", "mixed"]}',
'intermediate',
'{"navigation", "menu", "navbar", "header"}'),

-- Checkbox Component
('Checkbox', 'checkbox', 'form', 'Interactive checkbox with label',
'const checkboxContainer = figma.createFrame();
checkboxContainer.name = "Checkbox";
checkboxContainer.layoutMode = "HORIZONTAL";
checkboxContainer.primaryAxisAlignItems = "CENTER";
checkboxContainer.itemSpacing = 8;

const checkbox = figma.createFrame();
checkbox.resize(20, 20);
checkbox.cornerRadius = 4;
checkbox.strokeWeight = 2;
checkbox.strokes = [{type: "SOLID", color: {r: 0.7, g: 0.7, b: 0.7}}];
checkbox.fills = [{type: "SOLID", color: {r: 1, g: 1, b: 1}}];
checkboxContainer.appendChild(checkbox);

const label = figma.createText();
label.characters = "Checkbox label";
label.fontSize = 14;
label.fontName = {family: "Inter", style: "Regular"};
label.fills = [{type: "SOLID", color: {r: 0.2, g: 0.2, b: 0.2}}];
checkboxContainer.appendChild(label);',
'{"states": ["unchecked", "checked", "indeterminate"], "sizes": ["s", "m", "l"], "disabled": [true, false]}',
'beginner',
'{"checkbox", "form", "input", "selection"}'),

-- Select Component
('Select', 'select', 'form', 'Dropdown selection component',
'const select = figma.createFrame();
select.name = "Select";
select.resize(240, 40);
select.cornerRadius = 8;
select.strokeWeight = 1;
select.strokes = [{type: "SOLID", color: {r: 0.8, g: 0.8, b: 0.8}}];
select.fills = [{type: "SOLID", color: {r: 1, g: 1, b: 1}}];
select.layoutMode = "HORIZONTAL";
select.primaryAxisAlignItems = "CENTER";
select.counterAxisSizingMode = "FIXED";
select.paddingLeft = 12;
select.paddingRight = 12;

const placeholder = figma.createText();
placeholder.characters = "Select an option";
placeholder.fontSize = 14;
placeholder.fontName = {family: "Inter", style: "Regular"};
placeholder.fills = [{type: "SOLID", color: {r: 0.6, g: 0.6, b: 0.6}}];
select.appendChild(placeholder);',
'{"states": ["default", "open", "disabled"], "sizes": ["s", "m", "l"], "multiple": [true, false]}',
'intermediate',
'{"select", "dropdown", "form", "input"}'),

-- Modal Component
('Modal', 'modal', 'feedback', 'Overlay dialog for focused content',
'const modalOverlay = figma.createFrame();
modalOverlay.name = "Modal Overlay";
modalOverlay.resize(1440, 900);
modalOverlay.fills = [{type: "SOLID", color: {r: 0, g: 0, b: 0, a: 0.5}}];

const modal = figma.createFrame();
modal.name = "Modal";
modal.resize(480, 320);
modal.cornerRadius = 16;
modal.fills = [{type: "SOLID", color: {r: 1, g: 1, b: 1}}];
modal.effects = [{
  type: "DROP_SHADOW",
  color: {r: 0, g: 0, b: 0, a: 0.25},
  offset: {x: 0, y: 8},
  radius: 24,
  visible: true,
  blendMode: "NORMAL"
}];
modal.layoutMode = "VERTICAL";
modal.padding = 32;
modal.itemSpacing = 24;
modal.x = (1440 - 480) / 2;
modal.y = (900 - 320) / 2;
modalOverlay.appendChild(modal);',
'{"sizes": ["s", "m", "l", "fullscreen"], "actions": ["confirm", "cancel", "custom"], "closable": [true, false]}',
'intermediate',
'{"modal", "dialog", "popup", "overlay"}'),

-- Avatar Component
('Avatar', 'avatar', 'basic', 'User profile image or initials display',
'const avatar = figma.createFrame();
avatar.name = "Avatar";
avatar.resize(40, 40);
avatar.cornerRadius = 20;
avatar.fills = [{type: "SOLID", color: {r: 0.8, g: 0.85, b: 0.95}}];

const initials = figma.createText();
initials.characters = "JD";
initials.fontSize = 16;
initials.fontName = {family: "Inter", style: "Medium"};
initials.fills = [{type: "SOLID", color: {r: 0.2, g: 0.3, b: 0.6}}];
initials.textAlignHorizontal = "CENTER";
initials.textAlignVertical = "CENTER";
initials.resize(40, 40);
avatar.appendChild(initials);',
'{"sizes": ["xs", "s", "m", "l", "xl"], "shapes": ["circle", "square"], "types": ["image", "initials", "icon"]}',
'beginner',
'{"avatar", "user", "profile", "image"}'),

-- Progress Bar Component
('ProgressBar', 'progress', 'feedback', 'Visual indicator of completion status',
'const progressContainer = figma.createFrame();
progressContainer.name = "Progress Bar";
progressContainer.resize(240, 8);
progressContainer.cornerRadius = 4;
progressContainer.fills = [{type: "SOLID", color: {r: 0.9, g: 0.9, b: 0.9}}];

const progressFill = figma.createFrame();
progressFill.resize(144, 8); // 60% progress
progressFill.cornerRadius = 4;
progressFill.fills = [{type: "SOLID", color: {r: 0.388, g: 0.4, b: 0.965}}];
progressContainer.appendChild(progressFill);',
'{"variants": ["linear", "circular"], "sizes": ["s", "m", "l"], "animated": [true, false]}',
'beginner',
'{"progress", "loading", "status", "indicator"}');

-- Add RLS policies for new tables
ALTER TABLE once_ui_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_usage ENABLE ROW LEVEL SECURITY;

-- Once UI components are public read
CREATE POLICY "Public read access to components" ON once_ui_components
  FOR SELECT USING (true);

-- API calls are user-specific
CREATE POLICY "Users can view own API calls" ON api_calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API calls" ON api_calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API cache is public read (for efficiency)
CREATE POLICY "Public read access to cache" ON api_cache
  FOR SELECT USING (true);

-- System can manage cache
CREATE POLICY "System can manage cache" ON api_cache
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Component usage is user-specific
CREATE POLICY "Users can view own component usage" ON component_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can track own component usage" ON component_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own component usage" ON component_usage
  FOR UPDATE USING (auth.uid() = user_id);