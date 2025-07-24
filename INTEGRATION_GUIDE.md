# FigBud Integration Guide

## Overview
FigBud integrates multiple services to provide an AI-powered design assistant with YouTube tutorial recommendations and optional Firebase search capabilities.

## Core Integrations

### 1. Supabase (Database)
- **Purpose**: Stores chat sessions, component creation history, and usage analytics
- **Required**: Yes
- **Setup**: 
  ```bash
  # Add to .env
  SUPABASE_URL=your-supabase-url
  SUPABASE_SERVICE_KEY=your-service-key
  ```
- **Tables Required**:
  - `chat_sessions`: Stores conversation history
  - `components_created`: Tracks components created by users

### 2. YouTube Data API
- **Purpose**: Fetches relevant Figma tutorials with timestamps
- **Required**: Yes (falls back to mock data if not configured)
- **Setup**:
  ```bash
  # Add to .env
  YOUTUBE_API_KEY=your-youtube-api-key
  ```
- **Features**:
  - Automatic timestamp extraction from video descriptions
  - Channel prioritization for Figma-related content
  - 15-minute result caching for performance

### 3. Firebase (Optional)
- **Purpose**: Enhanced search for design resources and patterns
- **Required**: No
- **Setup**:
  ```bash
  # Add to .env (optional)
  FIREBASE_PROJECT_ID=your-project-id
  FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
  ```
- **Note**: Works without firebase-admin package installed

## Architecture

### Backend Services
```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│   Chat Route    │────▶│ AI Provider  │     │  YouTube API │
└─────────────────┘     └──────────────┘     └──────────────┘
         │                                            │
         ▼                                            ▼
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│    Supabase     │     │   Firebase   │     │ Memory Cache │
└─────────────────┘     └──────────────┘     └──────────────┘
```

### Frontend Components
```
┌─────────────────┐
│   ChatWindow    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  TutorialGrid   │────▶│ TutorialCard │
└─────────────────┘     └──────────────┘
```

## Features

### YouTube Integration
- Searches for Figma-specific tutorials
- Extracts timestamps from video descriptions
- Prioritizes official and trusted channels
- Handles YouTube URLs in chat messages

### Tutorial Display
- Thumbnail with duration overlay
- Clickable timestamps
- Channel information
- Skill level indicators

### Performance Optimizations
- Parallel API calls for AI, YouTube, and Firebase
- In-memory caching with 15-minute TTL
- Non-blocking database operations
- Graceful fallbacks for missing services

## Troubleshooting

### Common Issues

1. **"relation does not exist" error**
   - Run the SQL scripts in your Supabase dashboard
   - Ensure all required tables are created

2. **No tutorials showing**
   - Check YouTube API key is valid
   - Verify ChatWindow component includes TutorialGrid
   - Check browser console for errors

3. **Firebase not working**
   - This is optional - the app works without it
   - If needed, install: `npm install firebase-admin`
   - Add Firebase credentials to .env

### Testing

Run the integration tests:
```bash
# Test data flow
node test-data-flow.js

# Test edge cases
node test-edge-cases.js

# Test full integration
node test-full-integration.js
```

## API Keys

Users can provide their own API keys via headers:
- `X-YouTube-Key`: YouTube Data API key
- `X-OpenRouter-Key`: OpenRouter API key
- `X-DeepSeek-Key`: DeepSeek API key

## Next Steps

1. Load the plugin in Figma
2. Start the backend server: `npm run server`
3. Test creating components and viewing tutorials
4. Monitor logs for any issues