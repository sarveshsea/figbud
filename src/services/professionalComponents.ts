// Professional Component Library - Enterprise-grade UI components
import { designTokens, hexToRgb, createGlassmorphism, createNeumorphism, getRadius, getSpacing, createDropShadow, createGradientFill } from './designTokens';

export interface ComponentConfig {
  name: string;
  category: string;
  description: string;
  properties: Record<string, any>;
  variants?: Record<string, any>;
  states?: Record<string, any>;
}

// Button Component - Modern, accessible, with multiple variants
export const createProfessionalButton = async (properties: any = {}) => {
  const {
    label = 'Button',
    variant = 'primary', // primary, secondary, ghost, outline, gradient, glass
    size = 'medium', // small, medium, large
    icon = null,
    iconPosition = 'left',
    fullWidth = false,
    loading = false,
    disabled = false
  } = properties;

  // Size configurations
  const sizes = {
    small: { height: 32, paddingX: 12, fontSize: 14, iconSize: 16 },
    medium: { height: 40, paddingX: 20, fontSize: 16, iconSize: 20 },
    large: { height: 48, paddingX: 28, fontSize: 18, iconSize: 24 }
  };

  const sizeConfig = sizes[size] || sizes.medium;
  
  // Create button frame
  const button = figma.createFrame();
  button.name = `Button/${variant}/${size}`;
  button.resize(fullWidth ? 320 : 120, sizeConfig.height);
  button.layoutMode = 'HORIZONTAL';
  button.primaryAxisAlignItems = 'CENTER';
  button.counterAxisAlignItems = 'CENTER';
  button.itemSpacing = 8;
  button.paddingLeft = sizeConfig.paddingX;
  button.paddingRight = sizeConfig.paddingX;
  button.cornerRadius = getRadius('md');

  // Apply variant styles
  switch (variant) {
    case 'primary':
      button.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
      button.effects = [
        { 
          type: 'DROP_SHADOW', 
          color: { ...hexToRgb(designTokens.colors.primary[600]), a: 0.3 }, 
          offset: { x: 0, y: 4 }, 
          radius: 12,
          spread: -2,
          visible: true,
          blendMode: 'NORMAL'
        } as DropShadowEffect
      ];
      break;
      
    case 'gradient':
      button.fills = [createGradientFill([
        hexToRgb(designTokens.colors.primary[500]),
        hexToRgb(designTokens.colors.accent[500])
      ])];
      button.effects = [
        createDropShadow({ r: 0, g: 0, b: 0, a: 0.15 }, { x: 0, y: 8 }, 24)
      ];
      break;
      
    case 'glass':
      const glassStyle = createGlassmorphism();
      button.fills = glassStyle.fills as Paint[];
      button.effects = glassStyle.effects as Effect[];
      button.strokes = [{
        type: 'SOLID',
        color: hexToRgb('#FFFFFF'),
        opacity: 0.2
      }];
      button.strokeWeight = 1;
      break;
      
    case 'outline':
      button.fills = [];
      button.strokes = [{
        type: 'SOLID',
        color: hexToRgb(designTokens.colors.primary[600])
      }];
      button.strokeWeight = 2;
      break;
      
    case 'ghost':
      button.fills = [];
      break;
      
    case 'secondary':
      button.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[100]) }];
      button.effects = [
        createDropShadow({ r: 0, g: 0, b: 0, a: 0.05 }, { x: 0, y: 1 }, 2)
      ];
      break;
  }

  // Add loading spinner if needed
  if (loading) {
    const spinner = figma.createEllipse();
    spinner.resize(sizeConfig.iconSize, sizeConfig.iconSize);
    spinner.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF'), opacity: 0.6 }];
    spinner.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.5, innerRadius: 0.7 };
    button.appendChild(spinner);
  }

  // Add icon if provided
  if (icon && !loading) {
    const iconNode = figma.createVector();
    iconNode.resize(sizeConfig.iconSize, sizeConfig.iconSize);
    iconNode.fills = [{
      type: 'SOLID',
      color: variant === 'outline' || variant === 'ghost' 
        ? hexToRgb(designTokens.colors.primary[600])
        : hexToRgb('#FFFFFF')
    }];
    button.appendChild(iconNode);
  }

  // Add text
  const text = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  text.characters = label;
  text.fontSize = sizeConfig.fontSize;
  text.fontName = { family: "Inter", style: "Medium" };
  text.fills = [{
    type: 'SOLID',
    color: variant === 'outline' || variant === 'ghost' 
      ? hexToRgb(designTokens.colors.primary[600])
      : hexToRgb('#FFFFFF')
  }];
  text.textAlignHorizontal = 'CENTER';
  button.appendChild(text);

  // Apply disabled state
  if (disabled) {
    button.opacity = 0.5;
  }

  return button;
};

