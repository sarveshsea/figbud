/**
 * Enhanced AI Provider for FigBud
 * Combines best features from cascading and smart providers with circuit breaker and retry logic
 */

import axios from 'axios';
import { config } from 'dotenv';
import { AIProvider, AIResponse } from './ai-providers';
import { CircuitBreaker, circuitBreakerManager } from '../utils/circuit-breaker';
import { retry, RetryStrategies } from '../utils/retry';
import { databaseService } from './database';
import { firecrawlService } from './firecrawl-service';
import { APIKeyValidator } from '../utils/api-key-validation';

config();

interface ModelConfig {
  name: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  isFree: boolean;
  priority: number;
  costPer1kTokens: number;
  quality: 'low' | 'medium' | 'high';
  provider: string;
}

export type AIStrategy = 'cost_optimized' | 'performance' | 'balanced';

interface ModelUsage {
  model_name: string;
  provider: string;
  success: boolean;
  tokens_used: number;
  cost_cents: number;
  response_time_ms: number;
  error_type?: string;
}

export class EnhancedAIProvider implements AIProvider {
  name = 'enhanced';
  private models: ModelConfig[] = [];
  private userApiKeys: Record<string, string>;
  private strategy: AIStrategy;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private modelRateLimits: Map<string, { resetAt: number; remaining: number }> = new Map();
  
  constructor(
    userApiKeys: Record<string, string> = {},
    strategy: AIStrategy = 'cost_optimized'
  ) {
    this.userApiKeys = userApiKeys;
    this.strategy = process.env.AI_STRATEGY as AIStrategy || strategy;
    this.initializeModels();
  }

  private initializeModels() {
    // Prefer user-provided keys over environment variables
    const openRouterKey = this.userApiKeys['X-OpenRouter-Key'] || process.env.OPENROUTER_API_KEY || '';
    const deepSeekKey = this.userApiKeys['X-DeepSeek-Key'] || process.env.DEEPSEEK_API_KEY || '';
    const firecrawlKey = this.userApiKeys['X-Firecrawl-Key'] || process.env.FIRECRAWL_API_KEY || '';
    
    // Validate API keys if provided
    const validations = {
      openrouter: openRouterKey ? APIKeyValidator.validate(openRouterKey, 'openrouter') : null,
      deepseek: deepSeekKey ? APIKeyValidator.validate(deepSeekKey, 'deepseek') : null
    };
    
    // Log validation warnings
    Object.entries(validations).forEach(([service, result]) => {
      if (result && !result.isValid) {
        console.warn(`[EnhancedAI] ${result.error}`);
      }
    });
    
    // Free models (OpenRouter)
    if (openRouterKey && (!validations.openrouter || validations.openrouter.isValid)) {
      this.models.push({
        name: 'openrouter-free-llama',
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        isFree: true,
        priority: 1,
        costPer1kTokens: 0,
        quality: 'low',
        provider: 'openrouter'
      });

      this.models.push({
        name: 'openrouter-free-gemma',
        model: 'google/gemma-2-9b-it:free',
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        isFree: true,
        priority: 2,
        costPer1kTokens: 0,
        quality: 'medium',
        provider: 'openrouter'
      });
    }

    // DeepSeek direct API
    if (deepSeekKey && (!validations.deepseek || validations.deepseek.isValid)) {
      // Check if it's off-peak hours (PST)
      const hour = new Date().getUTCHours() - 8; // Convert to PST
      const isOffPeak = hour < 6 || hour >= 22; // 10 PM - 6 AM PST
      
      this.models.push({
        name: 'deepseek-direct',
        model: 'deepseek-chat',
        apiKey: deepSeekKey,
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        isFree: false,
        priority: isOffPeak ? 3 : 5, // Higher priority during off-peak
        costPer1kTokens: 0.00014,
        quality: 'high',
        provider: 'deepseek'
      });
    }


    // Claude Haiku via OpenRouter
    if (openRouterKey) {
      this.models.push({
        name: 'openrouter-claude-haiku',
        model: 'anthropic/claude-3-haiku',
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        isFree: false,
        priority: 6,
        costPer1kTokens: 0.00025,
        quality: 'medium',
        provider: 'openrouter'
      });
    }

    // Sort models based on strategy
    this.sortModelsByStrategy();
    
    // Initialize circuit breakers for each model
    this.models.forEach(model => {
      const breaker = circuitBreakerManager.getBreaker(model.name, {
        failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5'),
        resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000'),
        onStateChange: (oldState, newState) => {
          console.log(`[EnhancedAI] Circuit breaker for ${model.name}: ${oldState} -> ${newState}`);
        }
      });
      this.circuitBreakers.set(model.name, breaker);
    });

    console.log(`[EnhancedAI] Initialized with ${this.models.length} models, strategy: ${this.strategy}`);
  }

