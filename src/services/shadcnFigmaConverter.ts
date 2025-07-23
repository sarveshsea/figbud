import { FontLoader } from './fontLoader';

interface TailwindClass {
  property: string;
  value: any;
}

interface ShadcnComponentProps {
  variant?: string;
  size?: string;
  className?: string;
  children?: string;
  disabled?: boolean;
  [key: string]: any;
}

interface FigmaProperties {
  fills?: any[];
  strokes?: any[];
  effects?: any[];
  cornerRadius?: number;
  width?: number;
  height?: number;
  padding?: number;
  itemSpacing?: number;
  [key: string]: any;
}

export class ShadcnFigmaConverter {
  // Tailwind to Figma color mappings - Dark Mode
  private static colorMap: Record<string, { r: number; g: number; b: number }> = {
    // Primary colors
    'primary': { r: 0.129, g: 0.588, b: 0.953 }, // #2196F3
    'primary-foreground': { r: 1, g: 1, b: 1 },
    
    // Secondary colors  
    'secondary': { r: 0.176, g: 0.176, b: 0.176 }, // #2D2D2D
    'secondary-foreground': { r: 1, g: 1, b: 1 },
    
    // Destructive colors
    'destructive': { r: 0.957, g: 0.263, b: 0.212 }, // #F44336
    'destructive-foreground': { r: 1, g: 1, b: 1 },
    
    // Accent colors
    'accent': { r: 0.227, g: 0.227, b: 0.227 }, // #3A3A3A
    'accent-foreground': { r: 1, g: 1, b: 1 },
    
    // Muted colors
    'muted': { r: 0.227, g: 0.227, b: 0.227 }, // #3A3A3A
    'muted-foreground': { r: 0.7, g: 0.7, b: 0.7 }, // #B3B3B3
    
    // Background/Foreground
    'background': { r: 0.118, g: 0.118, b: 0.118 }, // #1E1E1E
    'foreground': { r: 1, g: 1, b: 1 }, // White text
    
    // Card colors
    'card': { r: 0.176, g: 0.176, b: 0.176 }, // #2D2D2D
    'card-foreground': { r: 1, g: 1, b: 1 },
    
    // Border colors
    'border': { r: 0.3, g: 0.3, b: 0.3 }, // Subtle border
    'input': { r: 0.3, g: 0.3, b: 0.3 },
    
    // Ring color
    'ring': { r: 0.129, g: 0.588, b: 0.953 }, // #2196F3
    
    // Success color
    'success': { r: 0.298, g: 0.686, b: 0.314 }, // #4CAF50
    'success-foreground': { r: 1, g: 1, b: 1 },
    
    // Warning color
    'warning': { r: 1, g: 0.596, b: 0 }, // #FF9800
    'warning-foreground': { r: 1, g: 1, b: 1 }
  };

  // Size mappings for different components
  private static sizeMap = {
    button: {
      default: { width: 120, height: 36, paddingX: 16, paddingY: 8, fontSize: 14 },
      sm: { width: 100, height: 32, paddingX: 12, paddingY: 6, fontSize: 12 },
      lg: { width: 140, height: 40, paddingX: 24, paddingY: 10, fontSize: 16 },
      icon: { width: 36, height: 36, paddingX: 0, paddingY: 0, fontSize: 14 }
    },
    card: {
      default: { width: 320, height: 240, padding: 24, spacing: 16 },
      sm: { width: 280, height: 200, padding: 16, spacing: 12 },
      lg: { width: 400, height: 300, padding: 32, spacing: 20 }
    },
    input: {
      default: { width: 320, height: 40, paddingX: 12, fontSize: 14 },
      sm: { width: 280, height: 32, paddingX: 8, fontSize: 12 },
      lg: { width: 360, height: 48, paddingX: 16, fontSize: 16 }
    },
    badge: {
      default: { paddingX: 10, paddingY: 2, fontSize: 12 },
      sm: { paddingX: 8, paddingY: 1, fontSize: 10 },
      lg: { paddingX: 12, paddingY: 3, fontSize: 14 }
    }
  };

