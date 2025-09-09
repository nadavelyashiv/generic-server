import { Router } from 'express';
import { authenticate } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware/rbac.middleware';
import {
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  assignUserRoles,
  removeUserRole,
  deleteUser
} from '@/controllers/admin.controller';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Get all users with filtering and pagination
router.get('/users', authorize('admin', 'moderator'), getUsers);

// Get user by ID
router.get('/users/:id', authorize('admin', 'moderator'), getUserById);

// Update user profile information
router.patch('/users/:id', authorize('admin'), updateUser);

// Update user status (activate/deactivate)
router.patch('/users/:id/status', authorize('admin'), updateUserStatus);

// Assign roles to user
router.put('/users/:id/roles', authorize('admin'), assignUserRoles);

// Remove role from user
router.delete('/users/:userId/roles/:roleId', authorize('admin'), removeUserRole);

// Delete user
router.delete('/users/:id', authorize('admin'), deleteUser);

export default router;