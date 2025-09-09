import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import logger from '@/utils/logger';
import { ApiResponse } from '@/types/common.types';
import { ValidationError, NotFoundError } from '@/utils/errors';

const prisma = new PrismaClient();

// Get current user profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: true
          }
        },
        permissions: true
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Transform user to include flattened permissions
    const rolePermissions = user.roles.flatMap(role => 
      role.permissions.map(permission => permission.name)
    );
    const userPermissions = user.permissions.map(permission => permission.name);
    const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

    const transformedUser = {
      ...user,
      permissions: allPermissions
    };

    // Remove password from response
    const { password, ...userWithoutPassword } = transformedUser;

    const response: ApiResponse = {
      success: true,
      message: 'Profile retrieved successfully',
      data: userWithoutPassword,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Get profile failed:', error);
    next(error);
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.id;
    const { firstName, lastName, email } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (emailExists) {
        throw new ValidationError('Email is already taken');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email })
      },
      include: {
        roles: {
          include: {
            permissions: true
          }
        },
        permissions: true
      }
    });

    // Transform user to include flattened permissions
    const rolePermissions = updatedUser.roles.flatMap(role => 
      role.permissions.map(permission => permission.name)
    );
    const userPermissions = updatedUser.permissions.map(permission => permission.name);
    const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

    const transformedUser = {
      ...updatedUser,
      permissions: allPermissions
    };

    // Remove password from response
    const { password, ...userWithoutPassword } = transformedUser;

    logger.info(`User ${userId} profile updated`);

    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: userWithoutPassword,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Update profile failed:', error);
    next(error);
  }
};

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters long');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    logger.info(`User ${userId} password changed`);

    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Change password failed:', error);
    next(error);
  }
};

// Delete user account (self-deletion)
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as any)?.id;
    const { password } = req.body;

    if (!password) {
      throw new ValidationError('Password is required to delete account');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ValidationError('Password is incorrect');
    }

    // Prevent deleting admin user
    if (user.email === 'admin@example.com') {
      throw new ValidationError('Cannot delete admin account');
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    logger.info(`User ${userId} account deleted (self-deletion)`);

    const response: ApiResponse = {
      success: true,
      message: 'Account deleted successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Delete account failed:', error);
    next(error);
  }
};