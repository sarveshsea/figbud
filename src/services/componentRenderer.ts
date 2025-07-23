// import { SupabaseDatabase } from '../../server/database/supabaseDatabase';
import { FontLoader } from './fontLoader';
import { ComponentLibrary } from './componentLibrary';
import { professionalComponents } from './professionalComponents';
import { advancedComponents } from './advancedComponents';
import { formComponents } from './formComponents';
import { ShadcnFigmaConverter } from './shadcnFigmaConverter';

interface ComponentMapping {
  componentType: string;
  onceUiComponent: string;
  figmaToOnceProps: any;
  onceToFigmaProps: any;
  styleMappings?: any;
}

interface FigmaComponent {
  name: string;
  type: string;
  figmaProperties: any;
  defaultProps?: any;
}

export class ComponentRenderer {
  private static mappings: Map<string, ComponentMapping> = new Map();
  private static componentsCache: Map<string, FigmaComponent> = new Map();

  /**
   * Initialize component mappings from database
   */
  static async initialize() {
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use hardcoded mappings
      this.initializeDefaultMappings();
    } catch (error) {
      console.error('[ComponentRenderer] Failed to initialize:', error);
    }
  }

  /**
   * Create a Figma component from Once UI props
   */
  static async createComponent(
    type: string, 
    onceUiProps: any,
    figmaContext?: { x?: number; y?: number }
  ): Promise<void> {
    try {
      let component: SceneNode | null = null;
      
      // Check if props indicate Shadcn component usage
      const isShadcn = onceUiProps.library === 'shadcn' || onceUiProps.useShadcn === true;
      
      if (isShadcn) {
        // Use Shadcn converter for supported components
        component = await ShadcnFigmaConverter.createComponent(type, onceUiProps);
      } else if (professionalComponents[type]) {
        // Check if it's a professional component
        component = await professionalComponents[type](onceUiProps);
      } else if (advancedComponents[type]) {
        component = await advancedComponents[type](onceUiProps);
      } else if (formComponents[type]) {
        component = await formComponents[type](onceUiProps);
      } else {
        // Try ComponentLibrary for templates
        component = await ComponentLibrary.createFromTemplate(type, onceUiProps);
        
        if (!component) {
          // Fallback to old method if template not found
          const mapping = this.mappings.get(type);
          if (!mapping) {
            throw new Error(`No mapping found for component type: ${type}`);
          }

          // Convert Once UI props to Figma properties
          const figmaProps = this.convertToFigmaProps(onceUiProps, mapping);
          
          // Create the component based on type
          switch (type) {
            case 'button':
              await this.createButton(figmaProps, figmaContext);
              return; // Early return as old methods handle positioning
            case 'card':
              await this.createCard(figmaProps, figmaContext);
              return;
            case 'input':
              await this.createInput(figmaProps, figmaContext);
              return;
            case 'badge':
              await this.createBadge(figmaProps, figmaContext);
              return;
            case 'text':
              await this.createText(figmaProps, figmaContext);
              return;
            default:
              throw new Error(`Unsupported component type: ${type}`);
          }
        }
      }
      
      if (component) {
        // Position the component if context provided
        if (figmaContext) {
          this.positionNode(component, figmaContext);
        } else {
          // Center in viewport if no context
          this.positionNode(component);
        }
        
        // Select and focus on the new component
        figma.currentPage.selection = [component];
        figma.viewport.scrollAndZoomIntoView([component]);
      }
      
      figma.notify(`✨ Created ${type} component!`);
    } catch (error) {
      console.error(`[ComponentRenderer] Error creating ${type}:`, error);
      figma.notify(`❌ Failed to create ${type}`, { error: true });
    }
  }

  /**
   * Convert Once UI props to Figma properties
   */
  private static convertToFigmaProps(onceUiProps: any, mapping: ComponentMapping): any {
    const figmaProps: any = {};
    const onceToFigmaProps = mapping.onceToFigmaProps;
    const styleMappings = mapping.styleMappings;

    // Convert basic properties
    const entries = Object.entries(onceToFigmaProps);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (!entry) continue;
      const onceProp = entry[0];
      const figmaProp = entry[1];
      
      if (onceUiProps[onceProp] !== undefined) {
        if (typeof figmaProp === 'object' && figmaProp !== null && !Array.isArray(figmaProp)) {
          // Handle nested mappings (e.g., size -> width/height)
          const value = onceUiProps[onceProp];
          if (value && figmaProp[value]) {
            const mappedValues = figmaProp[value];
            for (const key in mappedValues) {
              if (mappedValues.hasOwnProperty(key)) {
                figmaProps[key] = mappedValues[key];
              }
            }
          }
        } else {
          figmaProps[figmaProp as string] = onceUiProps[onceProp];
        }
      }
    }

    // Apply style mappings
    if (styleMappings && onceUiProps.variant) {
      const variantStyles = styleMappings[onceUiProps.variant];
      if (variantStyles) {
        for (const key in variantStyles) {
          if (variantStyles.hasOwnProperty(key)) {
            figmaProps[key] = variantStyles[key];
          }
        }
      }
    }

    return figmaProps;
  }

  /**
   * Create a button component
   */
  private static async createButton(props: any, context?: any): Promise<void> {
    const button = figma.createFrame();
    button.name = 'Once UI Button';
    
    // Set size
    button.resize(props.width || 120, props.height || 48);
    
    // Set properties
    button.cornerRadius = props.cornerRadius || 8;
    button.layoutMode = 'HORIZONTAL';
    button.primaryAxisAlignItems = 'CENTER';
    button.counterAxisAlignItems = 'CENTER';
    button.paddingLeft = props.paddingLeft || 24;
    button.paddingRight = props.paddingRight || 24;
    button.paddingTop = props.paddingTop || 12;
    button.paddingBottom = props.paddingBottom || 12;
    
    // Set background
    if (props.backgroundColor) {
      button.fills = [{
        type: 'SOLID',
        color: props.backgroundColor
      }];
    }

    // Add text using preloaded fonts
    try {
      const text = figma.createText();
      text.characters = props.text || 'Button';
      text.fontSize = 16;
      text.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      text.fills = [{
        type: 'SOLID',
        color: props.textColor || { r: 1, g: 1, b: 1 }
      }];
      button.appendChild(text);
    } catch (error) {
      console.error('[ComponentRenderer] Error creating button text:', error);
    }

    // Position the button
    this.positionNode(button, context);
    
    // Select and focus
    figma.currentPage.selection = [button];
    figma.viewport.scrollAndZoomIntoView([button]);
  }

  /**
   * Create a card component
   */
  private static async createCard(props: any, context?: any): Promise<void> {
    const card = figma.createFrame();
    card.name = 'Once UI Card';
    
    // Set size
    card.resize(props.width || 320, props.height || 240);
    
    // Set properties
    card.cornerRadius = props.cornerRadius || 16;
    card.layoutMode = 'VERTICAL';
    card.itemSpacing = props.itemSpacing || 16;
    card.paddingLeft = props.padding || 24;
    card.paddingRight = props.padding || 24;
    card.paddingTop = props.padding || 24;
    card.paddingBottom = props.padding || 24;
    
    // Set background
    card.fills = [{
      type: 'SOLID',
      color: props.backgroundColor || { r: 1, g: 1, b: 1 }
    }];
    
    // Add shadow effect
    if (props.shadow) {
      card.effects = [props.shadow];
    }

    // Add title and description if provided
    if (props.title || props.description) {
      try {
        if (props.title) {
          const title = figma.createText();
          title.characters = props.title;
          title.fontSize = 18;
          title.fontName = FontLoader.getSafeFont('Inter', 'Bold');
          title.fills = [{
            type: 'SOLID',
            color: { r: 0.1, g: 0.1, b: 0.1 }
          }];
          card.appendChild(title);
        }

        if (props.description) {
          const description = figma.createText();
          description.characters = props.description;
          description.fontSize = 14;
          description.fontName = FontLoader.getSafeFont('Inter', 'Regular');
          description.fills = [{
            type: 'SOLID',
            color: { r: 0.4, g: 0.4, b: 0.4 }
          }];
          description.layoutAlign = 'STRETCH';
          card.appendChild(description);
        }
      } catch (error) {
        console.error('[ComponentRenderer] Error creating card text:', error);
      }
    }

    // Position the card
    this.positionNode(card, context);
    
    // Select and focus
    figma.currentPage.selection = [card];
    figma.viewport.scrollAndZoomIntoView([card]);
  }

  /**
   * Create an input component
   */
  private static async createInput(props: any, context?: any): Promise<void> {
    const container = figma.createFrame();
    container.name = 'Once UI Input';
    container.layoutMode = 'VERTICAL';
    container.itemSpacing = 8;

    try {
      // Add label if provided
      if (props.label) {
        const label = figma.createText();
        label.characters = props.label;
        label.fontSize = 14;
        label.fontName = FontLoader.getSafeFont('Inter', 'Medium');
        label.fills = [{
          type: 'SOLID',
          color: { r: 0.1, g: 0.1, b: 0.1 }
        }];
        container.appendChild(label);
      }

      // Create input field
      const input = figma.createFrame();
      input.resize(props.width || 320, props.height || 48);
      input.cornerRadius = props.cornerRadius || 8;
      input.fills = [{
        type: 'SOLID',
        color: props.backgroundColor || { r: 0.98, g: 0.98, b: 0.98 }
      }];
      input.strokes = [{
        type: 'SOLID',
        color: props.borderColor || { r: 0.8, g: 0.8, b: 0.8 }
      }];
      input.strokeWeight = 1;
      input.layoutMode = 'HORIZONTAL';
      input.paddingLeft = 16;
      input.paddingRight = 16;
      input.primaryAxisAlignItems = 'CENTER';

      // Add placeholder text
      if (props.placeholder) {
        const placeholder = figma.createText();
        placeholder.characters = props.placeholder;
        placeholder.fontSize = 14;
        placeholder.fontName = FontLoader.getSafeFont('Inter', 'Regular');
        placeholder.fills = [{
          type: 'SOLID',
          color: { r: 0.6, g: 0.6, b: 0.6 }
        }];
        input.appendChild(placeholder);
      }

      container.appendChild(input);
    } catch (error) {
      console.error('[ComponentRenderer] Font loading error:', error);
    }

    // Position the input
    this.positionNode(container, context);
    
    // Select and focus
    figma.currentPage.selection = [container];
    figma.viewport.scrollAndZoomIntoView([container]);
  }

  /**
   * Create a badge component
   */
  private static async createBadge(props: any, context?: any): Promise<void> {
    const badge = figma.createFrame();
    badge.name = 'Once UI Badge';
    
    // Set layout
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';
    badge.paddingLeft = props.paddingX || 12;
    badge.paddingRight = props.paddingX || 12;
    badge.paddingTop = props.paddingY || 4;
    badge.paddingBottom = props.paddingY || 4;
    badge.cornerRadius = props.cornerRadius || 999; // Fully rounded
    
    // Set background
    if (props.backgroundColor) {
      badge.fills = [{
        type: 'SOLID',
        color: props.backgroundColor
      }];
    }

    // Add text
    try {
      const text = figma.createText();
      text.characters = props.text || 'Badge';
      text.fontSize = 12;
      text.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      text.fills = [{
        type: 'SOLID',
        color: props.color || { r: 1, g: 1, b: 1 }
      }];
      badge.appendChild(text);
    } catch (error) {
      console.error('[ComponentRenderer] Error creating badge text:', error);
    }

    // Position the badge
    this.positionNode(badge, context);
    
    // Select and focus
    figma.currentPage.selection = [badge];
    figma.viewport.scrollAndZoomIntoView([badge]);
  }

  /**
   * Create a text component
   */
  private static async createText(props: any, context?: any): Promise<void> {
    try {
      const requestedStyle = props.fontWeight === 'Bold' ? 'Bold' : 
                            props.fontWeight === 'Medium' ? 'Medium' : 'Regular';
      
      const text = figma.createText();
      text.name = 'Once UI Text';
      text.characters = props.characters || 'Text';
      text.fontSize = props.fontSize || 14;
      text.fontName = FontLoader.getSafeFont('Inter', requestedStyle);
      text.textAlignHorizontal = props.textAlign || 'LEFT';
      
      if (props.color) {
        text.fills = [{
          type: 'SOLID',
          color: props.color
        }];
      }

      // Position the text
      this.positionNode(text, context);
      
      // Select and focus
      figma.currentPage.selection = [text];
      figma.viewport.scrollAndZoomIntoView([text]);
    } catch (error) {
      console.error('[ComponentRenderer] Error creating text:', error);
    }
  }

  /**
   * Position a node at the center of viewport or at specified coordinates
   */
  private static positionNode(node: SceneNode, context?: { x?: number; y?: number }): void {
    if (context && context.x !== undefined && context.y !== undefined) {
      if ('x' in node && 'y' in node) {
        node.x = context.x;
        node.y = context.y;
      }
    } else {
      // Center in viewport
      const viewportCenter = figma.viewport.center;
      if ('x' in node && 'y' in node && 'width' in node && 'height' in node) {
        node.x = Math.round(viewportCenter.x - node.width / 2);
        node.y = Math.round(viewportCenter.y - node.height / 2);
      }
    }
  }

  /**
   * Initialize default mappings (temporary until database is connected)
   */
  private static initializeDefaultMappings(): void {
    // Button mapping
    this.mappings.set('button', {
      componentType: 'button',
      onceUiComponent: 'Button',
      figmaToOnceProps: {
        text: 'children',
        width: 'style.width',
        height: 'style.height',
        backgroundColor: 'variant',
        cornerRadius: 'radius'
      },
      onceToFigmaProps: {
        children: 'text',
        variant: 'backgroundColor',
        size: {
          small: { width: 80, height: 32 },
          medium: { width: 120, height: 40 },
          large: { width: 160, height: 48 }
        },
        radius: 'cornerRadius'
      },
      styleMappings: {
        primary: { backgroundColor: { r: 0.388, g: 0.4, b: 0.965 } },
        secondary: { backgroundColor: { r: 0.8, g: 0.8, b: 0.8 } },
        danger: { backgroundColor: { r: 0.95, g: 0.3, b: 0.3 } }
      }
    });

    // Card mapping
    this.mappings.set('card', {
      componentType: 'card',
      onceUiComponent: 'Card',
      figmaToOnceProps: {
        width: 'style.width',
        height: 'style.height',
        cornerRadius: 'radius',
        padding: 'style.padding'
      },
      onceToFigmaProps: {
        radius: 'cornerRadius',
        padding: 'padding',
        elevation: {
          small: { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 2 }, radius: 8 },
          medium: { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.15 }, offset: { x: 0, y: 4 }, radius: 16 },
          large: { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.2 }, offset: { x: 0, y: 8 }, radius: 24 }
        }
      }
    });

    // Input mapping
    this.mappings.set('input', {
      componentType: 'input',
      onceUiComponent: 'Input',
      figmaToOnceProps: {
        placeholder: 'placeholder',
        label: 'label',
        width: 'style.width',
        height: 'style.height'
      },
      onceToFigmaProps: {
        placeholder: 'placeholder',
        label: 'label',
        size: {
          small: { height: 32 },
          medium: { height: 40 },
          large: { height: 48 }
        }
      }
    });

    // Badge mapping
    this.mappings.set('badge', {
      componentType: 'badge',
      onceUiComponent: 'Badge',
      figmaToOnceProps: {
        text: 'children',
        backgroundColor: 'variant'
      },
      onceToFigmaProps: {
        children: 'text',
        size: {
          small: { paddingX: 8, paddingY: 2 },
          medium: { paddingX: 12, paddingY: 4 }
        }
      },
      styleMappings: {
        primary: { backgroundColor: { r: 0.388, g: 0.4, b: 0.965 }, color: { r: 1, g: 1, b: 1 } },
        secondary: { backgroundColor: { r: 0.9, g: 0.9, b: 0.9 }, color: { r: 0.1, g: 0.1, b: 0.1 } },
        success: { backgroundColor: { r: 0.3, g: 0.8, b: 0.3 }, color: { r: 1, g: 1, b: 1 } },
        warning: { backgroundColor: { r: 1, g: 0.7, b: 0 }, color: { r: 0, g: 0, b: 0 } },
        danger: { backgroundColor: { r: 0.95, g: 0.3, b: 0.3 }, color: { r: 1, g: 1, b: 1 } }
      }
    });

    // Text mapping
    this.mappings.set('text', {
      componentType: 'text',
      onceUiComponent: 'Text',
      figmaToOnceProps: {
        characters: 'children',
        fontSize: 'size',
        fontWeight: 'weight'
      },
      onceToFigmaProps: {
        children: 'characters',
        size: 'fontSize',
        weight: 'fontWeight'
      }
    });
  }
}

// Initialize on load
ComponentRenderer.initialize();