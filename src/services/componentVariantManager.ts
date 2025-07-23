/**
 * Component Variant Manager for FigBud
 * Handles creation of Figma components with proper variants and interactive states
 */

// Extend Figma types for component nodes
declare global {
  interface ComponentNode {
    variantProperties?: Record<string, string>;
    layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
    primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
    counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    itemSpacing?: number;
  }
  
  // ComponentSetNode is defined by Figma, we don't need to extend it
}

interface ComponentState {
  name: string;
  properties: Record<string, any>;
  styles?: {
    fills?: Paint[];
    strokes?: Paint[];
    effects?: Effect[];
    opacity?: number;
  };
}

interface VariantProperty {
  name: string;
  values: string[];
  defaultValue?: string;
}

interface ComponentVariantConfig {
  name: string;
  baseComponent?: SceneNode;
  properties: VariantProperty[];
  states: ComponentState[];
  autoLayout?: {
    mode: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
    padding?: number;
    spacing?: number;
    primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
    counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
  };
}

export class ComponentVariantManager {
  /**
   * Create a component set with variants and states
   */
  static async createComponentWithVariants(config: ComponentVariantConfig): Promise<ComponentSetNode> {
    // Create component set
    // First, create an initial component to start with
    const firstComponent = figma.createComponent();
    firstComponent.name = config.name;
    const componentSet = figma.combineAsVariants([firstComponent], figma.currentPage);
    componentSet.name = config.name;

    // Generate all variant combinations
    const variantCombinations = this.generateVariantCombinations(config.properties);
    
    // Create a variant for each combination
    for (const combination of variantCombinations) {
      // Find matching state configuration
      const stateConfig = config.states.find(state => 
        this.matchesState(state.name, combination)
      ) || config.states[0]; // Default to first state if no match

      if (!stateConfig) {
        console.error('No state configuration found for combination:', combination);
        continue;
      }

      // Create variant component
      const variant = await this.createVariant(
        config.name,
        combination,
        stateConfig,
        config.autoLayout
      );

      // Add to component set
      componentSet.appendChild(variant);
    }

    // Set up component properties
    this.setupComponentProperties(componentSet, config.properties);

    // Position the component set
    componentSet.x = 100;
    componentSet.y = 100;

    return componentSet;
  }

  /**
   * Create a single variant component
   */
  private static async createVariant(
    baseName: string,
    properties: Record<string, string>,
    state: ComponentState,
    autoLayout?: ComponentVariantConfig['autoLayout']
  ): Promise<ComponentNode> {
    const component = figma.createComponent();
    
    // Set variant properties
    const variantProps: Record<string, string> = {};
    for (const [key, value] of Object.entries(properties)) {
      variantProps[key] = value;
    }
    // Variant properties are set when the component is added to a ComponentSet
    // Store them temporarily for later use
    (component as any)._variantProperties = variantProps;

    // Create the component structure based on type
    const componentType = properties.Type || 'button';
    await this.buildComponentStructure(component, componentType, state, autoLayout);

    // Apply state-specific styles
    this.applyStateStyles(component, state);

    // Set component name
    const variantName = Object.entries(properties)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');
    component.name = variantName;

    return component;
  }

  /**
   * Build component structure based on type
   */
  private static async buildComponentStructure(
    component: ComponentNode,
    type: string,
    state: ComponentState,
    autoLayout?: ComponentVariantConfig['autoLayout']
  ): Promise<void> {
    // Set up auto-layout if specified
    if (autoLayout && autoLayout.mode !== 'NONE') {
      component.layoutMode = autoLayout.mode;
      component.paddingLeft = autoLayout.padding || 16;
      component.paddingRight = autoLayout.padding || 16;
      component.paddingTop = autoLayout.padding || 12;
      component.paddingBottom = autoLayout.padding || 12;
      component.itemSpacing = autoLayout.spacing || 8;
      
      if (autoLayout.primaryAxisAlignItems) {
        component.primaryAxisAlignItems = autoLayout.primaryAxisAlignItems;
      }
      if (autoLayout.counterAxisAlignItems) {
        component.counterAxisAlignItems = autoLayout.counterAxisAlignItems as 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
      }
    }

    // Build structure based on component type
    switch (type.toLowerCase()) {
      case 'button':
        await this.buildButtonStructure(component, state);
        break;
      case 'card':
        await this.buildCardStructure(component, state);
        break;
      case 'input':
        await this.buildInputStructure(component, state);
        break;
      case 'toggle':
        await this.buildToggleStructure(component, state);
        break;
      default:
        await this.buildDefaultStructure(component, state);
    }
  }

