import OpenAI from 'openai';
import { config } from 'dotenv';
import { RedisService } from './redis';

config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIResponse {
  text: string;
  metadata?: {
    suggestions?: string[];
    tutorials?: any[];
    components?: any[];
    guidance?: any[];
  };
}

export interface DesignContext {
  selection?: any[];
  currentPage?: string;
  viewport?: any;
}

export class OpenAIService {
  static async processDesignQuery(
    message: string,
    context: DesignContext,
    userSkillLevel: string = 'beginner'
  ): Promise<AIResponse> {
    try {
      // Check Redis cache first
      const cacheKey = RedisService.keys.openAIResponse(message, JSON.stringify(context));
      const cachedResponse = await RedisService.getJSON<AIResponse>(cacheKey);
      if (cachedResponse) {
        console.log('OpenAI response served from cache');
        return cachedResponse;
      }
      const systemPrompt = this.buildSystemPrompt(userSkillLevel);
      const contextualPrompt = this.buildContextualPrompt(message, context);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: contextualPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      const aiResponse: AIResponse = {
        text: response.message || 'I can help you with that!',
        metadata: {
          suggestions: response.suggestions || [],
          tutorials: response.tutorials || [],
          components: response.components || [],
          guidance: response.guidance || []
        }
      };
      
      // Cache the response
      await RedisService.setJSON(cacheKey, aiResponse, RedisService.TTL.OPENAI_RESPONSE);
      
      return aiResponse;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        text: 'I apologize, but I encountered an error processing your request. Please try again.',
        metadata: {}
      };
    }
  }

  static buildSystemPrompt(skillLevel: string): string {
    return `You are FigBud, an AI-powered Figma design assistant. You help designers at the ${skillLevel} level.
    
Your capabilities include:
- Providing design guidance and best practices
- Suggesting relevant YouTube tutorials
- Recommending component structures
- Offering step-by-step instructions
- Analyzing designs for improvements

Always respond in JSON format with the following structure:
{
  "message": "Your helpful response here",
  "suggestions": ["Optional array of quick suggestions"],
  "tutorials": [{"title": "Tutorial name", "query": "search query for YouTube"}],
  "components": [{"type": "component type", "description": "what to create"}],
  "guidance": [{"step": 1, "instruction": "Step description"}]
}

Be friendly, encouraging, and provide actionable advice tailored to the user's skill level.`;
  }

  static buildContextualPrompt(message: string, context: DesignContext): string {
    let prompt = message;

    if (context.selection && context.selection.length > 0) {
      prompt += `\n\nContext: The user has ${context.selection.length} element(s) selected:`;
      context.selection.forEach((item, index) => {
        prompt += `\n- ${item.type}${item.name ? ` "${item.name}"` : ''} (${item.width}x${item.height})`;
      });
    }

    if (context.currentPage) {
      prompt += `\n\nCurrent page: ${context.currentPage}`;
    }

    return prompt;
  }

  static async analyzeDesign(
    context: DesignContext,
    analysisType: 'color' | 'typography' | 'spacing' | 'general'
  ): Promise<AIResponse> {
    try {
      const prompt = `Analyze the current design for ${analysisType} and provide specific recommendations.
      
Context: ${JSON.stringify(context)}

Provide actionable feedback and improvements.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a design analysis expert. Provide specific, actionable feedback in JSON format.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      return {
        text: response.analysis || 'Analysis complete.',
        metadata: {
          suggestions: response.improvements || [],
          guidance: response.steps || []
        }
      };
    } catch (error) {
      console.error('Design analysis error:', error);
      return {
        text: 'Unable to analyze the design at this moment. Please try again.',
        metadata: {}
      };
    }
  }

  static async generateComponentCode(
    componentType: string,
    requirements: string
  ): Promise<AIResponse> {
    try {
      const prompt = `Generate Figma plugin code to create a ${componentType} component with these requirements: ${requirements}

Return JSON with:
- description: What the component does
- code: The actual Figma API code to create it
- tips: Usage tips`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a Figma API expert. Generate clean, working Figma plugin code.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 600,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      return {
        text: response.description || 'Component generated.',
        metadata: {
          components: [{
            type: componentType,
            code: response.code,
            tips: response.tips
          }]
        }
      };
    } catch (error) {
      console.error('Component generation error:', error);
      return {
        text: 'Unable to generate component code. Please try again.',
        metadata: {}
      };
    }
  }
}