// Natural Language Parser - Converts user messages to component specifications

export interface ComponentSpec {
  type: 'button' | 'card' | 'input' | 'text' | 'badge' | 'navbar' | 'modal' | 'toast' | 'table' | 
        'select' | 'checkbox' | 'radio' | 'toggle' | 'slider' | 'textarea' | 'unknown';
  properties: Record<string, any>;
  action: 'create' | 'modify' | 'explain' | 'list';
  confidence: number;
  originalPrompt: string;
}

export class NLPParser {
  // Component type patterns - enhanced with more keywords
  private componentPatterns = {
    button: /\b(button|btn|cta|call to action|submit|click|action|primary|secondary)\b/i,
    card: /\b(card|panel|container|box|section|tile|content)\b/i,
    input: /\b(input|field|textfield|text field|form field|email|password|search)\b/i,
    text: /\b(text|label|heading|title|paragraph|header|h1|h2|h3)\b/i,
    badge: /\b(badge|tag|chip|pill|status|indicator|label)\b/i,
    navbar: /\b(navbar|navigation|nav|menu|header|toolbar)\b/i,
    modal: /\b(modal|dialog|popup|overlay|lightbox)\b/i,
    toast: /\b(toast|notification|alert|message|snackbar)\b/i,
    table: /\b(table|grid|data|list|spreadsheet)\b/i,
    select: /\b(select|dropdown|picker|choice|option)\b/i,
    checkbox: /\b(checkbox|check|tick)\b/i,
    radio: /\b(radio|option button)\b/i,
    toggle: /\b(toggle|switch|on off)\b/i,
    slider: /\b(slider|range|progress)\b/i,
    textarea: /\b(textarea|text area|multiline|comment box|message box)\b/i,
  };

  // Action patterns - enhanced with more natural language
  private actionPatterns = {
    create: /\b(create|make|build|add|design|generate|give me|i need|i want|can you|please|show me a)\b/i,
    modify: /\b(change|modify|update|edit|make it|set|transform)\b/i,
    explain: /\b(what|how|explain|tell me|show me how|help)\b/i,
    list: /\b(list|show all|what can|available|options)\b/i,
  };
  
  // Greeting patterns
  private greetingPatterns = /^(hey|hi|hello|yo|sup|howdy|greetings|hola|bonjour|hiya)(\s|!|$)/i;

  // Size patterns
  private sizePatterns = {
    small: /\b(small|tiny|mini|sm|compact)\b/i,
    medium: /\b(medium|regular|normal|md|default)\b/i,
    large: /\b(large|big|huge|lg|xl)\b/i,
  };

  // Color patterns with common color values
  private colorPatterns = {
    primary: /\b(primary|main|default)\b/i,
    secondary: /\b(secondary|alternate)\b/i,
    success: /\b(success|green|positive)\b/i,
    danger: /\b(danger|error|red|negative)\b/i,
    warning: /\b(warning|caution|yellow|orange)\b/i,
    info: /\b(info|information|blue)\b/i,
    dark: /\b(dark|black)\b/i,
    light: /\b(light|white)\b/i,
  };

  // Style patterns for modern visual effects
  private stylePatterns = {
    gradient: /\b(gradient|gradual|fade|blend)\b/i,
    glass: /\b(glass|glassmorphism|blur|frosted|transparent)\b/i,
    neumorphic: /\b(neumorphic|neumorph|soft ui|3d)\b/i,
    elevated: /\b(elevated|raised|shadow|depth)\b/i,
    outline: /\b(outline|outlined|border)\b/i,
    ghost: /\b(ghost|transparent|text only)\b/i,
    flat: /\b(flat|minimal|simple)\b/i,
  };

  // Property extraction patterns
  private propertyPatterns = {
    text: /(?:with text|saying|labeled?|text:?)\s*["']?([^"'\n]+)["']?/i,
    placeholder: /(?:placeholder|hint):?\s*["']?([^"'\n]+)["']?/i,
    rounded: /\b(rounded|round|circular)\b/i,
    disabled: /\b(disabled|inactive)\b/i,
    fullWidth: /\b(full width|fullwidth|stretch|100%)\b/i,
  };

  // Parse user message into component specification
  parse(message: string): ComponentSpec {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if it's a greeting first
    if (this.greetingPatterns.test(lowerMessage)) {
      return {
        type: 'unknown',
        properties: { isGreeting: true },
        action: 'explain',
        confidence: 1,
        originalPrompt: message
      };
    }
    
    // Detect action
    const action = this.detectAction(lowerMessage);
    
    // Detect component type
    const componentType = this.detectComponentType(lowerMessage);
    
    // Extract properties based on component type
    const properties = this.extractProperties(message, componentType);
    
    // Calculate confidence based on matches
    const confidence = this.calculateConfidence(componentType, action, properties);

    return {
      type: componentType,
      properties,
      action,
      confidence,
      originalPrompt: message
    };
  }

  // Detect user's intended action
  private detectAction(message: string): ComponentSpec['action'] {
    for (const [action, pattern] of Object.entries(this.actionPatterns)) {
      if (pattern.test(message)) {
        return action as ComponentSpec['action'];
      }
    }
    // Default to create if component type is mentioned
    return 'create';
  }

  // Detect component type from message
  private detectComponentType(message: string): ComponentSpec['type'] {
    for (const [type, pattern] of Object.entries(this.componentPatterns)) {
      if (pattern.test(message)) {
        return type as ComponentSpec['type'];
      }
    }
    return 'unknown';
  }

