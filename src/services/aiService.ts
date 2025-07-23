// AI Service - Intelligent component creation and natural language understanding
import { nlpParser, ComponentSpec } from './nlpParser';
import { sandboxManager } from './sandboxManager';
import { ComponentRenderer } from './componentRenderer';
import { openRouterService } from './openRouterService';

interface AIResponse {
  message: string;
  action?: {
    type: 'create_component' | 'modify_component' | 'explain' | 'show_suggestions';
    data?: any;
  };
  suggestions?: string[];
  componentSpec?: ComponentSpec;
  metadata?: {
    componentType?: string;
    teacherNote?: string;
    tutorials?: any[];
    guidance?: any[];
  };
}

export class AIService {
  private conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }> = [];

  // Process user message with natural language understanding
  async processMessage(message: string, context?: any): Promise<AIResponse> {
    // Add to conversation history
    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    try {
      // First try to get AI response from OpenRouter
      const aiResponse = await openRouterService.sendMessage(message, context);
      
      // If AI provided component specs, use those
      if (aiResponse.componentSpec) {
        const spec: ComponentSpec = {
          type: aiResponse.componentSpec.type as any,
          properties: aiResponse.componentSpec.properties,
          action: 'create',
          confidence: 0.9,
          originalPrompt: message
        };
        
        // Create the component if it's a create action
        if (spec.type !== 'unknown') {
          await this.createComponentInSandbox(spec, aiResponse.metadata);
        }
        
        return {
          ...aiResponse,
          componentSpec: spec
        };
      }
      
      // Otherwise, fall back to local NLP parser
      const spec = nlpParser.parse(message);
      console.log('[AIService] Parsed spec:', spec);

      // Handle different actions
      switch (spec.action) {
        case 'create':
          return this.handleCreate(spec, message);
        case 'modify':
          return this.handleModify(spec, message);
        case 'explain':
          return this.handleExplain(spec, message);
        case 'list':
          return this.handleList(message);
        default:
          // Use AI response if available
          return aiResponse ? {
            ...aiResponse,
            componentSpec: undefined
          } : this.handleUnknown(message);
      }
    } catch (error) {
      console.error('[AIService] Error processing message:', error);
      return this.handleUnknown(message);
    }
  }

  // Handle component creation
  private async handleCreate(spec: ComponentSpec, originalMessage: string): Promise<AIResponse> {
    if (spec.type === 'unknown') {
      return {
        message: "I'd love to create something for you! Could you be a bit more specific? For example, you could say 'create a blue button' or 'make a card with a shadow'. What kind of component are you envisioning?",
        suggestions: [
          "Create a primary button",
          "Make a card with title and description",
          "Build an input field with placeholder",
          "Design a success badge",
          "Create a large heading"
        ]
      };
    }

    // Generate response
    const description = nlpParser.describeSpec(spec);
    
    try {
      // Create the component in sandbox
      await this.createComponentInSandbox(spec);
      
      const response: AIResponse = {
        message: `✨ ${description}! I've added it to your sandbox.`,
        action: {
          type: 'create_component',
          data: spec
        },
        componentSpec: spec,
        suggestions: this.getContextualSuggestions(spec)
      };

      // Add to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      return {
        message: `Sorry, I couldn't create the component: ${error}`,
        suggestions: ["Try again with a simpler request", "Check if Figma has the required fonts"]
      };
    }
  }

  // Create component in the sandbox
  private async createComponentInSandbox(spec: ComponentSpec, metadata?: any): Promise<void> {
    // Initialize sandbox if needed
    await sandboxManager.initialize();

    // Create component based on type
    const position = { x: 0, y: 0 }; // Sandbox manager will handle positioning
    await ComponentRenderer.createComponent(spec.type, spec.properties, position);

    // Get the last created component (it's selected)
    const selection = figma.currentPage.selection[0];
    if (selection) {
      await sandboxManager.addComponent(selection, {
        description: spec.type.charAt(0).toUpperCase() + spec.type.slice(1),
        prompt: spec.originalPrompt,
        teacherNote: metadata?.teacherNote || this.getComponentExplanation(spec.type)
      });
    }
  }

  // Handle modification requests
  private async handleModify(spec: ComponentSpec, message: string): Promise<AIResponse> {
    // Check if there's a selected component
    const selection = figma.currentPage.selection[0];
    if (!selection) {
      return {
        message: "Please select a component to modify first.",
        suggestions: ["Select a button to change its color", "Select a card to resize it"]
      };
    }

    return {
      message: "Component modification is coming soon! For now, try creating a new component with your desired properties.",
      suggestions: this.getModificationSuggestions(selection.type)
    };
  }

  // Handle explanation requests
  private async handleExplain(spec: ComponentSpec, message: string): Promise<AIResponse> {
    if (message.includes('button')) {
      return {
        message: "Buttons are interactive elements that trigger actions. In FigBud, you can create buttons with different sizes (small, medium, large) and variants (primary, secondary, danger). Try: 'Create a large primary button with text Submit'",
        suggestions: ["Create a primary button", "Create a danger button", "Create a small secondary button"]
      };
    }

    return {
      message: "I can help you create various UI components like buttons, cards, inputs, badges, and text. Just tell me what you need in plain English!",
      suggestions: ["What components can you create?", "How do I create a button?", "Show me card examples"]
    };
  }

  // Handle list/show all requests
  private async handleList(message: string): Promise<AIResponse> {
    return {
      message: "I can create these components for you:\n\n• **Buttons** - Interactive elements (primary, secondary, danger)\n• **Cards** - Content containers with optional shadows\n• **Inputs** - Form fields with labels and placeholders\n• **Badges** - Small status indicators\n• **Text** - Headings and paragraphs\n\nJust describe what you need!",
      suggestions: [
        "Create a primary button",
        "Make a card with shadow",
        "Build an input field",
        "Design a success badge",
        "Create a heading"
      ]
    };
  }

  // Handle unknown requests
  private async handleUnknown(message: string): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    
    // Check for common conversational patterns
    if (lowerMessage.includes('help') && lowerMessage.includes('design')) {
      return {
        message: "I'd be happy to help with your design! 🎨 What are you working on? I can help you create buttons, cards, forms, navigation bars, and more. Just describe what you need!",
        suggestions: [
          "Show me button examples",
          "I need a card layout",
          "Help me with a form design",
          "Create a navigation bar"
        ]
      };
    }
    
    if (lowerMessage.includes('component') && (lowerMessage.includes('new') || lowerMessage.includes('create'))) {
      return {
        message: "Let's create something awesome! What type of component do you need? I can help you design buttons for actions, cards for content, input fields for forms, or badges for status indicators. Just tell me what you're building!",
        suggestions: [
          "Create a primary button",
          "Design a content card",
          "Build a form input",
          "Make a status badge"
        ]
      };
    }
    
    if (lowerMessage.includes('hey') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        message: "Hey there! 👋 I'm FigBud, your design assistant. I can help you create UI components quickly. What would you like to work on today?",
        suggestions: [
          "Show me what you can do",
          "I need help with my design",
          "Create a button",
          "Teach me about components"
        ]
      };
    }
    
    // Default response
    return {
      message: "I'd love to help! I can create various UI components for you. Try saying something like 'create a blue button' or 'make a card with a shadow'. What would you like to build?",
      suggestions: nlpParser.getSuggestions(message)
    };
  }

  // Get contextual suggestions based on created component
  private getContextualSuggestions(spec: ComponentSpec): string[] {
    const suggestions: string[] = [];

    switch (spec.type) {
      case 'button':
        suggestions.push(
          "Create a gradient button with hover effect",
          "Make a glass button with blur",
          "Create a button group",
          "Add an icon button",
          "Create a floating action button"
        );
        break;
      case 'card':
        suggestions.push(
          "Create a glass card with blur effect",
          "Make a neumorphic card",
          "Create a stats card with numbers",
          "Add an image card with overlay",
          "Create a product card"
        );
        break;
      case 'input':
        suggestions.push(
          "Create a search input with icon",
          "Make a password input field",
          "Create a select dropdown",
          "Add a textarea for comments",
          "Create a date picker"
        );
        break;
      case 'navbar':
        suggestions.push(
          "Create a sidebar navigation",
          "Add a tab navigation",
          "Create breadcrumbs",
          "Make a mobile menu",
          "Add a search bar"
        );
        break;
      case 'modal':
        suggestions.push(
          "Create a confirmation dialog",
          "Make a form modal",
          "Create a image gallery modal",
          "Add a notification toast",
          "Create an alert dialog"
        );
        break;
      case 'toast':
        suggestions.push(
          "Create an error notification",
          "Make a success message",
          "Create a warning alert",
          "Add a loading spinner",
          "Create a progress bar"
        );
        break;
      default:
        suggestions.push(
          "Create a modern button",
          "Make a professional card",
          "Create a navigation bar",
          "Build a data table",
          "Design a modal dialog"
        );
    }

    return suggestions.slice(0, 5);
  }

  // Get modification suggestions based on node type
  private getModificationSuggestions(nodeType: string): string[] {
    const suggestions: string[] = [];

    if (nodeType === 'FRAME' || nodeType === 'COMPONENT') {
      suggestions.push(
        "Change color to primary",
        "Make it larger",
        "Add rounded corners",
        "Change the text"
      );
    }

    return suggestions;
  }

  // Clear conversation history
  clearHistory(): void {
    this.conversationHistory = [];
  }

  // Get conversation history
  getHistory(): typeof this.conversationHistory {
    return this.conversationHistory;
  }

  // Get component explanation for teaching
  private getComponentExplanation(type: string): string {
    const explanations: Record<string, string> = {
      button: "Buttons trigger actions. Use primary for main actions, secondary for less important ones.",
      card: "Cards group related content. Use elevation and spacing to create visual hierarchy.",
      input: "Input fields collect user data. Always include labels and helpful placeholders.",
      badge: "Badges show status or counts. Use color consistently across your design.",
      text: "Typography creates hierarchy. Use size and weight to guide user attention."
    };
    
    return explanations[type] || "Great component! Keep exploring different variations.";
  }
}

// Export singleton instance
export const aiService = new AIService();