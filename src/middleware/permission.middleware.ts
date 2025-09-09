import { Request, Response, NextFunction } from 'express';
import { AuthorizationError, AuthenticationError } from '@/utils/errors';
import logger from '@/utils/logger';

export const hasRole = (...requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const userRoles = (req.user as any).roles.map((role: any) => role.name);
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${requiredRoles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      logger.error('Role check failed:', error);
      next(error);
    }
  };
};

export const hasPermission = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      // Get all user permissions (from roles and direct permissions)
      const rolePermissions = (req.user as any).roles.flatMap((role: any) => 
        role.permissions.map((permission: any) => permission.name)
      );
      const userPermissions = (req.user as any).permissions.map((permission: any) => permission.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

      const hasRequiredPermission = requiredPermissions.some(permission => 
        allPermissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        throw new AuthorizationError(
          `Access denied. Required permissions: ${requiredPermissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      logger.error('Permission check failed:', error);
      next(error);
    }
  };
};

export const hasPermissionAny = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      // Get all user permissions (from roles and direct permissions)
      const rolePermissions = (req.user as any).roles.flatMap((role: any) => 
        role.permissions.map((permission: any) => permission.name)
      );
      const userPermissions = (req.user as any).permissions.map((permission: any) => permission.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

      const hasAnyPermission = requiredPermissions.some(permission => 
        allPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        throw new AuthorizationError(
          `Access denied. Required at least one of: ${requiredPermissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      logger.error('Permission check failed:', error);
      next(error);
    }
  };
};

export const hasPermissionAll = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      // Get all user permissions (from roles and direct permissions)
      const rolePermissions = (req.user as any).roles.flatMap((role: any) => 
        role.permissions.map((permission: any) => permission.name)
      );
      const userPermissions = (req.user as any).permissions.map((permission: any) => permission.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

      const hasAllPermissions = requiredPermissions.every(permission => 
        allPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        throw new AuthorizationError(
          `Access denied. Required all of: ${requiredPermissions.join(', ')}`
        );
      }

      next();
    } catch (error) {
      logger.error('Permission check failed:', error);
      next(error);
    }
  };
};

export const isOwnerOrHasPermission = (
  getResourceUserId: (req: Request) => string,
  ...requiredPermissions: string[]
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const resourceUserId = getResourceUserId(req);
      
      // Check if user is the owner of the resource
      if ((req.user as any).id === resourceUserId) {
        return next();
      }

      // Check if user has required permissions
      const rolePermissions = (req.user as any).roles.flatMap((role: any) => 
        role.permissions.map((permission: any) => permission.name)
      );
      const userPermissions = (req.user as any).permissions.map((permission: any) => permission.name);
      const allPermissions = [...new Set([...rolePermissions, ...userPermissions])];

      const hasRequiredPermission = requiredPermissions.some(permission => 
        allPermissions.includes(permission)
      );

      if (!hasRequiredPermission) {
        throw new AuthorizationError(
          'Access denied. You can only access your own resources or need appropriate permissions.'
        );
      }

      next();
    } catch (error) {
      logger.error('Owner or permission check failed:', error);
      next(error);
    }
  };
};

export const isSelfOrHasRole = (...requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const targetUserId = req.params.id || req.params.userId;
      
      // Check if user is accessing their own resource
      if ((req.user as any).id === targetUserId) {
        return next();
      }

      // Check if user has required roles
      const userRoles = (req.user as any).roles.map((role: any) => role.name);
      const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        throw new AuthorizationError(
          'Access denied. You can only access your own resources or need appropriate roles.'
        );
      }

      next();
    } catch (error) {
      logger.error('Self or role check failed:', error);
      next(error);
    }
  };
};