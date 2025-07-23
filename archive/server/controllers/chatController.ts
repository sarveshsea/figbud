import { Request, Response } from 'express';
import axios from 'axios';
import { DB } from '../config/databaseConfig';
import { AuthenticatedRequest } from '../middleware/auth';
import { OpenAIService } from '../services/openai';
import { YouTubeService } from '../services/youtube';
import { aiService } from '../services/ai-providers';
import { ResponseParser } from '../services/responseParser';
import { ComponentService } from '../services/componentService';
import { ChatService } from '../services/chatService';

export class ChatController {
  static async processMessage(req: AuthenticatedRequest, res: Response) {
    const { message, context, widgetSessionId } = req.body;
    const preferredProvider = req.body.provider || req.headers['x-ai-provider'] as string;
    
    try {
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      if (!widgetSessionId) {
        return res.status(400).json({
          success: false,
          message: 'Widget session ID is required'
        });
      }

      // Get or create session and conversation
      const { session, conversation } = await ChatService.getOrCreateSession(
        widgetSessionId,
        req.userId,
        { userAgent: req.headers['user-agent'], ip: req.ip }
      );

      if (!session || !conversation) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create chat session'
        });
      }

      // Store user message
      await ChatService.storeMessage(
        conversation.id,
        'user',
        message,
        { metadata: { context } }
      );

      // Process message with AI service (supports multiple providers)
      const user = req.userId ? await DB.findUserById(req.userId) : null;
      const skillLevel = user?.preferences?.skillLevel || 'beginner';
      
      // Add timing for logging
      const startTime = Date.now();
      const enhancedContext = { 
        ...context, 
        userId: req.userId, 
        sessionId: session.id,
        conversationId: conversation.id,
        startTime 
      };
      
      const response = await aiService.processQuery(
        message, 
        enhancedContext, 
        skillLevel,
        preferredProvider
      );

      // Parse the response to extract intent and keywords
      const enrichedResponse = await ResponseParser.parseResponse(response, message);

      // Fetch components if detected
      if (enrichedResponse.suggestedComponents && enrichedResponse.suggestedComponents.length > 0) {
        // Track component usage
        for (const component of enrichedResponse.suggestedComponents) {
          await ComponentService.trackComponentUsage(component.id, req.userId);
        }
      }

      // Search for YouTube tutorials if requested
      if (enrichedResponse.relatedTutorials && enrichedResponse.relatedTutorials.length > 0) {
        const tutorialResults = await Promise.all(
          enrichedResponse.relatedTutorials.map(async (tutorial) => {
            const videos = await YouTubeService.searchComponentTutorials(
              tutorial.searchQuery,
              undefined,
              2
            );
            return videos;
          })
        );
        enrichedResponse.relatedTutorials = tutorialResults.flat();
      }

      // Store intent analysis with session context
      if (enrichedResponse.intent) {
        await ChatService.storeIntentAnalysis(
          message,
          enrichedResponse.intent,
          session.id,
          conversation.id,
          req.userId
        );
      }

      // Store assistant response
      await ChatService.storeMessage(
        conversation.id,
        'assistant',
        enrichedResponse.text,
        enrichedResponse
      );

      // Update user analytics if authenticated
      if (req.userId) {
        const user = await DB.findUserById(req.userId);
        if (user) {
          DB.updateUser(req.userId, {
            analytics: {
              ...user.analytics,
              totalQueries: user.analytics.totalQueries + 1,
              lastActiveAt: new Date(),
            }
          });
        }
      }

      res.json({
        success: true,
        response: enrichedResponse.text,
        metadata: {
          ...enrichedResponse.metadata,
          intent: enrichedResponse.intent,
          components: enrichedResponse.suggestedComponents,
          tutorials: enrichedResponse.relatedTutorials,
          actionableSteps: enrichedResponse.actionableSteps
        },
        provider: enrichedResponse.provider,
        model: (enrichedResponse.metadata as any)?.model || 'unknown',
        isFree: (enrichedResponse.metadata as any)?.isFree || false,
        attempts: (enrichedResponse.metadata as any)?.attempts || [],
        availableProviders: aiService.getAvailableProviders(),
        conversationId: conversation.id,
        sessionId: session.id
      });

    } catch (error) {
      console.error('Process message error:', error);
      
      // Provide more detailed error messages
      let errorMessage = 'Failed to process message';
      const err = error as Error;
      if (err.message && err.message.includes('API key')) {
        errorMessage = 'AI service not configured. Please check API keys.';
      } else if (err.message && err.message.includes('provider')) {
        errorMessage = 'AI provider not available. Please check configuration.';
      }
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        provider: preferredProvider || 'unknown',
        availableProviders: aiService.getAvailableProviders()
      });
    }
  }

  static async searchTutorials(req: AuthenticatedRequest, res: Response) {
    try {
      const { query, skillLevel, maxResults = 5 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      // Check cache first
      const cachedTutorials = await DB.findCachedTutorials(query as string);
      if (cachedTutorials.length > 0) {
        return res.json({
          success: true,
          tutorials: cachedTutorials.slice(0, Number(maxResults)),
          cached: true
        });
      }

      // Search YouTube for tutorials
      const tutorials = await YouTubeService.searchTutorials(
        query as string, 
        skillLevel as string, 
        Number(maxResults)
      );

      // Cache results
      tutorials.forEach(tutorial => {
        DB.cacheTutorial({
          ...tutorial,
          cached: true,
          cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
      });

      // Update analytics
      if (req.userId) {
        const user = await DB.findUserById(req.userId);
        if (user) {
          DB.updateUser(req.userId, {
            analytics: {
              ...user.analytics,
              featureUsage: {
                ...user.analytics.featureUsage,
                tutorialSearch: user.analytics.featureUsage.tutorialSearch + 1,
              }
            }
          });
        }
      }

      res.json({
        success: true,
        tutorials: tutorials.slice(0, Number(maxResults)),
        cached: false
      });

    } catch (error) {
      console.error('Search tutorials error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search tutorials'
      });
    }
  }

  static async createDemo(req: AuthenticatedRequest, res: Response) {
    try {
      const { prompt, style, complexity } = req.body;

      if (!prompt) {
        return res.status(400).json({
          success: false,
          message: 'Demo prompt is required'
        });
      }

      // Check if user has premium access for advanced demos
      const user = req.userId ? await DB.findUserById(req.userId) : null;
      const isPremiumUser = user?.subscription.tier === 'premium';

      // Mock demo creation (replace with real template system)
      const demo = await mockDemoSearch(prompt);

      // Update analytics
      if (req.userId) {
        const user = await DB.findUserById(req.userId);
        if (user) {
          DB.updateUser(req.userId, {
            analytics: {
              ...user.analytics,
              demosCreated: user.analytics.demosCreated + 1,
              featureUsage: {
                ...user.analytics.featureUsage,
                demoCreation: user.analytics.featureUsage.demoCreation + 1,
              }
            }
          });
        }
      }

      res.json({
        success: true,
        demo: demo[0] || null,
        requiresPremium: (demo[0]?.isPremium || false) && !isPremiumUser
      });

    } catch (error) {
      console.error('Create demo error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create demo'
      });
    }
  }

  static async getGuidance(req: AuthenticatedRequest, res: Response) {
    try {
      const { query, context, userLevel } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Guidance query is required'
        });
      }

      // Use OpenAI for guidance generation
      const skillLevel = userLevel || 'beginner';
      const response = await OpenAIService.processDesignQuery(query, context, skillLevel);

      // Update analytics
      if (req.userId) {
        const user = await DB.findUserById(req.userId);
        if (user) {
          DB.updateUser(req.userId, {
            analytics: {
              ...user.analytics,
              featureUsage: {
                ...user.analytics.featureUsage,
                guidance: user.analytics.featureUsage.guidance + 1,
              }
            }
          });
        }
      }

      res.json({
        success: true,
        guidance: response.metadata?.guidance || [],
        message: response.text
      });

    } catch (error) {
      console.error('Get guidance error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate guidance'
      });
    }
  }

  static async analyzeDesign(req: AuthenticatedRequest, res: Response) {
    try {
      const { context, analysisType = 'general' } = req.body;

      if (!context) {
        return res.status(400).json({
          success: false,
          message: 'Design context is required'
        });
      }

      // Analyze design with OpenAI
      const response = await OpenAIService.analyzeDesign(
        context, 
        analysisType as 'color' | 'typography' | 'spacing' | 'general'
      );

      // Update analytics
      if (req.userId) {
        const user = await DB.findUserById(req.userId);
        if (user) {
          DB.updateUser(req.userId, {
            analytics: {
              ...user.analytics,
              totalQueries: user.analytics.totalQueries + 1,
              lastActiveAt: new Date(),
            }
          });
        }
      }

      res.json({
        success: true,
        analysis: response.text,
        suggestions: response.metadata?.suggestions || [],
        guidance: response.metadata?.guidance || []
      });

    } catch (error) {
      console.error('Design analysis error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to analyze design'
      });
    }
  }

  static async searchComponents(req: AuthenticatedRequest, res: Response) {
    try {
      const { keywords, types, limit = 10 } = req.body;

      if (!keywords || keywords.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Keywords are required for component search'
        });
      }

      // Search for components
      const components = await ComponentService.searchComponents(
        keywords,
        types,
        Number(limit)
      );

      // Get recommendations if user is authenticated
      let recommendations: any[] = [];
      if (req.userId && components.length < 5) {
        recommendations = await ComponentService.getRecommendations(
          req.userId,
          5 - components.length
        );
      }

      res.json({
        success: true,
        components,
        recommendations,
        total: components.length + recommendations.length
      });

    } catch (error) {
      console.error('Component search error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search components'
      });
    }
  }

  static async getComponentCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { componentId } = req.params;

      if (!componentId) {
        return res.status(400).json({
          success: false,
          message: 'Component ID is required'
        });
      }

      // Get component by ID
      const components = await ComponentService.searchComponents([], [componentId], 1);
      
      if (components.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Component not found'
        });
      }

      const component = components[0];
      if (!component) {
        return res.status(404).json({
          success: false,
          message: 'Component not found'
        });
      }
      
      const code = ComponentService.generateFigmaCode(component);

      // Track usage
      await ComponentService.trackComponentUsage(componentId, req.userId);

      res.json({
        success: true,
        component,
        code,
        onceUIMapping: component.onceUIMapping
      });

    } catch (error) {
      console.error('Get component code error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate component code'
      });
    }
  }

  static async getChatHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const history = await ChatService.getUserChatHistory(
        req.userId,
        Number(limit),
        Number(offset)
      );

      res.json({
        success: true,
        history,
        total: history.length
      });

    } catch (error) {
      console.error('Get chat history error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat history'
      });
    }
  }

  static async endChatSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { widgetSessionId } = req.body;

      if (!widgetSessionId) {
        return res.status(400).json({
          success: false,
          message: 'Widget session ID is required'
        });
      }

      await ChatService.endSession(widgetSessionId);

      res.json({
        success: true,
        message: 'Chat session ended successfully'
      });

    } catch (error) {
      console.error('End chat session error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to end chat session'
      });
    }
  }

  static async getConversationMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID is required'
        });
      }

      // Check access if user is authenticated
      if (req.userId) {
        const hasAccess = await ChatService.userHasAccessToConversation(
          req.userId,
          conversationId
        );

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this conversation'
          });
        }
      }

      const messages = await ChatService.getConversationMessages(conversationId);

      res.json({
        success: true,
        messages,
        total: messages.length
      });

    } catch (error) {
      console.error('Get conversation messages error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve conversation messages'
      });
    }
  }
}