  private sortModelsByStrategy() {
    switch (this.strategy) {
      case 'cost_optimized':
        // Sort by cost (free first, then cheapest)
        this.models.sort((a, b) => {
          if (a.isFree && !b.isFree) return -1;
          if (!a.isFree && b.isFree) return 1;
          return a.costPer1kTokens - b.costPer1kTokens;
        });
        break;

      case 'performance':
        // Sort by quality (highest first)
        const qualityOrder = { high: 0, medium: 1, low: 2 };
        this.models.sort((a, b) => 
          qualityOrder[a.quality] - qualityOrder[b.quality]
        );
        break;

      case 'balanced':
        // Keep original priority order
        this.models.sort((a, b) => a.priority - b.priority);
        break;
    }
  }

  async processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse> {
    console.log(`[EnhancedAI] Processing with strategy: ${this.strategy}`);
    
    // Check if we should enhance with web content
    const shouldScrape = this.shouldEnhanceWithWebContent(message);
    let webContext = '';
    
    if (shouldScrape) {
      try {
        console.log('[EnhancedAI] Enhancing with web content...');
        const scrapedContent = await firecrawlService.searchAndScrape(message, {
          maxResults: 2,
          userApiKey: this.userApiKeys['X-Firecrawl-Key']
        });
        
        if (scrapedContent.length > 0) {
          webContext = '\n\nRelevant information from web:\n';
          for (const content of scrapedContent) {
            const info = firecrawlService.extractKeyInfo(content, message);
            webContext += `\nFrom ${content.title}:\n${info.summary}\n`;
            if (info.keyPoints.length > 0) {
              webContext += 'Key points:\n' + info.keyPoints.join('\n') + '\n';
            }
          }
        }
      } catch (error) {
        console.error('[EnhancedAI] Web scraping failed:', error);
        // Continue without web content
      }
    }
    
    // Add web context to the context object
    if (webContext) {
      context.webContext = webContext;
    }
    
    const attempts: any[] = [];
    let lastError: any = null;
    const startTime = Date.now();

    // Try each model in order
    for (const model of this.models) {
      const breaker = this.circuitBreakers.get(model.name)!;
      
      try {
        // Check circuit breaker
        const result = await breaker.execute(async () => {
          console.log(`[EnhancedAI] Trying ${model.name} (${model.quality} quality, ${model.isFree ? 'FREE' : `$${model.costPer1kTokens}/1k`})`);
          
          // Use retry logic for transient failures
          return await retry(
            () => this.callModel(model, message, context, systemPrompt),
            RetryStrategies.aiModel({
              maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
              timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000'),
              onRetry: (attempt, error, delay) => {
                console.log(`[EnhancedAI] Retry ${attempt} for ${model.name} after ${delay}ms`);
              }
            })
          );
        });

        // Success! Log usage
        const responseTime = Date.now() - startTime;
        await this.logModelUsage({
          model_name: model.name,
          provider: model.provider,
          success: true,
          tokens_used: result.tokensUsed || 0,
          cost_cents: Math.round((result.cost || 0) * 100),
          response_time_ms: responseTime
        });

        attempts.push({
          model: model.name,
          success: true,
          isFree: model.isFree,
          cost: model.costPer1kTokens,
          responseTime
        });

        return {
          ...result,
          metadata: {
            ...result.metadata,
            attempts,
            usedModel: model.name,
            isFree: model.isFree,
            quality: model.quality,
            responseTime
          }
        };
      } catch (error: any) {
        console.error(`[EnhancedAI] ${model.name} failed:`, error);
        lastError = error;
        
        // Check for rate limit error (429)
        if (error.response?.status === 429) {
          // Extract rate limit info from error response
          const headers = error.response.headers;
          if (headers['x-ratelimit-reset']) {
            const reset = parseInt(headers['x-ratelimit-reset']) * 1000;
            this.modelRateLimits.set(model.name, {
              remaining: 0,
              resetAt: reset
            });
            console.log(`[EnhancedAI] Rate limit hit for ${model.name}. Resets at ${new Date(reset).toISOString()}`);
          }
        }
        
        // Log failure
        await this.logModelUsage({
          model_name: model.name,
          provider: model.provider,
          success: false,
          tokens_used: 0,
          cost_cents: 0,
          response_time_ms: Date.now() - startTime,
          error_type: error instanceof Error ? error.name : 'Unknown'
        });

        attempts.push({
          model: model.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // All models failed
    throw new Error(`All AI models failed. Last error: ${lastError?.message}. Circuit breaker status: ${this.getCircuitBreakerStatus()}`);
  }

  private async callModel(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string
  ): Promise<AIResponse> {
    // Check rate limit before making request
    const rateLimit = this.modelRateLimits.get(model.name);
    if (rateLimit && Date.now() < rateLimit.resetAt && rateLimit.remaining <= 0) {
      const waitTime = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      console.log(`[EnhancedAI] Rate limit exceeded for ${model.name}. Resets in ${waitTime}s`);
      throw new Error(`Rate limit exceeded for ${model.name}. Resets in ${waitTime} seconds`);
    }
    
    const isDeepSeekDirect = model.provider === 'deepseek';
    const isOpenAI = model.provider === 'openai';
    const isGemma = model.model.includes('gemma');
    
    // Enhanced system prompt with quality hints
    const enhancedSystemPrompt = this.enhanceSystemPrompt(systemPrompt, model.quality);
    
    // Don't force JSON format for models that don't support it well
    const supportsJsonFormat = !isDeepSeekDirect && !isOpenAI && !isGemma;
    
    const requestBody = {
      model: model.model,
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: this.buildPrompt(message, context) }
      ],
      temperature: model.quality === 'high' ? 0.7 : 0.8,
      max_tokens: model.quality === 'high' ? 1500 : 1000,
      ...(supportsJsonFormat ? { response_format: { type: 'json_object' } } : {})
    };

    const headers = this.getHeaders(model);
    
    const response = await axios.post(model.baseUrl, requestBody, { 
      headers,
      timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000')
    });
    
    // Track rate limit headers
    if (response.headers['x-ratelimit-remaining'] !== undefined) {
      const remaining = parseInt(response.headers['x-ratelimit-remaining']);
      const reset = parseInt(response.headers['x-ratelimit-reset']) * 1000; // Convert to milliseconds
      
      this.modelRateLimits.set(model.name, {
        remaining,
        resetAt: reset
      });
      
      console.log(`[EnhancedAI] Rate limit for ${model.name}: ${remaining} remaining, resets at ${new Date(reset).toISOString()}`);
    }
    
    // Validate and extract content with multiple fallback paths
    let content: string;
    
    try {
      // Try multiple paths to find the content
      content = response.data?.choices?.[0]?.message?.content ||
                response.data?.choices?.[0]?.text ||
                response.data?.message ||
                response.data?.content ||
                response.data?.text ||
                (typeof response.data === 'string' ? response.data : null);
      
      if (!content) {
        console.error(`[EnhancedAI] Unexpected response structure from ${model.name}:`, JSON.stringify(response.data).substring(0, 500));
        throw new Error(`No content found in response from ${model.name}`);
      }
    } catch (error) {
      console.error(`[EnhancedAI] Failed to extract content from ${model.name}:`, error);
      throw new Error(`Invalid response structure from ${model.name}: ${error.message}`);
    }
    
    console.log(`[EnhancedAI] Response from ${model.name} (${content.length} chars)`);
    
    // Parse response
    const parsedContent = this.parseResponse(content);
    
    return {
      text: JSON.stringify(parsedContent),
      metadata: {
        ...parsedContent,
        model: model.name,
        usedModel: model.name,
        isFree: model.isFree,
        quality: model.quality,
        provider: model.provider
      },
      provider: this.name,
      tokensUsed: response.data.usage?.total_tokens,
      cost: (response.data.usage?.total_tokens || 0) * model.costPer1kTokens / 1000
    };
  }

  private getHeaders(model: ModelConfig): Record<string, string> {
    const baseHeaders = {
      'Authorization': `Bearer ${model.apiKey}`,
      'Content-Type': 'application/json'
    };

    if (model.provider === 'openrouter') {
      return {
        ...baseHeaders,
        'HTTP-Referer': 'https://figma.com',
        'X-Title': 'FigBud Assistant'
      };
    }

    return baseHeaders;
  }

  private enhanceSystemPrompt(basePrompt: string, quality: string): string {
    const qualityHints = {
      high: '\n\nProvide detailed, accurate, and well-structured responses.',
      medium: '\n\nProvide clear and helpful responses.',
      low: '\n\nProvide concise and direct responses.'
    };

    return basePrompt + (qualityHints[quality] || '');
  }

  private buildPrompt(message: string, context: any): string {
    let prompt = '';
    
    // Add conversation history if available
    if (context.history && context.history.length > 0) {
      prompt += 'Previous conversation:\n';
      context.history.forEach((msg: any) => {
        const timestamp = new Date(msg.created_at).toLocaleTimeString();
        prompt += `[${timestamp}] User: ${msg.message}\n`;
        prompt += `[${timestamp}] Assistant: ${msg.response}\n`;
      });
      prompt += '\n---\n\n';
    }
    
    // Add current message
    prompt += `Current message: ${message}`;

    if (context.selection) {
      prompt += `\n\nCurrent selection: ${JSON.stringify(context.selection)}`;
    }

    if (context.componentType) {
      prompt += `\n\nRequested component type: ${context.componentType}`;
    }
    
    // Add memory instruction
    if (context.history && context.history.length > 0) {
      prompt += '\n\nPlease consider the conversation history above when responding. Maintain context and refer to previous messages when relevant.';
    }
    
    // Add web context if available
    if (context.webContext) {
      prompt += '\n\n' + context.webContext;
      prompt += '\n\nUse this web information to provide more accurate and up-to-date responses.';
    }

    return prompt;
  }
  
  private shouldEnhanceWithWebContent(message: string): boolean {
    const webKeywords = [
      'latest', 'new', 'current', 'recent', 'update',
      'how to', 'tutorial', 'guide', 'documentation',
      'best practice', 'example', 'sample',
      'feature', 'announcement', 'release'
    ];
    
    const messageLower = message.toLowerCase();
    return webKeywords.some(keyword => messageLower.includes(keyword));
  }

  private parseResponse(content: string): any {
    // Log the raw content for debugging
    if (content.length < 200) {
      console.log(`[EnhancedAI] Raw content: ${content}`);
    }
    
    // Try to parse as JSON first
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.trim();
      
      // Remove various markdown code block formats
      cleanContent = cleanContent
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim();
      
      // Try to extract JSON from mixed content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      const parsed = JSON.parse(cleanContent);
      
      // Ensure required fields exist
      if (!parsed.message && !parsed.text) {
        parsed.message = content;
      }
      
      return parsed;
    } catch (error) {
      console.log('[EnhancedAI] Failed to parse as JSON, extracting from text');
      // Fallback: extract information from text
      return this.extractFromText(content);
    }
  }

  private extractFromText(content: string): any {
    // Enhanced extraction logic for non-JSON responses
    const response: any = {
      message: content.trim(),
      suggestions: [],
      componentType: null,
      properties: {},
      teacherNote: null,
      tutorialQuery: null
    };

    // Try to extract component type with multiple patterns
    const componentPatterns = [
      /(?:create|make|build|design)\s+(?:a\s+)?(\w+)(?:\s+component)?/i,
      /component[:\s]+(\w+)/i,
      /(?:button|card|input|form|modal|navbar|badge|text)\s+(?:component)?/i,
      /I'll\s+(?:help\s+you\s+)?create\s+(?:a\s+)?(\w+)/i
    ];
    
    for (const pattern of componentPatterns) {
      const match = content.match(pattern);
      if (match) {
        const componentType = match[1] || match[0];
        response.componentType = componentType.toLowerCase()
          .replace(/component/i, '')
          .replace(/\s+/g, '')
          .trim();
        break;
      }
    }

    // Extract properties if mentioned
    const propPatterns = {
      label: /(?:text|label|caption)[:\s]["']?([^"'\n]+)["']?/i,
      variant: /(?:variant|style|type)[:\s](\w+)/i,
      size: /(?:size)[:\s](\w+)/i,
      color: /(?:color)[:\s](\w+)/i
    };
    
    for (const [key, pattern] of Object.entries(propPatterns)) {
      const match = content.match(pattern);
      if (match) {
        response.properties[key] = match[1].trim();
      }
    }

    // Extract tutorial query
    const tutorialMatch = content.match(/(?:tutorial|learn|guide).*?["']([^"']+)["']/i) ||
                         content.match(/search.*?(?:for|about)\s+["']?([^"'\n]+)["']?/i);
    if (tutorialMatch) {
      response.tutorialQuery = tutorialMatch[1].trim();
    }

    // Extract bullet points as suggestions
    const bulletPoints = content.match(/^[\*\-•]\s+(.+)$/gm);
    if (bulletPoints) {
      response.suggestions = bulletPoints.map(point => 
        point.replace(/^[\*\-•]\s+/, '').trim()
      ).slice(0, 4); // Limit to 4 suggestions
    }

    // Extract teacher note if present
    const teacherNoteMatch = content.match(/(?:tip|note|remember|pro tip)[:\s](.+?)(?:\n|$)/i);
    if (teacherNoteMatch) {
      response.teacherNote = teacherNoteMatch[1].trim();
    }

    return response;
  }

  private async logModelUsage(usage: ModelUsage): Promise<void> {
    try {
      // Log to database (implement this in database service)
      // await databaseService.logModelUsage(usage);
      
      // Log to console for now
      console.log('[EnhancedAI] Model usage:', {
        model: usage.model_name,
        success: usage.success,
        tokens: usage.tokens_used,
        cost: `$${(usage.cost_cents / 100).toFixed(4)}`,
        time: `${usage.response_time_ms}ms`
      });
    } catch (error) {
      console.error('[EnhancedAI] Failed to log model usage:', error);
    }
  }

  private getCircuitBreakerStatus(): string {
    const status: string[] = [];
    this.circuitBreakers.forEach((breaker, name) => {
      const state = breaker.getState();
      if (state !== 'CLOSED') {
        status.push(`${name}: ${state}`);
      }
    });
    return status.length > 0 ? status.join(', ') : 'All circuits operational';
  }

  /**
   * Get provider statistics
   */
  getStatistics(): any {
    const stats: any = {
      strategy: this.strategy,
      availableModels: this.models.length,
      circuitBreakerStatus: {}
    };

    this.circuitBreakers.forEach((breaker, name) => {
      stats.circuitBreakerStatus[name] = breaker.getStats();
    });

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers(): void {
    this.circuitBreakers.forEach(breaker => breaker.reset());
    console.log('[EnhancedAI] All circuit breakers reset');
  }
}