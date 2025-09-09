import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '@/utils/logger';
import { ApiResponse } from '@/types/common.types';
import { ValidationError, NotFoundError } from '@/utils/errors';

const prisma = new PrismaClient();

interface UserQueryParams {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
  isActive?: string;
  isEmailVerified?: string;
}

// Get all users with filtering and pagination
export const getUsers = async (req: Request<{}, {}, {}, UserQueryParams>, res: Response, next: NextFunction) => {
  try {
    const {
      page = '1',
      limit = '10',
      search,
      role,
      isActive,
      isEmailVerified
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.roles = {
        some: {
          name: role
        }
      };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (isEmailVerified !== undefined) {
      where.emailVerified = isEmailVerified === 'true';
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          roles: {
            include: {
              permissions: true
            }
          },
          permissions: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transform users to include flattened permissions
    const transformedUsers = users.map(user => {
      const rolePermissions = user.roles.flatMap(role => 
        role.permissions.map(permission => permission.name)
      );
      const userPermissions = user.permissions.map(permission => permission.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

      return {
        ...user,
        permissions: allPermissions
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    const response: ApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users: transformedUsers,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Get users failed:', error);
    next(error);
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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

    const response: ApiResponse = {
      success: true,
      message: 'User retrieved successfully',
      data: transformedUser,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Get user failed:', error);
    next(error);
  }
};

// Update user
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id }
        }
      });

      if (emailExists) {
        throw new ValidationError('Email is already taken');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
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

    logger.info(`User ${id} updated by admin ${(req.user as any)?.id}`);

    const response: ApiResponse = {
      success: true,
      message: 'User updated successfully',
      data: transformedUser,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Update user failed:', error);
    next(error);
  }
};

// Update user status (activate/deactivate)
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new ValidationError('isActive must be a boolean');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      include: {
        roles: {
          include: {
            permissions: true
          }
        },
        permissions: true
      }
    });

    logger.info(`User ${id} status updated to ${isActive} by admin ${(req.user as any)?.id}`);

    const response: ApiResponse = {
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Update user status failed:', error);
    next(error);
  }
};

// Assign roles to user
export const assignUserRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds)) {
      throw new ValidationError('roleIds must be an array');
    }

    // Verify all roles exist
    const roles = await prisma.role.findMany({
      where: {
        id: { in: roleIds }
      }
    });

    if (roles.length !== roleIds.length) {
      throw new ValidationError('One or more roles do not exist');
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        roles: {
          set: roleIds.map(roleId => ({ id: roleId }))
        }
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

    logger.info(`User ${id} roles updated by admin ${(req.user as any)?.id}`);

    const response: ApiResponse = {
      success: true,
      message: 'User roles updated successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Assign user roles failed:', error);
    next(error);
  }
};

// Remove role from user
export const removeUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, roleId } = req.params;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId }
        }
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

    logger.info(`Role ${roleId} removed from user ${userId} by admin ${(req.user as any)?.id}`);

    const response: ApiResponse = {
      success: true,
      message: 'Role removed from user successfully',
      data: updatedUser,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Remove user role failed:', error);
    next(error);
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent deleting admin user (assuming first user is admin or has specific email)
    if (user.email === 'admin@example.com') {
      throw new ValidationError('Cannot delete admin user');
    }

    await prisma.user.delete({
      where: { id }
    });

    logger.info(`User ${id} deleted by admin ${(req.user as any)?.id}`);

    const response: ApiResponse = {
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    logger.error('Delete user failed:', error);
    next(error);
  }
};