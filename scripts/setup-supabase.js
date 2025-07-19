const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://faummrgmlwhfehylhfvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW1tcmdtbHdoZmVoeWxoZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4ODU1MTMsImV4cCI6MjA2ODQ2MTUxM30.gQ8FKw9-ZGi2Ic0Uqt_1nGhCXGhMb44HADRpFK5N9JE';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhdW1tcmdtbHdoZmVoeWxoZnZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjg4NTUxMywiZXhwIjoyMDY4NDYxNTEzfQ.F1y74XY0bCW1Bqh0YFRE-gRoMRCvFB3BzP7B4GQD_mE';

// Use service role for admin operations
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupTables() {
  try {
    console.log('Setting up Supabase tables...');

    // Enable UUID extension
    const { error: uuidError } = await supabase.rpc('query', {
      query: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    });
    if (uuidError) console.log('UUID extension might already exist:', uuidError.message);

    // Create users table
    const { error: usersError } = await supabase.rpc('query', {
      query: `
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
      `
    });
    if (usersError) throw usersError;
    console.log('✓ Users table created');

    // Create once_ui_components table
    const { error: componentsError } = await supabase.rpc('query', {
      query: `
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
      `
    });
    if (componentsError) throw componentsError;
    console.log('✓ Once UI components table created');

    // Create api_calls table
    const { error: apiCallsError } = await supabase.rpc('query', {
      query: `
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
      `
    });
    if (apiCallsError) throw apiCallsError;
    console.log('✓ API calls table created');

    // Create api_cache table
    const { error: cacheError } = await supabase.rpc('query', {
      query: `
        CREATE TABLE IF NOT EXISTS api_cache (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          cache_key VARCHAR(255) UNIQUE NOT NULL,
          response_data JSONB NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    if (cacheError) throw cacheError;
    console.log('✓ API cache table created');

    // Create component_usage table
    const { error: usageError } = await supabase.rpc('query', {
      query: `
        CREATE TABLE IF NOT EXISTS component_usage (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          component_id UUID REFERENCES once_ui_components(id) ON DELETE CASCADE,
          used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          context JSONB DEFAULT '{}'
        );
      `
    });
    if (usageError) throw usageError;
    console.log('✓ Component usage table created');

    // Create tutorials table
    const { error: tutorialsError } = await supabase.rpc('query', {
      query: `
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
      `
    });
    if (tutorialsError) throw tutorialsError;
    console.log('✓ Tutorials table created');

    // Create subscriptions table
    const { error: subsError } = await supabase.rpc('query', {
      query: `
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
      `
    });
    if (subsError) throw subsError;
    console.log('✓ Subscriptions table created');

    console.log('\nAll tables created successfully!');
    
    // Now insert sample data
    await insertSampleData();
    
  } catch (error) {
    console.error('Error setting up tables:', error);
  }
}

async function insertSampleData() {
  console.log('\nInserting sample data...');

  // Insert Once UI components
  const components = [
    {
      name: 'Button',
      category: 'basic',
      figma_code: `const button = figma.createFrame();
button.resize(120, 48);
button.cornerRadius = 8;
button.fills = [{type: 'SOLID', color: {r: 0.388, g: 0.4, b: 0.965}}];
button.layoutMode = 'HORIZONTAL';
button.paddingLeft = 24;
button.paddingRight = 24;
button.paddingTop = 12;
button.paddingBottom = 12;
button.primaryAxisAlignItems = 'CENTER';
button.counterAxisAlignItems = 'CENTER';

const text = figma.createText();
text.characters = "Click me";
text.fontSize = 16;
text.fontName = {family: "Inter", style: "Medium"};
text.fills = [{type: 'SOLID', color: {r: 1, g: 1, b: 1}}];

button.appendChild(text);`,
      properties: {
        variant: ['primary', 'secondary', 'tertiary'],
        size: ['s', 'm', 'l'],
        fillWidth: 'boolean'
      },
      example_usage: '<Button variant="primary" size="m">Click me</Button>'
    },
    {
      name: 'Card',
      category: 'layout',
      figma_code: `const card = figma.createFrame();
card.resize(320, 200);
card.cornerRadius = 16;
card.fills = [{type: 'SOLID', color: {r: 1, g: 1, b: 1}}];
card.layoutMode = 'VERTICAL';
card.padding = 24;
card.itemSpacing = 16;`,
      properties: {
        padding: ['s', 'm', 'l', 'xl'],
        radius: ['s', 'm', 'l', 'xl'],
        align: ['start', 'center', 'end']
      },
      example_usage: '<Card padding="l" radius="m">Content</Card>'
    },
    {
      name: 'Input',
      category: 'form',
      figma_code: `const input = figma.createFrame();
input.resize(320, 48);
input.cornerRadius = 8;
input.strokeWeight = 1;
input.strokes = [{type: 'SOLID', color: {r: 0.8, g: 0.8, b: 0.8}}];
input.fills = [{type: 'SOLID', color: {r: 1, g: 1, b: 1}}];
input.paddingLeft = 16;
input.paddingRight = 16;`,
      properties: {
        type: ['text', 'email', 'password', 'number'],
        label: 'string',
        placeholder: 'string',
        disabled: 'boolean'
      },
      example_usage: '<Input label="Email" type="email" placeholder="Enter email" />'
    }
  ];

  for (const component of components) {
    const { error } = await supabase
      .from('once_ui_components')
      .insert(component);
    if (error) console.error(`Error inserting ${component.name}:`, error);
    else console.log(`✓ Inserted ${component.name} component`);
  }

  // Insert sample tutorials
  const tutorials = [
    {
      title: 'Getting Started with Once UI',
      description: 'Learn the basics of Once UI design system',
      category: 'basics',
      difficulty: 'beginner',
      duration: 10,
      content: {
        steps: [
          'Install Once UI components',
          'Import required components',
          'Use theme variables',
          'Build your first component'
        ]
      }
    },
    {
      title: 'Building Responsive Layouts',
      description: 'Create responsive designs with Flex and Grid',
      category: 'layout',
      difficulty: 'intermediate',
      duration: 20,
      content: {
        steps: [
          'Understanding Flex component',
          'Grid system basics',
          'Responsive breakpoints',
          'Mobile-first approach'
        ]
      }
    }
  ];

  for (const tutorial of tutorials) {
    const { error } = await supabase
      .from('tutorials')
      .insert(tutorial);
    if (error) console.error(`Error inserting tutorial:`, error);
    else console.log(`✓ Inserted "${tutorial.title}" tutorial`);
  }

  console.log('\nSample data inserted successfully!');
}

// Run the setup
setupTables();