  /**
   * Build button structure
   */
  private static async buildButtonStructure(
    component: ComponentNode,
    state: ComponentState
  ): Promise<void> {
    // Create text node
    const text = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Medium" });
    
    text.characters = state.properties.label || "Button";
    text.fontSize = state.properties.size === 'small' ? 14 : 
                    state.properties.size === 'large' ? 18 : 16;
    text.fontName = { family: "Inter", style: "Medium" };
    
    // Add text to component
    component.appendChild(text);

    // Set component size
    component.resize(
      state.properties.size === 'small' ? 80 : 
      state.properties.size === 'large' ? 120 : 100,
      state.properties.size === 'small' ? 32 : 
      state.properties.size === 'large' ? 48 : 40
    );

    // Apply variant-specific styling
    const variant = state.properties.variant || 'primary';
    const colors = {
      primary: { bg: '#6366F1', text: '#FFFFFF' },
      secondary: { bg: '#E5E7EB', text: '#374151' },
      danger: { bg: '#EF4444', text: '#FFFFFF' },
      ghost: { bg: 'transparent', text: '#6366F1' }
    };

    const color = colors[variant as keyof typeof colors] || colors.primary;
    
    // Apply background
    if (color.bg !== 'transparent') {
      component.fills = [{
        type: 'SOLID',
        color: this.hexToRgb(color.bg as string)
      }];
    } else {
      component.fills = [];
    }

    // Apply text color
    text.fills = [{
      type: 'SOLID',
      color: this.hexToRgb(color.text as string)
    }];

    // Add border for ghost variant
    if (variant === 'ghost') {
      component.strokes = [{
        type: 'SOLID',
        color: this.hexToRgb('#6366F1')
      }];
      component.strokeWeight = 1;
    }

    // Corner radius
    component.cornerRadius = 6;
  }

