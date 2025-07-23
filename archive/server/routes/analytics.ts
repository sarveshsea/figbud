import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/auth';
import { aiService } from '../services/ai-providers';

const router = Router();

// Get API usage statistics
router.get('/api-usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeframe = '24h', provider } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeframe) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setDate(now.getDate() - 1);
    }

    // Get API call statistics
    let query = supabase
      .from('api_calls')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .order('created_at', { ascending: false });

    if (provider) {
      query = query.eq('provider', provider as string);
    }

    const { data: apiCalls, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const stats = {
      timeframe,
      totalCalls: apiCalls?.length || 0,
      successfulCalls: apiCalls?.filter(call => call.response_status === 200).length || 0,
      failedCalls: apiCalls?.filter(call => call.response_status !== 200).length || 0,
      avgResponseTime: 0,
      totalTokensUsed: 0,
      totalCostCents: 0,
      byProvider: {} as Record<string, any>,
      byHour: {} as Record<string, number>,
      errorTypes: {} as Record<string, number>
    };

    // Calculate averages and totals
    if (apiCalls && apiCalls.length > 0) {
      const totalTime = apiCalls.reduce((sum, call) => sum + (call.duration_ms || 0), 0);
      stats.avgResponseTime = Math.round(totalTime / apiCalls.length);
      stats.totalTokensUsed = apiCalls.reduce((sum, call) => sum + (call.tokens_used || 0), 0);
      stats.totalCostCents = apiCalls.reduce((sum, call) => sum + (call.cost_cents || 0), 0);

      // Group by provider
      apiCalls.forEach(call => {
        const provider = call.provider || 'unknown';
        if (!stats.byProvider[provider]) {
          stats.byProvider[provider] = {
            calls: 0,
            success: 0,
            failed: 0,
            avgResponseTime: 0,
            tokensUsed: 0,
            costCents: 0
          };
        }
        
        stats.byProvider[provider].calls++;
        if (call.response_status === 200) {
          stats.byProvider[provider].success++;
        } else {
          stats.byProvider[provider].failed++;
        }
        stats.byProvider[provider].tokensUsed += call.tokens_used || 0;
        stats.byProvider[provider].costCents += call.cost_cents || 0;
      });

      // Calculate average response times per provider
      Object.keys(stats.byProvider).forEach(provider => {
        const providerCalls = apiCalls.filter(call => call.provider === provider);
        const totalTime = providerCalls.reduce((sum, call) => sum + (call.duration_ms || 0), 0);
        stats.byProvider[provider].avgResponseTime = Math.round(totalTime / providerCalls.length);
      });

      // Group by hour
      apiCalls.forEach(call => {
        const hour = new Date(call.created_at).getHours();
        stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
      });

      // Count error types
      apiCalls.filter(call => call.response_status !== 200).forEach(call => {
        const errorType = call.response_body?.error || 'Unknown Error';
        stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
      });
    }

    res.json({
      success: true,
      stats,
      availableProviders: aiService.getAvailableProviders()
    });

  } catch (error) {
    console.error('API usage stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API usage statistics'
    });
  }
});

// Get YouTube API statistics
router.get('/youtube-stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeframe) {
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
      default:
        startTime.setDate(now.getDate() - 7);
    }

    // Get YouTube search statistics from Redis cache hits
    const { data: youtubeData, error } = await supabase
      .from('api_cache')
      .select('*')
      .like('cache_key', 'youtube:%')
      .gte('created_at', startTime.toISOString());

    if (error) throw error;

    // Get timestamp cache statistics
    const { data: timestampData, error: timestampError } = await supabase
      .from('youtube_timestamps')
      .select('*')
      .gte('created_at', startTime.toISOString());

    if (timestampError) throw timestampError;

    const stats = {
      timeframe,
      totalSearches: youtubeData?.length || 0,
      cacheHitRate: 0,
      totalVideosWithTimestamps: timestampData?.length || 0,
      timestampExtractionMethods: {
        description: 0,
        ai_generated: 0,
        manual: 0
      },
      popularChannels: {} as Record<string, number>,
      avgTimestampsPerVideo: 0
    };

    // Calculate cache hit rate
    if (youtubeData && youtubeData.length > 0) {
      const totalHits = youtubeData.reduce((sum, item) => sum + (item.hit_count || 0), 0);
      stats.cacheHitRate = (totalHits / (youtubeData.length + totalHits)) * 100;
    }

    // Analyze timestamp data
    if (timestampData && timestampData.length > 0) {
      let totalTimestamps = 0;
      
      timestampData.forEach(video => {
        // Count extraction methods
        const method = video.extraction_method || 'description';
        stats.timestampExtractionMethods[method]++;
        
        // Count timestamps
        if (video.timestamps && Array.isArray(video.timestamps)) {
          totalTimestamps += video.timestamps.length;
        }
        
        // Track popular channels
        if (video.channel_name) {
          stats.popularChannels[video.channel_name] = 
            (stats.popularChannels[video.channel_name] || 0) + 1;
        }
      });
      
      stats.avgTimestampsPerVideo = Math.round(totalTimestamps / timestampData.length * 10) / 10;
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('YouTube stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve YouTube statistics'
    });
  }
});

