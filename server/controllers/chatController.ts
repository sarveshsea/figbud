import { Request, Response } from 'express';
import axios from 'axios';
import { DB } from '../config/databaseConfig';
import { AuthenticatedRequest } from '../middleware/auth';
import { OpenAIService } from '../services/openai';
import { YouTubeService } from '../services/youtube';
import { aiService } from '../services/ai-providers';

export class ChatController {
  static async processMessage(req: AuthenticatedRequest, res: Response) {
    const { message, context } = req.body;
    const preferredProvider = req.body.provider || req.headers['x-ai-provider'] as string;
    
    try {
      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Process message with AI service (supports multiple providers)
      const user = req.userId ? await DB.findUserById(req.userId) : null;
      const skillLevel = user?.preferences?.skillLevel || 'beginner';
      
      // Add timing for logging
      const startTime = Date.now();
      const enhancedContext = { ...context, userId: req.userId, startTime };
      
      const response = await aiService.processQuery(
        message, 
        enhancedContext, 
        skillLevel,
        preferredProvider
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
        response: response.text,
        metadata: response.metadata || {},
        provider: response.provider,
        model: (response.metadata as any)?.model || 'unknown',
        isFree: (response.metadata as any)?.isFree || false,
        attempts: (response.metadata as any)?.attempts || [],
        availableProviders: aiService.getAvailableProviders()
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