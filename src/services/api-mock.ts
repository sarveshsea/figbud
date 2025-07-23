// Mock API service for standalone plugin operation
// No backend server required

class MockApiService {
  private widgetSessionId: string;

  constructor() {
    this.widgetSessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `figbud-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  getSessionId(): string {
    return this.widgetSessionId;
  }

  // Mock chat functionality - just returns helpful prompts
  async sendChatMessage(message: string, context?: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const lowerMessage = message.toLowerCase();
    
    // Simple keyword-based responses
    if (lowerMessage.includes('button')) {
      return {
        response: "I can help you create a button! Use the menu: Plugins → FigBud → Quick Create Button",
        suggestions: [
          "Create a primary button",
          "Create a secondary button",
          "Create a danger button"
        ]
      };
    }
    
    if (lowerMessage.includes('card')) {
      return {
        response: "I can help you create a card component! Use the menu: Plugins → FigBud → Quick Create Card",
        suggestions: [
          "Create a basic card",
          "Create a card with shadow",
          "Create a card with image"
        ]
      };
    }
    
    if (lowerMessage.includes('input')) {
      return {
        response: "I can help you create an input field! Use the menu: Plugins → FigBud → Quick Create Input",
        suggestions: [
          "Create a text input",
          "Create a password input",
          "Create a search input"
        ]
      };
    }

    // Default response
    return {
      response: "I'm FigBud, your AI design assistant! I can help you create UI components. Try asking me to create a button, card, or input field.",
      suggestions: [
        "Create a button",
        "Create a card",
        "Create an input field"
      ]
    };
  }

  // Tutorials removed - not available in offline mode
  async searchTutorials(query: string): Promise<any> {
    return {
      tutorials: [],
      message: "Tutorial search requires internet connection"
    };
  }

  // No-op methods for features that require backend
  async startChatSession(): Promise<void> {
    // No backend needed
  }

  async endChatSession(): Promise<void> {
    // No backend needed
  }

  async trackAnalytics(event: string, properties?: any): Promise<void> {
    console.log('[Analytics]', event, properties);
    // No backend tracking
  }
}

export const apiService = new MockApiService();