import { supabase, supabaseAdmin } from '../config/supabase';

export interface UserPersonalization {
  personalize_enabled: boolean;
  inspirations: string | null;
  digest_info: string | null;
  write_style: string | null;
  language_preference: string;
  timezone: string;
}

export interface UserPreferences {
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  design_style: 'minimal' | 'modern' | 'playful' | 'professional';
  common_use_cases: string[];
  preferred_tutorial_length: 'short' | 'medium' | 'long' | 'any';
  notifications: {
    email: boolean;
    in_app: boolean;
    weekly: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
}

export interface UserFullContext {
  user_data: any;
  preferences: UserPreferences;
  personalization: UserPersonalization;
  current_session: any;
  recent_components: any[];
  learning_progress: any;
}

export class PreferenceService {
  /**
   * Get user's personalization settings
   */
  static async getUserPersonalization(userId: string): Promise<UserPersonalization | null> {
    try {
      const { data, error } = await supabase
        .from('user_personalization')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Return default if not found
      if (!data) {
        return {
          personalize_enabled: true,
          inspirations: null,
          digest_info: null,
          write_style: null,
          language_preference: 'en',
          timezone: 'UTC'
        };
      }

      return data;
    } catch (error) {
      console.error('Error getting user personalization:', error);
      return null;
    }
  }

