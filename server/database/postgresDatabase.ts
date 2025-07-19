import { query, transaction } from './postgres';
import { User, Session, Tutorial, DemoTemplate, UserSubscription, UserPreferences, UserAnalytics } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

export class PostgresDatabase {
  // User operations
  static async findUserById(id: string): Promise<User | null> {
    const result = await query(`
      SELECT u.*, 
        s.tier, s.stripe_customer_id, s.stripe_subscription_id, 
        s.current_period_start, s.current_period_end, 
        s.cancel_at_period_end, s.status as subscription_status,
        p.skill_level, p.design_style, p.common_use_cases,
        p.preferred_tutorial_length, p.notifications_email,
        p.notifications_in_app, p.notifications_weekly, p.theme,
        a.total_queries, a.tutorials_viewed, a.demos_created,
        a.last_active_at, a.feature_usage_tutorial_search,
        a.feature_usage_demo_creation, a.feature_usage_guidance,
        a.feature_usage_collaboration, a.completed_tutorials,
        a.skill_assessment_score, a.badges_earned
      FROM users u
      LEFT JOIN user_subscriptions s ON u.id = s.user_id
      LEFT JOIN user_preferences p ON u.id = p.user_id
      LEFT JOIN user_analytics a ON u.id = a.user_id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  static async findUserByEmail(email: string): Promise<User | null> {
    const result = await query(`
      SELECT u.*, 
        s.tier, s.stripe_customer_id, s.stripe_subscription_id, 
        s.current_period_start, s.current_period_end, 
        s.cancel_at_period_end, s.status as subscription_status,
        p.skill_level, p.design_style, p.common_use_cases,
        p.preferred_tutorial_length, p.notifications_email,
        p.notifications_in_app, p.notifications_weekly, p.theme,
        a.total_queries, a.tutorials_viewed, a.demos_created,
        a.last_active_at, a.feature_usage_tutorial_search,
        a.feature_usage_demo_creation, a.feature_usage_guidance,
        a.feature_usage_collaboration, a.completed_tutorials,
        a.skill_assessment_score, a.badges_earned
      FROM users u
      LEFT JOIN user_subscriptions s ON u.id = s.user_id
      LEFT JOIN user_preferences p ON u.id = p.user_id
      LEFT JOIN user_analytics a ON u.id = a.user_id
      WHERE u.email = $1
    `, [email]);

    if (result.rows.length === 0) return null;
    return this.mapRowToUser(result.rows[0]);
  }

  static async createUser(user: User): Promise<User> {
    return transaction(async (client) => {
      // Create user
      const userResult = await client.query(`
        INSERT INTO users (email, password, figma_user_id, is_email_verified, 
          email_verification_token, password_reset_token, password_reset_expires)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        user.email,
        user.password,
        user.figmaUserId,
        user.isEmailVerified,
        user.emailVerificationToken,
        user.passwordResetToken,
        user.passwordResetExpires
      ]);

      const userId = userResult.rows[0].id;

      // Create subscription
      await client.query(`
        INSERT INTO user_subscriptions (user_id, tier, status)
        VALUES ($1, $2, $3)
      `, [userId, user.subscription.tier, user.subscription.status]);

