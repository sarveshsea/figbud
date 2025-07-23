import axios from 'axios';
import { config } from 'dotenv';
import { AIProvider, AIResponse } from './ai-providers';

config();

interface ModelConfig {
  name: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  isFree: boolean;
  priority: number;
  costPer1kTokens: number;
}

export class CascadingAIProvider implements AIProvider {
  name = 'cascading';
  private models: ModelConfig[] = [];
  private userApiKeys: Record<string, string>;
  
  constructor(userApiKeys: Record<string, string> = {}) {
    this.userApiKeys = userApiKeys;
    this.initializeModels();
  }

  private initializeModels() {
    // Prefer user-provided keys over environment variables
    const openRouterKey = this.userApiKeys['X-OpenRouter-Key'] || process.env.OPENROUTER_API_KEY || '';
    const deepSeekKey = this.userApiKeys['X-DeepSeek-Key'] || process.env.DEEPSEEK_API_KEY || '';
    
    // Free models first (lowest priority numbers = first to try)
    if (openRouterKey) {
      this.models.push({
        name: 'openrouter-free-llama',
        model: 'meta-llama/llama-3.2-3b-instruct:free',
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        isFree: true,
        priority: 1,
        costPer1kTokens: 0
      });

      this.models.push({
        name: 'openrouter-free-gemma',
        model: 'google/gemma-2-9b-it:free',
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        isFree: true,
        priority: 2,
        costPer1kTokens: 0
      });
    }

    // DeepSeek direct API - always use direct API to save costs
    // Direct API: $0.14/million tokens vs OpenRouter: $0.28/million tokens (2x cost!)
    if (deepSeekKey) {
      this.models.push({
        name: 'deepseek-direct',
        model: 'deepseek-chat',
        apiKey: deepSeekKey,
        baseUrl: 'https://api.deepseek.com/v1/chat/completions',
        isFree: false,
        priority: 3, // Always try after free models
        costPer1kTokens: 0.00014 // $0.14 per million = $0.00014 per 1k tokens
      });
    }

    // Additional paid models via OpenRouter if needed
    // Note: We removed DeepSeek from OpenRouter to avoid double cost
    if (openRouterKey) {
      this.models.push({
        name: 'openrouter-claude-haiku',
        model: 'anthropic/claude-3-haiku',
        apiKey: openRouterKey,
        baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
        isFree: false,
        priority: 4,
        costPer1kTokens: 0.00025 // $0.25 per million
      });
    }

    // Sort by priority
    this.models.sort((a, b) => a.priority - b.priority);
    
    console.log(`[CascadingAI] Initialized with ${this.models.length} models (User keys: ${Object.keys(this.userApiKeys).length})`);
  }

  // Removed isDeepSeekOffHours() - we now always use DeepSeek direct API

  async processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse> {
    console.log(`[CascadingAI] Processing with ${this.models.length} available models`);
    
    const attempts: any[] = [];
    let lastError: any = null;

    // Try each model in order
    for (const model of this.models) {
      try {
        console.log(`[CascadingAI] Trying ${model.name} (${model.isFree ? 'FREE' : 'PAID'})...`);
        
        const response = await this.callModel(model, message, context, systemPrompt);
        
        // Success! Add attempt info
        attempts.push({
          model: model.name,
          success: true,
          isFree: model.isFree,
          cost: model.costPer1kTokens
        });

        return {
          ...response,
          metadata: {
            ...response.metadata,
            attempts,
            usedModel: model.name,
            isFree: model.isFree
          }
        };
      } catch (error) {
        console.error(`[CascadingAI] ${model.name} failed:`, error);
        lastError = error;
        attempts.push({
          model: model.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // All models failed
    throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
  }

  private async callModel(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string
  ): Promise<AIResponse> {
    const isDeepSeekDirect = model.name.includes('deepseek-direct');
    
    const requestBody = {
      model: model.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.buildPrompt(message, context) }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      ...(isDeepSeekDirect ? {} : { response_format: { type: 'json_object' } })
    };

    const headers = isDeepSeekDirect ? {
      'Authorization': `Bearer ${model.apiKey}`,
      'Content-Type': 'application/json'
    } : {
      'Authorization': `Bearer ${model.apiKey}`,
      'HTTP-Referer': 'https://figma.com',
      'X-Title': 'FigBud Assistant',
      'Content-Type': 'application/json'
    };

    const response = await axios.post(model.baseUrl, requestBody, { headers });
    
    // Check if response has the expected structure
    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      throw new Error('Invalid response structure from AI model');
    }
    
    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }
    
    // Log the raw content for debugging
    console.log(`[CascadingAI] Raw response from ${model.name}:`, content.substring(0, 200));
    
    // Remove markdown code block markers if present
    let cleanContent = content;
    if (content.startsWith('```json')) {
      cleanContent = content.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(cleanContent);
    } catch {
      // If not JSON, try to extract component info
      parsedContent = this.extractFromText(content);
    }
    
    return {
      text: JSON.stringify(parsedContent), // Return full JSON for proper parsing
      metadata: {
        componentType: parsedContent.componentType,
        properties: parsedContent.properties,
        teacherNote: parsedContent.teacherNote,
        suggestions: parsedContent.suggestions || [],
        explanation: parsedContent.explanation,
        model: model.name,
        usedModel: model.name,
        isFree: model.isFree
      },
      provider: this.name,
      tokensUsed: response.data.usage?.total_tokens,
      cost: (response.data.usage?.total_tokens || 0) * model.costPer1kTokens / 1000
    };
  }

  private buildPrompt(message: string, context: any): string {
    let prompt = '';
    
    // Add conversation history if available
    if (context.history && context.history.length > 0) {
      prompt += 'Previous conversation:\n';
      context.history.forEach((msg: any) => {
        prompt += `User: ${msg.message}\n`;
        prompt += `Assistant: ${msg.response}\n`;
      });
      prompt += '\n---\n\n';
    }
    
    prompt += `User Message: ${message}\n`;
    
    // Add context without history (to avoid duplication)
    const contextWithoutHistory = { ...context };
    delete contextWithoutHistory.history;
    if (Object.keys(contextWithoutHistory).length > 0) {
      prompt += `Context: ${JSON.stringify(contextWithoutHistory)}\n`;
    }
    
    prompt += `
IMPORTANT: Respond ONLY with valid JSON. Do not include any text before or after the JSON.
If the user wants to create a UI component, include componentType and properties.
Provide educational content and explanations in the JSON fields.`;
    
    if (context.history && context.history.length > 0) {
      prompt += '\nConsider the conversation history when responding.';
    }
    
    return prompt;
  }

  private extractFromText(text: string): any {
    // Basic extraction from non-JSON responses
    const result: any = { message: text };
    
    // Try to detect component type
    const componentTypes = ['button', 'card', 'input', 'badge', 'text'];
    for (const type of componentTypes) {
      if (text.toLowerCase().includes(type)) {
        result.componentType = type;
        break;
      }
    }
    
    return result;
  }
}