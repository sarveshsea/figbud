-- FigBud Component Library Schema
-- This schema stores Once UI components and their Figma mappings

-- Component categories
CREATE TYPE component_category AS ENUM (
  'layout',
  'form',
  'display',
  'navigation',
  'feedback',
  'data',
  'utility'
);

-- Component complexity levels
CREATE TYPE component_complexity AS ENUM (
  'atomic',
  'molecule',
  'organism',
  'template'
);

-- Figma components table
CREATE TABLE IF NOT EXISTS figma_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- button, card, input, etc.
  category component_category NOT NULL,
  complexity component_complexity DEFAULT 'atomic',
  description TEXT,
  thumbnail_url TEXT,
  figma_properties JSONB NOT NULL, -- Figma node properties
  default_props JSONB, -- Default property values
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Once UI component mappings
CREATE TABLE IF NOT EXISTS once_ui_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_type VARCHAR(100) NOT NULL UNIQUE, -- Maps to figma_components.type
  once_ui_component VARCHAR(100) NOT NULL, -- Once UI component name
  figma_to_once_props JSONB NOT NULL, -- Property mapping rules
  once_to_figma_props JSONB NOT NULL, -- Reverse mapping
  style_mappings JSONB, -- Style-specific mappings
  constraints JSONB, -- Validation rules
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Component templates (pre-built combinations)
CREATE TABLE IF NOT EXISTS component_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category component_category NOT NULL,
  components JSONB NOT NULL, -- Array of component configurations
  layout JSONB, -- Layout configuration
  preview_url TEXT,
  code TEXT, -- Generated code template
  figma_template JSONB, -- Figma-specific template data
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Component variations (different styles of same component)
CREATE TABLE IF NOT EXISTS component_variations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_id UUID NOT NULL REFERENCES figma_components(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  variant_props JSONB NOT NULL, -- Variant-specific properties
  preview_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User saved components
CREATE TABLE IF NOT EXISTS user_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  component_data JSONB NOT NULL, -- Full component configuration
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Component usage analytics
CREATE TABLE IF NOT EXISTS component_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_id UUID REFERENCES figma_components(id) ON DELETE CASCADE,
  template_id UUID REFERENCES component_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- created, modified, copied, etc.
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure only one foreign key is set
  CONSTRAINT single_component_ref CHECK (
    (component_id IS NOT NULL AND template_id IS NULL) OR
    (component_id IS NULL AND template_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX idx_figma_components_type ON figma_components(type);
CREATE INDEX idx_figma_components_category ON figma_components(category);
CREATE INDEX idx_figma_components_tags ON figma_components USING GIN(tags);
CREATE INDEX idx_component_templates_category ON component_templates(category);
CREATE INDEX idx_component_templates_featured ON component_templates(is_featured);
CREATE INDEX idx_user_components_user_id ON user_components(user_id);
CREATE INDEX idx_user_components_public ON user_components(is_public);
CREATE INDEX idx_component_analytics_created ON component_analytics(created_at);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_figma_components_updated_at BEFORE UPDATE
  ON figma_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_once_ui_mappings_updated_at BEFORE UPDATE
  ON once_ui_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_component_templates_updated_at BEFORE UPDATE
  ON component_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  
CREATE TRIGGER update_user_components_updated_at BEFORE UPDATE
  ON user_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE figma_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE once_ui_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Public read access to components" ON figma_components
  FOR SELECT USING (true);

CREATE POLICY "Public read access to mappings" ON once_ui_mappings
  FOR SELECT USING (true);

CREATE POLICY "Public read access to templates" ON component_templates
  FOR SELECT USING (true);

CREATE POLICY "Public read access to variations" ON component_variations
  FOR SELECT USING (true);

-- Policies for user components
CREATE POLICY "Users can read own components" ON user_components
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own components" ON user_components
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own components" ON user_components
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own components" ON user_components
  FOR DELETE USING (auth.uid() = user_id);

-- Analytics policy (write-only for authenticated users)
CREATE POLICY "Authenticated users can write analytics" ON component_analytics
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);