import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '@/utils/errors';
import tokenService from '@/services/token.service';
import prisma from '@/config/database';
import logger from '@/utils/logger';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new AuthenticationError('Token is invalid');
    }

    // Verify the token
    const payload = tokenService.verifyAccessToken(token);

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        permissions: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is disabled');
    }

    // Attach user to request
    req.user = user as any;
    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    next(error);
  }
};

export const optionalAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : null;

    if (!token) {
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }

    try {
      // Verify the token
      const payload = tokenService.verifyAccessToken(token);

      // Get user with roles and permissions
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          roles: {
            include: {
              permissions: true,
            },
          },
          permissions: true,
        },
      });

      if (user && user.isActive) {
        req.user = user as any;
      }
    } catch (error) {
      // Silently ignore authentication errors for optional auth
      logger.debug('Optional authentication failed:', error);
    }

    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next();
  }
};