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

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags: [Admin - User Management]
 *     summary: Get all users with pagination and filtering
 *     description: Retrieve paginated list of users with search and filter options (Admin/Moderator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role name
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isEmailVerified
 *         schema:
 *           type: boolean
 *         description: Filter by email verification status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedUsersResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin/Moderator access required
 */

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     tags: [Admin - User Management]
 *     summary: Get user by ID
 *     description: Retrieve detailed information about a specific user (Admin/Moderator only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin/Moderator access required
 *       404:
 *         description: User not found
 *   patch:
 *     tags: [Admin - User Management]
 *     summary: Update user profile
 *     description: Update user profile information (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User first name
 *               lastName:
 *                 type: string
 *                 description: User last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *           example:
 *             firstName: Updated John
 *             lastName: Updated Doe
 *             email: updated.email@example.com
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       400:
 *         description: Validation error
 *   delete:
 *     tags: [Admin - User Management]
 *     summary: Delete user
 *     description: Permanently delete a user account (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       400:
 *         description: Cannot delete admin user
 */

/**
 * @swagger
 * /api/admin/users/{id}/status:
 *   patch:
 *     tags: [Admin - User Management]
 *     summary: Update user status
 *     description: Activate or deactivate a user account (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Active status
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid status value
 */

/**
 * @swagger
 * /api/admin/users/{id}/roles:
 *   put:
 *     tags: [Admin - User Management]
 *     summary: Assign roles to user
 *     description: Assign one or more roles to a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleIds]
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of role IDs to assign
 *           example:
 *             roleIds: ["role-id-1", "role-id-2"]
 *     responses:
 *       200:
 *         description: User roles updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid role IDs
 */

/**
 * @swagger
 * /api/admin/users/{userId}/roles/{roleId}:
 *   delete:
 *     tags: [Admin - User Management]
 *     summary: Remove role from user
 *     description: Remove a specific role from a user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID to remove
 *     responses:
 *       200:
 *         description: Role removed from user successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       404:
 *         description: User or role not found
 */

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