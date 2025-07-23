import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DB } from '../config/databaseConfig';
import { JwtService } from '../config/jwt';
import { User, Session } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { SupabaseAuthService } from '../services/supabaseAuth';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, figmaUserId } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      // Use Supabase auth service
      const result = await SupabaseAuthService.register(email, password, figmaUserId);

      if (!result.success) {
        return res.status(409).json({
          success: false,
          message: result.error || 'Registration failed'
        });
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user
      });

    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Use Supabase auth service
      const result = await SupabaseAuthService.login(email, password);

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.error || 'Invalid email or password'
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required'
        });
      }

      // Use Supabase auth service
      const result = await SupabaseAuthService.refreshToken(refreshToken);

      if (!result.success) {
        return res.status(403).json({
          success: false,
          message: result.error || 'Invalid refresh token'
        });
      }

      res.json({
        success: true,
        token: result.token,
        refreshToken: result.refreshToken
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        const result = await SupabaseAuthService.logout(token);
        if (!result.success) {
          console.error('Logout failed:', result.error);
        }
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const user = await DB.findUserById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          figmaUserId: user.figmaUserId,
          subscription: user.subscription,
          preferences: user.preferences,
          analytics: user.analytics
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { preferences } = req.body;

      const updatedUser = await DB.updateUser(req.userId, {
        preferences,
        updatedAt: new Date()
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          figmaUserId: updatedUser.figmaUserId,
          subscription: updatedUser.subscription,
          preferences: updatedUser.preferences
        }
      });

    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}