// Design Tokens System - Professional design system foundation
// Inspired by top design systems: Material Design, Fluent UI, Carbon, Ant Design

export const designTokens = {
  // Color System - Modern, accessible, and versatile
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1', // Main brand color
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
      950: '#1E1B4B'
    },
    
    // Accent Colors - For highlights and CTAs
    accent: {
      50: '#FFF1F2',
      100: '#FFE4E6',
      200: '#FECDD3',
      300: '#FDA4AF',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#E11D48',
      700: '#BE123C',
      800: '#9F1239',
      900: '#881337'
    },
    
    // Neutral Colors - UI foundations
    neutral: {
      50: '#FAFAFA',
      100: '#F4F4F5',
      200: '#E4E4E7',
      300: '#D4D4D8',
      400: '#A1A1AA',
      500: '#71717A',
      600: '#52525B',
      700: '#3F3F46',
      800: '#27272A',
      900: '#18181B',
      950: '#09090B'
    },
    
    // Semantic Colors
    success: {
      light: '#4ADE80',
      main: '#22C55E',
      dark: '#16A34A',
      contrast: '#FFFFFF'
    },
    warning: {
      light: '#FCD34D',
      main: '#F59E0B',
      dark: '#D97706',
      contrast: '#FFFFFF'
    },
    error: {
      light: '#F87171',
      main: '#EF4444',
      dark: '#DC2626',
      contrast: '#FFFFFF'
    },
    info: {
      light: '#60A5FA',
      main: '#3B82F6',
      dark: '#2563EB',
      contrast: '#FFFFFF'
    },
    
    // Special Effects
    gradient: {
      primary: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      accent: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
      sunset: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)',
      ocean: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
      fire: 'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
      aurora: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)'
    },
    
    // Glassmorphism
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.2)',
      heavy: 'rgba(255, 255, 255, 0.3)',
      dark: 'rgba(0, 0, 0, 0.1)'
    }
  },
  
  // Typography System
  typography: {
    // Font Families
    fontFamily: {
      sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'JetBrains Mono, Consolas, Monaco, "Courier New", monospace',
      display: 'Sora, Inter, -apple-system, sans-serif'
    },
    
    // Font Sizes - Fluid scale
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 60,
      '7xl': 72,
      '8xl': 96,
      '9xl': 128
    },
    
    // Font Weights
    fontWeight: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900
    },
    
    // Line Heights
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2
    },
    
    // Letter Spacing
    letterSpacing: {
      tighter: -0.05,
      tight: -0.025,
      normal: 0,
      wide: 0.025,
      wider: 0.05,
      widest: 0.1
    }
  },
  
  // Spacing System - 8px grid
  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
    44: 176,
    48: 192,
    52: 208,
    56: 224,
    60: 240,
    64: 256
  },
  
  // Border Radius
  radius: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999
  },
  
  // Shadows - Elevation system
  shadows: {
    none: 'none',
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    // Colored shadows for modern effect
    primary: '0 20px 25px -5px rgba(99, 102, 241, 0.35)',
    accent: '0 20px 25px -5px rgba(244, 63, 94, 0.35)',
    success: '0 20px 25px -5px rgba(34, 197, 94, 0.35)',
    // Neumorphic shadows
    neumorphic: {
      flat: '5px 5px 10px #D1D5DB, -5px -5px 10px #FFFFFF',
      concave: 'inset 5px 5px 10px #D1D5DB, inset -5px -5px 10px #FFFFFF',
      convex: '10px 10px 20px #D1D5DB, -10px -10px 20px #FFFFFF',
      pressed: 'inset 2px 2px 5px #D1D5DB, inset -2px -2px 5px #FFFFFF'
    }
  },
  
  // Blur values for glassmorphism
  blur: {
    none: 0,
    sm: 4,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 40,
    '3xl': 64
  },
  
  // Animation durations
  duration: {
    fast: 150,
    base: 300,
    slow: 500,
    slower: 700
  },
  
  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600
  }
};

// Helper functions to apply tokens
export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getSpacing = (size: number): number => {
  return designTokens.spacing[size as keyof typeof designTokens.spacing] || size * 4;
};

export const getShadow = (type: string): string => {
  const shadow = designTokens.shadows[type as keyof typeof designTokens.shadows];
  if (typeof shadow === 'string') {
    return shadow;
  }
  return designTokens.shadows.base;
};

export const getRadius = (size: string): number => {
  return designTokens.radius[size as keyof typeof designTokens.radius] || designTokens.radius.base;
};

// Figma color converter
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  if (!hex) return { r: 0, g: 0, b: 0 };
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result && result[1] && result[2] && result[3] ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
};

// Modern effect generators
export const createGlassmorphism = () => ({
  fills: [{ type: 'SOLID', color: hexToRgb('#FFFFFF'), opacity: 0.1 }],
  effects: [
    { type: 'BACKGROUND_BLUR', radius: 16, visible: true } as Effect,
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 8, visible: true, blendMode: 'NORMAL' } as DropShadowEffect
  ]
});

export const createNeumorphism = (isPressed = false) => ({
  fills: [{ type: 'SOLID', color: hexToRgb('#F3F4F6') }],
  effects: isPressed ? [
    { type: 'INNER_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.15 }, offset: { x: 2, y: 2 }, radius: 5, visible: true, blendMode: 'NORMAL' } as InnerShadowEffect,
    { type: 'INNER_SHADOW', color: { r: 1, g: 1, b: 1, a: 0.7 }, offset: { x: -2, y: -2 }, radius: 5, visible: true, blendMode: 'NORMAL' } as InnerShadowEffect
  ] : [
    { type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 10, y: 10 }, radius: 20, visible: true, blendMode: 'NORMAL' } as DropShadowEffect,
    { type: 'DROP_SHADOW', color: { r: 1, g: 1, b: 1, a: 0.7 }, offset: { x: -10, y: -10 }, radius: 20, visible: true, blendMode: 'NORMAL' } as DropShadowEffect
  ]
});

// Helper to create drop shadow effect
export const createDropShadow = (color: RGBA, offset: { x: number; y: number }, radius: number, spread = 0): DropShadowEffect => ({
  type: 'DROP_SHADOW',
  color,
  offset,
  radius,
  spread,
  visible: true,
  blendMode: 'NORMAL'
});

// Helper to create gradient fill
export const createGradientFill = (colors: RGB[], positions: number[] = [0, 1]): GradientPaint => ({
  type: 'GRADIENT_LINEAR',
  gradientTransform: [[1, 0, 0], [0, 1, 0]],
  gradientStops: colors.map((color, i) => ({
    position: positions[i] || i / (colors.length - 1),
    color: { ...color, a: 1 }
  }))
});