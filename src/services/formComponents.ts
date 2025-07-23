// Form Components - Modern form elements for professional UIs
import { designTokens, hexToRgb, getRadius, getSpacing, createDropShadow } from './designTokens';

// Select/Dropdown Component
export const createSelect = async (properties: any = {}) => {
  const {
    options = ['Option 1', 'Option 2', 'Option 3'],
    placeholder = 'Select an option',
    label = 'Select',
    variant = 'outlined',
    size = 'medium',
    width = 280
  } = properties;

  const container = figma.createFrame();
  container.name = `Select/${variant}`;
  container.layoutMode = 'VERTICAL';
  container.itemSpacing = 8;
  container.resize(width, 80);

  // Label
  const labelText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  labelText.characters = label;
  labelText.fontSize = 14;
  labelText.fontName = { family: "Inter", style: "Medium" };
  labelText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
  container.appendChild(labelText);

  // Select field
  const selectField = figma.createFrame();
  selectField.resize(width, 48);
  selectField.layoutMode = 'HORIZONTAL';
  selectField.primaryAxisAlignItems = 'CENTER';
  selectField.counterAxisAlignItems = 'CENTER';
  selectField.paddingLeft = 16;
  selectField.paddingRight = 16;
  selectField.itemSpacing = 8;
  selectField.cornerRadius = getRadius('base');

  // Apply variant styles
  switch (variant) {
    case 'outlined':
      selectField.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
      selectField.strokes = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[300]) }];
      selectField.strokeWeight = 1;
      break;
    case 'filled':
      selectField.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[100]) }];
      break;
  }

  // Placeholder text
  const selectText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  selectText.characters = placeholder;
  selectText.fontSize = 16;
  selectText.fontName = { family: "Inter", style: "Regular" };
  selectText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[400]) }];
  selectText.layoutGrow = 1;
  selectField.appendChild(selectText);

  // Dropdown arrow
  const arrow = figma.createPolygon();
  arrow.resize(12, 12);
  arrow.pointCount = 3;
  arrow.rotation = 180;
  arrow.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[500]) }];
  selectField.appendChild(arrow);

  container.appendChild(selectField);

  return container;
};

// Checkbox Component
export const createCheckbox = async (properties: any = {}) => {
  const {
    label = 'Checkbox label',
    checked = false,
    size = 'medium',
    variant = 'primary'
  } = properties;

  const sizes = {
    small: 16,
    medium: 20,
    large: 24
  };

  const checkboxSize = sizes[size] || sizes.medium;

  const container = figma.createFrame();
  container.name = 'Checkbox';
  container.layoutMode = 'HORIZONTAL';
  container.primaryAxisAlignItems = 'CENTER';
  container.itemSpacing = 12;

  // Checkbox box
  const checkbox = figma.createFrame();
  checkbox.resize(checkboxSize, checkboxSize);
  checkbox.cornerRadius = getRadius('sm');
  
  if (checked) {
    checkbox.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
    
    // Checkmark
    const checkmark = figma.createVector();
    checkmark.resize(checkboxSize * 0.6, checkboxSize * 0.6);
    checkmark.x = checkboxSize * 0.2;
    checkmark.y = checkboxSize * 0.2;
    checkmark.vectorPaths = [{
      windingRule: 'NONZERO',
      data: 'M 2 5 L 5 8 L 10 3'
    }];
    checkmark.strokes = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    checkmark.strokeWeight = 2;
    checkmark.strokeCap = 'ROUND';
    checkmark.strokeJoin = 'ROUND';
    checkbox.appendChild(checkmark);
  } else {
    checkbox.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    checkbox.strokes = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[300]) }];
    checkbox.strokeWeight = 2;
  }

  container.appendChild(checkbox);

  // Label
  const labelText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  labelText.characters = label;
  labelText.fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
  labelText.fontName = { family: "Inter", style: "Regular" };
  labelText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
  container.appendChild(labelText);

  return container;
};

// Radio Button Component
export const createRadioButton = async (properties: any = {}) => {
  const {
    label = 'Radio option',
    selected = false,
    size = 'medium',
    groupName = 'radio-group'
  } = properties;

  const sizes = {
    small: 16,
    medium: 20,
    large: 24
  };

  const radioSize = sizes[size] || sizes.medium;

  const container = figma.createFrame();
  container.name = `Radio/${groupName}`;
  container.layoutMode = 'HORIZONTAL';
  container.primaryAxisAlignItems = 'CENTER';
  container.itemSpacing = 12;

  // Radio container
  const radioContainer = figma.createFrame();
  radioContainer.resize(radioSize, radioSize);
  radioContainer.fills = [];
  
  // Radio circle
  const radio = figma.createEllipse();
  radio.resize(radioSize, radioSize);
  
  if (selected) {
    radio.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    radio.strokes = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
    radio.strokeWeight = 2;
    radioContainer.appendChild(radio);
    
    // Inner dot
    const dot = figma.createEllipse();
    const dotSize = radioSize * 0.5;
    dot.resize(dotSize, dotSize);
    dot.x = (radioSize - dotSize) / 2;
    dot.y = (radioSize - dotSize) / 2;
    dot.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
    radioContainer.appendChild(dot);
  } else {
    radio.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    radio.strokes = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[300]) }];
    radio.strokeWeight = 2;
    radioContainer.appendChild(radio);
  }

  container.appendChild(radioContainer);

  // Label
  const labelText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  labelText.characters = label;
  labelText.fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
  labelText.fontName = { family: "Inter", style: "Regular" };
  labelText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
  container.appendChild(labelText);

  return container;
};

