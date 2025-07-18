import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../config/database';
import { JwtService } from '../config/jwt';
import { User, Session } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';

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

      // Check if user already exists
      const existingUser = Database.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user: User = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        figmaUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEmailVerified: false,
        emailVerificationToken: JwtService.generateSecureToken(),
        subscription: {
          tier: 'free',
          cancelAtPeriodEnd: false,
          status: 'active'
        },
        preferences: {
          skillLevel: 'beginner',
          designStyle: 'modern',
          commonUseCases: [],
          preferredTutorialLength: 'any',
          notifications: {
            email: true,
            inApp: true,
            weekly: true
          },
          theme: 'auto'
        },
        analytics: {
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
          learningProgress: {
            completedTutorials: [],
            badgesEarned: []
          }
        }
      };

      const createdUser = Database.createUser(user);

      // Generate tokens
      const { accessToken, refreshToken } = JwtService.generateTokenPair({
        userId: createdUser.id,
        email: createdUser.email,
        figmaUserId: createdUser.figmaUserId
      });

      // Create session
      const session: Session = {
        id: uuidv4(),
        userId: createdUser.id,
        token: accessToken,
        refreshToken,
        expiresAt: JwtService.getTokenExpiry(accessToken) || new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      };

      Database.createSession(session);

      // Return response without password
      const { password: _, ...userResponse } = createdUser;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token: accessToken,
        refreshToken,
        user: {
          id: userResponse.id,
          email: userResponse.email,
          figmaUserId: userResponse.figmaUserId,
          subscription: userResponse.subscription,
          preferences: userResponse.preferences
        }
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

      // Find user
      const user = Database.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = JwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        figmaUserId: user.figmaUserId
      });

      // Create session
      const session: Session = {
        id: uuidv4(),
        userId: user.id,
        token: accessToken,
        refreshToken,
        expiresAt: JwtService.getTokenExpiry(accessToken) || new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      };

      Database.createSession(session);

      // Update last active
      Database.updateUser(user.id, {
        analytics: {
          ...user.analytics,
          lastActiveAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          figmaUserId: user.figmaUserId,
          subscription: user.subscription,
          preferences: user.preferences
        }
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

      const payload = JwtService.verifyRefreshToken(refreshToken);
      if (!payload) {
        return res.status(403).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      const user = Database.findUserById(payload.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = JwtService.generateTokenPair({
        userId: user.id,
        email: user.email,
        figmaUserId: user.figmaUserId
      });

      // Update session
      const session: Session = {
        id: uuidv4(),
        userId: user.id,
        token: accessToken,
        refreshToken: newRefreshToken,
        expiresAt: JwtService.getTokenExpiry(accessToken) || new Date(Date.now() + 60 * 60 * 1000),
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      };

      Database.createSession(session);

      res.json({
        success: true,
        token: accessToken,
        refreshToken: newRefreshToken
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
        Database.deleteSession(token);
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

      const user = Database.findUserById(req.userId);
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

      const updatedUser = Database.updateUser(req.userId, {
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