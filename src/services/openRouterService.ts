// OpenRouter AI Service - Connects to backend API
import { backendAPI } from './backendApi';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  message: string;
  action?: {
    type: 'create_component' | 'modify_component' | 'explain' | 'show_suggestions';
    data?: any;
  };
  suggestions?: string[];
  componentSpec?: {
    type: string;
    properties: Record<string, any>;
  };
  metadata?: {
    componentType?: string;
    teacherNote?: string;
    tutorials?: any[];
    guidance?: any[];
    explanation?: string;
    steps?: string[];
  };
}

export class OpenRouterService {
  private conversationHistory: AIMessage[] = [];
  private backendAvailable: boolean = false;
  private componentPatterns = {
    button: /\b(button|btn|click|submit|action)\b/i,
    card: /\b(card|container|box|panel)\b/i,
    input: /\b(input|field|textbox|form|email|password|search)\b/i,
    badge: /\b(badge|tag|label|status|chip)\b/i,
    text: /\b(text|heading|title|paragraph|h1|h2|h3)\b/i
  };

  constructor() {
    // Backend is always available in the new architecture
    this.backendAvailable = true;
  }

  async sendMessage(message: string, context?: any): Promise<AIResponse> {
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message
    });

    let response: AIResponse;

    // Always try backend first (health check removed)
    try {
      console.log('[OpenRouterService] Calling backend API...');
      const apiResponse = await backendAPI.sendChatMessage(message, {
        ...context,
        conversationHistory: this.conversationHistory.slice(-5)
      });
      
      console.log('[OpenRouterService] Backend response:', apiResponse);
      console.log('[OpenRouterService] Text field:', apiResponse.text?.substring(0, 200));
      response = this.parseBackendResponse(apiResponse);
    } catch (error) {
      console.error('[OpenRouterService] Backend failed:', error);
      response = this.processMessageLocally(message, context);
    }
    
    this.conversationHistory.push({
      role: 'assistant',
      content: response.message
    });
    
    return response;
  }

  private parseBackendResponse(apiResponse: any): AIResponse {
    const componentType = apiResponse.metadata?.componentType;
    
    // Debug logging to understand response structure
    console.log('[OpenRouterService] Raw backend response:', {
      hasText: !!apiResponse.text,
      hasMessage: !!apiResponse.message,
      textPreview: apiResponse.text?.substring(0, 100),
      messagePreview: apiResponse.message?.substring(0, 100)
    });
    
    return {
      message: apiResponse.text || apiResponse.message || 'I received your message but the response was empty.',
      suggestions: apiResponse.metadata?.suggestions || [],
      componentSpec: componentType ? {
        type: componentType,
        properties: apiResponse.metadata?.properties || this.extractProperties(apiResponse.text, componentType)
      } : undefined,
      metadata: {
        ...apiResponse.metadata,
        teacherNote: apiResponse.metadata?.teacherNote || this.generateTeacherNote(componentType),
        explanation: apiResponse.metadata?.explanation
      }
    };
  }

  private processMessageLocally(message: string, context?: any): AIResponse {
    const lowerMessage = message.toLowerCase().trim();
    
    // Handle greetings and general queries
    if (this.isGreeting(lowerMessage)) {
      return this.handleGreeting();
    }
    
    // Check for help requests
    if (this.isHelpRequest(lowerMessage)) {
      return this.handleHelp();
    }
    
    // Detect component type from message
    const componentType = this.detectComponentType(message);
    
    if (componentType) {
      // Extract properties from the message
      const properties = this.extractProperties(message, componentType);
      
      return {
        message: this.generateCreationMessage(componentType, properties),
        componentSpec: {
          type: componentType,
          properties
        },
        suggestions: this.generateContextualSuggestions(componentType),
        metadata: {
          componentType,
          teacherNote: this.generateTeacherNote(componentType)
        }
      };
    }
    
    // Default response for unclear requests
    return {
      message: "I can help you create UI components! Just tell me what you need.",
      suggestions: [
        "Create a primary button",
        "Make a card with shadow",
        "Build an input field",
        "Design a success badge",
        "Create a large heading"
      ]
    };
  }
  
  private isGreeting(message: string): boolean {
    const greetings = ['hey', 'hi', 'hello', 'yo', 'sup', 'greetings', 'howdy'];
    return greetings.some(g => message.startsWith(g));
  }
  
  private isHelpRequest(message: string): boolean {
    return message.includes('help') || message.includes('what can you') || message === '?';
  }
  
  private handleGreeting(): AIResponse {
    return {
      message: "Hey! I'm FigBud, your component creation assistant. What would you like to build today?",
      suggestions: [
        "Create a primary button",
        "Make a modern card",
        "Build an input field",
        "Show me all components"
      ]
    };
  }
  
  private handleHelp(): AIResponse {
    return {
      message: "I can create these components for you:\n• Buttons (primary, secondary, danger)\n• Cards (with shadows and content)\n• Input fields (with labels)\n• Badges (success, warning, error)\n• Text elements (headings, paragraphs)\n\nJust describe what you need!",
      suggestions: [
        "Create a submit button",
        "Make a profile card",
        "Build an email input",
        "Design an error badge"
      ]
    };
  }
  
  private generateCreationMessage(type: string, properties: any): string {
    const messages = {
      button: `Creating a ${properties.variant || 'primary'} button${properties.label ? ` with text "${properties.label}"` : ''}. I'll add it to your sandbox!`,
      card: `Building a ${properties.elevation || 'elevated'} card${properties.title ? ` titled "${properties.title}"` : ''}. Check your sandbox!`,
      input: `Setting up ${properties.label ? `a ${properties.label} input` : 'an input field'}. It's ready in the sandbox!`,
      badge: `Designing a ${properties.variant || 'success'} badge${properties.text ? ` saying "${properties.text}"` : ''}. Added to sandbox!`,
      text: `Creating ${properties.size || 'medium'} text${properties.text ? `: "${properties.text}"` : ''}. Look for it in the sandbox!`
    };
    
    return messages[type] || `Creating your ${type} component now!`;
  }
  
  private extractProperties(message: string, type: string): Record<string, any> {
    const props: Record<string, any> = {};
    
    // Extract variant (primary, secondary, danger, success, etc.)
    const variantMatch = message.match(/\b(primary|secondary|danger|success|warning|error|info)\b/i);
    if (variantMatch && variantMatch[1]) props.variant = variantMatch[1].toLowerCase();
    
    // Extract size
    const sizeMatch = message.match(/\b(small|medium|large|tiny|huge)\b/i);
    if (sizeMatch && sizeMatch[1]) props.size = sizeMatch[1].toLowerCase();
    
    // Extract text content
    const quotedText = message.match(/["']([^"']+)["']/);
    if (quotedText && quotedText[1]) {
      props[type === 'button' ? 'label' : 'text'] = quotedText[1];
    } else {
      // Try to extract text after "with text" or "saying"
      const textMatch = message.match(/(?:with text|saying|labeled?|text)\s+(\w+(?:\s+\w+)*)/i);
      if (textMatch && textMatch[1]) {
        props[type === 'button' ? 'label' : 'text'] = textMatch[1].trim();
      }
    }
    
    // Type-specific extractions
    switch (type) {
      case 'card':
        if (message.includes('shadow')) props.elevation = 'elevated';
        if (message.includes('flat')) props.elevation = 'flat';
        break;
      case 'input':
        if (message.includes('email')) props.label = 'Email';
        if (message.includes('password')) props.label = 'Password';
        if (message.includes('search')) props.label = 'Search';
        break;
    }
    
    return props;
  }
  
  private generateContextualSuggestions(componentType: string): string[] {
    const suggestions = {
      button: [
        "Change it to secondary variant",
        "Make it larger",
        "Create a danger button",
        "Add another button"
      ],
      card: [
        "Add content to the card",
        "Remove the shadow",
        "Create another card",
        "Make it wider"
      ],
      input: [
        "Add a submit button",
        "Create a password field",
        "Make a form",
        "Add validation"
      ],
      badge: [
        "Change to error variant",
        "Create a warning badge",
        "Make it smaller",
        "Add to a card"
      ],
      text: [
        "Make it a heading",
        "Change the size",
        "Add a paragraph",
        "Create a subtitle"
      ]
    };
    
    return suggestions[componentType] || ["Create another component", "Show me the sandbox"];
  }

  private detectComponentType(message: string): string | undefined {
    // Check each pattern
    for (const [type, pattern] of Object.entries(this.componentPatterns)) {
      if (pattern.test(message)) {
        return type;
      }
    }
    return undefined;
  }

  private generateTeacherNote(componentType?: string): string {
    if (!componentType) {
      return "Start by describing what you want to create!";
    }

    const notes: Record<string, string> = {
      button: "Buttons should have clear labels and appropriate visual hierarchy. Primary buttons draw the most attention.",
      card: "Cards are great for grouping related content. Use consistent spacing and elevation for better visual hierarchy.",
      input: "Input fields should have clear labels and helpful placeholder text. Consider adding validation states.",
      badge: "Badges are perfect for status indicators or counts. Keep them small and use colors meaningfully.",
      text: "Typography creates hierarchy. Use different sizes and weights to guide users through your content."
    };

    return notes[componentType] || "Great choice! This component will enhance your design.";
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();