// Helper functions (these would be replaced with real API integrations)

async function processMessageWithAI(message: string, context: any, userId?: string) {
  // Mock AI processing - replace with OpenAI API
  const responses = [
    {
      text: "I'd be happy to help! Here are some relevant tutorials and resources for your question.",
      metadata: {
        tutorials: await mockYouTubeSearch(message, 'beginner'),
      }
    },
    {
      text: "Let me create a demo for you based on your request.",
      metadata: {
        demos: await mockDemoSearch(message),
      }
    },
    {
      text: "Here are some step-by-step guidance tips for your design.",
      metadata: {
        guidance: await mockGuidanceGeneration(message, context, 'beginner'),
      }
    }
  ];

  // Simple logic to determine response type
  if (message.toLowerCase().includes('demo') || message.toLowerCase().includes('create')) {
    return responses[1];
  } else if (message.toLowerCase().includes('how') || message.toLowerCase().includes('guide')) {
    return responses[2];
  } else {
    return responses[0];
  }
}

async function mockYouTubeSearch(query: string, skillLevel?: string) {
  // Mock YouTube search results
  return [
    {
      id: '1',
      videoId: 'dQw4w9WgXcQ',
      title: `Figma Tutorial: ${query} for Beginners`,
      description: `Learn how to ${query.toLowerCase()} in Figma with this comprehensive tutorial.`,
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: 720,
      channelTitle: 'Figma Academy',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      skillLevel: skillLevel as any || 'beginner',
      relevanceScore: 0.95,
      publishedAt: new Date(),
      tags: [query.toLowerCase(), 'figma', 'tutorial'],
      views: 50000,
      timestamps: [
        {
          time: 120,
          description: 'Getting started',
          topic: 'Introduction',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=120s'
        },
        {
          time: 300,
          description: 'Core concepts',
          topic: 'Main tutorial',
          url: 'https://youtube.com/watch?v=dQw4w9WgXcQ&t=300s'
        }
      ]
    },
    {
      id: '2',
      videoId: 'dQw4w9WgXcQ',
      title: `Advanced ${query} Techniques in Figma`,
      description: `Master advanced ${query.toLowerCase()} techniques with these pro tips.`,
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: 1200,
      channelTitle: 'Design Pro',
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      skillLevel: 'advanced' as any,
      relevanceScore: 0.88,
      publishedAt: new Date(),
      tags: [query.toLowerCase(), 'figma', 'advanced'],
      views: 25000,
      timestamps: []
    }
  ];
}

