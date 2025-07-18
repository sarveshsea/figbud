import { JwtService } from '../../server/config/jwt';
import { Database } from '../../server/config/database';
import bcrypt from 'bcryptjs';

describe('Authentication System', () => {
  beforeEach(() => {
    // Clear test data before each test
    jest.clearAllMocks();
  });

  describe('JWT Service', () => {
    const mockPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
    };

    test('should generate and verify access token', () => {
      const token = JwtService.generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = JwtService.verifyAccessToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.type).toBe('access');
    });

    test('should generate and verify refresh token', () => {
      const token = JwtService.generateRefreshToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = JwtService.verifyRefreshToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.type).toBe('refresh');
    });

    test('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(JwtService.verifyAccessToken(invalidToken)).toBeNull();
      expect(JwtService.verifyRefreshToken(invalidToken)).toBeNull();
    });

    test('should generate token pair', () => {
      const tokens = JwtService.generateTokenPair(mockPayload);
      
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      
      const accessDecoded = JwtService.verifyAccessToken(tokens.accessToken);
      const refreshDecoded = JwtService.verifyRefreshToken(tokens.refreshToken);
      
      expect(accessDecoded?.type).toBe('access');
      expect(refreshDecoded?.type).toBe('refresh');
    });

    test('should generate secure random token', () => {
      const token1 = JwtService.generateSecureToken();
      const token2 = JwtService.generateSecureToken();
      
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
    });
  });

  describe('Password Hashing', () => {
    test('should hash password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    test('should verify password correctly', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const isValid = await bcrypt.compare(password, hashedPassword);
      const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
      
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Database Operations', () => {
    const mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      password: 'hashedpassword',
      createdAt: new Date(),
      updatedAt: new Date(),
      isEmailVerified: false,
      subscription: {
        tier: 'free' as const,
        cancelAtPeriodEnd: false,
        status: 'active' as const,
      },
      preferences: {
        skillLevel: 'beginner' as const,
        designStyle: 'modern' as const,
        commonUseCases: [],
        preferredTutorialLength: 'any' as const,
        notifications: {
          email: true,
          inApp: true,
          weekly: true,
        },
        theme: 'auto' as const,
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
          collaboration: 0,
        },
        learningProgress: {
          completedTutorials: [],
          badgesEarned: [],
        },
      },
    };

    test('should create user', () => {
      const createdUser = Database.createUser(mockUser);
      expect(createdUser).toEqual(mockUser);
    });

    test('should find user by id', () => {
      Database.createUser(mockUser);
      const foundUser = Database.findUserById(mockUser.id);
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(mockUser.email);
    });

    test('should find user by email', () => {
      Database.createUser(mockUser);
      const foundUser = Database.findUserByEmail(mockUser.email);
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(mockUser.id);
    });

    test('should update user', () => {
      Database.createUser(mockUser);
      const updates = {
        preferences: {
          ...mockUser.preferences,
          skillLevel: 'advanced' as const,
        },
      };
      
      const updatedUser = Database.updateUser(mockUser.id, updates);
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.preferences.skillLevel).toBe('advanced');
    });

    test('should delete user', () => {
      Database.createUser(mockUser);
      const deleted = Database.deleteUser(mockUser.id);
      expect(deleted).toBe(true);
      
      const foundUser = Database.findUserById(mockUser.id);
      expect(foundUser).toBeNull();
    });

    test('should return null for non-existent user', () => {
      const foundUser = Database.findUserById('non-existent-id');
      expect(foundUser).toBeNull();
    });
  });
});