  /**
   * Update user's personalization settings
   */
  static async updateUserPersonalization(
    userId: string,
    updates: Partial<UserPersonalization>
  ): Promise<boolean> {
    try {
      const client = supabaseAdmin || supabase;
      
      const { error } = await client
        .rpc('update_user_personalization', {
          p_user_id: userId,
          p_personalize_enabled: updates.personalize_enabled,
          p_inspirations: updates.inspirations,
          p_digest_info: updates.digest_info,
          p_write_style: updates.write_style,
          p_language_preference: updates.language_preference,
          p_timezone: updates.timezone
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating user personalization:', error);
      return false;
    }
  }

  /**
   * Get user's current preferences
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Return default if not found
      if (!data) {
        return {
          skill_level: 'beginner',
          design_style: 'modern',
          common_use_cases: [],
          preferred_tutorial_length: 'any',
          notifications: {
            email: true,
            in_app: true,
            weekly: true
          },
          theme: 'auto'
        };
      }

      return {
        skill_level: data.skill_level,
        design_style: data.design_style,
        common_use_cases: data.common_use_cases || [],
        preferred_tutorial_length: data.preferred_tutorial_length,
        notifications: data.notifications || {
          email: true,
          in_app: true,
          weekly: true
        },
        theme: data.theme
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences with versioning
   */
  static async updateUserPreferences(
    userId: string,
    updates: Partial<UserPreferences>
  ): Promise<number | null> {
    try {
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .rpc('update_user_preferences', {
          p_user_id: userId,
          p_skill_level: updates.skill_level,
          p_design_style: updates.design_style,
          p_common_use_cases: updates.common_use_cases,
          p_preferred_tutorial_length: updates.preferred_tutorial_length,
          p_notifications: updates.notifications,
          p_theme: updates.theme
        });

      if (error) throw error;
      return data; // Returns new version number
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }
  }

  /**
   * Get user's full context including preferences and personalization
   */
  static async getUserFullContext(userId: string): Promise<UserFullContext | null> {
    try {
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .rpc('get_user_with_context', {
          p_user_id: userId
        });

      if (error) throw error;
      
      // The function returns a single row with all data
      const result = data[0] || {};
      
      return {
        user_data: result.user_data || {},
        preferences: result.preferences || {},
        personalization: result.personalization || {},
        current_session: result.current_session || null,
        recent_components: result.recent_components || [],
        learning_progress: result.learning_progress || {}
      };
    } catch (error) {
      console.error('Error getting user full context:', error);
      return null;
    }
  }

  /**
   * Find users with similar preferences
   */
  static async findSimilarUsers(
    userId: string,
    limit: number = 10
  ): Promise<Array<{
    similar_user_id: string;
    similarity_score: number;
    common_attributes: any;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('find_similar_users', {
          p_user_id: userId,
          p_limit: limit
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get learning recommendations based on user profile
   */
  static async getLearningRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<Array<{
    tutorial_id: string;
    title: string;
    skill_level: string;
    relevance_score: number;
    reason: string;
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_learning_recommendations', {
          p_user_id: userId,
          p_limit: limit
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting learning recommendations:', error);
      return [];
    }
  }

  /**
   * Get preferences history for a user
   */
  static async getPreferencesHistory(
    userId: string,
    limit: number = 10
  ): Promise<UserPreferences[]> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .order('version', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(pref => ({
        skill_level: pref.skill_level,
        design_style: pref.design_style,
        common_use_cases: pref.common_use_cases || [],
        preferred_tutorial_length: pref.preferred_tutorial_length,
        notifications: pref.notifications || {
          email: true,
          in_app: true,
          weekly: true
        },
        theme: pref.theme
      }));
    } catch (error) {
      console.error('Error getting preferences history:', error);
      return [];
    }
  }

  /**
   * Build AI context from user preferences and personalization
   */
  static async buildAIContext(userId: string): Promise<any> {
    try {
      const context = await this.getUserFullContext(userId);
      if (!context) return {};

      const { preferences, personalization, learning_progress, recent_components } = context;

      // Build comprehensive context for AI
      return {
        user_profile: {
          skill_level: preferences.skill_level,
          design_style: preferences.design_style,
          learning_style: personalization.digest_info,
          inspirations: personalization.inspirations,
          write_style: personalization.write_style,
          language: personalization.language_preference
        },
        personalization_enabled: personalization.personalize_enabled,
        recent_activity: {
          components_used: recent_components.slice(0, 5).map((c: any) => c.type),
          tutorials_completed: learning_progress.tutorials_completed || 0,
          current_skill_progression: learning_progress.current_skill_level
        },
        preferences: {
          tutorial_length: preferences.preferred_tutorial_length,
          use_cases: preferences.common_use_cases
        },
        // Instructions for AI based on personalization
        ai_instructions: this.generateAIInstructions(personalization, preferences)
      };
    } catch (error) {
      console.error('Error building AI context:', error);
      return {};
    }
  }

  /**
   * Generate specific instructions for AI based on user's settings
   */
  private static generateAIInstructions(
    personalization: UserPersonalization,
    preferences: UserPreferences
  ): string[] {
    const instructions: string[] = [];

    if (!personalization.personalize_enabled) {
      return ['Provide general responses without personalization'];
    }

    // Add write style instructions
    if (personalization.write_style) {
      instructions.push(`Write responses in this style: ${personalization.write_style}`);
    }

    // Add digest preferences
    if (personalization.digest_info) {
      instructions.push(`Format information according to: ${personalization.digest_info}`);
    }

    // Add inspiration context
    if (personalization.inspirations) {
      instructions.push(`Consider these influences when suggesting designs: ${personalization.inspirations}`);
    }

    // Add skill level appropriate language
    switch (preferences.skill_level) {
      case 'beginner':
        instructions.push('Use simple, clear language and avoid technical jargon');
        break;
      case 'intermediate':
        instructions.push('Balance technical details with clarity');
        break;
      case 'advanced':
        instructions.push('Feel free to use technical terms and advanced concepts');
        break;
    }

    // Add design style guidance
    instructions.push(`Align suggestions with ${preferences.design_style} design style`);

    // Add language preference
    if (personalization.language_preference !== 'en') {
      instructions.push(`Respond in ${personalization.language_preference} when possible`);
    }

    return instructions;
  }

  /**
   * Merge anonymous session preferences when user signs up
   */
  static async mergeAnonymousPreferences(
    anonymousSessionId: string,
    userId: string
  ): Promise<boolean> {
    try {
      // This would be implemented based on how anonymous preferences are stored
      // For now, just ensure user has default preferences
      const existing = await this.getUserPreferences(userId);
      
      if (!existing) {
        // Create default preferences
        await this.updateUserPreferences(userId, {
          skill_level: 'beginner',
          design_style: 'modern',
          common_use_cases: [],
          preferred_tutorial_length: 'any',
          notifications: {
            email: true,
            in_app: true,
            weekly: true
          },
          theme: 'auto'
        });
      }

      return true;
    } catch (error) {
      console.error('Error merging anonymous preferences:', error);
      return false;
    }
  }
}