// Card Component - Modern card with multiple styles
export const createProfessionalCard = async (properties: any = {}) => {
  const {
    title = 'Card Title',
    description = 'Card description goes here',
    image = null,
    variant = 'elevated', // elevated, outlined, filled, glass, neumorphic
    padding = 24,
    width = 320,
    height = 'auto'
  } = properties;

  const card = figma.createFrame();
  card.name = `Card/${variant}`;
  card.resize(width, height === 'auto' ? 200 : height);
  card.layoutMode = 'VERTICAL';
  card.itemSpacing = 16;
  card.paddingLeft = padding;
  card.paddingRight = padding;
  card.paddingTop = padding;
  card.paddingBottom = padding;
  card.cornerRadius = getRadius('xl');
  card.clipsContent = true;

  // Apply variant styles
  switch (variant) {
    case 'elevated':
      card.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
      card.effects = [
        createDropShadow({ r: 0, g: 0, b: 0, a: 0.1 }, { x: 0, y: 10 }, 30, -5),
        createDropShadow({ r: 0, g: 0, b: 0, a: 0.06 }, { x: 0, y: 4 }, 10)
      ];
      break;
      
    case 'glass':
      const glassStyle = createGlassmorphism();
      card.fills = glassStyle.fills as Paint[];
      card.effects = glassStyle.effects as Effect[];
      card.strokes = [{
        type: 'SOLID',
        color: hexToRgb('#FFFFFF'),
        opacity: 0.2
      }];
      card.strokeWeight = 1;
      break;
      
    case 'neumorphic':
      const neuStyle = createNeumorphism();
      card.fills = neuStyle.fills as Paint[];
      card.effects = neuStyle.effects as Effect[];
      break;
      
    case 'outlined':
      card.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
      card.strokes = [{
        type: 'SOLID',
        color: hexToRgb(designTokens.colors.neutral[200])
      }];
      card.strokeWeight = 1;
      break;
      
    case 'filled':
      card.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[50]) }];
      break;
  }

  // Add image placeholder if needed
  if (image) {
    const imageFrame = figma.createRectangle();
    imageFrame.resize(width - padding * 2, 160);
    imageFrame.cornerRadius = getRadius('md');
    imageFrame.fills = [createGradientFill([
      hexToRgb(designTokens.colors.primary[100]),
      hexToRgb(designTokens.colors.accent[100])
    ])];
    card.appendChild(imageFrame);
  }

  // Add title
  const titleText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  titleText.characters = title;
  titleText.fontSize = 20;
  titleText.fontName = { family: "Inter", style: "Bold" };
  titleText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[900]) }];
  card.appendChild(titleText);

  // Add description
  const descText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  descText.characters = description;
  descText.fontSize = 14;
  descText.fontName = { family: "Inter", style: "Regular" };
  descText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[600]) }];
  descText.layoutSizingHorizontal = 'FILL';
  card.appendChild(descText);

  return card;
};

