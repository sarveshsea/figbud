import { supabase, supabaseAdmin, handleSupabaseError, Database } from '../config/supabase';
import { DatabaseInterface } from '../config/databaseConfig';
import * as bcrypt from 'bcryptjs';

type UserRow = Database['public']['Tables']['users']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type TutorialRow = Database['public']['Tables']['tutorials']['Row'];
type DemoTemplateRow = Database['public']['Tables']['demo_templates']['Row'];

export const SupabaseDatabase: DatabaseInterface = {
  // User operations
  async findUserById(id: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          *,
          user_subscriptions (*),
          user_preferences (*),
          user_analytics (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!user) return null;

      // Transform to match existing structure
      return {
        id: user.id,
        email: user.email,
        password: user.password,
        figmaUserId: user.figma_user_id,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
        isEmailVerified: user.is_email_verified,
        emailVerificationToken: user.email_verification_token,
        passwordResetToken: user.password_reset_token,
        passwordResetExpires: user.password_reset_expires ? new Date(user.password_reset_expires) : null,
        subscription: user.user_subscriptions?.[0] ? {
          tier: user.user_subscriptions[0].tier,
          currentPeriodStart: user.user_subscriptions[0].current_period_start ? new Date(user.user_subscriptions[0].current_period_start) : null,
          currentPeriodEnd: user.user_subscriptions[0].current_period_end ? new Date(user.user_subscriptions[0].current_period_end) : null,
          cancelAtPeriodEnd: user.user_subscriptions[0].cancel_at_period_end,
          status: user.user_subscriptions[0].status
        } : {
          tier: 'free',
          status: 'active'
        },
        preferences: user.user_preferences?.[0] ? {
          skillLevel: user.user_preferences[0].skill_level,
          designStyle: user.user_preferences[0].design_style,
          commonUseCases: user.user_preferences[0].common_use_cases || [],
          preferredTutorialLength: user.user_preferences[0].preferred_tutorial_length,
          notifications: {
            email: user.user_preferences[0].notifications_email,
            inApp: user.user_preferences[0].notifications_in_app,
            weeklyDigest: user.user_preferences[0].notifications_weekly
          },
          theme: user.user_preferences[0].theme
        } : {
          skillLevel: 'beginner',
          designStyle: 'modern',
          commonUseCases: [],
          preferredTutorialLength: 'any',
          notifications: {
            email: true,
            inApp: true,
            weeklyDigest: false
          },
          theme: 'dark'
        },
        analytics: user.user_analytics?.[0] ? {
          totalQueries: user.user_analytics[0].total_queries,
          tutorialsViewed: user.user_analytics[0].tutorials_viewed,
          demosCreated: user.user_analytics[0].demos_created,
          lastActiveAt: new Date(user.user_analytics[0].last_active_at),
          featureUsage: {
            tutorialSearch: user.user_analytics[0].feature_usage_tutorial_search,
            demoCreation: user.user_analytics[0].feature_usage_demo_creation,
            guidance: user.user_analytics[0].feature_usage_guidance,
            collaboration: user.user_analytics[0].feature_usage_collaboration
          },
          completedTutorials: user.user_analytics[0].completed_tutorials || [],
          skillAssessmentScore: user.user_analytics[0].skill_assessment_score,
          badgesEarned: user.user_analytics[0].badges_earned || []
        } : {
          totalQueries: 0,
          tutorialsViewed: 0,
          demosCreated: 0,
          lastActiveAt: new Date(),
          featureUsage: {
            tutorialSearch: 0,
            demoCreation: 0,
            guidance: 0,
            collaboration: 0
          },
          completedTutorials: [],
          skillAssessmentScore: null,
          badgesEarned: []
        }
      };
    } catch (error) {
      console.error('Error finding user by ID:', handleSupabaseError(error));
      return null;
    }
  },

  async findUserByEmail(email: string): Promise<any> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          *,
          user_subscriptions (*),
          user_preferences (*),
          user_analytics (*)
        `)
        .eq('email', email)
        .single();

      if (error) throw error;
      if (!user) return null;

      // Use the same transformation as findUserById
      return this.findUserById(user.id);
    } catch (error) {
      console.error('Error finding user by email:', handleSupabaseError(error));
      return null;
    }
  },

  async createUser(userData: any): Promise<any> {
    try {
      // Hash password if provided
      const hashedPassword = userData.password ? await bcrypt.hash(userData.password, 10) : userData.password;

      // Create user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password: hashedPassword,
          figma_user_id: userData.figmaUserId,
          is_email_verified: userData.isEmailVerified || false,
          email_verification_token: userData.emailVerificationToken
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create related records
      const userId = user.id;

      // Create subscription
      const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: userData.subscription?.tier || 'free',
          status: userData.subscription?.status || 'active'
        });

      if (subError) console.error('Error creating subscription:', subError);

      // Create preferences
      const { error: prefError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          skill_level: userData.preferences?.skillLevel || 'beginner',
          design_style: userData.preferences?.designStyle || 'modern',
          theme: userData.preferences?.theme || 'dark'
        });

      if (prefError) console.error('Error creating preferences:', prefError);

      // Create analytics
      const { error: analyticsError } = await supabase
        .from('user_analytics')
        .insert({
          user_id: userId
        });

      if (analyticsError) console.error('Error creating analytics:', analyticsError);

      return this.findUserById(userId);
    } catch (error) {
      console.error('Error creating user:', handleSupabaseError(error));
      throw error;
    }
  },

  async updateUser(id: string, updates: any): Promise<any> {
    try {
      // Update main user record if needed
      if (updates.email || updates.password || updates.isEmailVerified !== undefined) {
        const userUpdates: any = {};
        if (updates.email) userUpdates.email = updates.email;
        if (updates.password) userUpdates.password = await bcrypt.hash(updates.password, 10);
        if (updates.isEmailVerified !== undefined) userUpdates.is_email_verified = updates.isEmailVerified;

        const { error } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', id);

        if (error) throw error;
      }

      // Update subscription if needed
      if (updates.subscription) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({
            tier: updates.subscription.tier,
            status: updates.subscription.status
          })
          .eq('user_id', id);

        if (error) console.error('Error updating subscription:', error);
      }

      // Update preferences if needed
      if (updates.preferences) {
        const { error } = await supabase
          .from('user_preferences')
          .update({
            skill_level: updates.preferences.skillLevel,
            design_style: updates.preferences.designStyle,
            theme: updates.preferences.theme,
            notifications_email: updates.preferences.notifications?.email,
            notifications_in_app: updates.preferences.notifications?.inApp,
            notifications_weekly: updates.preferences.notifications?.weeklyDigest
          })
          .eq('user_id', id);

        if (error) console.error('Error updating preferences:', error);
      }

      // Update analytics if needed
      if (updates.analytics) {
        const { error } = await supabase
          .from('user_analytics')
          .update({
            total_queries: updates.analytics.totalQueries,
            tutorials_viewed: updates.analytics.tutorialsViewed,
            demos_created: updates.analytics.demosCreated,
            last_active_at: new Date().toISOString(),
            feature_usage_tutorial_search: updates.analytics.featureUsage?.tutorialSearch,
            feature_usage_demo_creation: updates.analytics.featureUsage?.demoCreation,
            feature_usage_guidance: updates.analytics.featureUsage?.guidance,
            feature_usage_collaboration: updates.analytics.featureUsage?.collaboration
          })
          .eq('user_id', id);

        if (error) console.error('Error updating analytics:', error);
      }

      return this.findUserById(id);
    } catch (error) {
      console.error('Error updating user:', handleSupabaseError(error));
      throw error;
    }
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', handleSupabaseError(error));
      return false;
    }
  },

  // Session operations
  async createSession(sessionData: any): Promise<any> {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .insert({
          user_id: sessionData.userId,
          token: sessionData.token,
          refresh_token: sessionData.refreshToken,
          expires_at: sessionData.expiresAt.toISOString(),
          user_agent: sessionData.userAgent,
          ip_address: sessionData.ipAddress
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: session.id,
        userId: session.user_id,
        token: session.token,
        refreshToken: session.refresh_token,
        expiresAt: new Date(session.expires_at),
        createdAt: new Date(session.created_at),
        lastAccessedAt: new Date(session.last_accessed_at),
        userAgent: session.user_agent,
        ipAddress: session.ip_address
      };
    } catch (error) {
      console.error('Error creating session:', handleSupabaseError(error));
      throw error;
    }
  },

  async findSessionByToken(token: string): Promise<any> {
    try {
      const { data: session, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('token', token)
        .single();

      if (error) throw error;
      if (!session) return null;

      // Update last accessed timestamp
      await supabase
        .from('sessions')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', session.id);

      return {
        id: session.id,
        userId: session.user_id,
        token: session.token,
        refreshToken: session.refresh_token,
        expiresAt: new Date(session.expires_at),
        createdAt: new Date(session.created_at),
        lastAccessedAt: new Date(session.last_accessed_at),
        userAgent: session.user_agent,
        ipAddress: session.ip_address
      };
    } catch (error) {
      console.error('Error finding session by token:', handleSupabaseError(error));
      return null;
    }
  },

  async deleteSession(token: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('token', token);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting session:', handleSupabaseError(error));
      return false;
    }
  },

  async cleanExpiredSessions(): Promise<void> {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
    } catch (error) {
      console.error('Error cleaning expired sessions:', handleSupabaseError(error));
    }
  },

  // Tutorial operations
  async cacheTutorial(tutorial: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('tutorials')
        .upsert({
          video_id: tutorial.videoId,
          title: tutorial.title,
          description: tutorial.description,
          thumbnail_url: tutorial.thumbnailUrl,
          duration: tutorial.duration,
          channel_title: tutorial.channelTitle,
          url: tutorial.url,
          published_at: tutorial.publishedAt?.toISOString(),
          skill_level: tutorial.skillLevel,
          tags: tutorial.tags,
          views: tutorial.views,
          rating: tutorial.rating,
          cached: true,
          cache_expiry: tutorial.cacheExpiry?.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Add timestamps if provided
      if (tutorial.timestamps && tutorial.timestamps.length > 0) {
        const timestamps = tutorial.timestamps.map((ts: any) => ({
          tutorial_id: data.id,
          time_seconds: ts.time,
          description: ts.description,
          topic: ts.topic
        }));

        await supabase
          .from('tutorial_timestamps')
          .insert(timestamps);
      }

      return tutorial;
    } catch (error) {
      console.error('Error caching tutorial:', handleSupabaseError(error));
      throw error;
    }
  },

  async findCachedTutorials(query: string): Promise<any[]> {
    try {
      const { data: tutorials, error } = await supabase
        .from('tutorials')
        .select(`
          *,
          tutorial_timestamps (*)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .eq('cached', true)
        .gte('cache_expiry', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return tutorials.map(tutorial => ({
        id: tutorial.id,
        videoId: tutorial.video_id,
        title: tutorial.title,
        description: tutorial.description,
        thumbnailUrl: tutorial.thumbnail_url,
        duration: tutorial.duration,
        channelTitle: tutorial.channel_title,
        url: tutorial.url,
        skillLevel: tutorial.skill_level,
        relevanceScore: 0.9, // Calculate based on match
        publishedAt: tutorial.published_at ? new Date(tutorial.published_at) : null,
        tags: tutorial.tags || [],
        views: tutorial.views,
        timestamps: tutorial.tutorial_timestamps?.map((ts: any) => ({
          time: ts.time_seconds,
          description: ts.description,
          topic: ts.topic,
          url: `${tutorial.url}&t=${ts.time_seconds}s`
        })) || []
      }));
    } catch (error) {
      console.error('Error finding cached tutorials:', handleSupabaseError(error));
      return [];
    }
  },

  // Template operations
  async findTemplatesByCategory(category: string): Promise<any[]> {
    try {
      const { data: templates, error } = await supabase
        .from('demo_templates')
        .select('*')
        .eq('category', category)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        skillLevel: template.skill_level,
        figmaComponentKey: template.figma_component_key,
        thumbnailUrl: template.thumbnail_url,
        tags: template.tags || [],
        isPremium: template.is_premium,
        usageCount: template.usage_count
      }));
    } catch (error) {
      console.error('Error finding templates by category:', handleSupabaseError(error));
      return [];
    }
  },

  async incrementTemplateUsage(id: string): Promise<void> {
    try {
      const { data: template, error: fetchError } = await supabase
        .from('demo_templates')
        .select('usage_count')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('demo_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', id);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error incrementing template usage:', handleSupabaseError(error));
    }
  }
};