  // Extract properties from message
  private extractProperties(message: string, componentType: ComponentSpec['type']): Record<string, any> {
    const properties: Record<string, any> = {};

    // Extract size
    for (const [size, pattern] of Object.entries(this.sizePatterns)) {
      if (pattern.test(message)) {
        properties.size = size;
        break;
      }
    }

    // Extract color/variant
    for (const [variant, pattern] of Object.entries(this.colorPatterns)) {
      if (pattern.test(message)) {
        properties.variant = variant;
        break;
      }
    }

    // Extract style/variant (overrides color variant if both present)
    for (const [style, pattern] of Object.entries(this.stylePatterns)) {
      if (pattern.test(message)) {
        properties.variant = style;
        break;
      }
    }

    // Extract text content
    const textMatch = message.match(this.propertyPatterns.text);
    if (textMatch && textMatch[1]) {
      properties.text = textMatch[1].trim();
    } else if (componentType === 'button' && !properties.text) {
      // Default text for buttons
      properties.text = 'Click me';
    }

    // Extract placeholder for inputs
    if (componentType === 'input') {
      const placeholderMatch = message.match(this.propertyPatterns.placeholder);
      if (placeholderMatch && placeholderMatch[1]) {
        properties.placeholder = placeholderMatch[1].trim();
      }
    }

    // Extract boolean properties
    if (this.propertyPatterns.rounded.test(message)) {
      properties.rounded = true;
    }
    if (this.propertyPatterns.disabled.test(message)) {
      properties.disabled = true;
    }
    if (this.propertyPatterns.fullWidth.test(message)) {
      properties.fullWidth = true;
    }

    // Component-specific defaults
    this.applyComponentDefaults(componentType, properties);

    return properties;
  }

  // Apply sensible defaults based on component type
  private applyComponentDefaults(type: ComponentSpec['type'], properties: Record<string, any>): void {
    switch (type) {
      case 'button':
        properties.variant = properties.variant || 'primary';
        properties.size = properties.size || 'medium';
        break;
      case 'card':
        properties.padding = properties.padding || 24;
        properties.elevation = properties.elevation || 'medium';
        break;
      case 'input':
        properties.size = properties.size || 'medium';
        properties.placeholder = properties.placeholder || 'Enter text...';
        properties.label = properties.label || 'Input field';
        break;
      case 'badge':
        properties.variant = properties.variant || 'primary';
        properties.text = properties.text || 'Badge';
        break;
      case 'text':
        properties.size = properties.size || 'medium';
        properties.text = properties.text || 'Text content';
        break;
    }
  }

  // Calculate confidence score
  private calculateConfidence(
    type: ComponentSpec['type'], 
    action: ComponentSpec['action'], 
    properties: Record<string, any>
  ): number {
    let confidence = 0;

    // Type detection confidence
    if (type !== 'unknown') confidence += 0.4;

    // Action detection confidence
    if (action !== 'create') confidence += 0.2; // Non-default action

    // Properties extraction confidence
    const propertyCount = Object.keys(properties).length;
    confidence += Math.min(propertyCount * 0.1, 0.4);

    return Math.min(confidence, 1);
  }

  // Generate human-readable description of the spec
  describeSpec(spec: ComponentSpec): string {
    if (spec.type === 'unknown') {
      return "I'm not sure what component you want to create. Could you be more specific?";
    }

    const props = spec.properties;
    let description = `Creating a ${props.size || 'medium'} ${props.variant || ''} ${spec.type}`;

    if (props.text) {
      description += ` with text "${props.text}"`;
    }

    if (props.rounded) {
      description += ' with rounded corners';
    }

    if (props.disabled) {
      description += ' (disabled state)';
    }

    return description.trim();
  }

  // Get suggestions based on partial input
  getSuggestions(partialInput: string): string[] {
    const suggestions: string[] = [];
    const lower = partialInput.toLowerCase().trim();

    // Handle greetings and empty/unclear inputs
    if (this.greetingPatterns.test(lower) || lower.length < 3 || lower === 'help') {
      return [
        'Create a primary button',
        'Make a card with shadow',
        'Build an input field',
        'Design a success badge',
        'Create a large heading'
      ];
    }

    // Component suggestions
    if (lower.includes('create') || lower.includes('make') || lower.includes('build')) {
      suggestions.push(
        'Create a primary button with text "Submit"',
        'Make a card with title and description',
        'Build an email input field',
        'Create a success badge',
        'Design a large heading'
      );
    }

    // Specific component suggestions
    if (lower.includes('button')) {
      suggestions.push(
        'Create a secondary button',
        'Make a large primary button',
        'Build a danger button',
        'Design a full-width button'
      );
    } else if (lower.includes('card')) {
      suggestions.push(
        'Create a card with shadow',
        'Make a flat card',
        'Build a card with content',
        'Design a wide card'
      );
    } else if (lower.includes('input')) {
      suggestions.push(
        'Create an email input',
        'Build a password field',
        'Make a search input',
        'Design a form with inputs'
      );
    }

    // If no specific matches, provide general suggestions
    if (suggestions.length === 0) {
      suggestions.push(
        'Create a primary button',
        'Make a modern card',
        'Build an input field',
        'Show me all components',
        'Help me design'
      );
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}

// Export singleton instance
export const nlpParser = new NLPParser();