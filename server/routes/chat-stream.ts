import { Router } from 'express';
import { EnhancedAIProvider } from '../services/enhanced-ai-provider';
import { databaseService } from '../services/database';
import { YouTubeService } from '../services/youtube-service';
import { MemoryCache, aiResponseCache, tutorialCache } from '../services/memory-cache';
import { APIKeyValidator } from '../utils/api-key-validation';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const SYSTEM_PROMPT = `You are FigBud, a friendly AI design teacher and assistant for Figma. You help users learn design through conversation and by creating UI components.

Your personality:
- Warm, encouraging, and patient teacher
- Use conversational language, not formal documentation style
- Share design wisdom through stories and examples
- Celebrate user progress and experimentation

When responding:
1. First understand what the user wants to learn or create
2. If they want a UI component, respond with proper JSON format including componentType and properties
3. If they're asking for help, provide clear, friendly guidance
4. Include teacherNote with design tips when creating components
5. Suggest related topics they might want to explore next

Always respond in JSON format with these fields:
{
  "message": "Your conversational response",
  "componentType": "button/card/form/etc (if creating a component)",
  "properties": { component properties if applicable },
  "teacherNote": "A helpful design tip or insight",
  "suggestions": ["Related topics or next steps"]
}`;

router.post('/stream/optimized', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const startTime = Date.now();
  
  // Send initial connection event
  res.write('event: connected\ndata: {"status": "connected"}\n\n');
  
  // Send detailed agent status
  res.write(`event: agent_status\ndata: ${JSON.stringify({
    agents: [
      { name: 'Manager', status: 'active', task: 'Coordinating request' },
      { name: 'BackendEngineer', status: 'pending', task: 'Optimizing API calls' },
      { name: 'SolutionsArchitect', status: 'pending', task: 'Analyzing architecture' },
      { name: 'Debugger', status: 'monitoring', task: 'Tracking performance' }
    ]
  })}\n\n`);
  
  try {
    const { message, context = {} } = req.body;
    const conversationId = req.body.conversationId || uuidv4();
    
    // Extract and validate user API keys from headers
    const { valid: userApiKeys, errors: validationErrors } = APIKeyValidator.extractAndValidateKeys(req.headers);
    
    // Log validation errors if any (but don't fail the request)
    if (validationErrors.length > 0) {
      console.warn('[ChatStream] API key validation warnings:', validationErrors);
    }
    
    // Start all operations in parallel
    res.write(`event: status\ndata: ${JSON.stringify({ 
      status: 'processing',
      message: 'Starting parallel processing...'
    })}\n\n`);
    
    // Send detailed backend processes
    res.write(`event: backend_process\ndata: ${JSON.stringify({
      id: 'cache-check',
      name: 'Cache Lookup',
      status: 'active',
      message: 'Checking memory cache for previous responses'
    })}\n\n`);
    
    // 1. Get conversation history (non-blocking)
    const historyPromise = databaseService.getChatHistory(conversationId)
      .catch(error => {
        console.error('[Optimized] History retrieval failed:', error);
        return [];
      });
    
    // 2. Check AI cache
    const aiCacheKey = MemoryCache.generateKey(message, { context, systemPrompt: SYSTEM_PROMPT });
    const cachedAIResponse = aiResponseCache.get(aiCacheKey);
    
    // 3. Start AI query if not cached
    const aiStrategy = process.env.AI_STRATEGY as any || 'performance'; // Use performance for streaming
    const aiProvider = new EnhancedAIProvider(userApiKeys, aiStrategy);
    
    if (cachedAIResponse) {
      res.write(`event: backend_process\ndata: ${JSON.stringify({
        id: 'cache-check',
        name: 'Cache Lookup',
        status: 'completed',
        message: 'Found cached response!',
        details: { cacheHit: true }
      })}\n\n`);
    } else {
      res.write(`event: backend_process\ndata: ${JSON.stringify({
        id: 'ai-models',
        name: 'AI Model Query',
        status: 'active',
        message: 'Racing multiple AI models for fastest response',
        details: {
          models: ['gpt-4', 'claude-3', 'deepseek', 'mixtral'],
          strategy: 'first-to-respond-wins'
        }
      })}\n\n`);
    }
    
    const aiPromise = cachedAIResponse 
      ? Promise.resolve(cachedAIResponse)
      : aiProvider.processQuery(message, context, SYSTEM_PROMPT);
    
    // 4. Start YouTube search in parallel
    const tutorialPromise = YouTubeService.searchTutorials(
      message, 
      5, // maxResults
      userApiKeys['X-YouTube-Key'] // userApiKey
    ).catch(error => {
      console.error('[Optimized] Tutorial search failed:', error);
      return [];
    });
    
    // Wait for AI response first (most critical)
    const aiResponse = await aiPromise;
    const aiDuration = Date.now() - startTime;
    
    // Parse the response text if it's JSON
    let parsedResponse;
    let displayText;
    try {
      parsedResponse = JSON.parse(aiResponse.text);
      displayText = parsedResponse.message || aiResponse.text;
    } catch (e) {
      // If not JSON, use as-is
      parsedResponse = { message: aiResponse.text };
      displayText = aiResponse.text;
    }
    
    // Send AI response immediately
    res.write(`event: ai_response\ndata: ${JSON.stringify({
      text: displayText,
      metadata: {
        ...aiResponse.metadata,
        ...parsedResponse,
        responseTime: aiDuration,
        fromCache: !!cachedAIResponse
      },
      provider: aiResponse.provider
    })}\n\n`);
    
    // Send status update
    res.write(`event: status\ndata: ${JSON.stringify({ 
      status: 'ai_complete',
      message: `AI responded in ${aiDuration}ms`,
      duration: aiDuration
    })}\n\n`);
    
    // Store in database (non-blocking)
    const dbPromise = databaseService.storeChatInteraction({
      conversationId,
      userId: context.userId || 'anonymous',
      message,
      response: displayText,
      metadata: {
        ...aiResponse.metadata,
        ...parsedResponse,
        context: context
      }
    }).catch(error => {
      console.error('[Optimized] Database storage failed:', error);
    });
    
    // Wait for tutorials and send when ready
    tutorialPromise.then(tutorials => {
      console.log(`[ChatStream] Tutorial promise resolved with ${tutorials?.length || 0} tutorials`);
      if (tutorials && tutorials.length > 0) {
        res.write(`event: tutorials\ndata: ${JSON.stringify({
          tutorials: tutorials.map(t => ({
            id: t.id,
            videoId: t.videoId,
            title: t.title,
            description: t.description || '',
            url: t.url,
            duration: t.duration,
            channelTitle: t.channelTitle,
            thumbnailUrl: t.thumbnailUrl,
            skillLevel: 'intermediate' as const,
            timestamps: t.timestamps?.slice(0, 5) || []
          })),
          count: tutorials.length
        })}\n\n`);
      } else {
        console.log('[ChatStream] No tutorials found or error occurred');
      }
    }).catch(error => {
      console.error('[ChatStream] Tutorial promise error:', error);
    });
    
    // Get conversation history for context (already started)
    const conversationHistory = await historyPromise;
    
    // Send performance summary
    const totalDuration = Date.now() - startTime;
    res.write(`event: performance_summary\ndata: ${JSON.stringify({
      totalDuration,
      aiResponseTime: aiDuration,
      fromCache: !!cachedAIResponse,
      model: aiResponse.metadata?.model,
      conversationLength: conversationHistory.length
    })}\n\n`);
    
    // Send completion event
    res.write(`event: complete\ndata: ${JSON.stringify({
      status: 'complete',
      conversationId,
      totalDuration
    })}\n\n`);
    
    // Don't wait for database storage
    await Promise.race([
      dbPromise,
      new Promise(resolve => setTimeout(resolve, 100)) // Wait max 100ms for DB
    ]);
    
  } catch (error) {
    console.error('[Optimized] Error:', error);
    
    // Send error event
    res.write(`event: error\ndata: ${JSON.stringify({
      error: error.message || 'An error occurred',
      status: 'error'
    })}\n\n`);
  } finally {
    // Close the connection
    res.end();
  }
});

// Health check endpoint
router.get('/stream/optimized/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'chat-stream-optimized',
    features: [
      'race-based-ai',
      'parallel-processing', 
      'response-streaming',
      'smart-caching'
    ]
  });
});

export default router;