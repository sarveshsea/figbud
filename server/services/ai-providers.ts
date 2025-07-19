import axios from 'axios';
import { config } from 'dotenv';
import { RedisService } from './redis';
import { supabase } from '../config/supabase';
import { Database } from '../config/supabase';

config();

// AI Provider interfaces
export interface AIProvider {
  name: string;
  processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse>;
}

export interface AIResponse {
  text: string;
  metadata?: {
    action?: string;
    componentType?: string;
    teacherNote?: string;
    model?: string;
    isFree?: boolean;
    attempts?: { model: string; success: boolean; error?: string }[];
    suggestions?: string[];
    tutorials?: any[];
    components?: any[];
    guidance?: any[];
  };
  provider: string;
  tokensUsed?: number;
  cost?: number;
}

// OpenRouter API implementation
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter';
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  async processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'deepseek/deepseek-chat', // Using DeepSeek via OpenRouter
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: this.buildPrompt(message, context) }
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://figbud.com',
            'X-Title': 'FigBud Assistant',
            'Content-Type': 'application/json'
          }
        }
      );

      const content = JSON.parse(response.data.choices[0]?.message?.content || '{}');
      
      return {
        text: content.message || 'I can help you with that!',
        metadata: {
          action: content.action,
          componentType: content.componentType,
          teacherNote: content.teacherNote,
          suggestions: content.suggestions || [],
          tutorials: content.tutorials || [],
          components: content.components || [],
          guidance: content.guidance || []
        },
        provider: this.name,
        tokensUsed: response.data.usage?.total_tokens,
        cost: this.calculateCost(response.data.usage?.total_tokens || 0)
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error('Failed to process with OpenRouter');
    }
  }

  private buildPrompt(message: string, context: any): string {
    return `User Message: ${message}
Context: ${JSON.stringify(context)}

IMPORTANT: If the user asks to create, make, build, or show a UI component (button, card, input, toggle, etc.), you MUST include:
- action: "component_created"
- componentType: the specific component type
- teacherNote: a helpful tip about using or designing that component

Provide a helpful response for this Figma design query.`;
  }

  private calculateCost(tokens: number): number {
    // OpenRouter pricing varies by model - this is an example
    const costPer1kTokens = 0.002; // $0.002 per 1k tokens
    return (tokens / 1000) * costPer1kTokens;
  }
}

// DeepSeek API implementation
export class DeepSeekProvider implements AIProvider {
  name = 'deepseek';
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
  }

  async processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: this.buildPrompt(message, context) }
          ],
          temperature: 0.7,
          max_tokens: 500,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0]?.message?.content;
      let parsedContent;
      
      try {
        parsedContent = JSON.parse(content);
      } catch {
        // If not JSON, create structured response
        parsedContent = {
          message: content,
          suggestions: [],
          tutorials: [],
          components: [],
          guidance: []
        };
      }
      
      return {
        text: parsedContent.message || content,
        metadata: {
          action: parsedContent.action,
          componentType: parsedContent.componentType,
          teacherNote: parsedContent.teacherNote,
          suggestions: parsedContent.suggestions || [],
          tutorials: parsedContent.tutorials || [],
          components: parsedContent.components || [],
          guidance: parsedContent.guidance || []
        },
        provider: this.name,
        tokensUsed: response.data.usage?.total_tokens,
        cost: this.calculateCost(response.data.usage?.total_tokens || 0)
      };
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw new Error('Failed to process with DeepSeek');
    }
  }

  private buildPrompt(message: string, context: any): string {
    return `User Message: ${message}
Context: ${JSON.stringify(context)}

IMPORTANT: If the user asks to create, make, build, or show a UI component (button, card, input, toggle, etc.), you MUST include:
- action: "component_created"
- componentType: the specific component type
- teacherNote: a helpful tip about using or designing that component

Please provide a helpful response for this Figma design query. Always format your response as JSON.`;
  }

  private calculateCost(tokens: number): number {
    // DeepSeek pricing
    const costPer1MTokens = 1.4; // $1.4 per 1M tokens
    return (tokens / 1000000) * costPer1MTokens;
  }
}

