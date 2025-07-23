# FigBud AI Integration Guide

## Overview

FigBud uses DeepSeek and OpenRouter as AI providers to power intelligent design assistance. The system implements a smart cascading approach that prioritizes free models first, then falls back to cost-effective paid models.

## 🤖 AI Providers

### 1. DeepSeek (Primary)
- **Model**: `deepseek-chat`
- **Cost**: $0.14 per 1M input tokens / $0.28 per 1M output tokens
- **API Key**: Configured in `.env` as `DEEPSEEK_API_KEY`
- **Features**: Off-peak hours support for reduced costs

### 2. OpenRouter (Secondary)
- **Free Models Available**:
  - `google/gemini-2.0-flash-thinking-exp:free`
  - `google/gemini-flash-1.5-8b:free`
  - `microsoft/phi-3-mini-128k-instruct:free`
  - `meta-llama/llama-3.2-1b-instruct:free`
- **API Key**: Configured in `.env` as `OPENROUTER_API_KEY`

## 🚀 Setup Instructions

### 1. Backend Server Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file with:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development
   
   # AI Providers
   DEFAULT_AI_PROVIDER=deepseek
   DEEPSEEK_API_KEY=your-deepseek-api-key
   OPENROUTER_API_KEY=your-openrouter-api-key
   
   # Database (Supabase)
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

3. **Start the Server**:
   ```bash
   npm run server:dev
   ```

   The server will run on `http://localhost:3000`

### 2. Figma Plugin Configuration

The AI service is embedded directly in the `ui.html` file. To configure:

1. **Update API Endpoint** (if needed):
   - Default: `http://localhost:3000/api`
   - For production, update the endpoint in `ui.html`:
   ```javascript
   this.apiEndpoint = window.FIGBUD_API_ENDPOINT || 'https://your-server.com/api';
   ```

2. **CORS Configuration**:
   The server is configured to accept requests from:
   - `https://figma.com`
   - `https://www.figma.com`
   - `http://localhost:*`
   - Local file URLs

## 💬 Chat Features

### Natural Language Processing
The AI understands natural language requests like:
- "Create a button"
- "I need a login form"
- "Design a dark themed card"
- "Make a navigation bar"

### Component Detection
The system automatically detects when users want to create:
- Buttons
- Cards
- Input fields
- Forms
- Navigation bars
- Toggle switches

### Response Format
AI responses include:
```json
{
  "response": "I'll create a beautiful button for you!",
  "model": "deepseek-chat",
  "provider": "deepseek",
  "detectedComponents": ["button"],
  "action": {
    "type": "create_component",
    "component": "button",
    "props": {
      "text": "Click me",
      "variant": "primary"
    }
  }
}
```

## 🎨 Component Creation Flow

1. **User Message** → Sent to AI service
2. **AI Analysis** → Detects intent and components
3. **Response Generation** → AI provides helpful response
4. **Component Detection** → System identifies components to create
5. **Figma Creation** → Components are created in the canvas

## 🔧 Advanced Features

### Smart Provider Selection
The system implements intelligent model selection:
1. **Cost Optimized**: Tries free models first
2. **Performance**: Uses best models regardless of cost
3. **Balanced**: Mix of cost and performance

### Caching
- Responses are cached for 24 hours in Supabase
- Reduces API costs for repeated queries

### Error Handling
- Graceful fallback to local processing
- User-friendly error messages
- Automatic retry with different models

## 🧪 Testing

### Test Page
Use `test-ai-integration.html` to test the AI service:
```bash
open test-ai-integration.html
```

### Test Commands
```javascript
// Test basic message
await aiService.sendMessage("Hello");

// Test component creation
await aiService.sendMessage("Create a button");

// Test with context
await aiService.sendMessage("Design a login form", {
  style: "modern",
  theme: "dark"
});
```

## 📊 Monitoring

### API Usage Tracking
All API calls are logged in the database:
- Model used
- Tokens consumed
- Response time
- Cost calculation

### Database Tables
- `api_calls`: Logs all API requests
- `api_cache`: Stores cached responses
- `model_usage`: Tracks model performance

## 🚨 Troubleshooting

### Common Issues

1. **"Cannot connect to AI service"**
   - Ensure server is running: `npm run server:dev`
   - Check server logs for errors
   - Verify API keys in `.env`

2. **CORS Errors**
   - Make sure you're accessing from allowed origins
   - Check browser console for specific CORS messages

3. **Slow Responses**
   - Free models may have higher latency
   - Consider upgrading to paid models for production

### Debug Mode
Enable debug logging in the browser console:
```javascript
// In ui.html, add to AIService constructor:
this.debug = true;
```

## 🔐 Security

### API Key Protection
- Never expose API keys in client code
- All keys are stored server-side
- Use environment variables

### Request Validation
- All requests are validated server-side
- Rate limiting is implemented
- Authentication can be added as needed

## 📈 Cost Optimization

### Tips for Reducing Costs
1. **Use Free Models First**: System automatically tries free models
2. **Enable Caching**: Reduces repeated API calls
3. **Implement Rate Limiting**: Prevents abuse
4. **Monitor Usage**: Track costs in the database

### Cost Tracking
The system tracks costs per request:
```sql
SELECT 
  model,
  SUM(input_tokens) as total_input,
  SUM(output_tokens) as total_output,
  SUM(cost) as total_cost
FROM api_calls
GROUP BY model;
```

## 🚀 Production Deployment

### Recommended Setup
1. Deploy server to cloud (Vercel, Railway, etc.)
2. Use environment variables for configuration
3. Enable HTTPS for security
4. Set up monitoring and alerts
5. Implement user authentication

### Environment Variables for Production
```env
NODE_ENV=production
DEFAULT_AI_PROVIDER=smart  # Uses intelligent selection
RATE_LIMIT_MAX_REQUESTS=50  # Adjust based on usage
```

---

**Last Updated**: December 2024
**Maintained By**: FigBud Development Team