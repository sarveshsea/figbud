import axios from 'axios';
import { config } from 'dotenv';

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
    suggestions?: string[];
    properties?: Record<string, any>;
    error?: string;
  };
  provider: string;
  tokensUsed?: number;
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
          model: 'deepseek/deepseek-chat',
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
            'HTTP-Referer': 'https://figma.com',
            'X-Title': 'FigBud Assistant',
            'Content-Type': 'application/json'
          }
        }
      );

      const content = JSON.parse(response.data.choices[0]?.message?.content || '{}');
      
      return {
        text: content.message || 'I can help you with that!',
        metadata: {
          componentType: content.componentType,
          properties: content.properties,
          teacherNote: content.teacherNote,
          suggestions: content.suggestions || [],
          action: content.componentType ? 'component_created' : undefined
        },
        provider: this.name,
        tokensUsed: response.data.usage?.total_tokens
      };
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new Error('Failed to process with OpenRouter');
    }
  }

  private buildPrompt(message: string, context: any): string {
    return `User Message: ${message}
Context: ${JSON.stringify(context)}

Remember to include componentType and properties if the user wants to create a UI component.`;
  }
}