      // Create preferences
      await client.query(`
        INSERT INTO user_preferences (user_id, skill_level, design_style, 
          common_use_cases, preferred_tutorial_length, notifications_email,
          notifications_in_app, notifications_weekly, theme)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        userId,
        user.preferences.skillLevel,
        user.preferences.designStyle,
        user.preferences.commonUseCases,
        user.preferences.preferredTutorialLength,
        user.preferences.notifications.email,
        user.preferences.notifications.inApp,
        user.preferences.notifications.weekly,
        user.preferences.theme
      ]);

      // Create analytics
      await client.query(`
        INSERT INTO user_analytics (user_id, total_queries, tutorials_viewed,
          demos_created, feature_usage_tutorial_search, feature_usage_demo_creation,
          feature_usage_guidance, feature_usage_collaboration, completed_tutorials,
          skill_assessment_score, badges_earned)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        userId,
        user.analytics.totalQueries,
        user.analytics.tutorialsViewed,
        user.analytics.demosCreated,
        user.analytics.featureUsage.tutorialSearch,
        user.analytics.featureUsage.demoCreation,
        user.analytics.featureUsage.guidance,
        user.analytics.featureUsage.collaboration,
        user.analytics.learningProgress.completedTutorials,
        user.analytics.learningProgress.skillAssessmentScore,
        user.analytics.learningProgress.badgesEarned
      ]);

      const createdUser = await this.findUserById(userId);
      return createdUser!; // We know it exists since we just created it
    });
  }

  static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    // Build dynamic update query based on what's being updated
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.email) {
      updateFields.push(`email = $${paramIndex++}`);
      values.push(updates.email);
    }
    if (updates.password) {
      updateFields.push(`password = $${paramIndex++}`);
      values.push(updates.password);
    }
    if (updates.isEmailVerified !== undefined) {
      updateFields.push(`is_email_verified = $${paramIndex++}`);
      values.push(updates.isEmailVerified);
    }

    if (updateFields.length > 0) {
      values.push(id);
      await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
      `, values);
    }

    // Update related tables if needed
    if (updates.analytics) {
      await this.updateUserAnalytics(id, updates.analytics);
    }
    if (updates.preferences) {
      await this.updateUserPreferences(id, updates.preferences);
    }
    if (updates.subscription) {
      await this.updateUserSubscription(id, updates.subscription);
    }

    return this.findUserById(id);
  }

  static async deleteUser(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  // Session operations
  static async createSession(session: Session): Promise<Session> {
    const result = await query(`
      INSERT INTO sessions (user_id, token, refresh_token, expires_at, 
        user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      session.userId,
      session.token,
      session.refreshToken,
      session.expiresAt,
      session.userAgent,
      session.ipAddress
    ]);

    return this.mapRowToSession(result.rows[0]);
  }

  static async findSessionByToken(token: string): Promise<Session | null> {
    const result = await query(`
      SELECT * FROM sessions 
      WHERE token = $1 AND expires_at > NOW()
    `, [token]);

    if (result.rows.length === 0) return null;
    
    // Update last accessed time
    await query(`
      UPDATE sessions 
      SET last_accessed_at = NOW() 
      WHERE token = $1
    `, [token]);

    return this.mapRowToSession(result.rows[0]);
  }

  static async deleteSession(token: string): Promise<boolean> {
    const result = await query('DELETE FROM sessions WHERE token = $1', [token]);
    return (result.rowCount ?? 0) > 0;
  }

  static async cleanExpiredSessions(): Promise<void> {
    await query('DELETE FROM sessions WHERE expires_at < NOW()');
  }

  // Tutorial operations
  static async cacheTutorial(tutorial: Tutorial): Promise<Tutorial> {
    const result = await query(`
      INSERT INTO tutorials (video_id, title, description, thumbnail_url,
        duration, channel_title, url, published_at, skill_level, tags,
        views, rating, cached, cache_expiry)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (video_id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        thumbnail_url = EXCLUDED.thumbnail_url,
        duration = EXCLUDED.duration,
        views = EXCLUDED.views,
        rating = EXCLUDED.rating,
        cache_expiry = EXCLUDED.cache_expiry
      RETURNING *
    `, [
      tutorial.videoId,
      tutorial.title,
      tutorial.description,
      tutorial.thumbnailUrl,
      tutorial.duration,
      tutorial.channelTitle,
      tutorial.url,
      tutorial.publishedAt,
      tutorial.skillLevel,
      tutorial.tags,
      tutorial.views,
      tutorial.rating,
      tutorial.cached,
      tutorial.cacheExpiry
    ]);

    // Add timestamps if provided
    if (tutorial.timestamps && tutorial.timestamps.length > 0) {
      const tutorialId = result.rows[0].id;
      for (const timestamp of tutorial.timestamps) {
        await query(`
          INSERT INTO tutorial_timestamps (tutorial_id, time_seconds, 
            description, topic)
          VALUES ($1, $2, $3, $4)
        `, [
          tutorialId,
          timestamp.time,
          timestamp.description,
          timestamp.topic
        ]);
      }
    }

    return this.mapRowToTutorial(result.rows[0]);
  }

  static async findCachedTutorials(searchQuery: string): Promise<Tutorial[]> {
    const result = await query(`
      SELECT t.*, array_agg(
        json_build_object(
          'time', ts.time_seconds,
          'description', ts.description,
          'topic', ts.topic
        ) ORDER BY ts.time_seconds
      ) FILTER (WHERE ts.id IS NOT NULL) as timestamps
      FROM tutorials t
      LEFT JOIN tutorial_timestamps ts ON t.id = ts.tutorial_id
      WHERE t.cache_expiry > NOW()
        AND (
          t.title ILIKE $1
          OR t.description ILIKE $1
          OR $2 = ANY(t.tags)
        )
      GROUP BY t.id
      ORDER BY t.views DESC
      LIMIT 10
    `, [`%${searchQuery}%`, searchQuery.toLowerCase()]);

    return result.rows.map(row => this.mapRowToTutorial(row));
  }

  // Demo template operations
  static async findTemplatesByCategory(category: string): Promise<DemoTemplate[]> {
    const result = await query(`
      SELECT * FROM demo_templates
      WHERE category = $1
      ORDER BY usage_count DESC
    `, [category]);

    return result.rows.map(row => this.mapRowToDemoTemplate(row));
  }

  static async incrementTemplateUsage(id: string): Promise<void> {
    await query(`
      UPDATE demo_templates
      SET usage_count = usage_count + 1
      WHERE id = $1
    `, [id]);
  }

  // Helper methods for updating nested data
  private static async updateUserAnalytics(userId: string, analytics: Partial<UserAnalytics>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (analytics.totalQueries !== undefined) {
      updateFields.push(`total_queries = $${paramIndex++}`);
      values.push(analytics.totalQueries);
    }
    if (analytics.tutorialsViewed !== undefined) {
      updateFields.push(`tutorials_viewed = $${paramIndex++}`);
      values.push(analytics.tutorialsViewed);
    }
    if (analytics.demosCreated !== undefined) {
      updateFields.push(`demos_created = $${paramIndex++}`);
      values.push(analytics.demosCreated);
    }
    if (analytics.lastActiveAt) {
      updateFields.push(`last_active_at = $${paramIndex++}`);
      values.push(analytics.lastActiveAt);
    }
    if (analytics.featureUsage) {
      if (analytics.featureUsage.tutorialSearch !== undefined) {
        updateFields.push(`feature_usage_tutorial_search = $${paramIndex++}`);
        values.push(analytics.featureUsage.tutorialSearch);
      }
      if (analytics.featureUsage.demoCreation !== undefined) {
        updateFields.push(`feature_usage_demo_creation = $${paramIndex++}`);
        values.push(analytics.featureUsage.demoCreation);
      }
      if (analytics.featureUsage.guidance !== undefined) {
        updateFields.push(`feature_usage_guidance = $${paramIndex++}`);
        values.push(analytics.featureUsage.guidance);
      }
      if (analytics.featureUsage.collaboration !== undefined) {
        updateFields.push(`feature_usage_collaboration = $${paramIndex++}`);
        values.push(analytics.featureUsage.collaboration);
      }
    }

    if (updateFields.length > 0) {
      values.push(userId);
      await query(`
        UPDATE user_analytics
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
      `, values);
    }
  }

  private static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (preferences.skillLevel) {
      updateFields.push(`skill_level = $${paramIndex++}`);
      values.push(preferences.skillLevel);
    }
    if (preferences.designStyle) {
      updateFields.push(`design_style = $${paramIndex++}`);
      values.push(preferences.designStyle);
    }
    if (preferences.theme) {
      updateFields.push(`theme = $${paramIndex++}`);
      values.push(preferences.theme);
    }

    if (updateFields.length > 0) {
      values.push(userId);
      await query(`
        UPDATE user_preferences
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
      `, values);
    }
  }

  private static async updateUserSubscription(userId: string, subscription: Partial<UserSubscription>): Promise<void> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (subscription.tier) {
      updateFields.push(`tier = $${paramIndex++}`);
      values.push(subscription.tier);
    }
    if (subscription.status) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(subscription.status);
    }

    if (updateFields.length > 0) {
      values.push(userId);
      await query(`
        UPDATE user_subscriptions
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
      `, values);
    }
  }

  // Mapping functions
  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      figmaUserId: row.figma_user_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isEmailVerified: row.is_email_verified,
      emailVerificationToken: row.email_verification_token,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires,
      subscription: {
        tier: row.tier || 'free',
        stripeCustomerId: row.stripe_customer_id,
        stripeSubscriptionId: row.stripe_subscription_id,
        currentPeriodStart: row.current_period_start,
        currentPeriodEnd: row.current_period_end,
        cancelAtPeriodEnd: row.cancel_at_period_end || false,
        status: row.subscription_status || 'active'
      },
      preferences: {
        skillLevel: row.skill_level || 'beginner',
        designStyle: row.design_style || 'modern',
        commonUseCases: row.common_use_cases || [],
        preferredTutorialLength: row.preferred_tutorial_length || 'any',
        notifications: {
          email: row.notifications_email ?? true,
          inApp: row.notifications_in_app ?? true,
          weekly: row.notifications_weekly ?? false
        },
        theme: row.theme || 'dark'
      },
      analytics: {
        totalQueries: row.total_queries || 0,
        tutorialsViewed: row.tutorials_viewed || 0,
        demosCreated: row.demos_created || 0,
        lastActiveAt: row.last_active_at || new Date(),
        featureUsage: {
          tutorialSearch: row.feature_usage_tutorial_search || 0,
          demoCreation: row.feature_usage_demo_creation || 0,
          guidance: row.feature_usage_guidance || 0,
          collaboration: row.feature_usage_collaboration || 0
        },
        learningProgress: {
          completedTutorials: row.completed_tutorials || [],
          skillAssessmentScore: row.skill_assessment_score,
          badgesEarned: row.badges_earned || []
        }
      }
    };
  }

  private static mapRowToSession(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      lastAccessedAt: row.last_accessed_at,
      userAgent: row.user_agent,
      ipAddress: row.ip_address
    };
  }

  private static mapRowToTutorial(row: any): Tutorial {
    return {
      id: row.id,
      videoId: row.video_id,
      title: row.title,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      channelTitle: row.channel_title,
      url: row.url,
      publishedAt: row.published_at,
      skillLevel: row.skill_level,
      tags: row.tags || [],
      views: parseInt(row.views || '0'),
      rating: parseFloat(row.rating || '0'),
      timestamps: row.timestamps || [],
      cached: row.cached,
      cacheExpiry: row.cache_expiry
    };
  }

  private static mapRowToDemoTemplate(row: any): DemoTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      skillLevel: row.skill_level,
      figmaComponentKey: row.figma_component_key,
      thumbnailUrl: row.thumbnail_url,
      tags: row.tags || [],
      isPremium: row.is_premium,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      usageCount: row.usage_count
    };
  }
}