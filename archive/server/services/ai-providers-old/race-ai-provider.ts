import axios, { AxiosError, CancelTokenSource } from 'axios';
import { AIProvider, AIResponse } from './ai-providers';
import { MemoryCache, aiResponseCache } from './memory-cache';

interface ModelConfig {
  id: string;
  name: string;
  provider: 'openrouter' | 'openai' | 'direct-deepseek';
  apiKeyEnv?: string;
  baseUrl?: string;
  costPer1M: number;
  isFree: boolean;
  timeout: number;
  priority: number; // Lower number = higher priority
}

interface UserApiKeys {
  openai?: string;
  anthropic?: string;
  deepseek?: string;
  openrouter?: string;
}

interface ModelPerformance {
  averageResponseTime: number;
  successRate: number;
  lastSuccess: number;
  totalRequests: number;
}

export class RaceAIProvider implements AIProvider {
  name = 'race';
  private userApiKeys: UserApiKeys;
  private modelPerformance: Map<string, ModelPerformance> = new Map();
  private cancelTokens: Map<string, CancelTokenSource> = new Map();
  
  private models: ModelConfig[] = [
    // Free models - fastest, highest priority
    {
      id: 'meta-llama/llama-3.2-3b-instruct:free',
      name: 'Llama 3.2 3B (Free)',
      provider: 'openrouter',
      costPer1M: 0,
      isFree: true,
      timeout: 2000, // 2 seconds
      priority: 1
    },
    {
      id: 'google/gemma-2-9b-it:free',
      name: 'Gemma 2 9B (Free)',
      provider: 'openrouter',
      costPer1M: 0,
      isFree: true,
      timeout: 2000, // 2 seconds
      priority: 2
    },
    // Paid models - slightly longer timeout, lower priority
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'direct-deepseek',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      costPer1M: 0.14,
      isFree: false,
      timeout: 4000, // 4 seconds
      priority: 3
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      apiKeyEnv: 'OPENAI_API_KEY',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      costPer1M: 1.5,
      isFree: false,
      timeout: 4000, // 4 seconds
      priority: 4
    }
  ];

  constructor(userApiKeys: UserApiKeys = {}) {
    this.userApiKeys = userApiKeys;
    this.loadPerformanceData();
  }

  async processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse> {
    // Check cache first
    const cacheKey = MemoryCache.generateKey(message, { context, systemPrompt });
    const cachedResponse = aiResponseCache.get<AIResponse>(cacheKey);
    
    if (cachedResponse) {
      console.log('[RaceAI] Cache hit, returning immediately');
      return {
        ...cachedResponse,
        metadata: {
          ...cachedResponse.metadata,
          fromCache: true,
          responseTime: 0
        }
      };
    }

    // Get available models sorted by performance
    const availableModels = this.getAvailableModelsSortedByPerformance();
    
    if (availableModels.length === 0) {
      throw new Error('All AI models are currently unavailable');
    }

    // Clear any previous cancel tokens
    this.cancelTokens.clear();

    // Create race promises with staggered start times
    const racePromises: Promise<{ response: AIResponse; model: ModelConfig }>[] = [];
    
    availableModels.forEach((model, index) => {
      // Stagger starts by 200ms for each lower priority model
      const delay = index * 200;
      
      const promise = new Promise<{ response: AIResponse; model: ModelConfig }>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const response = await this.queryModel(model, message, context, systemPrompt);
            resolve({ response, model });
          } catch (error) {
            reject({ error, model });
          }
        }, delay);
      });
      
      racePromises.push(promise);
    });

    try {
      // Race for the first successful response
      const result = await Promise.race(racePromises);
      
      console.log(`[RaceAI] Success with ${result.model.name} in ${result.response.metadata?.responseTime}ms`);
      
      // Cancel all other pending requests
      this.cancelAllPendingRequests();
      
      // Update performance metrics
      this.updatePerformanceMetrics(result.model.id, result.response.metadata?.responseTime || 0, true);
      
      // Cache the successful response
      aiResponseCache.set(cacheKey, result.response);
      
      return result.response;
    } catch (firstError) {
      console.log('[RaceAI] First race failed, trying backup models...');
      
      // If the race fails, try remaining models sequentially
      for (const model of availableModels) {
        try {
          const response = await this.queryModel(model, message, context, systemPrompt);
          
          // Cancel any remaining requests
          this.cancelAllPendingRequests();
          
          // Update metrics and cache
          this.updatePerformanceMetrics(model.id, response.metadata?.responseTime || 0, true);
          aiResponseCache.set(cacheKey, response);
          
          return response;
        } catch (error) {
          this.updatePerformanceMetrics(model.id, model.timeout, false);
          console.error(`[RaceAI] ${model.name} failed:`, error);
        }
      }
      
      throw new Error('All AI models failed to process the request');
    }
  }

  private getAvailableModelsSortedByPerformance(): ModelConfig[] {
    const available = this.models.filter(model => {
      // Check if we have necessary API keys
      if (model.provider === 'openrouter') {
        return !!(this.userApiKeys.openrouter || process.env.OPENROUTER_API_KEY);
      } else if (model.provider === 'openai') {
        return !!(this.userApiKeys.openai || process.env.OPENAI_API_KEY);
      } else if (model.provider === 'direct-deepseek') {
        return !!(this.userApiKeys.deepseek || process.env.DEEPSEEK_API_KEY);
      }
      return true;
    });

    // Sort by performance metrics
    return available.sort((a, b) => {
      const perfA = this.modelPerformance.get(a.id);
      const perfB = this.modelPerformance.get(b.id);
      
      // If we don't have performance data, use priority
      if (!perfA || !perfB) {
        return a.priority - b.priority;
      }
      
      // Sort by success rate first, then by average response time
      const scoreA = perfA.successRate * 1000 - perfA.averageResponseTime;
      const scoreB = perfB.successRate * 1000 - perfB.averageResponseTime;
      
      return scoreB - scoreA; // Higher score = better
    });
  }

  private async queryModel(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string
  ): Promise<AIResponse> {
    const startTime = Date.now();
    const cancelTokenSource = axios.CancelToken.source();
    this.cancelTokens.set(model.id, cancelTokenSource);
    
    try {
      let response;
      
      if (model.provider === 'openrouter') {
        response = await this.queryOpenRouter(model, message, context, systemPrompt, cancelTokenSource);
      } else if (model.provider === 'direct-deepseek') {
        response = await this.queryDeepSeek(model, message, context, systemPrompt, cancelTokenSource);
      } else if (model.provider === 'openai') {
        response = await this.queryOpenAI(model, message, context, systemPrompt, cancelTokenSource);
      } else {
        throw new Error(`Unknown provider: ${model.provider}`);
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        ...response,
        metadata: {
          ...response.metadata,
          responseTime,
          model: model.name
        }
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log(`[RaceAI] Request cancelled for ${model.name}`);
      }
      throw error;
    } finally {
      this.cancelTokens.delete(model.id);
    }
  }

  private cancelAllPendingRequests() {
    this.cancelTokens.forEach((source, modelId) => {
      source.cancel(`Request cancelled - faster model responded`);
    });
    this.cancelTokens.clear();
  }

  private async queryOpenRouter(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string,
    cancelTokenSource: CancelTokenSource
  ): Promise<AIResponse> {
    const apiKey = this.userApiKeys.openrouter || process.env.OPENROUTER_API_KEY;
    
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.buildPrompt(message, context) }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: model.isFree ? undefined : { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://figma.com',
          'X-Title': 'FigBud Assistant',
          'Content-Type': 'application/json'
        },
        timeout: model.timeout,
        cancelToken: cancelTokenSource.token
      }
    );

    return this.parseResponse(response.data, model.name, model.isFree);
  }

  private async queryDeepSeek(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string,
    cancelTokenSource: CancelTokenSource
  ): Promise<AIResponse> {
    const apiKey = this.userApiKeys.deepseek || process.env.DEEPSEEK_API_KEY;
    
    const response = await axios.post(
      model.baseUrl!,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.buildPrompt(message, context) }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: model.timeout,
        cancelToken: cancelTokenSource.token
      }
    );

    return this.parseResponse(response.data, model.name, false);
  }

  private async queryOpenAI(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string,
    cancelTokenSource: CancelTokenSource
  ): Promise<AIResponse> {
    const apiKey = this.userApiKeys.openai || process.env.OPENAI_API_KEY;
    
    const response = await axios.post(
      model.baseUrl!,
      {
        model: model.id,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.buildPrompt(message, context) }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: model.timeout,
        cancelToken: cancelTokenSource.token
      }
    );

    return this.parseResponse(response.data, model.name, false);
  }

  private buildPrompt(message: string, context: any): string {
    return `User Message: ${message}
Context: ${JSON.stringify(context)}

Remember to include componentType and properties if the user wants to create a UI component.`;
  }

  private parseResponse(data: any, modelName: string, isFree: boolean): AIResponse {
    const content = data.choices[0]?.message?.content || '';
    
    try {
      const parsed = isFree ? this.parseTextResponse(content) : JSON.parse(content);
      
      return {
        text: parsed.message || parsed.response || 'I can help you with that!',
        metadata: {
          componentType: parsed.componentType,
          properties: parsed.properties,
          teacherNote: parsed.teacherNote,
          suggestions: parsed.suggestions || [],
          action: parsed.componentType ? 'component_created' : undefined,
          model: modelName,
          isFree: isFree
        },
        provider: this.name,
        tokensUsed: data.usage?.total_tokens
      };
    } catch (error) {
      return {
        text: content,
        metadata: {
          model: modelName,
          isFree: isFree
        },
        provider: this.name,
        tokensUsed: data.usage?.total_tokens
      };
    }
  }

  private parseTextResponse(text: string): any {
    const result: any = { message: text };
    
    const componentMatch = text.match(/component[:\s]+(\w+)/i);
    if (componentMatch) {
      result.componentType = componentMatch[1];
    }
    
    const teacherMatch = text.match(/tip[:\s]+(.+?)(?:\n|$)/i);
    if (teacherMatch) {
      result.teacherNote = teacherMatch[1];
    }
    
    return result;
  }

  private updatePerformanceMetrics(modelId: string, responseTime: number, success: boolean) {
    const current = this.modelPerformance.get(modelId) || {
      averageResponseTime: 0,
      successRate: 0,
      lastSuccess: 0,
      totalRequests: 0
    };
    
    const newTotal = current.totalRequests + 1;
    const newSuccessCount = current.totalRequests * current.successRate + (success ? 1 : 0);
    
    this.modelPerformance.set(modelId, {
      averageResponseTime: success 
        ? (current.averageResponseTime * current.totalRequests + responseTime) / newTotal
        : current.averageResponseTime,
      successRate: newSuccessCount / newTotal,
      lastSuccess: success ? Date.now() : current.lastSuccess,
      totalRequests: newTotal
    });
    
    this.savePerformanceData();
  }

  private loadPerformanceData() {
    // In a real implementation, this would load from a database
    // For now, initialize with default values
    this.models.forEach(model => {
      this.modelPerformance.set(model.id, {
        averageResponseTime: model.timeout * 0.6, // Assume 60% of timeout on average
        successRate: 0.95, // Assume 95% success rate to start
        lastSuccess: Date.now(),
        totalRequests: 0
      });
    });
  }

  private savePerformanceData() {
    // In a real implementation, this would save to a database
    // For now, just log it
    console.log('[RaceAI] Performance metrics updated:', 
      Array.from(this.modelPerformance.entries()).map(([id, metrics]) => ({
        model: this.models.find(m => m.id === id)?.name,
        avgResponseTime: Math.round(metrics.averageResponseTime),
        successRate: (metrics.successRate * 100).toFixed(1) + '%'
      }))
    );
  }
}