import { AIResponse } from './ai-providers';
import { supabase } from '../config/supabase';

export interface ParsedIntent {
  action: string | null;
  componentTypes: string[];
  keywords: string[];
  tutorialRequests: string[];
  isQuestion: boolean;
  needsGuidance: boolean;
  confidence: number;
}

export interface EnrichedResponse extends AIResponse {
  intent: ParsedIntent;
  suggestedComponents?: any[];
  relatedTutorials?: any[];
  actionableSteps?: any[];
}

export class ResponseParser {
  // Component type keywords mapping
  private static componentKeywords: Record<string, string[]> = {
    button: ['button', 'btn', 'click', 'press', 'action', 'submit', 'cta'],
    input: ['input', 'field', 'textfield', 'text field', 'entry', 'form field'],
    card: ['card', 'container', 'box', 'panel', 'tile'],
    navbar: ['navbar', 'navigation', 'nav bar', 'menu', 'header navigation'],
    toggle: ['toggle', 'switch', 'on/off', 'checkbox', 'enable/disable'],
    dropdown: ['dropdown', 'select', 'picker', 'combobox', 'choice'],
    modal: ['modal', 'dialog', 'popup', 'overlay', 'lightbox'],
    table: ['table', 'grid', 'data table', 'list view', 'spreadsheet'],
    form: ['form', 'signup', 'signin', 'login', 'register', 'contact form'],
    badge: ['badge', 'chip', 'tag', 'label', 'status'],
    textarea: ['textarea', 'text area', 'multiline', 'description field'],
    radio: ['radio', 'radio button', 'option group', 'single choice'],
    avatar: ['avatar', 'profile picture', 'user image', 'profile pic'],
    icon: ['icon', 'symbol', 'glyph', 'pictogram'],
    tooltip: ['tooltip', 'hint', 'popover', 'help text']
  };

  // Action keywords
  private static actionKeywords = {
    create: ['create', 'make', 'build', 'add', 'generate', 'design', 'new'],
    show: ['show', 'display', 'present', 'view', 'see'],
    learn: ['how to', 'tutorial', 'teach', 'learn', 'guide', 'help with', 'explain'],
    analyze: ['analyze', 'review', 'check', 'inspect', 'evaluate'],
    modify: ['change', 'update', 'modify', 'edit', 'adjust', 'customize']
  };

  // Tutorial keywords
  private static tutorialKeywords = [
    'tutorial', 'guide', 'how to', 'learn', 'teach me', 'show me how',
    'walkthrough', 'lesson', 'course', 'training', 'youtube', 'video'
  ];

  static async parseResponse(response: AIResponse, userMessage: string): Promise<EnrichedResponse> {
    const intent = this.detectIntent(userMessage, response.text);
    
    // Start with the original response
    const enrichedResponse: EnrichedResponse = {
      ...response,
      intent
    };

    // If components are detected, fetch them from database
    if (intent.componentTypes.length > 0) {
      enrichedResponse.suggestedComponents = await this.fetchComponents(intent.componentTypes);
    }

    // If tutorial requests are detected, prepare search queries
    if (intent.tutorialRequests.length > 0) {
      enrichedResponse.relatedTutorials = intent.tutorialRequests.map(request => ({
        searchQuery: request,
        type: 'youtube'
      }));
    }

    // Add actionable steps if needed
    if (intent.needsGuidance && intent.componentTypes.length > 0) {
      enrichedResponse.actionableSteps = this.generateActionableSteps(intent);
    }

    // Store the parsed intent for analytics
    await this.storeIntentAnalysis(userMessage, intent);

    return enrichedResponse;
  }

  private static detectIntent(userMessage: string, aiResponse: string): ParsedIntent {
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();
    const combinedText = `${lowerMessage} ${lowerResponse}`;

    // Detect action
    let detectedAction: string | null = null;
    let actionConfidence = 0;

    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      const matches = keywords.filter(keyword => combinedText.includes(keyword));
      if (matches.length > 0) {
        detectedAction = action;
        actionConfidence = matches.length / keywords.length;
        break;
      }
    }

