import { Router } from 'express';
import { EnhancedAIProvider } from '../services/enhanced-ai-provider';
import { databaseService } from '../services/database';
import { YouTubeService, Tutorial } from '../services/youtube-service';
import { firebaseService } from '../services/firebase-service';
import { APIKeyValidator } from '../utils/api-key-validation';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// System prompt for FigBud
const SYSTEM_PROMPT = `You are FigBud, a friendly AI design teacher and assistant for Figma. You help users learn design through conversation and by creating UI components.

Your personality:
- Warm, encouraging, and patient teacher
- Use conversational language, not formal documentation style
- Share design wisdom through stories and examples
- Celebrate user progress and experimentation
- Use emojis occasionally to add warmth (but don't overdo it)

When responding:
1. First, acknowledge what the user said in a natural, conversational way
2. If they're asking to create something, identify the component type
3. If they're asking questions, provide helpful explanations
4. Always think about what would help them learn, not just complete a task

For component creation requests, respond in JSON format:
{
  "message": "Your conversational, encouraging response that acknowledges their request and teaches something",
  "componentType": "button/card/input/badge/text/navbar/modal/form",
  "properties": {
    // Extract properties from their natural language request
    "label": "...",
    "variant": "...",
    "size": "...",
    // Include sensible defaults for unspecified properties
  },
  "suggestions": [
    // 3-4 contextual next steps that build on what they just learned
  ],
  "teacherNote": "A practical tip about this component or design principle",
  "tutorialQuery": "What to search for to find relevant video tutorials"
}

For general questions or conversation:
{
  "message": "Your helpful, conversational response",
  "tutorialQuery": "Related tutorial search term if applicable",
  "suggestions": [
    // Relevant next actions or things to try
  ]
}

Remember:
- Users are here to LEARN, not just get components made
- Every interaction is a teaching opportunity
- Connect design decisions to real-world use cases
- If unsure about component type, ask clarifying questions
- Encourage best practices through positive reinforcement`;