async function mockDemoSearch(query: string) {
  // Mock demo templates
  return [
    {
      id: 'demo-1',
      name: `${query} Demo Template`,
      description: `A professional ${query.toLowerCase()} template ready to customize.`,
      category: 'website',
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Demo+Template',
      isPremium: false,
      figmaComponentKey: 'demo-component-key-1'
    },
    {
      id: 'demo-2',
      name: `Premium ${query} Kit`,
      description: `Advanced ${query.toLowerCase()} kit with multiple variants and components.`,
      category: 'mobile-app',
      thumbnailUrl: 'https://via.placeholder.com/400x300?text=Premium+Demo',
      isPremium: true,
      figmaComponentKey: 'demo-component-key-2'
    }
  ];
}

async function mockGuidanceGeneration(query: string, context: any, userLevel: string) {
  // Mock guidance steps
  return [
    {
      id: 'step-1',
      title: 'Start with the basics',
      description: `First, let's understand the fundamentals of ${query.toLowerCase()}.`,
      action: 'Learn more',
      target: 'canvas',
      order: 1
    },
    {
      id: 'step-2',
      title: 'Apply the concept',
      description: `Now, try implementing ${query.toLowerCase()} in your current design.`,
      action: 'Try it',
      target: 'selection',
      order: 2
    },
    {
      id: 'step-3',
      title: 'Refine and improve',
      description: `Polish your ${query.toLowerCase()} implementation with these tips.`,
      action: 'Refine',
      target: 'canvas',
      order: 3
    }
  ];
}