// Main AI Service that can switch between providers
export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string;

  constructor() {
    // Initialize providers
    if (process.env.OPENROUTER_API_KEY) {
      this.providers.set('openrouter', new OpenRouterProvider());
    }
    if (process.env.DEEPSEEK_API_KEY) {
      this.providers.set('deepseek', new DeepSeekProvider());
    }
    // Smart provider with cascading model selection
    if (process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY) {
      const { SmartAIProvider } = require('./smart-ai-provider');
      this.providers.set('smart', new SmartAIProvider());
    }
    // Fallback to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      // Reuse existing OpenAI implementation
      const { OpenAIService } = require('./openai');
      this.providers.set('openai', {
        name: 'openai',
        processQuery: async (message, context, systemPrompt) => {
          const result = await OpenAIService.processDesignQuery(message, context);
          return {
            ...result,
            provider: 'openai'
          };
        }
      });
    }

    // Set default provider based on environment or config
    this.defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'smart';
  }

  async processQuery(
    message: string,
    context: any,
    userSkillLevel: string = 'beginner',
    preferredProvider?: string
  ): Promise<AIResponse> {
    // Check cache first
    const cacheKey = `ai:${message}:${JSON.stringify(context)}`;
    const cachedResponse = await this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      console.log('AI response served from cache');
      return cachedResponse;
    }

    // Select provider
    const providerName = preferredProvider || this.defaultProvider;
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`AI provider ${providerName} not available`);
    }

    const systemPrompt = this.buildSystemPrompt(userSkillLevel);
    
    try {
      // Try primary provider
      const response = await provider.processQuery(message, context, systemPrompt);
      
      // Cache successful response
      await this.cacheResponse(cacheKey, response);
      
      // Log API usage
      await this.logApiUsage(response, message, context);
      
      return response;
    } catch (error) {
      console.error(`Primary provider ${providerName} failed:`, error);
      
      // Try fallback providers
      for (const [name, fallbackProvider] of this.providers) {
        if (name !== providerName) {
          try {
            console.log(`Trying fallback provider: ${name}`);
            const response = await fallbackProvider.processQuery(message, context, systemPrompt);
            
            // Cache successful response
            await this.cacheResponse(cacheKey, response);
            
            // Log API usage
            await this.logApiUsage(response, message, context);
            
            return response;
          } catch (fallbackError) {
            console.error(`Fallback provider ${name} also failed:`, fallbackError);
          }
        }
      }
      
      // All providers failed
      return {
        text: 'I apologize, but I encountered an error processing your request. Please try again.',
        metadata: {},
        provider: 'error'
      };
    }
  }

  private buildSystemPrompt(skillLevel: string): string {
    return `You are FigBud, an AI-powered Figma design assistant. You help designers at the ${skillLevel} level.
    
Your capabilities include:
- Creating UI components when users ask (button, card, input, toggle, etc.)
- Providing design guidance and best practices
- Suggesting relevant tutorials for learning
- Offering step-by-step instructions
- Teaching design principles through practical examples

IMPORTANT: When users ask to create components, include the component type in your response.

Always respond in JSON format with the following structure:
{
  "message": "Your helpful response here",
  "action": "component_created" (when creating components),
  "componentType": "button/card/input/etc" (when creating components),
  "teacherNote": "A helpful tip about the component or design principle",
  "suggestions": ["Optional array of quick suggestions"],
  "tutorials": [{"title": "Tutorial name", "query": "search query for YouTube"}],
  "guidance": [{"step": 1, "instruction": "Step description"}]
}

Component Creation Examples:
- "create a button" → Include componentType: "button", action: "component_created"
- "make a card" → Include componentType: "card", action: "component_created"
- "show me an input" → Include componentType: "input", action: "component_created"

Be friendly, encouraging, and always include a teacherNote with practical tips.`;
  }

  private async getCachedResponse(cacheKey: string): Promise<AIResponse | null> {
    try {
      const { data, error } = await supabase
        .from('api_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (data) {
        // Update hit count
        await supabase
          .from('api_cache')
          .update({ 
            hit_count: data.hit_count + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', data.id);

        return data.response_data as AIResponse;
      }
    } catch (error) {
      console.error('Cache lookup error:', error);
    }
    return null;
  }

  private async cacheResponse(cacheKey: string, response: AIResponse): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour cache

      await supabase
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          response_data: response,
          provider: response.provider,
          expires_at: expiresAt.toISOString(),
          hit_count: 0
        });
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  private async logApiUsage(response: AIResponse, message: string, context: any): Promise<void> {
    try {
      // Get current user from context or auth
      const userId = context.userId || null;

      await supabase
        .from('api_calls')
        .insert({
          user_id: userId,
          endpoint: '/api/chat/message',
          method: 'POST',
          request_body: { message, context },
          response_status: 200,
          response_body: response,
          provider: response.provider,
          tokens_used: response.tokensUsed || 0,
          cost_cents: Math.round((response.cost || 0) * 100),
          duration_ms: Date.now() - context.startTime || 0
        });
    } catch (error) {
      console.error('API usage logging error:', error);
    }
  }

  // Get available providers
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // Set default provider
  setDefaultProvider(providerName: string): void {
    if (this.providers.has(providerName)) {
      this.defaultProvider = providerName;
    } else {
      throw new Error(`Provider ${providerName} is not available`);
    }
  }
}

// Export singleton instance
export const aiService = new AIService();