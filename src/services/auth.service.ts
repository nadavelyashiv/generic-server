import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { config } from '@/config/environment';
import prisma from '@/config/database';
import tokenService from '@/services/token.service';
import emailService from '@/services/email.service';
import logger from '@/utils/logger';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '@/utils/errors';
import {
  RegisterData,
  LoginCredentials,
  JWTTokens,
  PasswordResetData,
  ChangePasswordData,
  UserWithRolesAndPermissions,
} from '@/types/auth.types';

class AuthService {
  async register(data: RegisterData): Promise<UserWithRolesAndPermissions> {
    const { email, password, firstName, lastName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

    // Generate email verification token
    const verificationToken = tokenService.generateEmailVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours

    // Get default role
    const defaultRole = await prisma.role.findFirst({
      where: { isDefault: true },
      include: { permissions: true },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        roles: defaultRole
          ? {
              connect: { id: defaultRole.id },
            }
          : undefined,
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        permissions: true,
      },
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, firstName, verificationToken);
    } catch (error) {
      logger.error('Failed to send verification email:', error);
      // Don't fail registration if email fails
    }

    logger.info('User registered successfully:', {
      userId: user.id,
      email: user.email,
    });

    return user;
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired verification token');
    }

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }

    logger.info('Email verified successfully:', {
      userId: user.id,
      email: user.email,
    });
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.emailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Generate new verification token
    const verificationToken = tokenService.generateEmailVerificationToken();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, user.firstName, verificationToken);

    logger.info('Verification email resent:', {
      userId: user.id,
      email: user.email,
    });
  }

  async login(
    credentials: LoginCredentials,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ user: UserWithRolesAndPermissions; tokens: JWTTokens }> {
    const { email, password } = credentials;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        permissions: true,
      },
    });

    if (!user || !user.password) {
      throw new AuthenticationError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('Your account has been disabled');
    }

    if (!user.emailVerified) {
      throw new AuthenticationError('Please verify your email address before signing in');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Extract permissions
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
      userAgent,
      ipAddress
    );

    logger.info('User logged in successfully:', {
      userId: user.id,
      email: user.email,
    });

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<JWTTokens> {
    return await tokenService.refreshTokens(refreshToken);
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    // Blacklist access token
    await tokenService.blacklistAccessToken(accessToken);

    // Revoke refresh token
    await tokenService.revokeRefreshToken(refreshToken);

    logger.info('User logged out successfully');
  }

  async logoutAll(userId: string, currentRefreshToken?: string): Promise<void> {
    // Revoke all refresh tokens except current one
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
        ...(currentRefreshToken && { token: { not: currentRefreshToken } }),
      },
      data: { isRevoked: true },
    });

    logger.info('All user sessions logged out:', { userId });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    if (!user.isActive) {
      throw new AuthenticationError('Your account has been disabled');
    }

    // Generate reset token
    const resetToken = tokenService.generatePasswordResetToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1 hour

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail(email, user.firstName, resetToken);

    logger.info('Password reset email sent:', {
      userId: user.id,
      email: user.email,
    });
  }

  async resetPassword(data: PasswordResetData): Promise<void> {
    const { token, newPassword } = data;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new ValidationError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.rounds);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revoke all existing tokens
    await tokenService.revokeAllUserTokens(user.id);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedNotification(user.email, user.firstName);
    } catch (error) {
      logger.error('Failed to send password changed email:', error);
    }

    logger.info('Password reset successfully:', {
      userId: user.id,
      email: user.email,
    });
  }

  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    const { currentPassword, newPassword } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.rounds);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Revoke all existing refresh tokens except current session would be handled by controller
    await tokenService.revokeAllUserTokens(userId);

    // Send confirmation email
    try {
      await emailService.sendPasswordChangedNotification(user.email, user.firstName);
    } catch (error) {
      logger.error('Failed to send password changed email:', error);
    }

    logger.info('Password changed successfully:', {
      userId: user.id,
      email: user.email,
    });
  }
}

export default new AuthService();