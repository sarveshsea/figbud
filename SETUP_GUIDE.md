# FigBud Setup Guide

## 🚨 Security Notice
Your Supabase keys were exposed in git history. **Please rotate them immediately** in your Supabase dashboard before proceeding!

## Quick Setup Steps

### 1. Environment Setup
1. Make sure your `.env` file has the new Supabase keys (after rotation)
2. Verify all API keys are present:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY` (new)
   - `SUPABASE_SERVICE_KEY` (new)
   - `DEEPSEEK_API_KEY`
   - `OPENROUTER_API_KEY`
   - `YOUTUBE_API_KEY`

### 2. Start Backend Server
```bash
cd /Users/sarveshchidambaram/Desktop/figbud
npm run server:dev
```
Keep this running in a terminal.

### 3. Use the Plugin in Figma
1. The plugin is already imported with ID: `figbud-plugin-1752945749024-7vkfms1rj`
2. In Figma: **Plugins → FigBud AI Assistant → Open FigBud AI**
3. Or use quick commands: **Quick Create Button/Card/Input**

### 4. Test Features
- **Chat Mode**: Type "create a button" or ask design questions
- **Sandbox Mode**: Click sandbox or type "playground" in chat
- **Quick Create**: Use menu commands for instant components

## What's Working Now
✅ Plugin loads without errors
✅ No more widget errors
✅ Font loading issues fixed
✅ AI chat with DeepSeek/OpenRouter
✅ Component creation from chat
✅ Interactive Sandbox mode
✅ Quick create commands
❌ Stripe removed (premium features show "coming soon")

## Troubleshooting
- **If AI doesn't respond**: Check backend server is running
- **If components don't create**: Make sure you have a Figma file open
- **If UI shows "Loading..."**: Refresh the plugin

## Important Notes
1. The backend server must be running for AI features
2. Premium features show UI but payments are disabled
3. All Stripe code has been removed for simplicity

## Development
To make changes:
```bash
npm run watch     # Auto-rebuild on changes
npm run server:dev # Keep backend running
```

Enjoy using FigBud AI! 🎉