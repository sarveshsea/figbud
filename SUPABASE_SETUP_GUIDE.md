# Supabase Setup Guide for FigBud

## Quick Setup

### Step 1: Run the SQL Schema

1. Open your Supabase dashboard: https://supabase.com/dashboard/project/faummrgmlwhfehylhfvx/sql/new

2. Copy and paste the SQL from `supabase-schema-fixed.sql` (or run `node setup-supabase-tables.js` to copy to clipboard)

3. Click "Run" to create all tables

### Step 2: Verify Tables Created

Run the test script:
```bash
node test-supabase.js
```

You should see:
```
✅ Table 'chat_sessions' exists
✅ Table 'components_created' exists
✅ Table 'api_cache' exists
✅ Table 'api_calls' exists
```

### Step 3: Test the Integration

1. Make sure the server is running:
```bash
npm run server
```

2. Send a test message through the chat API:
```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, test message", "context": {"source": "test"}}'
```

3. Check if the message was stored:
```bash
node test-supabase.js
```

## Tables Overview

### 1. `chat_sessions`
Stores all chat conversations between users and FigBud
- `conversation_id`: Groups messages in a conversation
- `message`: User's message
- `response`: AI's response
- `metadata`: Additional data (model used, tokens, etc.)

### 2. `components_created`
Tracks all UI components created through FigBud
- `component_type`: Type of component (button, card, etc.)
- `properties`: Component properties as JSON
- `prompt`: Original user prompt
- `teacher_note`: Educational note from AI

### 3. `api_cache`
Caches AI responses to reduce API costs
- `cache_key`: Unique key for the cached response
- `response_data`: Cached AI response
- `expires_at`: When the cache expires

### 4. `api_calls`
Logs all API calls for analytics and debugging
- `provider`: Which AI provider was used
- `tokens_used`: Number of tokens consumed
- `cost_cents`: Estimated cost in cents
- `duration_ms`: Response time

## Environment Variables

Your `.env` file should have:
```
SUPABASE_URL=https://faummrgmlwhfehylhfvx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Troubleshooting

### "Invalid API key" Error
- Make sure you're using the service key (not anon key) for server-side operations
- Check that the keys match your Supabase project

### Tables Not Found
- Run the SQL schema in Supabase SQL editor
- Make sure you're connected to the right project

### No Data Being Stored
- Check server logs for errors
- Verify the database service is being imported correctly
- Ensure RLS policies allow inserts

## Security Notes

For production:
1. Update RLS policies to restrict access properly
2. Use user authentication to track individual users
3. Consider using the anon key in the frontend and service key only on backend
4. Add proper error handling and retry logic