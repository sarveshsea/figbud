# FigBud Quick Start Guide

## ✅ Your Environment is Configured!

All your API keys have been set up in the `.env` file:
- ✅ Supabase (Database)
- ✅ DeepSeek (AI Provider)
- ✅ OpenRouter (AI Provider) 
- ✅ YouTube API
- ✅ AssemblyAI
- ✅ Figma API
- ✅ GitHub Token

## 🚀 Quick Start Steps

### 1. Start the Backend Server
```bash
npm run server:dev
```
Keep this running in a terminal window.

### 2. In Another Terminal - Build the Plugin
```bash
npm run build
```

### 3. Import into Figma
1. Open **Figma Desktop App**
2. Go to **Plugins → Development → Import plugin from manifest**
3. Navigate to your FigBud folder
4. Select `manifest.json`
5. Click "Import Plugin"

### 4. Use FigBud!
- **Open FigBud**: Plugins → FigBud AI Assistant → Open FigBud AI
- **Quick Actions**: 
  - Quick Create Button
  - Quick Create Card
  - Quick Create Input
- **Sandbox Mode**: Plugins → FigBud AI Assistant → Open Sandbox Mode

## 💡 Features Available

### AI Chat
- Ask design questions
- Request component creation: "create a button", "make a card"
- Get design suggestions

### Sandbox Mode
- Interactive tutorials
- Step-by-step component building
- Code previews
- Progress tracking

### Quick Create
- Instant component creation from menu
- Button, Card, and Input components
- Once UI design system styling

## 🔧 Development Mode

For hot reloading during development:
```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend watch
npm run watch

# After making changes, reload plugin in Figma
```

## 📝 Notes
- The AI will use DeepSeek and OpenRouter as providers
- All chat messages are processed through your backend server
- Components are created directly in your Figma canvas
- Sandbox mode provides guided learning experiences

## 🆘 Troubleshooting
- If AI doesn't respond: Check backend server is running
- If plugin doesn't load: Run `node verify-plugin.js` to check setup
- For errors: Check Figma console (Plugins → Development → Show/Hide Console)

Enjoy using FigBud! 🎉