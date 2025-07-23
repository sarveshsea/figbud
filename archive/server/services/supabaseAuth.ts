import { supabase, handleSupabaseError } from '../config/supabase';
import { JwtService } from '../config/jwt';
import { DB } from '../config/databaseConfig';
import { v4 as uuidv4 } from 'uuid';

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

export class SupabaseAuthService {
  /**
   * Register a new user
   */
  static async register(email: string, password: string, figmaUserId?: string): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await DB.findUserByEmail(email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists'
        };
      }

      // Create user in our database
      const newUser = await DB.createUser({
        email,
        password,
        figmaUserId,
        isEmailVerified: false,
        emailVerificationToken: uuidv4()
      });

      // Generate JWT tokens
      const tokens = JwtService.generateTokenPair({
        userId: newUser.id,
        email: newUser.email,
        figmaUserId: newUser.figmaUserId
      });

      // Create session
      await DB.createSession({
        userId: newUser.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        userAgent: 'FigBud Widget',
        ipAddress: null
      });

      return {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          subscription: newUser.subscription,
          preferences: newUser.preferences
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<AuthResult> {
    try {
      // Find user
      const user = await DB.findUserByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Verify password
      const bcrypt = await import('bcryptjs');
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }

      // Generate JWT tokens
      const tokens = JwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        figmaUserId: user.figmaUserId
      });

      // Create session
      await DB.createSession({
        userId: user.id,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        userAgent: 'FigBud Widget',
        ipAddress: null
      });

      // Update last active
      await DB.updateUser(user.id, {
        analytics: {
          ...user.analytics,
          lastActiveAt: new Date()
        }
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          subscription: user.subscription,
          preferences: user.preferences
        },
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Logout user
   */
  static async logout(token: string): Promise<AuthResult> {
    try {
      const deleted = await DB.deleteSession(token);
      return {
        success: deleted,
        message: deleted ? 'Logged out successfully' : 'Session not found'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // Verify refresh token
      const payload = JwtService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      // Check if session exists
      const session = await supabase
        .from('sessions')
        .select('*')
        .eq('refresh_token', refreshToken)
        .single();

      if (!session.data) {
        return {
          success: false,
          error: 'Session not found'
        };
      }

      // Generate new tokens
      const tokens = JwtService.generateTokenPair({
        userId: payload.userId,
        email: payload.email,
        figmaUserId: payload.figmaUserId
      });

      // Update session
      await supabase
        .from('sessions')
        .update({
          token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', session.data.id);

      return {
        success: true,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Verify email
   */
  static async verifyEmail(token: string): Promise<AuthResult> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email_verification_token', token)
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'Invalid verification token'
        };
      }

      // Update user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_email_verified: true,
          email_verification_token: null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<AuthResult> {
    try {
      const user = await DB.findUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return {
          success: true,
          message: 'If an account exists with this email, a reset link has been sent'
        };
      }

      const resetToken = uuidv4();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await supabase
        .from('users')
        .update({
          password_reset_token: resetToken,
          password_reset_expires: resetExpires.toISOString()
        })
        .eq('id', user.id);

      // TODO: Send email with reset link
      console.log('Password reset token:', resetToken);

      return {
        success: true,
        message: 'If an account exists with this email, a reset link has been sent'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Reset password
   */
  static async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('password_reset_token', token)
        .gt('password_reset_expires', new Date().toISOString())
        .single();

      if (error || !user) {
        return {
          success: false,
          error: 'Invalid or expired reset token'
        };
      }

      // Hash new password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          password_reset_token: null,
          password_reset_expires: null
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: handleSupabaseError(error)
      };
    }
  }

  /**
   * Clean up expired sessions
   */
  static async cleanupSessions(): Promise<void> {
    await DB.cleanExpiredSessions();
  }
}