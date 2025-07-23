import { google } from 'googleapis';
import { config } from 'dotenv';
import { Tutorial, TutorialTimestamp } from '../models/User';
import { RedisService } from './redis';
import { supabase } from '../config/supabase';

config();

// Initialize YouTube API client
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

export interface VideoTimestamp {
  time: string;
  seconds: number;
  title: string;
  url: string;
}

export class YouTubeService {
  // Prioritized Figma-related YouTube channels
  private static readonly FIGMA_CHANNELS = {
    official: [
      'UCQsVmhSa4X-G3lHlUtejzLA', // Figma official channel
      'UC-b3c7kxa5vU-bnmaROgvog', // Config (Figma conference)
    ],
    trusted: [
      'UCTIhfOopxukTIRkbXJ3kN-g', // DesignCourse
      'UCJQJ7GId4i1NepmJpb1VAEw', // The Futur Academy
      'UCvBGFeXbBrq3W9_0oNLJREQ', // Flux Academy
      'UCeB_OpLspKJGiKv1CYkWFFw', // AJ&Smart
      'UCzBkNPSxw15qrW_Y8p-oCUw', // High Resolution
      'UCW5gUZ7lKGrAbLOkHv2xfbw', // Mike Locke
      'UCNZnXvcHmfbHBEbtF9V6u7g', // Mizko
      'UCbqd2YmFeHMwxlj4NcN5zPQ', // Figma Guru
      'UC7gLo5ERvucOoV8z_V0vvTw', // UI Collective
    ],
    channelNames: {
      'Figma': 10,
      'Config': 8,
      'DesignCourse': 7,
      'The Futur Academy': 7,
      'Flux Academy': 6,
      'AJ&Smart': 6,
      'Figma Guru': 5,
      'UI Collective': 5,
      'Mizko': 5,
      'Mike Locke': 4
    }
  };

