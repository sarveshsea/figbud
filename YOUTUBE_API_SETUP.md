# YouTube API Setup Guide

## Quick Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/

2. **Create a new project** (or select existing):
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it "FigBud" or similar
   - Click "Create"

3. **Enable YouTube Data API v3**:
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click on it and press "Enable"

4. **Create API Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

5. **Add to your .env file**:
   ```
   YOUTUBE_API_KEY=AIzaSy... (your key here)
   ```

6. **Restart the backend server**:
   ```bash
   npm run server
   ```

## Verify It's Working

Check the server logs. You should see:
- `[YouTube] Using API key for search` (instead of "No API key found")
- Actual YouTube results instead of mock data

## Quotas and Limits

- Free tier: 10,000 units per day
- Search operation: 100 units per request
- This allows ~100 searches per day

## Troubleshooting

If you still see "0 tutorials found":
1. Check if the API key is valid
2. Ensure YouTube Data API v3 is enabled
3. Check quota usage in Google Cloud Console
4. Look for error details in server logs

## Note

The app works without YouTube API key - it will use mock tutorial data. But real YouTube results provide better, up-to-date content.