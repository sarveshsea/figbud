export interface User {
  id: string;
  email: string;
  password: string; // hashed
  figmaUserId?: string;
  createdAt: Date;
  updatedAt: Date;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  subscription: UserSubscription;
  preferences: UserPreferences;
  analytics: UserAnalytics;
}

export interface UserSubscription {
  tier: 'free' | 'premium';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
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

export interface UserAnalytics {
  totalQueries: number;
  tutorialsViewed: number;
  demosCreated: number;
  lastActiveAt: Date;
  featureUsage: {
    tutorialSearch: number;
    demoCreation: number;
    guidance: number;
    collaboration: number;
  };
  learningProgress: {
    completedTutorials: string[];
    skillAssessmentScore?: number;
    badgesEarned: string[];
  };
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface Tutorial {
  id: string;
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number;
  channelTitle: string;
  url: string;
  publishedAt: Date;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  timestamps: TutorialTimestamp[];
  rating?: number;
  views: number;
  cached: boolean;
  cacheExpiry: Date;
}

export interface TutorialTimestamp {
  time: number; // seconds
  description: string;
  topic: string;
  url?: string;
}

export interface DemoTemplate {
  id: string;
  name: string;
  description: string;
  category: 'ecommerce' | 'mobile-app' | 'website' | 'dashboard' | 'other';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  figmaComponentKey: string;
  thumbnailUrl: string;
  tags: string[];
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}