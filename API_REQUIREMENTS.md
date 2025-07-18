# FigBud API Requirements

## Required API Keys

To run FigBud in production, you'll need the following API keys:

### 🚀 Essential APIs (Required for Core Functionality)

1. **OpenAI API** - For AI-powered chat responses and guidance
   - Get your key: https://platform.openai.com/api-keys
   - Add to `.env`: `OPENAI_API_KEY=your-openai-api-key`
   - Used for: Chat responses, tutorial recommendations, demo generation

2. **YouTube Data API v3** - For tutorial search and recommendations
   - Get your key: https://console.developers.google.com/apis/credentials
   - Enable: YouTube Data API v3
   - Add to `.env`: `YOUTUBE_API_KEY=your-youtube-data-api-key`
   - Used for: Searching design tutorials, video metadata

### 💼 Premium Features (Optional)

3. **AssemblyAI API** - For tutorial transcription and timestamped guidance
   - Get your key: https://www.assemblyai.com/
   - Add to `.env`: `ASSEMBLYAI_API_KEY=your-assemblyai-api-key`
   - Used for: Timestamped tutorial guidance, voice-to-text

4. **Stripe API** - For premium subscription management
   - Get your keys: https://dashboard.stripe.com/apikeys
   - Add to `.env`: 
     - `STRIPE_SECRET_KEY=your-stripe-secret-key`
     - `STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret`
   - Used for: Premium subscriptions, payment processing

### 📧 Optional Services

5. **SMTP Email Service** - For user notifications and onboarding
   - Example setup with Gmail:
     - `SMTP_HOST=smtp.gmail.com`
     - `SMTP_PORT=587`
     - `SMTP_USER=your-email@gmail.com`
     - `SMTP_PASS=your-app-password`

6. **Sentry** - For error tracking and monitoring
   - Get your DSN: https://sentry.io/
   - Add to `.env`: `SENTRY_DSN=your-sentry-dsn`

### 🗄️ Database Options

7. **PostgreSQL** (Recommended for Production)
   - Current: File-based database (development)
   - Upgrade: Set `DATABASE_URL=postgresql://username:password@localhost:5432/figbud`

8. **Redis** (Optional, for caching)
   - Add to `.env`: `REDIS_URL=redis://localhost:6379`
   - Used for: API response caching, session management

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Add your API keys to the `.env` file

3. Generate secure JWT secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## Minimum Viable Setup

For basic functionality, you only need:
- ✅ OpenAI API Key
- ✅ YouTube Data API Key

The widget will work with these two APIs, with premium features disabled.

## Development vs Production

### Development
- File-based database included
- Default JWT secrets (change in production)
- CORS enabled for `localhost:8080`

### Production
- PostgreSQL database recommended
- Strong JWT secrets required
- CORS restricted to your domain
- HTTPS required for Figma widget

## Cost Estimates

- **OpenAI**: ~$0.01-0.10 per chat interaction
- **YouTube API**: Free (1,000,000 requests/day)
- **AssemblyAI**: ~$0.65 per hour of audio
- **Stripe**: 2.9% + $0.30 per transaction

## Security Notes

- Never commit API keys to version control
- Use environment variables for all secrets
- Rotate keys regularly in production
- Enable API key restrictions where possible