router.post('/message', async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Get or create conversation ID
    const conversationId = context?.conversationId || uuidv4();
    
    // Extract and validate user API keys from headers
    const { valid: userApiKeys, errors: validationErrors } = APIKeyValidator.extractAndValidateKeys(req.headers);
    
    // Log validation errors if any (but don't fail the request)
    if (validationErrors.length > 0) {
      console.warn('[Chat] API key validation warnings:', validationErrors);
    }
    
    // Retrieve conversation history for context
    let conversationHistory: any[] = [];
    try {
      conversationHistory = await databaseService.getConversationHistory(conversationId);
      console.log(`[Chat] Retrieved ${conversationHistory.length} messages from history`);
    } catch (error) {
      console.error('[Chat] Failed to retrieve conversation history:', error);
      // Continue without history if retrieval fails
    }
    
    // Build context with conversation history
    const enhancedContext = {
      ...context,
      conversationId,
      history: conversationHistory.slice(-10) // Last 10 messages for context
    };
    
    // Create AI provider instance with strategy from environment
    const aiStrategy = process.env.AI_STRATEGY as any || 'cost_optimized';
    const aiProvider = new EnhancedAIProvider(userApiKeys, aiStrategy);
    
    // Process AI request, YouTube search, and Firebase search in parallel
    const [response, tutorials, firebaseResults] = await Promise.all([
      // AI processing
      aiProvider.processQuery(
        message,
        enhancedContext,
        SYSTEM_PROMPT
      ),
      // YouTube search (non-blocking)
      (async () => {
        try {
          console.log('[Chat] Searching for YouTube tutorials...');
          
          // First check if message contains YouTube URLs
          const youtubeUrlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/gi;
          const youtubeUrls = message.match(youtubeUrlPattern);
          
          if (youtubeUrls && youtubeUrls.length > 0) {
            console.log(`[Chat] Found ${youtubeUrls.length} YouTube URL(s) in message`);
            const videoPromises = youtubeUrls.map(async url => {
              const videoId = YouTubeService.extractVideoId(url);
              if (videoId) {
                console.log(`[Chat] Fetching details for video ID: ${videoId}`);
                return YouTubeService.getVideoById(videoId, {
                  userApiKey: userApiKeys['X-YouTube-Key']
                });
              }
              return null;
            });
            
            const videos = await Promise.all(videoPromises);
            const validVideos = videos.filter(v => v !== null) as Tutorial[];
            
            if (validVideos.length > 0) {
              console.log(`[Chat] Successfully fetched ${validVideos.length} YouTube video(s)`);
              return validVideos;
            }
          }
          
          // Check if user is asking about tutorials/learning
          const learningKeywords = ['tutorial', 'learn', 'how to', 'teach', 'show me', 'guide', 'help'];
          if (learningKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
            const topicMatch = message.match(/(?:about|learn|tutorial on)\s+(.+?)(?:\s+in\s+figma)?$/i);
            if (topicMatch) {
              console.log(`[Chat] Searching tutorials for topic: ${topicMatch[1]}`);
              return await YouTubeService.searchByTopic(topicMatch[1], {
                userApiKey: userApiKeys['X-YouTube-Key']
              });
            }
          }
          
          // Check for component keywords
          const componentKeywords = ['button', 'card', 'input', 'form', 'navbar', 'modal', 'badge'];
          const detectedComponent = componentKeywords.find(keyword => 
            message.toLowerCase().includes(keyword)
          );
          if (detectedComponent) {
            console.log(`[Chat] Searching tutorials for detected keyword: ${detectedComponent}`);
            return await YouTubeService.searchByComponent(detectedComponent, {
              userApiKey: userApiKeys['X-YouTube-Key']
            });
          }
          
          return [];
        } catch (error) {
          console.error('[Chat] Error searching YouTube tutorials:', error);
          return [];
        }
      })(),
      // Firebase search for additional resources (non-blocking)
      (async () => {
        try {
          console.log('[Chat] Searching Firebase for design resources...');
          const searchResults = await firebaseService.searchResources(message, 5);
          
          // Track search analytics
          if (searchResults.length > 0) {
            await firebaseService.trackSearch(message, searchResults.length);
          }
          
          return searchResults;
        } catch (error) {
          console.error('[Chat] Error searching Firebase:', error);
          return [];
        }
      })()
    ]);

    // After AI response, check if we need additional tutorials based on component type
    let finalTutorials = tutorials;
    if (response.metadata?.componentType && tutorials.length === 0) {
      try {
        console.log(`[Chat] Searching tutorials for component: ${response.metadata.componentType}`);
        finalTutorials = await YouTubeService.searchByComponent(response.metadata.componentType, {
          userApiKey: userApiKeys['X-YouTube-Key']
        });
      } catch (error) {
        console.error('[Chat] Error searching component tutorials:', error);
      }
    }
    
    console.log(`[Chat] Found ${finalTutorials.length} tutorials`);

    // Parse the response text if it's JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response.text);
    } catch (e) {
      // If not JSON, use as-is
      parsedResponse = { message: response.text };
    }

    // Parse and format response
    const formattedResponse = {
      text: parsedResponse.message || response.text, // Use the parsed message as primary text
      parsedResponse, // Add parsed version
      message: parsedResponse.message || response.text, // Extract message
      metadata: {
        ...response.metadata,
        ...parsedResponse, // Include all parsed fields
        model: response.metadata?.usedModel || response.metadata?.model || 'unknown',
        provider: response.provider,
        tutorials: finalTutorials.map(t => ({
          id: t.id,
          videoId: t.videoId,
          title: t.title,
          description: t.description || '',
          url: t.url,
          duration: t.duration,
          channelTitle: t.channelTitle,
          thumbnailUrl: t.thumbnailUrl,
          skillLevel: 'intermediate' as const, // Default skill level
          timestamps: t.timestamps.slice(0, 5) // Limit timestamps to top 5
        })),
        // Add Firebase search results if available
        designResources: firebaseResults.length > 0 ? firebaseResults : undefined
      },
      conversationId
    };

    // Send response immediately, store in database asynchronously
    res.json(formattedResponse);
    
    // Store in database (non-blocking)
    Promise.all([
      databaseService.storeChatMessage({
        conversationId,
        message,
        response: response.text,
        metadata: response.metadata
      }),
      response.metadata?.componentType ? 
        databaseService.storeComponentCreated({
          componentType: response.metadata.componentType,
          properties: response.metadata.properties || {},
          prompt: message,
          teacherNote: response.metadata.teacherNote
        }) : Promise.resolve()
    ]).catch(error => {
      console.error('[Chat] Error storing data in database:', error);
    });
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      text: "I'm having trouble processing that request. Please try again!",
      metadata: {
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Endpoint for searching tutorials
router.get('/tutorials', async (req, res) => {
  try {
    const { query, skillLevel, maxResults } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }
    
    console.log(`[Chat] Tutorial search request: "${query}"`);
    
    // Extract user YouTube API key if provided
    const userYouTubeKey = req.headers['x-youtube-key'] as string;
    
    // Search for tutorials
    const tutorials = await YouTubeService.searchByTopic(
      query as string,
      {
        maxResults: parseInt(maxResults as string) || 5,
        userApiKey: userYouTubeKey
      }
    );
    
    res.json({
      query,
      count: tutorials.length,
      tutorials
    });
  } catch (error) {
    console.error('Tutorial search error:', error);
    res.status(500).json({
      error: 'Failed to search tutorials',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Endpoint for getting conversation history
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, offset } = req.query;
    
    const history = await databaseService.getConversationHistory(conversationId);
    
    // Apply pagination if requested
    let messages = history;
    if (limit) {
      const startIndex = parseInt(offset as string) || 0;
      const endIndex = startIndex + parseInt(limit as string);
      messages = history.slice(startIndex, endIndex);
    }
    
    res.json({
      conversationId,
      totalMessages: history.length,
      messages
    });
  } catch (error) {
    console.error('Conversation history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve conversation history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Link preview endpoint
router.get('/link-preview', async (req: Request, res: Response) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Basic metadata extraction (can be enhanced with actual scraping)
    const metadata = {
      url,
      title: new URL(url).hostname,
      description: `Content from ${new URL(url).hostname}`,
      favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
    };

    // TODO: Implement proper Open Graph metadata extraction
    // This would involve fetching the URL and parsing meta tags
    
    res.json(metadata);
  } catch (error) {
    console.error('[Chat] Link preview error:', error);
    res.status(500).json({ error: 'Failed to fetch link preview' });
  }
});

export default router;