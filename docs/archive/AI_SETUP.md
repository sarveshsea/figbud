# FigBud AI Setup Instructions

## Quick Setup

1. **Get DeepSeek API Key** (Recommended - Most cost-effective)
   - Go to https://platform.deepseek.com
   - Sign up and add credits (very affordable - $1 = ~700k tokens)
   - Generate API key from API Keys section
   - Add to `.env`: `DEEPSEEK_API_KEY=sk-YOUR_KEY_HERE`

2. **Get OpenRouter API Key** (Alternative - Access to many models)
   - Go to https://openrouter.ai
   - Sign up and add credits
   - Generate API key from https://openrouter.ai/keys
   - Add to `.env`: `OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE`

3. **Configure Default Provider**
   - In `.env`, set: `DEFAULT_AI_PROVIDER=deepseek` (or `openrouter`)

## Supported Models

### DeepSeek (Recommended)
- Model: `deepseek-chat`
- Cost: ~$0.14 per 1M input tokens, $0.28 per 1M output tokens
- Very capable for design assistance
- Fast response times

### OpenRouter
- Can use multiple models including:
  - `deepseek/deepseek-chat` (same as above but via OpenRouter)
  - `openai/gpt-3.5-turbo` 
  - `anthropic/claude-3-haiku`
  - Many more at https://openrouter.ai/models

## Testing Your Setup

1. Start the backend server:
   ```bash
   cd server
   npm run dev
   ```

2. The plugin will automatically use the configured AI provider
3. Send a test message like "Create a button"
4. Check server logs for AI provider being used

## Troubleshooting

- **"AI provider not available"**: Check API key is correctly set in `.env`
- **Rate limits**: Both services have generous rate limits for normal usage
- **Fallback**: If primary provider fails, system will try other configured providers

## Cost Estimates

- Average chat message: ~500-1000 tokens
- DeepSeek: ~$0.0002 per message
- OpenRouter (GPT-3.5): ~$0.001 per message

Both are very affordable for development and production use!