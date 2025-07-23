# 🐸 Starting FigBud - Complete Guide

FigBud requires both the Figma plugin and a backend server to work properly.

## Quick Start

### 1. Start the Backend Server (REQUIRED)

Open a terminal and run:
```bash
# Make the script executable (first time only)
chmod +x start-server.sh

# Start the server
./start-server.sh

# OR use npm directly
npm run server
```

The server will start on `http://localhost:3000`

### 2. Build and Run the Figma Plugin

In another terminal:
```bash
# Build the plugin
npm run build

# This creates the necessary files for Figma
```

### 3. Load in Figma

1. Open Figma Desktop App
2. Go to Menu → Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file from the FigBud directory
4. Run the plugin from Plugins → Development → FigBud

## Troubleshooting

### "Backend server is not running" Error

This means the backend server isn't started. Follow these steps:

1. Check if the server is running:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. If not, start it:
   ```bash
   ./start-server.sh
   ```

3. Check for errors in the terminal where you started the server

### Missing Environment Variables

If you see errors about missing API keys:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   - SUPABASE_URL and SUPABASE_SERVICE_KEY (required)
   - JWT_SECRET and JWT_REFRESH_SECRET (required)
   - API keys for AI services (optional - users can provide their own)

### Port 3000 Already in Use

If port 3000 is taken:
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or use a different port
PORT=3001 npm run server
```

Then update `src/services/api.ts` to use the new port.

## Development Mode

For development with auto-reload:

### Terminal 1 - Backend:
```bash
npm run server:dev
```

### Terminal 2 - Frontend:
```bash
npm run watch
```

## What You Should See

1. **Backend Terminal**: 
   ```
   🚀 FigBud server running on port 3000
   ✅ Environment variables validated
   ```

2. **Figma Plugin**:
   - The FigBud interface loads
   - When sending a message, you'll see:
     - Pixelated frog animation
     - Progress percentage (0-100%)
     - Current step being executed
     - Elapsed time counter

## Features That Show It's Working

1. **Connection Indicator**: "Connected to backend" message
2. **Progress Tracking**: Real-time progress updates
3. **Model Selection**: Shows which AI model is being used
4. **Tutorial Search**: Automatically searches for relevant tutorials
5. **Response Generation**: Creates helpful responses with step-by-step guides

## Common Issues

### Plugin Shows "Loading..." Forever

1. Backend server is not running
2. Wrong backend URL in the code
3. CORS issues (check browser console)

### No AI Responses

1. Missing API keys in `.env`
2. API rate limits reached
3. Network connectivity issues

### Build Errors

1. Missing dependencies: `npm install`
2. TypeScript errors: `npm run type-check`
3. Clean and rebuild: `npm run clean && npm run build`

## Support

If you're still having issues:
1. Check the browser console (F12 in Figma)
2. Check the backend server logs
3. Ensure all dependencies are installed
4. Verify your `.env` file has all required variables