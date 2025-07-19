# FigBud AI Chatbot Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Configure AI Provider

#### Option A: DeepSeek (Recommended - Most Cost-Effective)
1. Go to https://platform.deepseek.com
2. Sign up and add credits ($1 gives ~700k tokens)
3. Generate API key
4. Update `.env`:
   ```
   DEEPSEEK_API_KEY=sk-YOUR_DEEPSEEK_KEY_HERE
   DEFAULT_AI_PROVIDER=deepseek
   ```

#### Option B: OpenRouter (Access to Multiple Models)
1. Go to https://openrouter.ai
2. Sign up and add credits
3. Generate API key from https://openrouter.ai/keys
4. Update `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-YOUR_OPENROUTER_KEY_HERE
   DEFAULT_AI_PROVIDER=openrouter
   ```

### 3. Start the Backend Server
```bash
npm run server:dev
# or
cd server && npm run dev
```

The server will start on http://localhost:3000

### 4. Build and Run the Plugin
```bash
# In another terminal, build the plugin
npm run build

# Then load in Figma:
# 1. Open Figma Desktop
# 2. Plugins → Development → Import plugin from manifest
# 3. Select manifest.json from this folder
# 4. Run the plugin
```

## Testing the AI Integration

### Test Script
```bash
npm run test:ai
```

This will test:
- Basic chat responses
- Component creation commands
- AI provider connectivity

### Manual Testing
1. Open the plugin in Figma
2. Try these messages:
   - "Hello" - Basic greeting
   - "Create a button" - Should create a button component
   - "Make a card" - Should create a card component
   - "Show me an input field" - Should create an input

## How It Works

1. **User sends message** → ChatView component
2. **Frontend sends to backend** → POST /api/chat/message
3. **Backend processes with AI** → DeepSeek/OpenRouter
4. **AI responds with JSON** → Includes component actions
5. **Frontend receives response** → Shows in chat
6. **Component creation trigger** → Sends to Figma plugin
7. **Plugin creates component** → Places in playground

## Troubleshooting

### "Failed to send message"
- Check backend is running: `npm run server:dev`
- Check console for errors
- Verify API keys in `.env`

### "AI provider not available"
- Ensure API key is set correctly
- Check you have credits on the provider
- Try switching providers in `.env`

### CORS Errors
- Make sure backend is running on port 3000
- Plugin should connect to http://localhost:3000
- Check browser console for specific errors

### Components Not Creating
- Check Figma console for errors
- Ensure playground/sandbox exists
- Verify chat message includes create/make/build keywords

## Advanced Configuration

### Switch AI Models
In `server/services/ai-providers.ts`:
- OpenRouter: Change `model` parameter (line 43)
- DeepSeek: Already uses best model

### Adjust Response Style
Edit system prompts in `buildSystemPrompt()` method

### Add Custom Components
1. Add to component patterns in `code.js`
2. Update AI prompts to recognize new types
3. Add creation logic in `handleCreateComponent()`

## Cost Management

- DeepSeek: ~$0.0002 per message
- OpenRouter: Varies by model (~$0.001 per message)
- Both very affordable for development

## Production Deployment

1. Update `.env` with production API keys
2. Change `DEFAULT_AI_PROVIDER` if needed
3. Update CORS settings in `server/index.ts`
4. Deploy backend to your preferred host
5. Update frontend API URLs