// Get chat session analytics
router.get('/chat-analytics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeframe = '24h' } = req.query;
    
    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    
    switch (timeframe) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      default:
        startTime.setDate(now.getDate() - 1);
    }

    // Get chat statistics
    const { data: sessions, error: sessionError } = await supabase
      .from('chat_sessions')
      .select('*')
      .gte('created_at', startTime.toISOString());

    if (sessionError) throw sessionError;

    const { data: messages, error: messageError } = await supabase
      .from('chat_messages')
      .select('*')
      .gte('created_at', startTime.toISOString());

    if (messageError) throw messageError;

    const { data: intents, error: intentError } = await supabase
      .from('intent_analysis')
      .select('*')
      .gte('created_at', startTime.toISOString());

    if (intentError) throw intentError;

    // Calculate statistics
    const stats = {
      timeframe,
      totalSessions: sessions?.length || 0,
      activeSessions: sessions?.filter(s => !s.ended_at).length || 0,
      totalMessages: messages?.length || 0,
      avgMessagesPerSession: 0,
      totalIntentsDetected: intents?.length || 0,
      topIntents: {} as Record<string, number>,
      topComponents: {} as Record<string, number>,
      avgConfidence: 0,
      userTypes: {
        authenticated: 0,
        anonymous: 0
      }
    };

    // Calculate averages
    if (sessions && sessions.length > 0 && messages) {
      stats.avgMessagesPerSession = Math.round(messages.length / sessions.length * 10) / 10;
      
      // Count user types
      sessions.forEach(session => {
        if (session.is_anonymous) {
          stats.userTypes.anonymous++;
        } else {
          stats.userTypes.authenticated++;
        }
      });
    }

    // Analyze intents
    if (intents && intents.length > 0) {
      let totalConfidence = 0;
      
      intents.forEach(intent => {
        // Count actions
        if (intent.detected_action) {
          stats.topIntents[intent.detected_action] = 
            (stats.topIntents[intent.detected_action] || 0) + 1;
        }
        
        // Count component types
        if (intent.component_types && Array.isArray(intent.component_types)) {
          intent.component_types.forEach(type => {
            stats.topComponents[type] = (stats.topComponents[type] || 0) + 1;
          });
        }
        
        // Sum confidence
        totalConfidence += intent.confidence || 0;
      });
      
      stats.avgConfidence = Math.round(totalConfidence / intents.length * 100) / 100;
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Chat analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat analytics'
    });
  }
});

// Get real-time health metrics
router.get('/health-metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        redis: 'unknown',
        youtube: 'unknown',
        ai: 'unknown'
      },
      performance: {
        avgApiResponseTime: 0,
        activeConnections: 0,
        memoryUsageMB: 0,
        uptime: process.uptime()
      }
    };

    // Check database health
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      metrics.services.database = error ? 'down' : 'up';
    } catch {
      metrics.services.database = 'down';
    }

    // Check AI service health
    const availableProviders = aiService.getAvailableProviders();
    metrics.services.ai = availableProviders.length > 0 ? 'up' : 'down';

    // Check YouTube API (by checking if key exists)
    metrics.services.youtube = process.env.YOUTUBE_API_KEY ? 'up' : 'down';

    // Memory usage
    const memUsage = process.memoryUsage();
    metrics.performance.memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);

    // Get recent API response times
    const recentCalls = await supabase
      .from('api_calls')
      .select('duration_ms')
      .order('created_at', { ascending: false })
      .limit(100);

    if (recentCalls.data && recentCalls.data.length > 0) {
      const totalTime = recentCalls.data.reduce((sum, call) => sum + (call.duration_ms || 0), 0);
      metrics.performance.avgApiResponseTime = Math.round(totalTime / recentCalls.data.length);
    }

    res.json({
      success: true,
      metrics
    });

  } catch (error) {
    console.error('Health metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve health metrics'
    });
  }
});

export default router;