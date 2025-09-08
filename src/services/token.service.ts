import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '@/config/environment';
import { TokenPayload, JWTTokens } from '@/types/auth.types';
import { AuthenticationError } from '@/utils/errors';
import prisma from '@/config/database';
import logger from '@/utils/logger';

class TokenService {
  generateAccessToken(payload: Omit<TokenPayload, 'type'>): string {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'access',
    };

    return jwt.sign(tokenPayload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: 'auth-server',
      audience: 'auth-client',
    } as any);
  }

  generateRefreshToken(payload: Omit<TokenPayload, 'type'>): string {
    const tokenPayload: TokenPayload = {
      ...payload,
      type: 'refresh',
    };

    return jwt.sign(tokenPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'auth-server',
      audience: 'auth-client',
    } as any);
  }

  async generateTokenPair(
    userId: string,
    email: string,
    roles: string[],
    permissions: string[],
    userAgent?: string,
    ipAddress?: string
  ): Promise<JWTTokens> {
    const payload = { userId, email, roles, permissions };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Store refresh token in database
    await this.storeRefreshToken(refreshToken, userId, userAgent, ipAddress);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(
    token: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      const expiresAt = new Date(decoded.exp * 1000);

      await prisma.refreshToken.create({
        data: {
          token,
          userId,
          expiresAt,
          userAgent: userAgent || null,
          ipAddress: ipAddress || null,
        },
      });
    } catch (error) {
      logger.error('Failed to store refresh token:', error);
      throw error;
    }
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret, {
        issuer: 'auth-server',
        audience: 'auth-client',
      }) as TokenPayload;

      if (decoded.type !== 'access') {
        throw new AuthenticationError('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid access token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Access token expired');
      }
      throw error;
    }
  }

  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'auth-server',
        audience: 'auth-client',
      }) as TokenPayload;

      if (decoded.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token expired');
      }
      throw error;
    }
  }

  async refreshTokens(refreshToken: string): Promise<JWTTokens> {
    const decoded = this.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in database and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
            permissions: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new AuthenticationError('Refresh token is invalid or revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new AuthenticationError('Refresh token expired');
    }

    if (!storedToken.user.isActive) {
      throw new AuthenticationError('User account is disabled');
    }

    // Extract user permissions from roles and direct permissions
    const rolePermissions = storedToken.user.roles.flatMap(role => 
      role.permissions.map(permission => permission.name)
    );
    const userPermissions = storedToken.user.permissions.map(permission => permission.name);
    const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];
    
    const roles = storedToken.user.roles.map(role => role.name);

    // Generate new token pair
    const newTokens = await this.generateTokenPair(
      storedToken.user.id,
      storedToken.user.email,
      roles,
      allPermissions,
      storedToken.userAgent,
      storedToken.ipAddress
    );

    // Revoke old refresh token
    await this.revokeRefreshToken(refreshToken);

    return newTokens;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      await prisma.refreshToken.update({
        where: { token },
        data: { isRevoked: true },
      });
    } catch (error) {
      logger.error('Failed to revoke refresh token:', error);
      // Don't throw error here to avoid breaking logout flow
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    } catch (error) {
      logger.error('Failed to revoke all user tokens:', error);
      throw error;
    }
  }

  async blacklistAccessToken(token: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        
        await prisma.blacklistedToken.create({
          data: {
            token,
            expiresAt,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to blacklist access token:', error);
      // Don't throw error here to avoid breaking logout flow
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistedToken = await prisma.blacklistedToken.findUnique({
        where: { token },
      });

      return !!blacklistedToken && new Date() < blacklistedToken.expiresAt;
    } catch (error) {
      logger.error('Failed to check token blacklist:', error);
      return false;
    }
  }

  generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = new Date();
      
      // Clean up expired refresh tokens
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      // Clean up expired blacklisted tokens
      await prisma.blacklistedToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });

      logger.info('Expired tokens cleaned up successfully');
    } catch (error) {
      logger.error('Failed to cleanup expired tokens:', error);
    }
  }
}

export default new TokenService();