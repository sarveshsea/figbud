# FigBud Supabase Setup Guide

## Prerequisites
1. Create a Supabase account at https://supabase.com
2. Create a new project

## Database Setup

### Step 1: Open SQL Editor
1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run the Schema
1. Copy the entire contents of `supabase-schema.sql`
2. Paste it into the SQL editor
3. Click "Run" (or press Ctrl/Cmd + Enter)

### Step 3: Get Your API Keys
1. Go to "Settings" → "API" in your Supabase dashboard
2. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (safe to use in client-side code)
   - **Service Role Key**: `eyJhbGc...` (keep this secret!)

## Environment Variables

Create a `.env` file in your project root:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## Tables Created

The schema creates these tables:

1. **figbud_users** - Extended user profiles
2. **component_templates** - Saved component designs
3. **usage_history** - Track component creation and chat usage
4. **chat_conversations** - Chat session management
5. **chat_messages** - Individual chat messages

## Row Level Security

All tables have RLS enabled, meaning:
- Users can only see and modify their own data
- Public templates are visible to everyone
- All operations require authentication

## Next Steps

To integrate Supabase with the widget:

1. Install Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Initialize in your code:
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_ANON_KEY
   )
   ```

3. Use authentication:
   ```javascript
   // Sign up
   const { user, error } = await supabase.auth.signUp({
     email: 'user@example.com',
     password: 'password'
   })
   
   // Sign in
   const { user, error } = await supabase.auth.signIn({
     email: 'user@example.com',
     password: 'password'
   })
   ```

4. Store component usage:
   ```javascript
   const { data, error } = await supabase
     .from('usage_history')
     .insert({
       action_type: 'component_created',
       component_type: 'button',
       metadata: { sandbox_mode: true }
     })
   ```

## Troubleshooting

If you see "relation does not exist" errors:
1. Make sure you ran the entire SQL script
2. Check that UUID extension is enabled
3. Verify you're in the correct project

For "permission denied" errors:
1. Check that RLS policies are created
2. Ensure user is authenticated
3. Verify the user owns the data they're trying to access