import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import authService from '@/services/auth.service';
import tokenService from '@/services/token.service';
import { ApiResponse } from '@/types/common.types';
import { AuthenticationError } from '@/utils/errors';
import logger from '@/utils/logger';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await authService.register(req.body);

    const response: ApiResponse = {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
        },
      },
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new AuthenticationError('Verification token is required');
    }

    await authService.verifyEmail(token);

    const response: ApiResponse = {
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.resendVerificationEmail(email);

    const response: ApiResponse = {
      success: true,
      message: 'Verification email sent successfully.',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userAgent = req.get('User-Agent');
    const ipAddress = req.ip;

    const { user, tokens } = await authService.login(req.body, userAgent, ipAddress);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          roles: user.roles.map(role => role.name),
        },
        accessToken: tokens.accessToken,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const refreshTokens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token is required');
    }

    const tokens = await authService.refreshTokens(refreshToken);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: ApiResponse = {
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
      },
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.get('Authorization')?.replace('Bearer ', '');
    const refreshToken = req.cookies.refreshToken;

    if (accessToken && refreshToken) {
      await authService.logout(accessToken, refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const currentRefreshToken = req.cookies.refreshToken;
    await authService.logoutAll(req.user.id, currentRefreshToken);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    const response: ApiResponse = {
      success: true,
      message: 'All sessions logged out successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);

    const response: ApiResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await authService.resetPassword(req.body);

    const response: ApiResponse = {
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    await authService.changePassword(req.user.id, req.body);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

// OAuth handlers
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('google', { session: false }, async (error, user) => {
    try {
      if (error) {
        logger.error('Google OAuth error:', error);
        return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_error`);
      }

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_failed`);
      }

      // Extract permissions and roles
      const rolePermissions = user.roles.flatMap(role =>
        role.permissions.map(permission => permission.name)
      );
      const userPermissions = user.permissions.map(permission => permission.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];
      const roles = user.roles.map(role => role.name);

      // Generate tokens
      const tokens = await tokenService.generateTokenPair(
        user.id,
        user.email,
        roles,
        allPermissions,
        req.get('User-Agent'),
        req.ip
      );

      // Set refresh token as HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Redirect to client with access token
      res.redirect(
        `${process.env.CLIENT_URL}/auth/success?token=${tokens.accessToken}`
      );
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_error`);
    }
  })(req, res, next);
};

export const facebookAuth = passport.authenticate('facebook', {
  scope: ['email'],
});

export const facebookCallback = async (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('facebook', { session: false }, async (error, user) => {
    try {
      if (error) {
        logger.error('Facebook OAuth error:', error);
        return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_error`);
      }

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_failed`);
      }

      // Similar token generation logic as Google
      const rolePermissions = user.roles.flatMap(role =>
        role.permissions.map(permission => permission.name)
      );
      const userPermissions = user.permissions.map(permission => permission.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];
      const roles = user.roles.map(role => role.name);

      const tokens = await tokenService.generateTokenPair(
        user.id,
        user.email,
        roles,
        allPermissions,
        req.get('User-Agent'),
        req.ip
      );

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.redirect(
        `${process.env.CLIENT_URL}/auth/success?token=${tokens.accessToken}`
      );
    } catch (error) {
      logger.error('Facebook OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error?message=oauth_error`);
    }
  })(req, res, next);
};