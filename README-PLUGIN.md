# FigBud Plugin Installation & Setup Guide

## Overview
FigBud is an AI-powered Figma plugin that helps designers create UI components with AI assistance and step-by-step guidance.

## Features
- 🤖 AI Chat Assistant with multiple AI providers
- 🎮 Interactive Sandbox Mode for learning component creation
- 🚀 Quick component creation (Button, Card, Input)
- 🎨 Once UI design system integration
- 💡 Step-by-step tutorials and guidance

## Installation

### 1. Prerequisites
- Node.js 18+ and npm installed
- Figma desktop app

### 2. Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/sarveshsea/figbud.git
   cd figbud
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys:
   - At least one AI provider key (OpenAI, DeepSeek, or OpenRouter)
   - Database configuration (Supabase recommended)
   - JWT secrets

4. **Build the plugin**
   ```bash
   npm run build
   ```

5. **Start the backend server** (for AI features)
   ```bash
   npm run server:dev
   ```

### 3. Import into Figma

1. Open Figma Desktop App
2. Go to Menu → Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file from the FigBud directory
4. The plugin will appear in your plugins menu

## Usage

### Opening FigBud
- **Menu**: Plugins → FigBud AI Assistant → Open FigBud AI
- **Quick Actions**: Use menu commands for quick component creation

### Chat Mode
- Ask questions about design
- Request component creation (e.g., "create a button")
- Get design suggestions and best practices

### Sandbox Mode
- Access via menu: Open Sandbox Mode
- Or type "sandbox" or "playground" in chat
- Follow step-by-step tutorials
- Practice creating components with guidance

### Quick Create Commands
- Quick Create Button
- Quick Create Card
- Quick Create Input

## Development

### Running in Development Mode
```bash
# Start webpack in watch mode
npm run watch

# Start backend server with hot reload
npm run server:dev

# In another terminal, run the frontend dev server (optional)
npm run dev
```

### Building for Production
```bash
# Build everything
npm run build

# Build server separately
npm run build:server
```

### Testing
```bash
# Run tests
npm test

# Test AI integration
npm run test:ai
```

## Troubleshooting

### Plugin not loading
1. Check console for errors (Plugins → Development → Show/Hide Console)
2. Ensure `code.js` and `ui.html` exist in root directory
3. Run `npm run build` to regenerate files

### AI features not working
1. Check backend server is running (`npm run server:dev`)
2. Verify API keys in `.env` file
3. Check network tab for API errors

### Component creation fails
1. Ensure you have a Figma file open
2. Check console for specific error messages
3. Try using quick create commands first

## API Configuration

### Supported AI Providers
- **OpenAI**: Set `OPENAI_API_KEY`
- **DeepSeek**: Set `DEEPSEEK_API_KEY`
- **OpenRouter**: Set `OPENROUTER_API_KEY`

### Database Options
1. **Supabase** (Recommended)
   - Set `DATABASE_TYPE=supabase`
   - Configure Supabase credentials

2. **PostgreSQL**
   - Set `DATABASE_TYPE=postgres`
   - Configure `DATABASE_URL`

3. **File-based** (Development only)
   - Set `DATABASE_TYPE=file`

## Contributing
Please see CONTRIBUTING.md for guidelines.

## License
MIT License - see LICENSE file for details.