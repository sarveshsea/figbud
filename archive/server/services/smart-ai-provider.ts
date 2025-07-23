import axios from 'axios';
import { AIProvider, AIResponse } from './ai-providers';
import { DeepSeekProvider, OpenRouterProvider } from './ai-providers';
import { supabase } from '../config/supabase';

// Model configuration with cost per million tokens
interface ModelConfig {
  name: string;
  inputCost: number;  // $ per 1M tokens
  outputCost: number; // $ per 1M tokens
  isFree: boolean;
  provider: 'openrouter' | 'deepseek';
  quality: 'low' | 'medium' | 'high';
}

// OpenRouter model configurations
const OPENROUTER_MODELS: ModelConfig[] = [
  // Free models (try first)
  {
    name: 'google/gemini-2.0-flash-thinking-exp:free',
    inputCost: 0,
    outputCost: 0,
    isFree: true,
    provider: 'openrouter',
    quality: 'medium'
  },
  {
    name: 'google/gemini-flash-1.5-8b:free',
    inputCost: 0,
    outputCost: 0,
    isFree: true,
    provider: 'openrouter',
    quality: 'medium'
  },
  {
    name: 'microsoft/phi-3-mini-128k-instruct:free',
    inputCost: 0,
    outputCost: 0,
    isFree: true,
    provider: 'openrouter',
    quality: 'low'
  },
  {
    name: 'meta-llama/llama-3.2-1b-instruct:free',
    inputCost: 0,
    outputCost: 0,
    isFree: true,
    provider: 'openrouter',
    quality: 'low'
  },
  // Cheap paid models (fallback)
  {
    name: 'deepseek/deepseek-chat',
    inputCost: 0.14,
    outputCost: 0.28,
    isFree: false,
    provider: 'openrouter',
    quality: 'high'
  },
  {
    name: 'meta-llama/llama-3.1-8b-instruct',
    inputCost: 0.18,
    outputCost: 0.18,
    isFree: false,
    provider: 'openrouter',
    quality: 'medium'
  },
  {
    name: 'google/gemini-flash-1.5',
    inputCost: 0.25,
    outputCost: 0.25,
    isFree: false,
    provider: 'openrouter',
    quality: 'high'
  }
];

export class SmartAIProvider implements AIProvider {
  name = 'smart';
  private openRouterKey: string;
  private deepSeekKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private strategy: string;

  constructor() {
    this.openRouterKey = process.env.OPENROUTER_API_KEY || '';
    this.deepSeekKey = process.env.DEEPSEEK_API_KEY || '';
    this.strategy = process.env.AI_STRATEGY || 'cost_optimized';
  }

  async processQuery(message: string, context: any, systemPrompt: string): Promise<AIResponse> {
    const models = this.getModelPriority();
    let lastError: Error | null = null;

    // Track attempts for logging
    const attempts: { model: string; success: boolean; error?: string }[] = [];

    for (const model of models) {
      try {
        console.log(`[SmartAI] Trying model: ${model.name} (${model.isFree ? 'FREE' : `$${model.inputCost}/$${model.outputCost}/M`})`);
        
        let response: AIResponse;
        
        if (model.provider === 'openrouter') {
          response = await this.callOpenRouter(model, message, context, systemPrompt);
        } else {
          // Direct DeepSeek API call
          const deepSeekProvider = new DeepSeekProvider();
          response = await deepSeekProvider.processQuery(message, context, systemPrompt);
        }

        // Track successful attempt
        attempts.push({ model: model.name, success: true });
        await this.logModelUsage(model, true, response.tokensUsed || 0);
        
        // Add model info to response
        response.metadata = {
          ...response.metadata,
          model: model.name,
          isFree: model.isFree,
          attempts: attempts
        };

        console.log(`[SmartAI] Success with ${model.name}`);
        return response;

      } catch (error) {
        lastError = error as Error;
        attempts.push({ 
          model: model.name, 
          success: false, 
          error: (error as Error).message 
        });
        
        console.error(`[SmartAI] Failed with ${model.name}:`, (error as Error).message);
        await this.logModelUsage(model, false, 0);
        
        // Continue to next model
        continue;
      }
    }

    // All models failed
    throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
  }

