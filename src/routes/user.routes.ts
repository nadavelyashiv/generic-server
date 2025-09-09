import { Router } from 'express';
import { authenticate } from '@/middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} from '@/controllers/user.controller';

const router = Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     tags: [User Profile]
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: Profile retrieved successfully
 *               data:
 *                 id: user-id-123
 *                 email: user@example.com
 *                 firstName: John
 *                 lastName: Doe
 *                 isActive: true
 *                 isEmailVerified: true
 *                 roles: [{ name: user }]
 *                 permissions: [profile:read, profile:write]
 *               timestamp: '2025-09-09T14:37:00.000Z'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [User Profile]
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
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
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/user/password:
 *   patch:
 *     tags: [User Profile]
 *     summary: Change user password
 *     description: Change the authenticated user's password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (minimum 8 characters)
 *           example:
 *             currentPassword: CurrentPassword123!
 *             newPassword: NewSecurePassword456!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/user/account:
 *   delete:
 *     tags: [User Profile]
 *     summary: Delete user account
 *     description: Permanently delete the authenticated user's account (self-deletion)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Cannot delete account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// All user routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/profile', getProfile);

// Update user profile
router.patch('/profile', updateProfile);

// Change password
router.patch('/password', changePassword);

// Delete user account (self-deletion)
router.delete('/account', deleteAccount);

export default router;