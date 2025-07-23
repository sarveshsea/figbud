// Backend API Service - Handles communication with FigBud server
export interface ChatResponse {
  text: string;
  metadata?: {
    componentType?: string;
    properties?: Record<string, any>;
    teacherNote?: string;
    suggestions?: string[];
    tutorials?: any[];
    explanation?: string;
    steps?: string[];
  };
}

export class BackendAPI {
  private baseUrl: string;
  private conversationId?: string;

  constructor() {
    // Always use localhost for now (update when you have production server)
    this.baseUrl = 'http://localhost:3000/api';
  }

  async sendChatMessage(message: string, context?: any): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: {
            ...context,
            conversationId: this.conversationId,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Debug logging
      console.log('[BackendAPI] Raw response from server:', {
        hasText: !!data.text,
        hasMessage: !!data.message,
        textPreview: data.text?.substring(0, 100),
        messagePreview: data.message?.substring(0, 100),
        fullData: data
      });
      
      // Store conversation ID if returned
      if (data.conversationId) {
        this.conversationId = data.conversationId;
      }

      return data;
    } catch (error) {
      console.error('[BackendAPI] Error:', error);
      throw error;
    }
  }

  async getComponentExplanation(componentType: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/components/explain/${componentType}`);
      if (!response.ok) throw new Error('Failed to get explanation');
      
      const data = await response.json();
      return data.explanation || 'No explanation available';
    } catch (error) {
      console.error('[BackendAPI] Error getting explanation:', error);
      return this.getLocalExplanation(componentType);
    }
  }

  private getLocalExplanation(componentType: string): string {
    const explanations: Record<string, string> = {
      button: "Buttons are interactive elements that trigger actions. Best practices:\n• Use clear, action-oriented labels\n• Primary buttons for main actions\n• Secondary for less important actions\n• Danger buttons for destructive actions",
      card: "Cards are containers for grouped content. Design tips:\n• Use consistent padding and spacing\n• Add elevation for visual hierarchy\n• Keep content concise and scannable\n• Use cards to create visual boundaries",
      input: "Input fields collect user data. Guidelines:\n• Always include clear labels\n• Use helpful placeholder text\n• Consider validation states\n• Group related inputs together",
      badge: "Badges display status or counts. Usage:\n• Keep text short (1-2 words)\n• Use consistent colors for status\n• Position near related content\n• Don't overuse - they draw attention",
      text: "Typography creates visual hierarchy. Tips:\n• Use size to show importance\n• Limit font variations\n• Ensure good contrast\n• Maintain consistent line spacing"
    };
    
    return explanations[componentType] || "Components should follow consistent design patterns.";
  }

  // Check if backend is available
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const backendAPI = new BackendAPI();