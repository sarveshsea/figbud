// AI Service for FigBud - Vanilla JS Implementation
// Handles communication with DeepSeek and OpenRouter

class AIService {
  constructor() {
    // Backend API endpoint (adjust based on your server setup)
    this.apiEndpoint = 'http://localhost:3000/api';
    this.authToken = null;
  }

  // Set authentication token if needed
  setAuthToken(token) {
    this.authToken = token;
  }

  // Send message to AI and get response
  async sendMessage(message, context = {}) {
    try {
      const response = await fetch(`${this.apiEndpoint}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
        },
        body: JSON.stringify({
          message,
          context: {
            tool: 'figma_plugin',
            ...context
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[AIService] Error:', error);
      throw error;
    }
  }

  // Parse AI response for component creation
  parseComponentRequest(aiResponse) {
    const components = [];
    
    // Look for component patterns in the response
    const componentPatterns = {
      button: /create\s+(?:a\s+)?button|button\s+component/i,
      card: /create\s+(?:a\s+)?card|card\s+component/i,
      input: /create\s+(?:an?\s+)?input|input\s+field|form\s+input/i,
      navbar: /create\s+(?:a\s+)?nav(?:bar)?|navigation/i,
      form: /create\s+(?:a\s+)?form|form\s+component/i,
      toggle: /create\s+(?:a\s+)?toggle|switch\s+component/i
    };

    for (const [type, pattern] of Object.entries(componentPatterns)) {
      if (pattern.test(aiResponse)) {
        components.push({ type });
      }
    }

    // Extract properties from AI response (if structured)
    if (aiResponse.includes('```json')) {
      try {
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          const componentData = JSON.parse(jsonMatch[1]);
          return componentData.components || components;
        }
      } catch (e) {
        console.warn('[AIService] Could not parse JSON from response');
      }
    }

    return components;
  }

  // Format message for Figma context
  formatMessageForFigma(message) {
    return {
      message,
      context: {
        platform: 'figma',
        capabilities: [
          'create_button',
          'create_card', 
          'create_input',
          'create_navbar',
          'create_form',
          'create_toggle'
        ],
        instruction: 'User is designing in Figma. Provide helpful design suggestions and offer to create UI components.'
      }
    };
  }
}

// Export for use in UI
window.AIService = AIService;