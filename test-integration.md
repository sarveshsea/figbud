# FigBud Integration Test Checklist

## ✅ What's Working

1. **Backend Server**
   - Server runs with `npm run server` (now using tsx)
   - Health endpoint working: http://localhost:3000/api/health
   - Chat endpoint processing messages with cascading AI models
   - DeepSeek off-hours detection active (50% discount during PST business hours)

2. **API Integration**
   - Messages sent from plugin reach backend server
   - Backend tries models in order: Free → Paid → DeepSeek off-hours
   - Responses include model used and conversation ID
   - Fallback to local processing if backend unavailable

3. **Database Logging**
   - Conversation IDs generated and persisted
   - Messages should be logged to Supabase (verify in dashboard)
   - API calls tracked with model information

4. **UI Features**
   - Minimize button resizes to 70x70px (bubble only)
   - Maximize restores to previous size
   - State persists across plugin restarts

## 📋 Quick Test Steps

1. **Start Backend** (if not running)
   ```bash
   npm run server
   ```

2. **Test API**
   ```bash
   node debug-api.js
   ```

3. **Import Plugin in Figma**
   - Open Figma Desktop
   - Plugins → Development → Import plugin from manifest
   - Select manifest.json from figbud directory

4. **Test in Figma**
   - Run plugin (should see FigBud window)
   - Type "Create a primary button"
   - Watch console for API logs
   - Check minimize/maximize functionality

5. **Verify in Supabase**
   - Go to Table Editor
   - Check `chat_sessions` for conversation
   - Check `api_calls` for model usage

## 🔍 Debug Console Logs to Look For

In browser console (View → Developer → JavaScript Console):
- `[OpenRouterService] Backend available: true`
- `[OpenRouterService] Calling backend API...`
- `[OpenRouterService] Backend response: {...}`

In server terminal:
- `[CascadingAI] Processing with X available models`
- `[CascadingAI] Trying model-name...`
- `[Database] Storing chat session...`

## 🎯 Current Status
- ✅ API calls working from plugin to backend
- ✅ Cascading AI models implemented
- ✅ DeepSeek off-hours active (currently getting 50% discount)
- ✅ Minimize shows only bubble (70x70px)
- ✅ Plugin builds successfully

The integration is complete and ready for testing!