// Toggle Switch Component
export const createToggle = async (properties: any = {}) => {
  const {
    label = 'Toggle option',
    checked = false,
    size = 'medium',
    variant = 'primary'
  } = properties;

  const sizes = {
    small: { width: 36, height: 20 },
    medium: { width: 48, height: 26 },
    large: { width: 60, height: 32 }
  };

  const toggleSize = sizes[size] || sizes.medium;

  const container = figma.createFrame();
  container.name = 'Toggle';
  container.layoutMode = 'HORIZONTAL';
  container.primaryAxisAlignItems = 'CENTER';
  container.itemSpacing = 12;

  // Toggle track
  const track = figma.createFrame();
  track.resize(toggleSize.width, toggleSize.height);
  track.cornerRadius = toggleSize.height / 2;
  
  if (checked) {
    track.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
  } else {
    track.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[300]) }];
  }

  // Toggle thumb
  const thumb = figma.createEllipse();
  const thumbSize = toggleSize.height - 4;
  thumb.resize(thumbSize, thumbSize);
  thumb.y = 2;
  thumb.x = checked ? toggleSize.width - thumbSize - 2 : 2;
  thumb.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  thumb.effects = [
    createDropShadow({ r: 0, g: 0, b: 0, a: 0.15 }, { x: 0, y: 2 }, 4)
  ];
  
  track.appendChild(thumb);
  container.appendChild(track);

  // Label
  if (label) {
    const labelText = figma.createText();
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    labelText.characters = label;
    labelText.fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;
    labelText.fontName = { family: "Inter", style: "Regular" };
    labelText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
    container.appendChild(labelText);
  }

  return container;
};

// Slider Component
export const createSlider = async (properties: any = {}) => {
  const {
    min = 0,
    max = 100,
    value = 50,
    label = 'Slider',
    showValue = true,
    width = 280,
    variant = 'primary'
  } = properties;

  const container = figma.createFrame();
  container.name = 'Slider';
  container.layoutMode = 'VERTICAL';
  container.itemSpacing = 12;
  container.resize(width, 60);

  // Label and value
  const header = figma.createFrame();
  header.layoutMode = 'HORIZONTAL';
  header.counterAxisAlignItems = 'CENTER';
  header.layoutSizingHorizontal = 'FILL';

  const labelText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  labelText.characters = label;
  labelText.fontSize = 14;
  labelText.fontName = { family: "Inter", style: "Medium" };
  labelText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
  labelText.layoutGrow = 1;
  header.appendChild(labelText);

  if (showValue) {
    const valueText = figma.createText();
    valueText.characters = value.toString();
    valueText.fontSize = 14;
    valueText.fontName = { family: "Inter", style: "Medium" };
    valueText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
    header.appendChild(valueText);
  }

  container.appendChild(header);

  // Slider track
  const trackContainer = figma.createFrame();
  trackContainer.resize(width, 8);
  trackContainer.layoutMode = 'HORIZONTAL';

  const track = figma.createFrame();
  track.resize(width, 4);
  track.y = 2;
  track.cornerRadius = 2;
  track.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[200]) }];

  // Progress fill
  const progress = figma.createFrame();
  const progressWidth = (value - min) / (max - min) * width;
  progress.resize(progressWidth, 4);
  progress.cornerRadius = 2;
  progress.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
  track.appendChild(progress);

  // Thumb
  const thumb = figma.createEllipse();
  thumb.resize(16, 16);
  thumb.x = progressWidth - 8;
  thumb.y = -6;
  thumb.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.primary[600]) }];
  thumb.effects = [
    createDropShadow({ r: 0, g: 0, b: 0, a: 0.2 }, { x: 0, y: 2 }, 6)
  ];
  track.appendChild(thumb);

  trackContainer.appendChild(track);
  container.appendChild(trackContainer);

  return container;
};

// Textarea Component
export const createTextarea = async (properties: any = {}) => {
  const {
    placeholder = 'Enter your message...',
    label = 'Message',
    rows = 4,
    variant = 'outlined',
    width = 320
  } = properties;

  const container = figma.createFrame();
  container.name = `Textarea/${variant}`;
  container.layoutMode = 'VERTICAL';
  container.itemSpacing = 8;

  // Label
  const labelText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Medium" });
  labelText.characters = label;
  labelText.fontSize = 14;
  labelText.fontName = { family: "Inter", style: "Medium" };
  labelText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[700]) }];
  container.appendChild(labelText);

  // Textarea field
  const textarea = figma.createFrame();
  textarea.resize(width, rows * 24 + 24);
  textarea.paddingLeft = 16;
  textarea.paddingRight = 16;
  textarea.paddingTop = 16;
  textarea.paddingBottom = 16;
  textarea.cornerRadius = getRadius('base');

  // Apply variant styles
  switch (variant) {
    case 'outlined':
      textarea.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
      textarea.strokes = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[300]) }];
      textarea.strokeWeight = 1;
      break;
    case 'filled':
      textarea.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[100]) }];
      break;
  }

  // Placeholder text
  const placeholderText = figma.createText();
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  placeholderText.characters = placeholder;
  placeholderText.fontSize = 16;
  placeholderText.fontName = { family: "Inter", style: "Regular" };
  placeholderText.fills = [{ type: 'SOLID', color: hexToRgb(designTokens.colors.neutral[400]) }];
  placeholderText.layoutSizingHorizontal = 'FILL';
  placeholderText.layoutSizingVertical = 'FILL';
  textarea.appendChild(placeholderText);

  container.appendChild(textarea);

  return container;
};

// Export form components
export const formComponents = {
  select: createSelect,
  checkbox: createCheckbox,
  radio: createRadioButton,
  toggle: createToggle,
  slider: createSlider,
  textarea: createTextarea
};