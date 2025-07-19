# Smart AI Implementation for FigBud

## Overview

FigBud now uses a smart cascading AI provider system that automatically selects the most cost-effective model while maintaining high quality responses. The system tries free models first, then falls back to increasingly capable paid models if needed.

## Model Cascade Strategy

### 1. Free Models (Try First)
- **Google Gemini 2.0 Flash Thinking (Free)** - Experimental but capable
- **Google Gemini Flash 1.5 8B (Free)** - Good for general queries
- **Microsoft Phi-3 Mini (Free)** - Lightweight, good for simple tasks
- **Meta Llama 3.2 1B (Free)** - Basic but functional

### 2. Cheap Paid Models (Fallback)
- **DeepSeek Chat** - $0.14/$0.28 per 1M tokens (excellent quality)
- **Llama 3.1 8B** - $0.18/$0.18 per 1M tokens (balanced)
- **Google Gemini Flash 1.5** - $0.25/$0.25 per 1M tokens (high quality)

### 3. Time-Based Optimization
- During off-peak hours (10 PM - 8 AM by default), DeepSeek is prioritized
- Configurable via `DEEPSEEK_OFFPEAK_START` and `DEEPSEEK_OFFPEAK_END`

## Configuration

### Environment Variables
```bash
# Required API Keys
OPENROUTER_API_KEY=sk-or-v1-...  # For free and paid models
DEEPSEEK_API_KEY=sk-...          # For direct DeepSeek access

# Smart AI Configuration
DEFAULT_AI_PROVIDER=smart         # Use smart cascading
AI_STRATEGY=cost_optimized       # Options: cost_optimized, performance, balanced
DEEPSEEK_OFFPEAK_START=22        # 10 PM
DEEPSEEK_OFFPEAK_END=8           # 8 AM
MAX_RETRY_ATTEMPTS=5             # Number of models to try
```

### Strategy Options

1. **cost_optimized** (Default)
   - Always tries free models first
   - Orders paid models by cost
   - Best for development and cost-conscious usage

2. **performance**
   - Prioritizes model quality over cost
   - Still tries free high-quality models first
   - Best for production where quality matters most

3. **balanced**
   - Balances cost and quality
   - Prefers free models if they're high quality
   - Good middle ground

## Features

### 1. Automatic Fallback
If a model fails (rate limit, error, etc.), the system automatically tries the next model in the cascade.

### 2. Cost Tracking
- Every request tracks which model was used
- Shows "🆓 Free AI" or "💎 Premium AI" in chat
- Logs usage to database for analytics

### 3. Smart Component Detection
The AI understands Figma-specific commands:
- "Create a button" → Creates button component
- "Make a card" → Creates card component
- Includes helpful teacher notes

### 4. Transparency
- Console logs show which model responded
- UI displays model information
- Full cascade attempts visible in logs

## Usage Examples

### Basic Chat
```
User: "Hello"
AI: Uses free model (e.g., Gemini Flash Free)
Cost: $0.00
```

### Component Creation
```
User: "Create a button"
AI: May use better model for accuracy
Response: Creates button + provides design tip
Cost: $0.00 - $0.0002
```

### Complex Queries
```
User: "Explain design systems"
AI: May cascade to paid model for quality
Cost: $0.0001 - $0.0005
```

## Cost Estimates

Based on typical usage:
- **Free tier only**: $0/month (limited by rate limits)
- **Mixed usage**: ~$0.10-$1.00/month for active development
- **Heavy usage**: ~$1-5/month for team usage

## Monitoring

### Database Views
- `daily_model_stats` - Daily usage breakdown
- `model_performance` - Success rates and costs

### Console Logging
```javascript
[SmartAI] Trying model: google/gemini-flash-1.5-8b:free (FREE)
[SmartAI] Success with google/gemini-flash-1.5-8b:free
```

### UI Indicators
- Model name shown in chat
- Free/Paid badge
- Response time tracking

## Troubleshooting

### "All AI models failed"
- Check API keys are valid
- Verify you have credits on OpenRouter
- Check rate limits haven't been exceeded

### Slow Responses
- Free models may have higher latency
- Consider switching to `performance` strategy
- Check if cascading through multiple failed models

### Unexpected Costs
- Review `model_performance` view
- Check if free models are failing frequently
- Adjust `AI_STRATEGY` to `cost_optimized`

## Best Practices

1. **Development**: Use `cost_optimized` strategy
2. **Testing**: Monitor which models are actually being used
3. **Production**: Consider `balanced` or `performance` based on needs
4. **Monitoring**: Regular check `daily_model_stats` for usage patterns

## Future Enhancements

1. **Model Learning**: Track which models work best for specific queries
2. **User Preferences**: Let premium users choose preferred models
3. **Cost Budgets**: Set daily/monthly cost limits
4. **Model Caching**: Cache model selection for similar queries

The smart AI system ensures FigBud provides high-quality responses while minimizing costs through intelligent model selection!