  /**
   * Build card structure
   */
  private static async buildCardStructure(
    component: ComponentNode,
    state: ComponentState
  ): Promise<void> {
    // Set card size
    component.resize(320, 200);
    
    // Background
    component.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 }
    }];

    // Border
    component.strokes = [{
      type: 'SOLID',
      color: { r: 0.9, g: 0.9, b: 0.9 }
    }];
    component.strokeWeight = 1;
    component.cornerRadius = 8;

    // Shadow
    component.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 2 },
      radius: 4,
      visible: true,
      blendMode: 'NORMAL'
    }];

    // Add title if provided
    if (state.properties.title) {
      const title = figma.createText();
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      title.characters = state.properties.title;
      title.fontSize = 18;
      title.fontName = { family: "Inter", style: "Bold" };
      title.x = 16;
      title.y = 16;
      component.appendChild(title);
    }
  }

  /**
   * Build input structure
   */
  private static async buildInputStructure(
    component: ComponentNode,
    state: ComponentState
  ): Promise<void> {
    component.resize(240, 40);
    
    // Background
    component.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 }
    }];

    // Border
    component.strokes = [{
      type: 'SOLID',
      color: state.name === 'Focus' ? 
        this.hexToRgb('#6366F1') : 
        { r: 0.8, g: 0.8, b: 0.8 }
    }];
    component.strokeWeight = state.name === 'Focus' ? 2 : 1;
    component.cornerRadius = 4;

    // Placeholder text
    const placeholder = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    placeholder.characters = state.properties.placeholder || "Enter text...";
    placeholder.fontSize = 14;
    placeholder.fontName = { family: "Inter", style: "Regular" };
    placeholder.fills = [{
      type: 'SOLID',
      color: { r: 0.6, g: 0.6, b: 0.6 }
    }];
    placeholder.x = 12;
    placeholder.y = 12;
    component.appendChild(placeholder);
  }

  /**
   * Build toggle structure
   */
  private static async buildToggleStructure(
    component: ComponentNode,
    state: ComponentState
  ): Promise<void> {
    component.resize(48, 24);
    
    const isChecked = state.properties.checked || state.name === 'Checked';
    
    // Background
    component.fills = [{
      type: 'SOLID',
      color: isChecked ? 
        this.hexToRgb('#6366F1') : 
        { r: 0.8, g: 0.8, b: 0.8 }
    }];
    
    component.cornerRadius = 12;

    // Toggle circle
    const circle = figma.createEllipse();
    circle.resize(20, 20);
    circle.x = isChecked ? 26 : 2;
    circle.y = 2;
    circle.fills = [{
      type: 'SOLID',
      color: { r: 1, g: 1, b: 1 }
    }];
    
    // Shadow for circle
    circle.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.2 },
      offset: { x: 0, y: 1 },
      radius: 2,
      visible: true,
      blendMode: 'NORMAL'
    }];
    
    component.appendChild(circle);
  }

  /**
   * Build default structure
   */
  private static async buildDefaultStructure(
    component: ComponentNode,
    state: ComponentState
  ): Promise<void> {
    // Default rectangle
    component.resize(200, 100);
    component.fills = [{
      type: 'SOLID',
      color: { r: 0.95, g: 0.95, b: 0.95 }
    }];
    component.cornerRadius = 4;
  }

  /**
   * Apply state-specific styles
   */
  private static applyStateStyles(component: ComponentNode, state: ComponentState): void {
    if (!state.styles) return;

    // Apply fills
    if (state.styles.fills) {
      component.fills = state.styles.fills;
    }

    // Apply strokes
    if (state.styles.strokes) {
      component.strokes = state.styles.strokes;
    }

    // Apply effects
    if (state.styles.effects) {
      component.effects = state.styles.effects;
    }

    // Apply opacity
    if (state.styles.opacity !== undefined) {
      component.opacity = state.styles.opacity;
    }

    // Handle specific states
    switch (state.name.toLowerCase()) {
      case 'hover':
        // Slightly brighten the component
        if (component.fills && component.fills !== figma.mixed && component.fills.length > 0) {
          const fill = component.fills[0];
          if (fill && fill.type === 'SOLID' && 'color' in fill) {
            component.fills = [{
              type: 'SOLID',
              color: this.lightenColor(fill.color, 0.1)
            }];
          }
        }
        break;

      case 'pressed':
        // Slightly darken and remove shadow
        if (component.fills && component.fills !== figma.mixed && component.fills.length > 0) {
          const fill = component.fills[0];
          if (fill && fill.type === 'SOLID' && 'color' in fill) {
            component.fills = [{
              type: 'SOLID',
              color: this.darkenColor(fill.color, 0.1)
            }];
          }
        }
        component.effects = [];
        break;

      case 'disabled':
        // Reduce opacity
        component.opacity = 0.5;
        break;

      case 'focus':
        // Add focus ring
        component.strokes = [{
          type: 'SOLID',
          color: this.hexToRgb('#6366F1')
        }];
        component.strokeWeight = 2;
        break;
    }
  }

  /**
   * Set up component properties
   */
  private static setupComponentProperties(
    componentSet: ComponentSetNode,
    properties: VariantProperty[]
  ): void {
    // Component properties are automatically set by Figma when using combineAsVariants
    // We don't need to manually set them
    console.log('Component properties will be auto-generated by Figma for:', properties.map(p => p.name).join(', '));
  }

  /**
   * Generate all variant combinations
   */
  private static generateVariantCombinations(
    properties: VariantProperty[]
  ): Record<string, string>[] {
    const combinations: Record<string, string>[] = [];

    // Helper function to generate combinations recursively
    const generate = (index: number, current: Record<string, string>) => {
      if (index === properties.length) {
        combinations.push({ ...current });
        return;
      }

      const prop = properties[index];
      if (prop && prop.values && prop.values.length > 0) {
        for (const value of prop.values) {
          current[prop.name] = value;
          generate(index + 1, current);
        }
      }
    };

    generate(0, {});
    return combinations;
  }

  /**
   * Check if a state matches the variant combination
   */
  private static matchesState(
    stateName: string,
    combination: Record<string, string>
  ): boolean {
    // Check if the State property matches
    return combination.State === stateName;
  }

  /**
   * Utility: Convert hex to RGB
   */
  private static hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result && result[1] && result[2] && result[3] ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Utility: Lighten color
   */
  private static lightenColor(color: { r: number, g: number, b: number }, amount: number): { r: number, g: number, b: number } {
    return {
      r: Math.min(1, color.r + amount),
      g: Math.min(1, color.g + amount),
      b: Math.min(1, color.b + amount)
    };
  }

  /**
   * Utility: Darken color
   */
  private static darkenColor(color: { r: number, g: number, b: number }, amount: number): { r: number, g: number, b: number } {
    return {
      r: Math.max(0, color.r - amount),
      g: Math.max(0, color.g - amount),
      b: Math.max(0, color.b - amount)
    };
  }

  /**
   * Create common UI component variants
   */
  static async createCommonComponents(): Promise<void> {
    // Button with all variants and states
    await this.createComponentWithVariants({
      name: 'Button',
      properties: [
        {
          name: 'Type',
          values: ['button'],
          defaultValue: 'button'
        },
        {
          name: 'Variant',
          values: ['primary', 'secondary', 'danger', 'ghost'],
          defaultValue: 'primary'
        },
        {
          name: 'Size',
          values: ['small', 'medium', 'large'],
          defaultValue: 'medium'
        },
        {
          name: 'State',
          values: ['Default', 'Hover', 'Pressed', 'Disabled', 'Focus'],
          defaultValue: 'Default'
        }
      ],
      states: [
        { name: 'Default', properties: { label: 'Button' } },
        { name: 'Hover', properties: { label: 'Button' } },
        { name: 'Pressed', properties: { label: 'Button' } },
        { name: 'Disabled', properties: { label: 'Button' } },
        { name: 'Focus', properties: { label: 'Button' } }
      ],
      autoLayout: {
        mode: 'HORIZONTAL',
        padding: 16,
        primaryAxisAlignItems: 'CENTER',
        counterAxisAlignItems: 'CENTER'
      }
    });

    // Input field with states
    await this.createComponentWithVariants({
      name: 'Input',
      properties: [
        {
          name: 'Type',
          values: ['input'],
          defaultValue: 'input'
        },
        {
          name: 'State',
          values: ['Default', 'Focus', 'Disabled', 'Error'],
          defaultValue: 'Default'
        }
      ],
      states: [
        { name: 'Default', properties: { placeholder: 'Enter text...' } },
        { name: 'Focus', properties: { placeholder: 'Enter text...' } },
        { name: 'Disabled', properties: { placeholder: 'Disabled' } },
        { name: 'Error', properties: { placeholder: 'Error state' } }
      ]
    });

    // Toggle switch
    await this.createComponentWithVariants({
      name: 'Toggle',
      properties: [
        {
          name: 'Type',
          values: ['toggle'],
          defaultValue: 'toggle'
        },
        {
          name: 'State',
          values: ['Unchecked', 'Checked', 'Disabled'],
          defaultValue: 'Unchecked'
        }
      ],
      states: [
        { name: 'Unchecked', properties: { checked: false } },
        { name: 'Checked', properties: { checked: true } },
        { name: 'Disabled', properties: { checked: false } }
      ]
    });
  }
}