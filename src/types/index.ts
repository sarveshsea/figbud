// Figma Widget API types
export interface FigmaUser {
  id: string;
  name: string;
  photoUrl?: string;
}

// Link Preview types
export interface ParsedLink {
  url: string;
  originalText: string;
  domain: string;
  protocol: string;
  path: string;
}

export interface LinkSegment {
  type: 'text' | 'link';
  content: string;
  linkData?: ParsedLink;
}

export interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

// Authentication types
export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: UserProfile;
  message?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  figmaUserId?: string;
  subscription: {
    tier: 'free' | 'premium';
    status: string;
  };
  preferences: UserPreferences;
}

export interface UserPreferences {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  designStyle: 'minimal' | 'modern' | 'playful' | 'professional';
  commonUseCases: string[];
  preferredTutorialLength: 'short' | 'medium' | 'long' | 'any';
  notifications: {
    email: boolean;
    inApp: boolean;
    weekly: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

// Widget state types
export interface WidgetState {
  isVisible: boolean;
  isAuthenticated: boolean;
  user: UserProfile | null;
  currentView: 'chat' | 'onboarding' | 'settings' | 'premium' | 'sandbox';
  onboardingStep: number;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  playgroundActive?: boolean;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  metadata?: {
    tutorials?: TutorialResult[];
    demos?: DemoResult[];
    guidance?: GuidanceStep[];
    action?: string;
    componentType?: string;
    teacherNote?: string;
    model?: string;
    isFree?: boolean;
    stepByStep?: string[];
    attempts?: { model: string; success: boolean; error?: string }[];
    intent?: {
      action: string | null;
      componentTypes: string[];
      keywords: string[];
      tutorialRequests: string[];
      isQuestion: boolean;
      needsGuidance: boolean;
      confidence: number;
    };
    components?: ComponentResult[];
    actionableSteps?: ActionableStep[];
  };
}

export interface ComponentResult {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  thumbnail_url?: string;
  usage_count: number;
  onceUIMapping?: any;
}

export interface ActionableStep {
  step: number;
  action: string;
  description: string;
}

// API response types
export interface TutorialResult {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: string; // Changed to string for formatted duration
  channelTitle: string;
  url: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  relevanceScore?: number;
  timestamps?: TutorialTimestamp[];
  views?: number;
}

export interface TutorialTimestamp {
  time: string; // Changed to string for formatted time
  seconds?: number;
  title: string;
  topic?: string;
  url?: string;
}

export interface DemoResult {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  isPremium: boolean;
  figmaComponentKey: string;
}

export interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  target?: string;
  order: number;
}

// Figma context types
export interface FigmaContext {
  selectedNodes: SceneNode[];
  currentPage: string;
  canvasSize: { width: number; height: number };
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  currentTool?: string;
}

// API request types
export interface SearchRequest {
  query: string;
  context?: FigmaContext;
  skillLevel?: 'beginner' | 'intermediate' | 'advanced';
  maxResults?: number;
}

export interface CreateDemoRequest {
  prompt: string;
  context?: FigmaContext;
  style?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}

export interface GuidanceRequest {
  query: string;
  context: FigmaContext;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
}

// Widget events
export interface WidgetEvent {
  type: 'search' | 'create-demo' | 'guidance' | 'auth' | 'settings' | 'premium';
  payload: any;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Subscription types
export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    queries: number;
    demos: number;
    guidance: number;
  };
}

// Analytics types
export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties: Record<string, any>;
  timestamp: Date;
}