  private async callOpenRouter(
    model: ModelConfig, 
    message: string, 
    context: any, 
    systemPrompt: string
  ): Promise<AIResponse> {
    const response = await axios.post(
      this.baseUrl,
      {
        model: model.name,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.buildPrompt(message, context) }
        ],
        temperature: 0.7,
        max_tokens: 500,
        // Only request JSON format from capable models
        ...(model.quality !== 'low' && { response_format: { type: 'json_object' } })
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openRouterKey}`,
          'HTTP-Referer': 'https://figbud.com',
          'X-Title': 'FigBud Assistant',
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
        action: this.detectAction(message),
        componentType: this.detectComponentType(message),
        teacherNote: this.generateTeacherNote(message)
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
        guidance: parsedContent.guidance || []
      },
      provider: 'openrouter',
      tokensUsed: response.data.usage?.total_tokens,
      cost: this.calculateCost(model, response.data.usage || {})
    };
  }

  private getModelPriority(): ModelConfig[] {
    const currentHour = new Date().getHours();
    const isOffPeak = this.isOffPeakHours(currentHour);
    
    let models = [...OPENROUTER_MODELS];

    // Sort based on strategy
    switch (this.strategy) {
      case 'cost_optimized':
        // Free models first, then by cost
        models.sort((a, b) => {
          if (a.isFree && !b.isFree) return -1;
          if (!a.isFree && b.isFree) return 1;
          return (a.inputCost + a.outputCost) - (b.inputCost + b.outputCost);
        });
        break;
      
      case 'performance':
        // Quality first, cost second
        models.sort((a, b) => {
          const qualityOrder = { high: 3, medium: 2, low: 1 };
          return qualityOrder[b.quality] - qualityOrder[a.quality];
        });
        break;
      
      case 'balanced':
      default:
        // Free high-quality first, then balance cost/quality
        models.sort((a, b) => {
          if (a.isFree && !b.isFree && a.quality !== 'low') return -1;
          if (!a.isFree && b.isFree && b.quality !== 'low') return 1;
          const aScore = (a.quality === 'high' ? 3 : a.quality === 'medium' ? 2 : 1) / (a.inputCost + a.outputCost + 1);
          const bScore = (b.quality === 'high' ? 3 : b.quality === 'medium' ? 2 : 1) / (b.inputCost + b.outputCost + 1);
          return bScore - aScore;
        });
    }

    // During off-peak hours, prioritize DeepSeek
    if (isOffPeak && this.deepSeekKey) {
      const deepSeekModel = models.find(m => m.name === 'deepseek/deepseek-chat');
      if (deepSeekModel) {
        models = [deepSeekModel, ...models.filter(m => m.name !== 'deepseek/deepseek-chat')];
      }
    }

    return models;
  }

  private isOffPeakHours(hour: number): boolean {
    const offPeakStart = parseInt(process.env.DEEPSEEK_OFFPEAK_START || '22');
    const offPeakEnd = parseInt(process.env.DEEPSEEK_OFFPEAK_END || '8');
    
    if (offPeakStart > offPeakEnd) {
      // Crosses midnight
      return hour >= offPeakStart || hour < offPeakEnd;
    }
    return hour >= offPeakStart && hour < offPeakEnd;
  }

  private calculateCost(model: ModelConfig, usage: any): number {
    const inputTokens = usage.prompt_tokens || 0;
    const outputTokens = usage.completion_tokens || 0;
    
    const inputCost = (inputTokens / 1_000_000) * model.inputCost;
    const outputCost = (outputTokens / 1_000_000) * model.outputCost;
    
    return inputCost + outputCost;
  }

  private async logModelUsage(model: ModelConfig, success: boolean, tokensUsed: number) {
    try {
      await supabase
        .from('model_usage')
        .insert({
          model_name: model.name,
          provider: model.provider,
          success,
          tokens_used: tokensUsed,
          cost_cents: Math.round(this.calculateCost(model, { 
            prompt_tokens: tokensUsed * 0.3, 
            completion_tokens: tokensUsed * 0.7 
          }) * 100),
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log model usage:', error);
    }
  }

  private buildPrompt(message: string, context: any): string {
    return `User Message: ${message}
Context: ${JSON.stringify(context)}

IMPORTANT: If the user asks to create, make, build, or show a UI component (button, card, input, toggle, etc.), you MUST include:
- action: "component_created"
- componentType: the specific component type
- teacherNote: a helpful tip about using or designing that component

Please provide a helpful response for this Figma design query.`;
  }

  private detectAction(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.match(/create|make|build|show|add/)) {
      return 'component_created';
    }
    return undefined;
  }

  private detectComponentType(message: string): string | undefined {
    const lowerMessage = message.toLowerCase();
    const components = ['button', 'card', 'input', 'toggle', 'checkbox', 'radio', 'badge', 'textarea', 'dropdown'];
    
    for (const component of components) {
      if (lowerMessage.includes(component)) {
        return component;
      }
    }
    return undefined;
  }

  private generateTeacherNote(message: string): string | undefined {
    const componentType = this.detectComponentType(message);
    if (!componentType) return undefined;

    const notes: Record<string, string> = {
      button: 'Buttons should have clear labels and appropriate padding. Use primary buttons for main actions.',
      card: 'Cards group related content. Use consistent padding and consider adding subtle shadows.',
      input: 'Input fields need clear labels and placeholder text. Always consider accessibility.',
      toggle: 'Toggles are for on/off states. Place labels on the left for better usability.',
      checkbox: 'Checkboxes allow multiple selections. Group related options together.',
      radio: 'Radio buttons are for single selection from a group. Always have one option selected by default.',
      badge: 'Badges show status or counts. Keep text short and use appropriate colors.',
      textarea: 'Textareas are for longer text input. Set appropriate min/max heights.',
      dropdown: 'Dropdowns save space for long lists. Consider search functionality for 10+ items.'
    };

    return notes[componentType];
  }
}