  static async searchTutorials(
    query: string, 
    skillLevel?: string,
    maxResults: number = 5
  ): Promise<Tutorial[]> {
    try {
      // Check Redis cache first
      const cacheKey = RedisService.keys.youtubeSearch(query, skillLevel);
      const cachedResults = await RedisService.getJSON<Tutorial[]>(cacheKey);
      if (cachedResults) {
        console.log('YouTube search served from cache');
        return cachedResults.slice(0, maxResults);
      }
      // Add Figma-specific keywords to improve relevance
      const enhancedQuery = `${query} Figma tutorial`;
      
      // Search for videos (fetch more to allow for filtering/sorting)
      const searchResponse = await youtube.search.list({
        part: ['snippet'],
        q: enhancedQuery,
        maxResults: maxResults * 2, // Fetch extra to allow for channel prioritization
        type: ['video'],
        videoDuration: skillLevel === 'beginner' ? 'short' : 'any',
        relevanceLanguage: 'en',
        order: 'relevance',
        safeSearch: 'strict'
      });

      if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
        return [];
      }

      // Get video details including duration
      const videoIds = searchResponse.data.items
        .map(item => item.id?.videoId)
        .filter(Boolean) as string[];

      const videosResponse = await youtube.videos.list({
        part: ['contentDetails', 'statistics'],
        id: videoIds
      });

      // Map results to Tutorial format with channel scoring
      const tutorialsWithScores = await Promise.all(
        searchResponse.data.items.map(async (item, index) => {
          const videoDetails = videosResponse.data.items?.[index];
          const duration = this.parseDuration(videoDetails?.contentDetails?.duration || 'PT0S');
          const channelId = item.snippet?.channelId || '';
          const channelTitle = item.snippet?.channelTitle || '';
          
          // Calculate channel priority score
          let channelScore = 0;
          if (this.FIGMA_CHANNELS.official.includes(channelId)) {
            channelScore = 100; // Highest priority for official channels
          } else if (this.FIGMA_CHANNELS.trusted.includes(channelId)) {
            channelScore = 50; // High priority for trusted channels
          } else {
            // Check channel name for known good channels
            for (const [name, score] of Object.entries(this.FIGMA_CHANNELS.channelNames)) {
              if (channelTitle.toLowerCase().includes(name.toLowerCase())) {
                channelScore = score * 5;
                break;
              }
            }
          }
          
          const tutorial: Tutorial = {
            id: item.id?.videoId || '',
            videoId: item.id?.videoId || '',
            title: item.snippet?.title || '',
            description: item.snippet?.description || '',
            thumbnailUrl: item.snippet?.thumbnails?.high?.url || 
                          item.snippet?.thumbnails?.default?.url || '',
            duration: duration,
            channelTitle: channelTitle,
            url: `https://youtube.com/watch?v=${item.id?.videoId}`,
            publishedAt: new Date(item.snippet?.publishedAt || Date.now()),
            skillLevel: this.determineSkillLevel(item.snippet?.title || '', duration),
            tags: this.extractTags(item.snippet?.title + ' ' + item.snippet?.description),
            views: parseInt(videoDetails?.statistics?.viewCount || '0'),
            timestamps: [],
            rating: this.calculateRating(videoDetails?.statistics),
            cached: false,
            cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          };
          
          // Enhance with timestamps
          const enhancedTutorial = await this.enhanceTutorialWithTimestamps(tutorial);
          
          return {
            tutorial: enhancedTutorial,
            score: channelScore + (tutorial.rating || 0) + (tutorial.views ? Math.log10(tutorial.views) : 0)
          };
        })
      );

      // Sort by score and take top results
      const sortedTutorials = tutorialsWithScores
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(item => item.tutorial);

      // Cache the results
      await RedisService.setJSON(cacheKey, sortedTutorials, RedisService.TTL.YOUTUBE_SEARCH);

      return sortedTutorials;
    } catch (error) {
      console.error('YouTube API error:', error);
      throw new Error('Failed to search YouTube tutorials');
    }
  }

  static async getVideoDetails(videoId: string): Promise<Tutorial | null> {
    try {
      // Check Redis cache first
      const cacheKey = RedisService.keys.youtubeVideo(videoId);
      const cachedVideo = await RedisService.getJSON<Tutorial>(cacheKey);
      if (cachedVideo) {
        console.log('YouTube video details served from cache');
        return cachedVideo;
      }
      const response = await youtube.videos.list({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: [videoId]
      });

      const video = response.data.items?.[0];
      if (!video) return null;

      const duration = this.parseDuration(video.contentDetails?.duration || 'PT0S');
      
      // Get video chapters if available
      let timestamps: TutorialTimestamp[] = [];
      
      // First, try to get chapters from the video description
      if (video.snippet?.description) {
        const extractedTimestamps = await this.extractTimestamps(
          videoId, 
          video.snippet.description,
          video.snippet.title || undefined,
          video.snippet.channelTitle || undefined
        );
        timestamps = extractedTimestamps.map(ts => ({
          time: ts.seconds,
          description: ts.title,
          topic: ts.title,
          url: ts.url
        }));
      }
      
      // If the video has chapters, YouTube API provides them in a special format
      // Check if the first timestamp is at 0:00 - this indicates chapters are available
      if (timestamps.length > 0 && timestamps[0] && timestamps[0].time === 0) {
        console.log(`Video ${videoId} has ${timestamps.length} chapters`);
      }
      
      const tutorial: Tutorial = {
        id: videoId,
        videoId: videoId,
        title: video.snippet?.title || '',
        description: video.snippet?.description || '',
        thumbnailUrl: video.snippet?.thumbnails?.high?.url || 
                      video.snippet?.thumbnails?.default?.url || '',
        duration: duration,
        channelTitle: video.snippet?.channelTitle || '',
        url: `https://youtube.com/watch?v=${videoId}`,
        publishedAt: new Date(video.snippet?.publishedAt || Date.now()),
        skillLevel: this.determineSkillLevel(video.snippet?.title || '', duration),
        tags: video.snippet?.tags || [],
        views: parseInt(video.statistics?.viewCount || '0'),
        timestamps: timestamps,
        rating: this.calculateRating(video.statistics),
        cached: false,
        cacheExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      // Cache the video details
      await RedisService.setJSON(cacheKey, tutorial, RedisService.TTL.YOUTUBE_VIDEO);
      
      return tutorial;
    } catch (error) {
      console.error('YouTube video details error:', error);
      return null;
    }
  }

  // Helper methods
  private static parseDuration(duration: string): number {
    // Parse ISO 8601 duration (e.g., PT1H30M45S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  private static determineSkillLevel(title: string, duration: number): 'beginner' | 'intermediate' | 'advanced' {
    const lowerTitle = title.toLowerCase();
    
    // Check for explicit skill level keywords
    if (lowerTitle.includes('beginner') || lowerTitle.includes('basic') || 
        lowerTitle.includes('introduction') || lowerTitle.includes('getting started')) {
      return 'beginner';
    }
    
    if (lowerTitle.includes('advanced') || lowerTitle.includes('expert') || 
        lowerTitle.includes('master') || lowerTitle.includes('pro tips')) {
      return 'advanced';
    }
    
    // Use duration as a heuristic
    if (duration < 600) { // Less than 10 minutes
      return 'beginner';
    } else if (duration > 1800) { // More than 30 minutes
      return 'advanced';
    }
    
    return 'intermediate';
  }

  private static extractTags(text: string): string[] {
    const keywords = [
      'figma', 'design', 'ui', 'ux', 'component', 'prototype',
      'tutorial', 'basics', 'advanced', 'tips', 'tricks',
      'workflow', 'plugin', 'auto layout', 'variants', 'animation'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword));
  }

  private static calculateRating(statistics: any): number {
    if (!statistics) return 0;
    
    const likes = parseInt(statistics.likeCount || '0');
    const views = parseInt(statistics.viewCount || '1');
    
    // Simple rating calculation based on like/view ratio
    const ratio = likes / views;
    
    // Convert to 1-5 scale
    if (ratio > 0.1) return 5;
    if (ratio > 0.05) return 4.5;
    if (ratio > 0.02) return 4;
    if (ratio > 0.01) return 3.5;
    return 3;
  }

  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Extract timestamps from video description with Supabase caching
   */
  static async extractTimestamps(
    videoId: string, 
    description: string, 
    videoTitle?: string,
    channelName?: string
  ): Promise<VideoTimestamp[]> {
    try {
      // Check Supabase cache first
      const { data: cachedData, error: cacheError } = await supabase
        .from('youtube_timestamps')
        .select('timestamps')
        .eq('video_id', videoId)
        .single();

      if (cachedData && cachedData.timestamps && Array.isArray(cachedData.timestamps)) {
        console.log(`Timestamps for video ${videoId} served from Supabase cache`);
        
        // Update access info - just update last_accessed for now
        await supabase
          .from('youtube_timestamps')
          .update({
            last_accessed: new Date().toISOString()
          })
          .eq('video_id', videoId);
        
        return cachedData.timestamps as VideoTimestamp[];
      }

      // Extract timestamps from description
      const timestamps: VideoTimestamp[] = [];
      
      // Enhanced timestamp patterns to catch more formats
      const patterns = [
        // Standard formats
        /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+)/gm,           // 0:00 - Introduction
        /(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/gm,                    // 0:00 Introduction
        /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)/gm,                // [0:00] Introduction
        /(.+)\s*@?\s*(\d{1,2}:\d{2}(?::\d{2})?)/gm,               // Introduction @ 0:00
        
        // Additional formats commonly used
        /(\d{1,2}:\d{2}(?::\d{2})?)\s*[|｜]\s*(.+)/gm,           // 0:00 | Introduction
        /(\d{1,2}:\d{2}(?::\d{2})?)\s*:\s*(.+)/gm,                // 0:00 : Introduction
        /(\d{1,2}:\d{2}(?::\d{2})?)\s*→\s*(.+)/gm,                // 0:00 → Introduction
        /(\d{1,2}:\d{2}(?::\d{2})?)\s*》\s*(.+)/gm,               // 0:00 》 Introduction
        /【(\d{1,2}:\d{2}(?::\d{2})?)】\s*(.+)/gm,                // 【0:00】 Introduction
        /\((\d{1,2}:\d{2}(?::\d{2})?)\)\s*(.+)/gm,                // (0:00) Introduction
        /^(\d{1,2}:\d{2}(?::\d{2})?)\s*(.+)/gm,                   // 0:00 at line start
        /^\s*•\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]?\s*(.+)/gm,  // • 0:00 - Introduction
        /^➜\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(.+)/gm,               // ➜ 0:00 Introduction
        /^⏱\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*(.+)/gm,               // ⏱ 0:00 Introduction
      ];

      // Process each pattern
      for (const pattern of patterns) {
        let match;
        pattern.lastIndex = 0; // Reset regex state
        
        while ((match = pattern.exec(description)) !== null) {
          let timeStr: string;
          let title: string;
          
          // Handle different capture group orders
          if (this.isValidTimeString(match[1])) {
            timeStr = match[1];
            title = match[2];
          } else if (match[2] && this.isValidTimeString(match[2])) {
            timeStr = match[2];
            title = match[1];
          } else {
            continue;
          }
          
          const seconds = this.timeStringToSeconds(timeStr);
          
          // Clean up the title
          title = title.trim()
            .replace(/^[-–—:→》｜|•➜⏱\s]+/, '')  // Remove leading separators
            .replace(/[-–—:→》｜|•➜⏱\s]+$/, '')  // Remove trailing separators
            .trim();
          
          if (title && title.length > 0) {
            timestamps.push({
              time: timeStr,
              seconds,
              title,
              url: `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`
            });
          }
        }
      }

      // Special handling for numbered lists with timestamps
      const numberedPattern = /^\s*\d+\.\s*(.+?)\s*[-–—]?\s*(\d{1,2}:\d{2}(?::\d{2})?)/gm;
      let match;
      while ((match = numberedPattern.exec(description)) !== null) {
        const title = match[1].trim();
        const timeStr = match[2];
        
        if (this.isValidTimeString(timeStr)) {
          const seconds = this.timeStringToSeconds(timeStr);
          timestamps.push({
            time: timeStr,
            seconds,
            title,
            url: `https://www.youtube.com/watch?v=${videoId}&t=${seconds}s`
          });
        }
      }

      // Remove duplicates and sort by time
      const uniqueTimestamps = Array.from(
        new Map(timestamps.map(t => [t.seconds, t])).values()
      ).sort((a, b) => a.seconds - b.seconds);

      // Filter out timestamps that are too similar (within 5 seconds)
      const filteredTimestamps: VideoTimestamp[] = [];
      for (let i = 0; i < uniqueTimestamps.length; i++) {
        const currentTimestamp = uniqueTimestamps[i];
        const previousTimestamp = i > 0 ? uniqueTimestamps[i - 1] : null;
        
        if (currentTimestamp && (i === 0 || !previousTimestamp || currentTimestamp.seconds - previousTimestamp.seconds >= 5)) {
          filteredTimestamps.push(currentTimestamp);
        }
      }

      // Cache the extracted timestamps in Supabase
      if (filteredTimestamps.length > 0) {
        const { error: insertError } = await supabase
          .from('youtube_timestamps')
          .upsert({
            video_id: videoId,
            video_title: videoTitle || null,
            channel_name: channelName || null,
            timestamps: filteredTimestamps,
            extraction_method: 'description',
            extracted_at: new Date().toISOString()
          }, {
            onConflict: 'video_id'
          });

        if (insertError) {
          console.error('Error caching timestamps:', insertError);
        } else {
          console.log(`Cached timestamps for video ${videoId}`);
        }
      }

      return filteredTimestamps;
    } catch (error) {
      console.error('Error extracting timestamps:', error);
      return [];
    }
  }

  private static isValidTimeString(str: string): boolean {
    return /^\d{1,2}:\d{2}(?::\d{2})?$/.test(str);
  }

  private static timeStringToSeconds(timeStr: string): number {
    const parts = timeStr.split(':').map(p => parseInt(p));
    if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined && parts[2] !== undefined) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2 && parts[0] !== undefined && parts[1] !== undefined) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  /**
   * Search for tutorials based on component type and topic
   */
  static async searchComponentTutorials(
    componentType: string,
    topic?: string,
    maxResults: number = 3
  ): Promise<Tutorial[]> {
    // Build search query
    let searchQuery = `Figma ${componentType}`;
    if (topic) {
      searchQuery += ` ${topic}`;
    }
    searchQuery += ' tutorial';

    const tutorials = await this.searchTutorials(searchQuery, undefined, maxResults);
    
    // Enhance with timestamps
    const enhancedTutorials = await Promise.all(
      tutorials.map(async (tutorial) => {
        // Use the enhanceTutorialWithTimestamps method which includes caching
        return await this.enhanceTutorialWithTimestamps(tutorial);
      })
    );

    return enhancedTutorials;
  }

  /**
   * Get tutorial recommendations based on user's intent
   */
  static async getRecommendedTutorials(
    keywords: string[],
    componentTypes: string[],
    userLevel: string = 'beginner'
  ): Promise<Tutorial[]> {
    const recommendations: Tutorial[] = [];
    
    // Search for component-specific tutorials
    if (componentTypes.length > 0) {
      for (const component of componentTypes.slice(0, 2)) {
        const tutorials = await this.searchTutorials(
          `${component} Figma tutorial ${userLevel}`,
          userLevel,
          2
        );
        recommendations.push(...tutorials);
      }
    }

    // Search for keyword-based tutorials
    if (keywords.length > 0 && recommendations.length < 5) {
      const keywordQuery = keywords.slice(0, 3).join(' ');
      const tutorials = await this.searchTutorials(
        `${keywordQuery} Figma`,
        userLevel,
        3
      );
      recommendations.push(...tutorials);
    }

    // Remove duplicates
    const uniqueTutorials = Array.from(
      new Map(recommendations.map(t => [t.videoId, t])).values()
    );

    return uniqueTutorials.slice(0, 5);
  }

  /**
   * Generate AI-based timestamps for videos without chapters
   * This is a fallback when no timestamps are found in the description
   */
  static generateAITimestamps(
    videoTitle: string,
    videoDuration: number,
    videoDescription: string
  ): VideoTimestamp[] {
    // Common tutorial structure based on duration
    const timestamps: VideoTimestamp[] = [];
    
    if (videoDuration < 300) { // Less than 5 minutes
      timestamps.push({
        time: '0:00',
        seconds: 0,
        title: 'Introduction',
        url: ''
      });
      
      if (videoDuration > 120) {
        timestamps.push({
          time: '1:00',
          seconds: 60,
          title: 'Main Content',
          url: ''
        });
      }
    } else if (videoDuration < 900) { // 5-15 minutes
      timestamps.push(
        { time: '0:00', seconds: 0, title: 'Introduction', url: '' },
        { time: '1:00', seconds: 60, title: 'Getting Started', url: '' },
        { time: `${Math.floor(videoDuration/3/60)}:${Math.floor(videoDuration/3%60).toString().padStart(2,'0')}`, 
          seconds: Math.floor(videoDuration/3), title: 'Main Tutorial', url: '' },
        { time: `${Math.floor(videoDuration*2/3/60)}:${Math.floor(videoDuration*2/3%60).toString().padStart(2,'0')}`, 
          seconds: Math.floor(videoDuration*2/3), title: 'Advanced Tips', url: '' }
      );
    } else { // More than 15 minutes
      const segments = 5;
      const segmentDuration = videoDuration / segments;
      
      const topics = [
        'Introduction',
        'Basic Concepts',
        'Main Tutorial',
        'Advanced Features',
        'Conclusion & Next Steps'
      ];
      
      for (let i = 0; i < segments; i++) {
        const seconds = Math.floor(i * segmentDuration);
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        timestamps.push({
          time: `${minutes}:${secs.toString().padStart(2, '0')}`,
          seconds,
          title: topics[i] || `Part ${i + 1}`,
          url: ''
        });
      }
    }
    
    // Add video ID to URLs
    return timestamps;
  }

  /**
   * Enhance tutorial search with better timestamp handling
   */
  static async enhanceTutorialWithTimestamps(tutorial: Tutorial): Promise<Tutorial> {
    try {
      // If we already have timestamps, return as is
      if (tutorial.timestamps && tutorial.timestamps.length > 0) {
        return tutorial;
      }
      
      // Try to extract timestamps from description
      if (tutorial.description) {
        const videoTimestamps = await this.extractTimestamps(
          tutorial.videoId, 
          tutorial.description,
          tutorial.title,
          tutorial.channelTitle
        );
        
        if (videoTimestamps.length > 0) {
          tutorial.timestamps = videoTimestamps.map(ts => ({
            time: ts.seconds,
            description: ts.title,
            topic: ts.title,
            url: ts.url
          }));
        } else {
          // Generate AI-based timestamps as fallback
          const aiTimestamps = this.generateAITimestamps(
            tutorial.title,
            tutorial.duration,
            tutorial.description
          );
          
          tutorial.timestamps = aiTimestamps.map(ts => ({
            time: ts.seconds,
            description: ts.title,
            topic: ts.title,
            url: `https://www.youtube.com/watch?v=${tutorial.videoId}&t=${ts.seconds}s`
          }));
          
          // Cache AI-generated timestamps
          if (aiTimestamps.length > 0) {
            await supabase
              .from('youtube_timestamps')
              .upsert({
                video_id: tutorial.videoId,
                video_title: tutorial.title,
                channel_name: tutorial.channelTitle,
                timestamps: aiTimestamps,
                extraction_method: 'ai_generated',
                extracted_at: new Date().toISOString()
              }, {
                onConflict: 'video_id'
              });
          }
        }
      }
      
      return tutorial;
    } catch (error) {
      console.error('Error enhancing tutorial with timestamps:', error);
      return tutorial;
    }
  }
}