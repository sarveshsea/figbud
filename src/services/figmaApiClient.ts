// Figma Plugin API Client - Handles HTTP requests from UI context
// This service is specifically designed for Figma plugin UI context where we can make HTTP requests

interface ChatRequest {
  message: string;
  context?: any;
  sessionId?: string;
}

interface ChatResponse {
  message: string;
  componentSpec?: {
    type: string;
    properties: Record<string, any>;
  };
  suggestions?: string[];
  metadata?: {
    componentType?: string;
    teacherNote?: string;
    tutorials?: any[];
    guidance?: any[];
  };
}

class FigmaApiClient {
  private baseUrl: string;
  private sessionId: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `figbud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async sendChatMessage(message: string, context?: any): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          sessionId: this.sessionId,
        } as ChatRequest),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform backend response to match our interface
      return {
        message: data.text || data.message || "I'll help you with that!",
        componentSpec: data.metadata?.componentType ? {
          type: data.metadata.componentType,
          properties: data.metadata.properties || {}
        } : undefined,
        suggestions: data.metadata?.suggestions || [],
        metadata: {
          componentType: data.metadata?.componentType,
          teacherNote: data.metadata?.teacherNote,
          tutorials: data.metadata?.tutorials,
          guidance: data.metadata?.guidance
        }
      };
    } catch (error) {
      console.error('API request failed:', error);
      
      // Fallback to local processing if API fails
      return this.fallbackLocalResponse(message);
    }
  }

  private fallbackLocalResponse(message: string): ChatResponse {
    const lowerMessage = message.toLowerCase();
    
    // Basic pattern matching for common requests
    if (lowerMessage.includes('button')) {
      return {
        message: "I'll create a button for you! Since the API is unavailable, I'm using local processing.",
        componentSpec: {
          type: 'button',
          properties: {
            label: 'Click me',
            variant: 'primary',
            size: 'medium'
          }
        },
        suggestions: [
          'Change the button text',
          'Make it secondary style',
          'Create a larger button'
        ],
        metadata: {
          componentType: 'button',
          teacherNote: 'Buttons should have clear, action-oriented labels.'
        }
      };
    }
    
    if (lowerMessage.includes('card')) {
      return {
        message: "Creating a card component locally.",
        componentSpec: {
          type: 'card',
          properties: {
            title: 'Card Title',
            description: 'Card content goes here',
            elevation: 'elevated'
          }
        },
        suggestions: [
          'Add content to the card',
          'Remove the shadow',
          'Create another card'
        ],
        metadata: {
          componentType: 'card',
          teacherNote: 'Cards group related content and create visual hierarchy.'
        }
      };
    }
    
    // Default response
    return {
      message: "I can help you create UI components! The API is currently unavailable, but I can still create basic components locally.",
      suggestions: [
        'Create a button',
        'Make a card',
        'Build an input field',
        'Show me what you can do'
      ]
    };
  }

  // Health check to verify API connectivity
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const figmaApiClient = new FigmaApiClient();