  // Convert Tailwind classes to Figma properties
  static parseTailwindClasses(className: string): Partial<FigmaProperties> {
    const classes = className.split(' ');
    const properties: Partial<FigmaProperties> = {};

    classes.forEach(cls => {
      // Background colors
      if (cls.startsWith('bg-')) {
        const colorName = cls.replace('bg-', '');
        const color = this.colorMap[colorName];
        if (color) {
          properties.fills = [{ type: 'SOLID', color }];
        }
      }

      // Text colors
      if (cls.startsWith('text-')) {
        const colorName = cls.replace('text-', '');
        const color = this.colorMap[colorName];
        if (color) {
          properties.textColor = color;
        }
      }

      // Border colors
      if (cls.startsWith('border-')) {
        const colorName = cls.replace('border-', '');
        const color = this.colorMap[colorName];
        if (color) {
          properties.strokes = [{ type: 'SOLID', color }];
          properties.strokeWeight = 1;
        }
      }

      // Padding
      if (cls.startsWith('p-')) {
        const value = parseInt(cls.replace('p-', '')) * 4;
        properties.padding = value;
      }
      if (cls.startsWith('px-')) {
        const value = parseInt(cls.replace('px-', '')) * 4;
        properties.paddingLeft = value;
        properties.paddingRight = value;
      }
      if (cls.startsWith('py-')) {
        const value = parseInt(cls.replace('py-', '')) * 4;
        properties.paddingTop = value;
        properties.paddingBottom = value;
      }

      // Border radius
      if (cls.startsWith('rounded-')) {
        const radiusMap: Record<string, number> = {
          'none': 0,
          'sm': 2,
          'md': 6,
          'lg': 8,
          'xl': 12,
          '2xl': 16,
          'full': 999
        };
        const suffix = cls.replace('rounded-', '');
        properties.cornerRadius = radiusMap[suffix] || 4;
      }

      // Shadow
      if (cls.startsWith('shadow')) {
        const shadowMap: Record<string, any> = {
          'shadow-sm': {
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.05 },
            offset: { x: 0, y: 1 },
            radius: 2,
            visible: true,
            blendMode: 'NORMAL'
          },
          'shadow': {
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: 1 },
            radius: 3,
            visible: true,
            blendMode: 'NORMAL'
          },
          'shadow-md': {
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: 4 },
            radius: 6,
            visible: true,
            blendMode: 'NORMAL'
          },
          'shadow-lg': {
            type: 'DROP_SHADOW',
            color: { r: 0, g: 0, b: 0, a: 0.1 },
            offset: { x: 0, y: 10 },
            radius: 15,
            visible: true,
            blendMode: 'NORMAL'
          }
        };
        const effect = shadowMap[cls];
        if (effect) {
          properties.effects = [effect];
        }
      }
    });

    return properties;
  }

  // Convert Shadcn Button to Figma
  static async createShadcnButton(props: ShadcnComponentProps): Promise<FrameNode> {
    const { variant = 'default', size = 'default', children = 'Button', className = '', disabled = false } = props;
    
    // Get size properties
    const sizeProps = this.sizeMap.button[size as keyof typeof this.sizeMap.button] || this.sizeMap.button.default;
    
    // Create button frame
    const button = figma.createFrame();
    button.name = `Shadcn Button - ${variant}`;
    button.resize(sizeProps.width, sizeProps.height);
    
    // Set layout properties
    button.layoutMode = 'HORIZONTAL';
    button.primaryAxisAlignItems = 'CENTER';
    button.counterAxisAlignItems = 'CENTER';
    button.paddingLeft = sizeProps.paddingX;
    button.paddingRight = sizeProps.paddingX;
    button.paddingTop = sizeProps.paddingY;
    button.paddingBottom = sizeProps.paddingY;
    button.cornerRadius = 6;
    
    // Apply variant styles
    const variantStyles = this.getButtonVariantStyles(variant);
    button.fills = variantStyles.fills;
    if (variantStyles.strokes) {
      button.strokes = variantStyles.strokes;
      button.strokeWeight = 1;
    }
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(button, customProps);
    }
    
    // Add text
    const text = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
    text.characters = children;
    text.fontSize = sizeProps.fontSize;
    text.fontName = FontLoader.getSafeFont('Inter', 'Medium');
    text.fills = variantStyles.textFills;
    
    button.appendChild(text);
    
    // Apply disabled state
    if (disabled) {
      button.opacity = 0.5;
    }
    
    return button;
  }

  // Convert Shadcn Card to Figma
  static async createShadcnCard(props: ShadcnComponentProps): Promise<FrameNode> {
    const { className = '', children } = props;
    
    const card = figma.createFrame();
    card.name = 'Shadcn Card';
    card.resize(320, 240);
    
    // Set default properties
    card.layoutMode = 'VERTICAL';
    card.cornerRadius = 8;
    card.fills = [{ type: 'SOLID', color: this.colorMap.card || { r: 0.176, g: 0.176, b: 0.176 } }];
    card.strokes = [{ type: 'SOLID', color: this.colorMap.border || { r: 0.3, g: 0.3, b: 0.3 } }];
    card.strokeWeight = 1;
    card.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 1 },
      radius: 3,
      visible: true,
      blendMode: 'NORMAL'
    }];
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(card, customProps);
    }
    
    return card;
  }

  // Convert Shadcn Input to Figma
  static async createShadcnInput(props: ShadcnComponentProps): Promise<FrameNode> {
    const { size = 'default', placeholder = 'Enter text...', className = '', disabled = false } = props;
    
    const sizeProps = this.sizeMap.input[size as keyof typeof this.sizeMap.input] || this.sizeMap.input.default;
    
    const input = figma.createFrame();
    input.name = 'Shadcn Input';
    input.resize(sizeProps.width, sizeProps.height);
    
    // Set properties
    input.layoutMode = 'HORIZONTAL';
    input.primaryAxisAlignItems = 'CENTER';
    input.paddingLeft = sizeProps.paddingX;
    input.paddingRight = sizeProps.paddingX;
    input.cornerRadius = 6;
    input.fills = [{ type: 'SOLID', color: this.colorMap.secondary || { r: 0.176, g: 0.176, b: 0.176 } }]; // Use secondary for input background
    input.strokes = [{ type: 'SOLID', color: this.colorMap.input || { r: 0.3, g: 0.3, b: 0.3 } }];
    input.strokeWeight = 1;
    
    // Add placeholder text
    const text = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    text.characters = placeholder;
    text.fontSize = sizeProps.fontSize;
    text.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    text.fills = [{ type: 'SOLID', color: this.colorMap['muted-foreground'] || { r: 0.7, g: 0.7, b: 0.7 } }];
    
    input.appendChild(text);
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(input, customProps);
    }
    
    // Apply disabled state
    if (disabled) {
      input.opacity = 0.5;
    }
    
    return input;
  }

  // Convert Shadcn Badge to Figma
  static async createShadcnBadge(props: ShadcnComponentProps): Promise<FrameNode> {
    const { variant = 'default', size = 'default', children = 'Badge', className = '' } = props;
    
    const sizeProps = this.sizeMap.badge[size as keyof typeof this.sizeMap.badge] || this.sizeMap.badge.default;
    
    const badge = figma.createFrame();
    badge.name = `Shadcn Badge - ${variant}`;
    
    // Set layout
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';
    badge.paddingLeft = sizeProps.paddingX;
    badge.paddingRight = sizeProps.paddingX;
    badge.paddingTop = sizeProps.paddingY;
    badge.paddingBottom = sizeProps.paddingY;
    badge.cornerRadius = 999; // Fully rounded
    
    // Apply variant styles
    const variantStyles = this.getBadgeVariantStyles(variant);
    badge.fills = variantStyles.fills;
    if (variantStyles.strokes) {
      badge.strokes = variantStyles.strokes;
      badge.strokeWeight = 1;
    }
    
    // Add text
    const text = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
    text.characters = children;
    text.fontSize = sizeProps.fontSize;
    text.fontName = FontLoader.getSafeFont('Inter', 'Medium');
    text.fills = variantStyles.textFills;
    
    badge.appendChild(text);
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(badge, customProps);
    }
    
    return badge;
  }

  // Get button variant styles
  private static getButtonVariantStyles(variant: string) {
    const styles: Record<string, any> = {
      default: {
        fills: [{ type: 'SOLID', color: this.colorMap.primary }],
        textFills: [{ type: 'SOLID', color: this.colorMap['primary-foreground'] }]
      },
      destructive: {
        fills: [{ type: 'SOLID', color: this.colorMap.destructive }],
        textFills: [{ type: 'SOLID', color: this.colorMap['destructive-foreground'] }]
      },
      outline: {
        fills: [], // No fill for outline
        strokes: [{ type: 'SOLID', color: this.colorMap.border }],
        textFills: [{ type: 'SOLID', color: this.colorMap.foreground }]
      },
      secondary: {
        fills: [{ type: 'SOLID', color: this.colorMap.secondary }],
        textFills: [{ type: 'SOLID', color: this.colorMap['secondary-foreground'] }]
      },
      ghost: {
        fills: [], // Transparent
        textFills: [{ type: 'SOLID', color: this.colorMap.foreground }]
      },
      link: {
        fills: [],
        textFills: [{ type: 'SOLID', color: this.colorMap.primary }]
      }
    };
    
    return styles[variant] || styles.default;
  }

  // Get badge variant styles
  private static getBadgeVariantStyles(variant: string) {
    const styles: Record<string, any> = {
      default: {
        fills: [{ type: 'SOLID', color: this.colorMap.primary }],
        textFills: [{ type: 'SOLID', color: this.colorMap['primary-foreground'] }]
      },
      secondary: {
        fills: [{ type: 'SOLID', color: this.colorMap.secondary }],
        textFills: [{ type: 'SOLID', color: this.colorMap['secondary-foreground'] }]
      },
      destructive: {
        fills: [{ type: 'SOLID', color: this.colorMap.destructive }],
        textFills: [{ type: 'SOLID', color: this.colorMap['destructive-foreground'] }]
      },
      outline: {
        fills: [], // No fill for outline
        strokes: [{ type: 'SOLID', color: this.colorMap.border }],
        textFills: [{ type: 'SOLID', color: this.colorMap.foreground }]
      }
    };
    
    return styles[variant] || styles.default;
  }

  // Create Switch/Toggle component
  static async createShadcnSwitch(props: ShadcnComponentProps): Promise<FrameNode> {
    const { checked = false, disabled = false } = props;
    
    const switchContainer = figma.createFrame();
    switchContainer.name = 'Shadcn Switch';
    switchContainer.resize(44, 24);
    
    // Background track
    switchContainer.cornerRadius = 12;
    switchContainer.fills = checked ? 
      [{ type: 'SOLID', color: this.colorMap.primary || { r: 0.129, g: 0.588, b: 0.953 } }] :
      [{ type: 'SOLID', color: this.colorMap.muted || { r: 0.227, g: 0.227, b: 0.227 } }];
    
    // Create thumb
    const thumb = figma.createEllipse();
    thumb.resize(18, 18);
    thumb.x = checked ? 23 : 3;
    thumb.y = 3;
    thumb.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    thumb.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      offset: { x: 0, y: 2 },
      radius: 4,
      visible: true,
      blendMode: 'NORMAL'
    }];
    
    switchContainer.appendChild(thumb);
    
    if (disabled) {
      switchContainer.opacity = 0.5;
    }
    
    return switchContainer;
  }

  // Create Checkbox component
  static async createShadcnCheckbox(props: ShadcnComponentProps): Promise<FrameNode> {
    const { checked = false, label = '', disabled = false } = props;
    
    const container = figma.createFrame();
    container.name = 'Shadcn Checkbox';
    container.layoutMode = 'HORIZONTAL';
    container.counterAxisAlignItems = 'CENTER';
    container.itemSpacing = 8;
    
    // Checkbox box
    const checkbox = figma.createFrame();
    checkbox.resize(18, 18);
    checkbox.cornerRadius = 4;
    checkbox.strokes = [{ type: 'SOLID', color: checked ? (this.colorMap.primary || { r: 0.129, g: 0.588, b: 0.953 }) : (this.colorMap.input || { r: 0.3, g: 0.3, b: 0.3 }) }];
    checkbox.strokeWeight = 2;
    checkbox.fills = checked ? 
      [{ type: 'SOLID', color: this.colorMap.primary || { r: 0.129, g: 0.588, b: 0.953 } }] :
      [{ type: 'SOLID', color: this.colorMap.background || { r: 0.118, g: 0.118, b: 0.118 } }];
    
    if (checked) {
      // Add checkmark
      const checkmark = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Bold'));
      checkmark.characters = '✓';
      checkmark.fontSize = 12;
      checkmark.fontName = FontLoader.getSafeFont('Inter', 'Bold');
      checkmark.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      checkmark.textAlignHorizontal = 'CENTER';
      checkmark.textAlignVertical = 'CENTER';
      checkmark.resize(18, 18);
      checkbox.appendChild(checkmark);
    }
    
    container.appendChild(checkbox);
    
    // Add label if provided
    if (label) {
      const labelText = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
      labelText.characters = label;
      labelText.fontSize = 14;
      labelText.fontName = FontLoader.getSafeFont('Inter', 'Regular');
      labelText.fills = [{ type: 'SOLID', color: this.colorMap.foreground || { r: 1, g: 1, b: 1 } }];
      container.appendChild(labelText);
    }
    
    if (disabled) {
      container.opacity = 0.5;
    }
    
    return container;
  }

  // Create Select/Dropdown component
  static async createShadcnSelect(props: ShadcnComponentProps): Promise<FrameNode> {
    const { placeholder = 'Select an option', value = '', disabled = false, size = 'default' } = props;
    
    const sizeProps = this.sizeMap.input[size as keyof typeof this.sizeMap.input] || this.sizeMap.input.default;
    
    const select = figma.createFrame();
    select.name = 'Shadcn Select';
    select.resize(sizeProps.width, sizeProps.height);
    
    // Set properties
    select.layoutMode = 'HORIZONTAL';
    select.primaryAxisAlignItems = 'CENTER';
    select.counterAxisAlignItems = 'CENTER';
    select.paddingLeft = sizeProps.paddingX;
    select.paddingRight = 40; // Extra space for arrow
    select.cornerRadius = 6;
    select.fills = [{ type: 'SOLID', color: this.colorMap.secondary || { r: 0.176, g: 0.176, b: 0.176 } }]; // Use secondary for select background
    select.strokes = [{ type: 'SOLID', color: this.colorMap.input || { r: 0.3, g: 0.3, b: 0.3 } }];
    select.strokeWeight = 1;
    
    // Add text
    const text = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    text.characters = value || placeholder;
    text.fontSize = sizeProps.fontSize;
    text.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    text.fills = value ? 
      [{ type: 'SOLID', color: this.colorMap.foreground || { r: 1, g: 1, b: 1 } }] :
      [{ type: 'SOLID', color: this.colorMap['muted-foreground'] || { r: 0.7, g: 0.7, b: 0.7 } }];
    text.layoutGrow = 1;
    select.appendChild(text);
    
    // Add dropdown arrow
    const arrow = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    arrow.characters = '▼';
    arrow.fontSize = 10;
    arrow.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    arrow.fills = [{ type: 'SOLID', color: this.colorMap['muted-foreground'] || { r: 0.7, g: 0.7, b: 0.7 } }];
    arrow.x = select.width - 25;
    arrow.y = (select.height - 10) / 2;
    select.appendChild(arrow);
    
    if (disabled) {
      select.opacity = 0.5;
    }
    
    return select;
  }

  // Create Avatar component
  static async createShadcnAvatar(props: ShadcnComponentProps): Promise<FrameNode> {
    const { size = 'default', initials = 'JD', src = '', alt = '' } = props;
    
    const sizeMap = {
      sm: 32,
      default: 40,
      lg: 48
    };
    
    const avatarSize = sizeMap[size as keyof typeof sizeMap] || sizeMap.default;
    
    const avatar = figma.createFrame();
    avatar.name = 'Shadcn Avatar';
    avatar.resize(avatarSize, avatarSize);
    avatar.cornerRadius = avatarSize / 2;
    avatar.clipsContent = true;
    
    if (src) {
      // For demo purposes, use a placeholder background
      avatar.fills = [{ type: 'SOLID', color: this.colorMap.secondary || { r: 0.176, g: 0.176, b: 0.176 } }];
      
      // Add a subtle pattern to indicate image
      const pattern = figma.createRectangle();
      pattern.resize(avatarSize, avatarSize);
      pattern.fills = [{
        type: 'SOLID',
        color: this.colorMap['secondary-foreground'] || { r: 1, g: 1, b: 1 },
        opacity: 0.1
      }];
      avatar.appendChild(pattern);
    } else {
      // Initials avatar
      avatar.fills = [{ type: 'SOLID', color: this.colorMap.primary || { r: 0.129, g: 0.588, b: 0.953 } }];
      avatar.layoutMode = 'HORIZONTAL';
      avatar.primaryAxisAlignItems = 'CENTER';
      avatar.counterAxisAlignItems = 'CENTER';
      
      const initialsText = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
      initialsText.characters = initials.slice(0, 2).toUpperCase();
      initialsText.fontSize = avatarSize * 0.4;
      initialsText.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      initialsText.fills = [{ type: 'SOLID', color: this.colorMap['primary-foreground'] || { r: 1, g: 1, b: 1 } }];
      initialsText.textAlignHorizontal = 'CENTER';
      initialsText.textAlignVertical = 'CENTER';
      avatar.appendChild(initialsText);
    }
    
    // Add border
    avatar.strokes = [{ type: 'SOLID', color: this.colorMap.border || { r: 0.3, g: 0.3, b: 0.3 } }];
    avatar.strokeWeight = 2;
    
    return avatar;
  }

  // Create Alert component
  static async createShadcnAlert(props: ShadcnComponentProps): Promise<FrameNode> {
    const { variant = 'default', title = 'Alert', description = '', className = '' } = props;
    
    const alert = figma.createFrame();
    alert.name = `Shadcn Alert - ${variant}`;
    alert.resize(480, 80);
    
    // Set layout
    alert.layoutMode = 'HORIZONTAL';
    alert.itemSpacing = 12;
    alert.paddingLeft = 16;
    alert.paddingRight = 16;
    alert.paddingTop = 16;
    alert.paddingBottom = 16;
    alert.cornerRadius = 6;
    
    // Apply variant styles
    const variantStyles = this.getAlertVariantStyles(variant);
    alert.fills = variantStyles.fills;
    alert.strokes = variantStyles.strokes;
    alert.strokeWeight = 1;
    
    // Add icon
    const icon = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    icon.characters = variantStyles.icon;
    icon.fontSize = 20;
    icon.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    icon.fills = variantStyles.iconFills;
    alert.appendChild(icon);
    
    // Content container
    const content = figma.createFrame();
    content.layoutMode = 'VERTICAL';
    content.itemSpacing = 4;
    content.layoutGrow = 1;
    
    // Title
    const titleText = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
    titleText.characters = title;
    titleText.fontSize = 14;
    titleText.fontName = FontLoader.getSafeFont('Inter', 'Medium');
    titleText.fills = variantStyles.textFills;
    content.appendChild(titleText);
    
    // Description
    if (description) {
      const descText = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
      descText.characters = description;
      descText.fontSize = 14;
      descText.fontName = FontLoader.getSafeFont('Inter', 'Regular');
      descText.fills = variantStyles.mutedTextFills;
      descText.layoutAlign = 'STRETCH';
      content.appendChild(descText);
    }
    
    alert.appendChild(content);
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(alert, customProps);
    }
    
    return alert;
  }

  // Get alert variant styles
  private static getAlertVariantStyles(variant: string) {
    const styles: Record<string, any> = {
      default: {
        fills: [{ type: 'SOLID', color: this.colorMap.secondary }],
        strokes: [{ type: 'SOLID', color: this.colorMap.border }],
        textFills: [{ type: 'SOLID', color: this.colorMap.foreground }],
        mutedTextFills: [{ type: 'SOLID', color: this.colorMap['muted-foreground'] }],
        iconFills: [{ type: 'SOLID', color: this.colorMap.foreground }],
        icon: 'ℹ'
      },
      destructive: {
        fills: [{ type: 'SOLID', color: { r: 0.3, g: 0.15, b: 0.15 } }], // Dark red background
        strokes: [{ type: 'SOLID', color: this.colorMap.destructive }],
        textFills: [{ type: 'SOLID', color: { r: 1, g: 0.8, b: 0.8 } }], // Light red text
        mutedTextFills: [{ type: 'SOLID', color: { r: 1, g: 0.7, b: 0.7 } }],
        iconFills: [{ type: 'SOLID', color: this.colorMap.destructive }],
        icon: '✕'
      },
      success: {
        fills: [{ type: 'SOLID', color: { r: 0.15, g: 0.3, b: 0.15 } }], // Dark green background
        strokes: [{ type: 'SOLID', color: this.colorMap.success }],
        textFills: [{ type: 'SOLID', color: { r: 0.8, g: 1, b: 0.8 } }], // Light green text
        mutedTextFills: [{ type: 'SOLID', color: { r: 0.7, g: 0.9, b: 0.7 } }],
        iconFills: [{ type: 'SOLID', color: this.colorMap.success }],
        icon: '✓'
      },
      warning: {
        fills: [{ type: 'SOLID', color: { r: 0.4, g: 0.25, b: 0 } }], // Dark orange background
        strokes: [{ type: 'SOLID', color: this.colorMap.warning }],
        textFills: [{ type: 'SOLID', color: { r: 1, g: 0.9, b: 0.7 } }], // Light orange text
        mutedTextFills: [{ type: 'SOLID', color: { r: 1, g: 0.85, b: 0.6 } }],
        iconFills: [{ type: 'SOLID', color: this.colorMap.warning }],
        icon: '⚠'
      }
    };
    
    return styles[variant] || styles.default;
  }

  // Create Progress component
  static async createShadcnProgress(props: ShadcnComponentProps): Promise<FrameNode> {
    const { value = 50, className = '' } = props;
    
    const container = figma.createFrame();
    container.name = 'Shadcn Progress';
    container.resize(320, 8);
    
    // Background track
    container.cornerRadius = 4;
    container.fills = [{ type: 'SOLID', color: this.colorMap.secondary || { r: 0.176, g: 0.176, b: 0.176 } }];
    container.clipsContent = true;
    
    // Progress fill
    const fill = figma.createRectangle();
    fill.resize((container.width * value) / 100, 8);
    fill.cornerRadius = 4;
    fill.fills = [{ type: 'SOLID', color: this.colorMap.primary || { r: 0.129, g: 0.588, b: 0.953 } }];
    container.appendChild(fill);
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(container, customProps);
    }
    
    return container;
  }

  // Create Skeleton component
  static async createShadcnSkeleton(props: ShadcnComponentProps): Promise<FrameNode> {
    const { variant = 'text', className = '' } = props;
    
    const skeleton = figma.createFrame();
    skeleton.name = `Shadcn Skeleton - ${variant}`;
    
    // Set size based on variant
    switch (variant) {
      case 'text':
        skeleton.resize(200, 16);
        skeleton.cornerRadius = 4;
        break;
      case 'title':
        skeleton.resize(300, 24);
        skeleton.cornerRadius = 4;
        break;
      case 'avatar':
        skeleton.resize(40, 40);
        skeleton.cornerRadius = 20;
        break;
      case 'button':
        skeleton.resize(120, 40);
        skeleton.cornerRadius = 6;
        break;
      case 'card':
        skeleton.resize(320, 120);
        skeleton.cornerRadius = 8;
        break;
      default:
        skeleton.resize(200, 16);
        skeleton.cornerRadius = 4;
    }
    
    // Animated gradient effect (simulated with gradient)
    skeleton.fills = [{
      type: 'GRADIENT_LINEAR',
      gradientTransform: [
        [1, 0, 0],
        [0, 1, 0]
      ],
      gradientStops: [
        { position: 0, color: { r: 0.176, g: 0.176, b: 0.176, a: 1 } },
        { position: 0.5, color: { r: 0.227, g: 0.227, b: 0.227, a: 1 } },
        { position: 1, color: { r: 0.176, g: 0.176, b: 0.176, a: 1 } }
      ]
    }];
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(skeleton, customProps);
    }
    
    return skeleton;
  }

  // Create Tabs component
  static async createShadcnTabs(props: ShadcnComponentProps): Promise<FrameNode> {
    const { tabs = ['Tab 1', 'Tab 2', 'Tab 3'], activeTab = 0, className = '' } = props;
    
    const container = figma.createFrame();
    container.name = 'Shadcn Tabs';
    container.layoutMode = 'VERTICAL';
    container.resize(480, 200);
    
    // Tab list
    const tabList = figma.createFrame();
    tabList.name = 'Tab List';
    tabList.layoutMode = 'HORIZONTAL';
    tabList.itemSpacing = 4;
    tabList.layoutAlign = 'STRETCH';
    
    // Create tabs
    for (let i = 0; i < tabs.length; i++) {
      const tab = figma.createFrame();
      tab.layoutMode = 'HORIZONTAL';
      tab.primaryAxisAlignItems = 'CENTER';
      tab.counterAxisAlignItems = 'CENTER';
      tab.paddingLeft = 16;
      tab.paddingRight = 16;
      tab.paddingTop = 10;
      tab.paddingBottom = 10;
      
      const tabText = figma.createText();
      await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Medium'));
      tabText.characters = tabs[i] as string;
      tabText.fontSize = 14;
      tabText.fontName = FontLoader.getSafeFont('Inter', 'Medium');
      
      if (i === activeTab) {
        tabText.fills = [{ type: 'SOLID', color: this.colorMap.primary || { r: 0.129, g: 0.588, b: 0.953 } }];
      } else {
        tabText.fills = [{ type: 'SOLID', color: this.colorMap['muted-foreground'] || { r: 0.7, g: 0.7, b: 0.7 } }];
      }
      
      tab.appendChild(tabText);
      tabList.appendChild(tab);
    }
    
    container.appendChild(tabList);
    
    // Tab border (using a thin frame instead of line)
    const border = figma.createFrame();
    border.resize(container.width, 1);
    border.fills = [{ type: 'SOLID', color: this.colorMap.border || { r: 0.3, g: 0.3, b: 0.3 } }];
    container.appendChild(border);
    
    // Tab content
    const content = figma.createFrame();
    content.layoutMode = 'VERTICAL';
    content.paddingTop = 24;
    content.layoutAlign = 'STRETCH';
    content.layoutGrow = 1;
    
    const contentText = figma.createText();
    await figma.loadFontAsync(FontLoader.getSafeFont('Inter', 'Regular'));
    contentText.characters = `Content for ${tabs[activeTab]}`;
    contentText.fontSize = 14;
    contentText.fontName = FontLoader.getSafeFont('Inter', 'Regular');
    contentText.fills = [{ type: 'SOLID', color: this.colorMap['muted-foreground'] || { r: 0.7, g: 0.7, b: 0.7 } }];
    content.appendChild(contentText);
    
    container.appendChild(content);
    
    // Apply custom className styles
    if (className) {
      const customProps = this.parseTailwindClasses(className);
      Object.assign(container, customProps);
    }
    
    return container;
  }

  // Create component based on type
  static async createComponent(type: string, props: ShadcnComponentProps): Promise<SceneNode | null> {
    try {
      switch (type) {
        case 'button':
          return await this.createShadcnButton(props);
        case 'card':
          return await this.createShadcnCard(props);
        case 'input':
          return await this.createShadcnInput(props);
        case 'badge':
          return await this.createShadcnBadge(props);
        case 'switch':
        case 'toggle':
          return await this.createShadcnSwitch(props);
        case 'checkbox':
          return await this.createShadcnCheckbox(props);
        case 'select':
        case 'dropdown':
          return await this.createShadcnSelect(props);
        case 'avatar':
          return await this.createShadcnAvatar(props);
        case 'alert':
          return await this.createShadcnAlert(props);
        case 'progress':
          return await this.createShadcnProgress(props);
        case 'skeleton':
          return await this.createShadcnSkeleton(props);
        case 'tabs':
          return await this.createShadcnTabs(props);
        default:
          console.error(`[ShadcnFigmaConverter] Unsupported component type: ${type}`);
          return null;
      }
    } catch (error) {
      console.error(`[ShadcnFigmaConverter] Error creating ${type}:`, error);
      return null;
    }
  }
}