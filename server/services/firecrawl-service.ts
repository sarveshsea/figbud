/**
 * Firecrawl Service for Web Scraping
 * Enhances AI responses with real-time web data
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { config } from 'dotenv';

config();

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  timestamp: Date;
}

interface FirecrawlCache {
  [url: string]: {
    data: ScrapedContent;
    expiresAt: Date;
  };
}

export class FirecrawlService {
  private static instance: FirecrawlService;
  private firecrawl: FirecrawlApp | null = null;
  private cache: FirecrawlCache = {};
  private cacheExpiry = 3600000; // 1 hour

  private constructor() {
    // Initialize with API key if available
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (apiKey) {
      this.firecrawl = new FirecrawlApp({ apiKey });
      console.log('[Firecrawl] Service initialized with API key');
    } else {
      console.log('[Firecrawl] No API key found - web scraping disabled');
    }
  }

  static getInstance(): FirecrawlService {
    if (!FirecrawlService.instance) {
      FirecrawlService.instance = new FirecrawlService();
    }
    return FirecrawlService.instance;
  }

  /**
   * Scrape a single URL
   */
  async scrapeUrl(url: string, userApiKey?: string): Promise<ScrapedContent | null> {
    try {
      // Check cache first
      const cached = this.getCachedContent(url);
      if (cached) {
        console.log(`[Firecrawl] Returning cached content for: ${url}`);
        return cached;
      }

      // Use user API key if provided
      const firecrawl = userApiKey 
        ? new FirecrawlApp({ apiKey: userApiKey })
        : this.firecrawl;

      if (!firecrawl) {
        console.log('[Firecrawl] No API key available for scraping');
        return null;
      }

      console.log(`[Firecrawl] Scraping URL: ${url}`);
      
      const result = await firecrawl.scrapeUrl(url, {
        pageOptions: {
          onlyMainContent: true,
          includeHtml: false
        }
      });

      if (!result.success || !result.data) {
        console.error('[Firecrawl] Scraping failed:', result.error);
        return null;
      }

      const content: ScrapedContent = {
        title: result.data.metadata?.title || 'Untitled',
        content: result.data.markdown || result.data.content || '',
        url,
        timestamp: new Date()
      };

      // Cache the result
      this.cacheContent(url, content);

      return content;
    } catch (error) {
      console.error('[Firecrawl] Error scraping URL:', error);
      return null;
    }
  }

  /**
   * Scrape Figma documentation
   */
  async scrapeFigmaDocs(topic: string, userApiKey?: string): Promise<ScrapedContent[]> {
    const figmaDocUrls = [
      `https://help.figma.com/hc/en-us/search?query=${encodeURIComponent(topic)}`,
      `https://www.figma.com/community/search?q=${encodeURIComponent(topic)}`,
      `https://www.figma.com/best-practices/${topic.toLowerCase().replace(/\s+/g, '-')}`
    ];

    const results: ScrapedContent[] = [];

    for (const url of figmaDocUrls) {
      const content = await this.scrapeUrl(url, userApiKey);
      if (content) {
        results.push(content);
      }
    }

    return results;
  }

  /**
   * Scrape design tutorial sites
   */
  async scrapeDesignTutorials(topic: string, userApiKey?: string): Promise<ScrapedContent[]> {
    const tutorialSites = [
      `https://designcode.io/search?q=${encodeURIComponent(topic)}`,
      `https://www.smashingmagazine.com/?s=${encodeURIComponent(topic)}`,
      `https://medium.com/search?q=${encodeURIComponent(topic + ' figma')}`
    ];

    const results: ScrapedContent[] = [];

    for (const url of tutorialSites) {
      const content = await this.scrapeUrl(url, userApiKey);
      if (content) {
        results.push(content);
      }
    }

    return results;
  }

  /**
   * Search and scrape relevant content for a query
   */
  async searchAndScrape(query: string, options?: {
    maxResults?: number;
    userApiKey?: string;
    sources?: ('figma' | 'tutorials' | 'general')[];
  }): Promise<ScrapedContent[]> {
    const { 
      maxResults = 3, 
      userApiKey,
      sources = ['figma', 'tutorials']
    } = options || {};

    const allResults: ScrapedContent[] = [];

    // Scrape different sources based on options
    if (sources.includes('figma')) {
      const figmaResults = await this.scrapeFigmaDocs(query, userApiKey);
      allResults.push(...figmaResults);
    }

    if (sources.includes('tutorials')) {
      const tutorialResults = await this.scrapeDesignTutorials(query, userApiKey);
      allResults.push(...tutorialResults);
    }

    // Sort by relevance (simple keyword matching for now)
    const sortedResults = this.sortByRelevance(allResults, query);

    // Return top results
    return sortedResults.slice(0, maxResults);
  }

  /**
   * Extract key information from scraped content
   */
  extractKeyInfo(content: ScrapedContent, query: string): {
    summary: string;
    keyPoints: string[];
    relevantSections: string[];
  } {
    const text = content.content.toLowerCase();
    const queryWords = query.toLowerCase().split(' ');

    // Find sentences containing query words
    const sentences = content.content.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence => 
      queryWords.some(word => sentence.toLowerCase().includes(word))
    );

    // Extract key points (lines that start with bullets or numbers)
    const keyPoints = content.content
      .split('\n')
      .filter(line => /^[\*\-•\d+\.]\s/.test(line.trim()))
      .slice(0, 5);

    // Create summary from first few relevant sentences
    const summary = relevantSentences.slice(0, 3).join('. ').trim() || 
                   sentences.slice(0, 2).join('. ').trim();

    // Extract relevant sections (paragraphs containing query words)
    const paragraphs = content.content.split('\n\n');
    const relevantSections = paragraphs
      .filter(para => queryWords.some(word => para.toLowerCase().includes(word)))
      .slice(0, 3);

    return {
      summary,
      keyPoints,
      relevantSections
    };
  }

  /**
   * Cache management
   */
  private getCachedContent(url: string): ScrapedContent | null {
    const cached = this.cache[url];
    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }
    
    // Remove expired cache
    if (cached) {
      delete this.cache[url];
    }
    
    return null;
  }

  private cacheContent(url: string, content: ScrapedContent): void {
    this.cache[url] = {
      data: content,
      expiresAt: new Date(Date.now() + this.cacheExpiry)
    };
  }

  /**
   * Sort results by relevance to query
   */
  private sortByRelevance(results: ScrapedContent[], query: string): ScrapedContent[] {
    const queryWords = query.toLowerCase().split(' ');
    
    return results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, queryWords);
      const bScore = this.calculateRelevanceScore(b, queryWords);
      return bScore - aScore;
    });
  }

  private calculateRelevanceScore(content: ScrapedContent, queryWords: string[]): number {
    const text = (content.title + ' ' + content.content).toLowerCase();
    let score = 0;

    // Score based on word matches
    for (const word of queryWords) {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      score += matches;
    }

    // Bonus for title matches
    const titleLower = content.title.toLowerCase();
    for (const word of queryWords) {
      if (titleLower.includes(word)) {
        score += 5;
      }
    }

    // Bonus for Figma-specific content
    if (content.url.includes('figma.com')) {
      score += 10;
    }

    return score;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache = {};
    console.log('[Firecrawl] Cache cleared');
  }
}

// Export singleton instance
export const firecrawlService = FirecrawlService.getInstance();