import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Public client for general use
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'figbud'
    }
  }
});

// Service role client for admin operations (only use server-side)
export const supabaseAdmin: SupabaseClient | null = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      }
    })
  : null;

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  if (error?.details) {
    return error.details;
  }
  return 'An unexpected error occurred';
}

// Database types (will be generated from Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password: string;
          figma_user_id: string | null;
          created_at: string;
          updated_at: string;
          is_email_verified: boolean;
          email_verification_token: string | null;
          password_reset_token: string | null;
          password_reset_expires: string | null;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: 'free' | 'premium';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          status: 'active' | 'canceled' | 'past_due' | 'unpaid';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_subscriptions']['Insert']>;
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          skill_level: 'beginner' | 'intermediate' | 'advanced';
          design_style: 'minimal' | 'modern' | 'playful' | 'professional';
          common_use_cases: string[] | null;
          preferred_tutorial_length: 'short' | 'medium' | 'long' | 'any';
          notifications_email: boolean;
          notifications_in_app: boolean;
          notifications_weekly: boolean;
          theme: 'light' | 'dark' | 'auto';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_preferences']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_preferences']['Insert']>;
      };
      user_analytics: {
        Row: {
          id: string;
          user_id: string;
          total_queries: number;
          tutorials_viewed: number;
          demos_created: number;
          last_active_at: string;
          feature_usage_tutorial_search: number;
          feature_usage_demo_creation: number;
          feature_usage_guidance: number;
          feature_usage_collaboration: number;
          completed_tutorials: string[] | null;
          skill_assessment_score: number | null;
          badges_earned: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_analytics']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_analytics']['Insert']>;
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          refresh_token: string;
          expires_at: string;
          created_at: string;
          last_accessed_at: string;
          user_agent: string | null;
          ip_address: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sessions']['Row'], 'id' | 'created_at' | 'last_accessed_at'>;
        Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
      };
      tutorials: {
        Row: {
          id: string;
          video_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          duration: number;
          channel_title: string | null;
          url: string;
          published_at: string | null;
          skill_level: 'beginner' | 'intermediate' | 'advanced' | null;
          tags: string[] | null;
          views: number;
          rating: number | null;
          cached: boolean;
          cache_expiry: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tutorials']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tutorials']['Insert']>;
      };
      tutorial_timestamps: {
        Row: {
          id: string;
          tutorial_id: string;
          time_seconds: number;
          description: string | null;
          topic: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tutorial_timestamps']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tutorial_timestamps']['Insert']>;
      };
      demo_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: 'ecommerce' | 'mobile-app' | 'website' | 'dashboard' | 'other' | null;
          skill_level: 'beginner' | 'intermediate' | 'advanced' | null;
          figma_component_key: string | null;
          thumbnail_url: string | null;
          tags: string[] | null;
          is_premium: boolean;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['demo_templates']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['demo_templates']['Insert']>;
      };
      chat_history: {
        Row: {
          id: string;
          user_id: string | null;
          message: string;
          response: string | null;
          context: any | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chat_history']['Insert']>;
      };
      once_ui_components: {
        Row: {
          id: string;
          name: string;
          category: string;
          component_type: string;
          description: string | null;
          figma_code: string;
          properties: any;
          usage_example: string | null;
          design_tokens: any;
          difficulty: string;
          tags: string[];
          preview_image_url: string | null;
          documentation_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['once_ui_components']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['once_ui_components']['Insert']>;
      };
      api_calls: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          method: string;
          request_body: any | null;
          response_status: number | null;
          response_body: any | null;
          provider: string | null;
          tokens_used: number;
          cost_cents: number;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['api_calls']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['api_calls']['Insert']>;
      };
      api_cache: {
        Row: {
          id: string;
          cache_key: string;
          response_data: any;
          provider: string | null;
          expires_at: string;
          hit_count: number;
          created_at: string;
          last_accessed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['api_cache']['Row'], 'id' | 'created_at' | 'last_accessed_at'>;
        Update: Partial<Database['public']['Tables']['api_cache']['Insert']>;
      };
      component_usage: {
        Row: {
          id: string;
          user_id: string;
          component_id: string;
          template_id: string | null;
          step_id: string | null;
          completed: boolean;
          figma_node_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['component_usage']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['component_usage']['Insert']>;
      };
    };
  };
}