    // Detect components
    const detectedComponents: string[] = [];
    for (const [component, keywords] of Object.entries(this.componentKeywords)) {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        detectedComponents.push(component);
      }
    }

    // Extract all keywords
    const allKeywords = this.extractKeywords(combinedText);

    // Detect tutorial requests
    const tutorialRequests: string[] = [];
    if (this.tutorialKeywords.some(keyword => lowerMessage.includes(keyword))) {
      // Extract the specific topic they want to learn about
      const topic = this.extractTutorialTopic(userMessage);
      if (topic) {
        tutorialRequests.push(topic);
      }
    }

    // Determine if it's a question
    const isQuestion = /\?|how|what|where|when|why|can|could|should/i.test(userMessage);

    // Determine if user needs guidance
    const needsGuidance = isQuestion || 
      lowerMessage.includes('help') || 
      lowerMessage.includes('guide') ||
      lowerMessage.includes('don\'t know') ||
      lowerMessage.includes('confused');

    // Calculate overall confidence
    const confidence = this.calculateConfidence(
      detectedAction !== null,
      detectedComponents.length > 0,
      allKeywords.length,
      actionConfidence
    );

    return {
      action: detectedAction,
      componentTypes: detectedComponents,
      keywords: allKeywords,
      tutorialRequests,
      isQuestion,
      needsGuidance,
      confidence
    };
  }

  private static extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'i', 'me', 'my', 'we', 'our',
      'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those'
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Return unique keywords
    return [...new Set(words)];
  }

  private static extractTutorialTopic(message: string): string | null {
    // Common patterns for tutorial requests
    const patterns = [
      /(?:tutorial|guide|teach|learn|how to)\s+(?:about\s+)?(.+?)(?:\?|$)/i,
      /show\s+me\s+how\s+to\s+(.+?)(?:\?|$)/i,
      /help\s+(?:me\s+)?(?:with\s+)?(.+?)(?:\?|$)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // If no specific pattern, but tutorial keywords exist, use component types
    if (this.tutorialKeywords.some(keyword => message.toLowerCase().includes(keyword))) {
      const components = this.detectComponents(message);
      if (components.length > 0) {
        return `${components[0]} in Figma`;
      }
    }

    return null;
  }

  private static detectComponents(text: string): string[] {
    const lowerText = text.toLowerCase();
    const detected: string[] = [];

    for (const [component, keywords] of Object.entries(this.componentKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detected.push(component);
      }
    }

    return detected;
  }

  private static calculateConfidence(
    hasAction: boolean,
    hasComponents: boolean,
    keywordCount: number,
    actionConfidence: number
  ): number {
    let confidence = 0;

    if (hasAction) confidence += 0.3 * actionConfidence;
    if (hasComponents) confidence += 0.3;
    if (keywordCount > 5) confidence += 0.2;
    if (keywordCount > 10) confidence += 0.2;

    return Math.min(confidence, 1);
  }

  private static async fetchComponents(componentTypes: string[]): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('figma_components')
        .select(`
          *,
          once_ui_mappings!inner(*)
        `)
        .in('type', componentTypes)
        .order('usage_count', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching components:', error);
      return [];
    }
  }

  private static generateActionableSteps(intent: ParsedIntent): any[] {
    const steps: any[] = [];

    if (intent.action === 'create' && intent.componentTypes.length > 0) {
      const componentType = intent.componentTypes[0];
      steps.push(
        { step: 1, action: 'select_frame', description: 'Select a frame or create a new one' },
        { step: 2, action: 'insert_component', description: `Insert ${componentType} component` },
        { step: 3, action: 'customize', description: 'Customize properties and styling' }
      );
    }

    return steps;
  }

  private static async storeIntentAnalysis(message: string, intent: ParsedIntent): Promise<void> {
    // Intent analysis is now stored by ChatController with proper session context
    // This method is kept for backward compatibility but no longer stores directly
    console.log('Intent analysis:', intent);
  }

  // Utility method to enhance AI responses with detected intents
  static enhanceAIResponse(response: AIResponse, intent: ParsedIntent): AIResponse {
    // Merge metadata
    const enhancedMetadata = {
      ...response.metadata,
      detectedAction: intent.action,
      detectedComponents: intent.componentTypes,
      isQuestion: intent.isQuestion,
      needsGuidance: intent.needsGuidance,
      confidence: intent.confidence
    };

    // If components were detected, add component-specific suggestions
    if (intent.componentTypes.length > 0 && !response.metadata?.components) {
      enhancedMetadata.components = intent.componentTypes.map(type => ({
        type,
        description: `Create a ${type} component`
      }));
    }

    // If tutorial was requested, add tutorial suggestions
    if (intent.tutorialRequests.length > 0 && !response.metadata?.tutorials) {
      enhancedMetadata.tutorials = intent.tutorialRequests.map(request => ({
        title: `Learn about ${request}`,
        query: request
      }));
    }

    return {
      ...response,
      metadata: enhancedMetadata
    };
  }
}