// Input Component - Modern form input with states
export const createProfessionalInput = async (properties: any = {}) => {
  const {
    placeholder = 'Enter text...',
    label = 'Label',
    value = '',
    variant = 'outlined', // outlined, filled, underlined
    size = 'medium',
    error = false,
    helperText = '',
    icon = null,
    type = 'text' // text, email, password, number
  } = properties;

  const container = figma.createFrame();
  container.name = `Input/${variant}/${size}`;
  container.layoutMode = 'VERTICAL';
  container.itemSpacing = 8;
  container.resize(280, 80);

  // Add label
  const labelText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  labelText.characters = label;
  labelText.fontSize = 14;
  labelText.fontName = { family: "Inter", style: "Medium" };
  labelText.fills = [{ 
    type: 'SOLID', 
    color: hexToRgb(error ? designTokens.colors.error.main : designTokens.colors.neutral[700]) 
  }];
  container.appendChild(labelText);

  // Create input field
  const inputFrame = figma.createFrame();
  inputFrame.resize(280, 48);
  inputFrame.layoutMode = 'HORIZONTAL';
  inputFrame.primaryAxisAlignItems = 'CENTER';
  inputFrame.itemSpacing = 12;
  inputFrame.paddingLeft = 16;
  inputFrame.paddingRight = 16;

  // Apply variant styles
  switch (variant) {
    case 'outlined':
      inputFrame.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
      inputFrame.strokes = [{
        type: 'SOLID',
        color: hexToRgb(error ? designTokens.colors.error.main : designTokens.colors.neutral[300])
      }];
      inputFrame.strokeWeight = error ? 2 : 1;
      inputFrame.cornerRadius = getRadius('base');
      break;
      
    case 'filled':
      inputFrame.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[100]) }];
      inputFrame.cornerRadius = getRadius('base');
      // Add bottom border
      const bottomBorder = figma.createLine();
      bottomBorder.resize(280, 0);
      bottomBorder.strokes = [{
        type: 'SOLID',
        color: hexToRgb(error ? designTokens.colors.error.main : designTokens.colors.primary[600])
      }];
      bottomBorder.strokeWeight = 2;
      container.appendChild(bottomBorder);
      break;
      
    case 'underlined':
      inputFrame.fills = [];
      const underline = figma.createLine();
      underline.resize(280, 0);
      underline.strokes = [{
        type: 'SOLID',
        color: hexToRgb(error ? designTokens.colors.error.main : designTokens.colors.neutral[400])
      }];
      underline.strokeWeight = 1;
      container.appendChild(underline);
      break;
  }

  // Add icon if provided
  if (icon) {
    const iconNode = figma.createVector();
    iconNode.resize(20, 20);
    iconNode.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[500]) }];
    inputFrame.appendChild(iconNode);
  }

  // Add placeholder/value text
  const inputText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  inputText.characters = value || placeholder;
  inputText.fontSize = 16;
  inputText.fontName = { family: "Inter", style: "Regular" };
  inputText.fills = [{ 
    type: 'SOLID', 
    color: hexToRgb(value ? designTokens.colors.neutral[900] : designTokens.colors.neutral[400])
  }];
  inputText.layoutSizingHorizontal = 'FILL';
  inputFrame.appendChild(inputText);

  container.appendChild(inputFrame);

  // Add helper text if provided
  if (helperText) {
    const helperTextNode = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    helperTextNode.characters = helperText;
    helperTextNode.fontSize = 12;
    helperTextNode.fontName = { family: "Inter", style: "Regular" };
    helperTextNode.fills = [{ 
      type: 'SOLID', 
      color: hexToRgb(error ? designTokens.colors.error.main : designTokens.colors.neutral[600])
    }];
    container.appendChild(helperTextNode);
  }

  return container;
};

// Badge/Chip Component
export const createProfessionalBadge = async (properties: any = {}) => {
  const {
    label = 'Badge',
    variant = 'primary', // primary, success, warning, error, info, neutral
    size = 'medium',
    icon = null,
    closable = false,
    rounded = true
  } = properties;

  const badge = figma.createFrame();
  badge.name = `Badge/${variant}`;
  badge.layoutMode = 'HORIZONTAL';
  badge.primaryAxisAlignItems = 'CENTER';
  badge.itemSpacing = 4;
  
  // Size configurations
  const sizes = {
    small: { height: 20, paddingX: 8, fontSize: 11 },
    medium: { height: 24, paddingX: 12, fontSize: 12 },
    large: { height: 32, paddingX: 16, fontSize: 14 }
  };
  
  const sizeConfig = sizes[size] || sizes.medium;
  badge.resize(80, sizeConfig.height);
  badge.paddingLeft = sizeConfig.paddingX;
  badge.paddingRight = sizeConfig.paddingX;
  badge.cornerRadius = rounded ? sizeConfig.height / 2 : getRadius('sm');

  // Apply variant colors
  const variantColors = {
    primary: { bg: designTokens.colors.primary[100], text: designTokens.colors.primary[800] },
    success: { bg: '#D1FAE5', text: '#065F46' },
    warning: { bg: '#FEF3C7', text: '#92400E' },
    error: { bg: '#FEE2E2', text: '#991B1B' },
    info: { bg: '#DBEAFE', text: '#1E40AF' },
    neutral: { bg: designTokens.colors.neutral[100], text: designTokens.colors.neutral[800] }
  };

  const colors = variantColors[variant] || variantColors.primary;
  badge.fills = [{ type: 'SOLID', color: hexToRgb(colors.bg) }];

  // Add text
  const text = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  text.characters = label;
  text.fontSize = sizeConfig.fontSize;
  text.fontName = { family: "Inter", style: "Medium" };
  text.fills = [{ type: 'SOLID', color: hexToRgb(colors.text) }];
  badge.appendChild(text);

  return badge;
};

// Export component map for easy access
export const professionalComponents = {
  button: createProfessionalButton,
  card: createProfessionalCard,
  input: createProfessionalInput,
  badge: createProfessionalBadge
};