import axios, { AxiosError } from 'axios';
import { AIProvider, AIResponse } from './ai-providers';
import { CircuitBreakerState } from './circuit-breaker';
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
}

interface UserApiKeys {
  openai?: string;
  anthropic?: string;
  deepseek?: string;
  openrouter?: string;
}

export class ParallelAIProvider implements AIProvider {
  name = 'parallel';
  private userApiKeys: UserApiKeys;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private responseTimeStats: Map<string, { total: number; count: number; avg: number }> = new Map();
  
  private models: ModelConfig[] = [
    // Free models (fastest response expected)
    {
      id: 'meta-llama/llama-3.2-3b-instruct:free',
      name: 'Llama 3.2 3B (Free)',
      provider: 'openrouter',
      costPer1M: 0,
      isFree: true,
      timeout: 3000 // Reduced from 5000ms for faster response
    },
    {
      id: 'google/gemma-2-9b-it:free',
      name: 'Gemma 2 9B (Free)',
      provider: 'openrouter',
      costPer1M: 0,
      isFree: true,
      timeout: 3000 // Reduced from 5000ms for faster response
    },
    // Paid models (in parallel with free models)
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'direct-deepseek',
      apiKeyEnv: 'DEEPSEEK_API_KEY',
      baseUrl: 'https://api.deepseek.com/v1/chat/completions',
      costPer1M: 0.14,
      isFree: false,
      timeout: 5000 // Reduced from 8000ms for faster response
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      apiKeyEnv: 'OPENAI_API_KEY',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      costPer1M: 1.5,
      isFree: false,
      timeout: 5000 // Reduced from 8000ms for faster response
    }
  ];

  constructor(userApiKeys: UserApiKeys = {}) {
    this.userApiKeys = userApiKeys;
    
    // Initialize circuit breakers for each model
    this.models.forEach(model => {
      this.circuitBreakers.set(model.id, {
        failures: 0,
        lastFailureTime: null,
        state: 'closed'
      });
    });
  }

  async processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse> {
    // Check cache first
    const cacheKey = MemoryCache.generateKey(message, { context, systemPrompt });
    const cachedResponse = aiResponseCache.get<AIResponse>(cacheKey);
    
    if (cachedResponse) {
      console.log('[ParallelAI] Cache hit for query');
      return {
        ...cachedResponse,
        metadata: {
          ...cachedResponse.metadata,
          fromCache: true
        }
      };
    }
    
    const availableModels = this.getAvailableModels();
    
    if (availableModels.length === 0) {
      throw new Error('All AI models are currently unavailable');
    }

    // Create abort controllers for each model
    const abortControllers = new Map<string, AbortController>();
    
    // Create promises for all available models with cancellation support
    const modelPromises = availableModels.map(model => {
      const controller = new AbortController();
      abortControllers.set(model.id, controller);
      
      return this.queryModel(model, message, context, systemPrompt, controller.signal)
        .then(response => ({ success: true, response, model }))
        .catch(error => {
          if (error.name === 'AbortError') {
            console.log(`[ParallelAI] Request cancelled for ${model.name}`);
          }
          return { success: false, error, model };
        });
    });

    // Race for the first successful response
    try {
      const result = await Promise.race(
        modelPromises.map(async (promise, index) => {
          const res = await promise;
          if (res.success) {
            // Cancel all other pending requests
            abortControllers.forEach((controller, modelId) => {
              if (modelId !== res.model.id) {
                controller.abort();
              }
            });
            return res;
          }
          // If this model failed, wait for others
          throw new Error(`Model ${availableModels[index].name} failed`);
        })
      );
      
      if (result && result.success) {
        console.log(`[ParallelAI] Success with ${result.model.name}`);
        
        // Cache the successful response
        aiResponseCache.set(cacheKey, result.response);
        
        return result.response;
      }
    } catch (error) {
      // If Promise.race throws, it means all models failed
      // Wait for all promises to settle to collect errors
      const results = await Promise.allSettled(modelPromises);
      const errors = results
        .filter(r => r.status === 'fulfilled' && !r.value.success)
        .map(r => (r as any).value.error);
      
      console.error('[ParallelAI] All models failed:', errors);
      throw new Error('All AI models failed to process the request');
    }
  }

  private getAvailableModels(): ModelConfig[] {
    return this.models.filter(model => {
      const breaker = this.circuitBreakers.get(model.id);
      if (!breaker || breaker.state === 'open') {
        // Check if circuit breaker should be reset
        if (breaker && breaker.lastFailureTime) {
          const timeSinceFailure = Date.now() - breaker.lastFailureTime;
          if (timeSinceFailure > 30000) { // 30 seconds cooldown (reduced from 60s)
            breaker.state = 'closed';
            breaker.failures = 0;
          } else {
            return false;
          }
        }
      }
      
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
  }

  private async queryModel(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string,
    signal?: AbortSignal
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      let response;
      
      if (model.provider === 'openrouter') {
        response = await this.queryOpenRouter(model, message, context, systemPrompt, signal);
      } else if (model.provider === 'direct-deepseek') {
        response = await this.queryDeepSeek(model, message, context, systemPrompt, signal);
      } else if (model.provider === 'openai') {
        response = await this.queryOpenAI(model, message, context, systemPrompt, signal);
      } else {
        throw new Error(`Unknown provider: ${model.provider}`);
      }
      
      const duration = Date.now() - startTime;
      console.log(`[ParallelAI] ${model.name} responded in ${duration}ms`);
      
      // Update response time statistics
      const stats = this.responseTimeStats.get(model.id) || { total: 0, count: 0, avg: 0 };
      stats.total += duration;
      stats.count++;
      stats.avg = stats.total / stats.count;
      this.responseTimeStats.set(model.id, stats);
      
      // Dynamically adjust timeout based on average response time
      if (stats.count > 5 && stats.avg < model.timeout * 0.7) {
        // If consistently faster than 70% of timeout, reduce timeout
        model.timeout = Math.max(Math.ceil(stats.avg * 1.5), 2000); // 1.5x avg, min 2s
        console.log(`[ParallelAI] Adjusted ${model.name} timeout to ${model.timeout}ms based on avg ${Math.round(stats.avg)}ms`);
      }
      
      // Reset circuit breaker on success
      const breaker = this.circuitBreakers.get(model.id);
      if (breaker) {
        breaker.failures = 0;
        breaker.state = 'closed';
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[ParallelAI] ${model.name} failed after ${duration}ms:`, error);
      
      // Update circuit breaker
      const breaker = this.circuitBreakers.get(model.id);
      if (breaker) {
        breaker.failures++;
        breaker.lastFailureTime = Date.now();
        if (breaker.failures >= 3) {
          breaker.state = 'open';
          console.log(`[ParallelAI] Circuit breaker opened for ${model.name}`);
        }
      }
      
      throw error;
    }
  }

  private async queryOpenRouter(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string,
    signal?: AbortSignal
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
        signal: signal
      }
    );

    return this.parseResponse(response.data, model.name, model.isFree);
  }

  private async queryDeepSeek(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string,
    signal?: AbortSignal
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
        signal: signal
      }
    );

    return this.parseResponse(response.data, model.name, false);
  }

  private async queryOpenAI(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string,
    signal?: AbortSignal
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
        signal: signal
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
      // Fallback for non-JSON responses
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
    
    // Try to extract structured data from text
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

  /**
   * Get performance statistics for monitoring
   */
  getPerformanceStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.models.forEach(model => {
      const responseStats = this.responseTimeStats.get(model.id);
      const circuitBreaker = this.circuitBreakers.get(model.id);
      
      stats[model.name] = {
        avgResponseTime: responseStats ? Math.round(responseStats.avg) : 0,
        totalRequests: responseStats?.count || 0,
        currentTimeout: model.timeout,
        circuitBreakerState: circuitBreaker?.state || 'closed',
        failures: circuitBreaker?.failures || 0,
        isFree: model.isFree,
        costPer1M: model.costPer1M
      };
    });
    
    return stats;
  }
}