// Component Library - Predefined components with proper styling
export interface ComponentTemplate {
  type: string;
  name: string;
  description: string;
  defaultProps: Record<string, any>;
  variants: Record<string, Record<string, any>>;
  build: (props: any) => Promise<SceneNode>;
}

export class ComponentLibrary {
  private static templates: Map<string, ComponentTemplate> = new Map();

  static initialize() {
    // Initialize all component templates
    this.registerButton();
    this.registerCard();
    this.registerInput();
    this.registerBadge();
    this.registerText();
  }

  static getTemplate(type: string): ComponentTemplate | null {
    return this.templates.get(type) || null;
  }

  private static registerButton() {
    this.templates.set('button', {
      type: 'button',
      name: 'Button',
      description: 'Interactive button component',
      defaultProps: {
        label: 'Button',
        variant: 'primary',
        size: 'medium',
        width: 120,
        height: 40
      },
      variants: {
        primary: {
          backgroundColor: { r: 0.298, g: 0.686, b: 0.314 }, // #4CAF50
          textColor: { r: 1, g: 1, b: 1 },
          borderRadius: 8
        },
        secondary: {
          backgroundColor: { r: 0.176, g: 0.176, b: 0.176 }, // #2D2D2D
          textColor: { r: 1, g: 1, b: 1 },
          borderRadius: 8
        },
        danger: {
          backgroundColor: { r: 0.956, g: 0.262, b: 0.211 }, // #F44336
          textColor: { r: 1, g: 1, b: 1 },
          borderRadius: 8
        }
      },
      build: async (props) => {
        const button = figma.createFrame();
        button.name = `Button - ${props.label || 'Button'}`;
        
        // Apply size
        const sizes = {
          small: { width: 80, height: 32, fontSize: 14, padding: 16 },
          medium: { width: 120, height: 40, fontSize: 16, padding: 20 },
          large: { width: 160, height: 48, fontSize: 18, padding: 24 }
        };
        
        const sizeConfig = sizes[props.size || 'medium'];
        button.resize(sizeConfig.width, sizeConfig.height);
        
        // Layout
        button.layoutMode = 'HORIZONTAL';
        button.primaryAxisAlignItems = 'CENTER';
        button.counterAxisAlignItems = 'CENTER';
        button.paddingLeft = sizeConfig.padding;
        button.paddingRight = sizeConfig.padding;
        
        // Apply variant styles
        const template = this.templates.get('button');
        const variantStyles = template?.variants[props.variant || 'primary'] || template?.variants.primary;
        if (variantStyles) {
          button.cornerRadius = variantStyles.borderRadius;
          button.fills = [{
            type: 'SOLID',
            color: variantStyles.backgroundColor
          }];
        }
        
        // Add hover effect
        button.effects = [{
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.1 },
          offset: { x: 0, y: 2 },
          radius: 4,
          visible: true,
          blendMode: 'NORMAL'
        }];
        
        // Add text
        const text = figma.createText();
        await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
        text.fontName = { family: 'Inter', style: 'Medium' };
        text.characters = props.label || 'Button';
        text.fontSize = sizeConfig.fontSize;
        text.textAlignHorizontal = 'CENTER';
        
        if (variantStyles) {
          text.fills = [{
            type: 'SOLID',
            color: variantStyles.textColor
          }];
        } else {
          text.fills = [{
            type: 'SOLID',
            color: { r: 1, g: 1, b: 1 } // Default white
          }];
        }
        
        button.appendChild(text);
        
        return button;
      }
    });
  }

  private static registerCard() {
    this.templates.set('card', {
      type: 'card',
      name: 'Card',
      description: 'Content container with optional shadow',
      defaultProps: {
        title: 'Card Title',
        description: 'Card description goes here',
        width: 320,
        height: 200,
        padding: 24,
        elevation: 'medium'
      },
      variants: {
        flat: {
          backgroundColor: { r: 0.176, g: 0.176, b: 0.176 }, // #2D2D2D
          shadowIntensity: 0
        },
        elevated: {
          backgroundColor: { r: 0.176, g: 0.176, b: 0.176 }, // #2D2D2D
          shadowIntensity: 0.1
        }
      },
      build: async (props) => {
        const card = figma.createFrame();
        card.name = `Card - ${props.title || 'Card'}`;
        
        // Size and layout
        card.resize(props.width || 320, props.height || 200);
        card.layoutMode = 'VERTICAL';
        card.itemSpacing = 16;
        card.paddingTop = props.padding || 24;
        card.paddingBottom = props.padding || 24;
        card.paddingLeft = props.padding || 24;
        card.paddingRight = props.padding || 24;
        
        // Styling
        card.cornerRadius = 16;
        card.fills = [{
          type: 'SOLID',
          color: { r: 0.176, g: 0.176, b: 0.176 } // #2D2D2D
        }];
        
        // Add elevation shadow
        if (props.elevation !== 'none') {
          const shadowIntensity = props.elevation === 'high' ? 0.15 : 0.08;
          card.effects = [{
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: shadowIntensity },
            offset: { x: 0, y: 4 },
            radius: 12,
            visible: true,
            blendMode: 'NORMAL'
          }];
        }
        
        // Add title
        const title = figma.createText();
        await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
        title.fontName = { family: 'Inter', style: 'Bold' };
        title.characters = props.title || 'Card Title';
        title.fontSize = 20;
        title.fills = [{
          type: 'SOLID',
          color: { r: 1, g: 1, b: 1 } // White text
        }];
        
        card.appendChild(title);
        
        // Add description
        if (props.description) {
          const description = figma.createText();
          await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
          description.fontName = { family: 'Inter', style: 'Regular' };
          description.characters = props.description;
          description.fontSize = 14;
          description.fills = [{
            type: 'SOLID',
            color: { r: 0.7, g: 0.7, b: 0.7 } // Light gray
          }];
          description.layoutSizingHorizontal = 'FILL';
          
          card.appendChild(description);
        }
        
        return card;
      }
    });
  }

  private static registerInput() {
    this.templates.set('input', {
      type: 'input',
      name: 'Input Field',
      description: 'Form input field with label',
      defaultProps: {
        label: 'Email Address',
        placeholder: 'Enter your email',
        width: 280,
        height: 72
      },
      variants: {
        default: {
          borderColor: { r: 0.4, g: 0.4, b: 0.4 },
          backgroundColor: { r: 0.118, g: 0.118, b: 0.118 } // #1E1E1E
        },
        focused: {
          borderColor: { r: 0.298, g: 0.686, b: 0.314 }, // #4CAF50
          backgroundColor: { r: 0.118, g: 0.118, b: 0.118 }
        }
      },
      build: async (props) => {
        const container = figma.createFrame();
        container.name = `Input - ${props.label || 'Input'}`;
        container.resize(props.width || 280, props.height || 72);
        container.layoutMode = 'VERTICAL';
        container.itemSpacing = 8;
        
        // Add label
        const label = figma.createText();
        await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
        label.fontName = { family: 'Inter', style: 'Medium' };
        label.characters = props.label || 'Label';
        label.fontSize = 14;
        label.fills = [{
          type: 'SOLID',
          color: { r: 0.8, g: 0.8, b: 0.8 }
        }];
        
        container.appendChild(label);
        
        // Create input field
        const inputField = figma.createFrame();
        inputField.resize(props.width || 280, 40);
        inputField.cornerRadius = 8;
        inputField.fills = [{
          type: 'SOLID',
          color: { r: 0.118, g: 0.118, b: 0.118 } // #1E1E1E
        }];
        inputField.strokes = [{
          type: 'SOLID',
          color: { r: 0.4, g: 0.4, b: 0.4 }
        }];
        inputField.strokeWeight = 1;
        inputField.layoutMode = 'HORIZONTAL';
        inputField.primaryAxisAlignItems = 'CENTER';
        inputField.paddingLeft = 16;
        inputField.paddingRight = 16;
        
        // Add placeholder text
        const placeholder = figma.createText();
        await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
        placeholder.fontName = { family: 'Inter', style: 'Regular' };
        placeholder.characters = props.placeholder || 'Enter text...';
        placeholder.fontSize = 14;
        placeholder.fills = [{
          type: 'SOLID',
          color: { r: 0.5, g: 0.5, b: 0.5 }
        }];
        
        inputField.appendChild(placeholder);
        container.appendChild(inputField);
        
        return container;
      }
    });
  }

  private static registerBadge() {
    this.templates.set('badge', {
      type: 'badge',
      name: 'Badge',
      description: 'Small status indicator',
      defaultProps: {
        text: 'Badge',
        variant: 'success'
      },
      variants: {
        success: {
          backgroundColor: { r: 0.298, g: 0.686, b: 0.314 }, // #4CAF50
          textColor: { r: 1, g: 1, b: 1 }
        },
        warning: {
          backgroundColor: { r: 1, g: 0.596, b: 0 }, // #FF9800
          textColor: { r: 1, g: 1, b: 1 }
        },
        error: {
          backgroundColor: { r: 0.956, g: 0.262, b: 0.211 }, // #F44336
          textColor: { r: 1, g: 1, b: 1 }
        },
        info: {
          backgroundColor: { r: 0.129, g: 0.588, b: 0.953 }, // #2196F3
          textColor: { r: 1, g: 1, b: 1 }
        }
      },
      build: async (props) => {
        const badge = figma.createFrame();
        badge.name = `Badge - ${props.text || 'Badge'}`;
        
        // Layout
        badge.layoutMode = 'HORIZONTAL';
        badge.primaryAxisAlignItems = 'CENTER';
        badge.counterAxisAlignItems = 'CENTER';
        badge.paddingLeft = 12;
        badge.paddingRight = 12;
        badge.paddingTop = 4;
        badge.paddingBottom = 4;
        badge.cornerRadius = 12;
        
        // Apply variant styles
        const template = this.templates.get('badge');
        const variantStyles = template?.variants[props.variant || 'success'] || template?.variants.success;
        if (variantStyles) {
          badge.fills = [{
            type: 'SOLID',
            color: variantStyles.backgroundColor
          }];
        }
        
        // Add text
        const text = figma.createText();
        await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
        text.fontName = { family: 'Inter', style: 'Medium' };
        text.characters = props.text || 'Badge';
        text.fontSize = 12;
        
        if (variantStyles) {
          text.fills = [{
            type: 'SOLID',
            color: variantStyles.textColor
          }];
        }
        
        badge.appendChild(text);
        
        // Auto-resize to fit content
        badge.layoutSizingHorizontal = 'HUG';
        badge.layoutSizingVertical = 'HUG';
        
        return badge;
      }
    });
  }

  private static registerText() {
    this.templates.set('text', {
      type: 'text',
      name: 'Text',
      description: 'Typography element',
      defaultProps: {
        text: 'Sample Text',
        size: 'medium',
        weight: 'regular'
      },
      variants: {
        heading: {
          fontSize: 32,
          fontStyle: 'Bold',
          color: { r: 1, g: 1, b: 1 }
        },
        subheading: {
          fontSize: 24,
          fontStyle: 'Medium',
          color: { r: 1, g: 1, b: 1 }
        },
        body: {
          fontSize: 16,
          fontStyle: 'Regular',
          color: { r: 0.8, g: 0.8, b: 0.8 }
        },
        caption: {
          fontSize: 12,
          fontStyle: 'Regular',
          color: { r: 0.6, g: 0.6, b: 0.6 }
        }
      },
      build: async (props) => {
        const text = figma.createText();
        
        // Determine size variant
        const sizeVariant = props.size === 'large' ? 'heading' : 
                           props.size === 'medium' ? 'body' : 'caption';
        const template = this.templates.get('text');
        const variant = template?.variants[sizeVariant] || template?.variants.body;
        
        if (variant) {
          // Load font and apply styles
          await figma.loadFontAsync({ family: 'Inter', style: variant.fontStyle });
          text.fontName = { family: 'Inter', style: variant.fontStyle };
          text.characters = props.text || 'Sample Text';
          text.fontSize = variant.fontSize;
          text.fills = [{
            type: 'SOLID',
            color: variant.color
          }];
        } else {
          // Fallback
          await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
          text.fontName = { family: 'Inter', style: 'Regular' };
          text.characters = props.text || 'Sample Text';
          text.fontSize = 16;
        }
        
        text.name = `Text - ${props.text || 'Text'}`;
        
        return text;
      }
    });
  }

  // Helper method to create component from template
  static async createFromTemplate(type: string, customProps?: Record<string, any>): Promise<SceneNode | null> {
    const template = this.templates.get(type);
    if (!template) {
      console.error(`[ComponentLibrary] No template found for type: ${type}`);
      return null;
    }

    try {
      // Merge custom props with defaults
      const props = { ...template.defaultProps, ...customProps };
      
      // Build the component
      const component = await template.build(props);
      
      return component;
    } catch (error) {
      console.error(`[ComponentLibrary] Error creating ${type}:`, error);
      return null;
    }
  }
}

// Initialize the library on load
ComponentLibrary.initialize();