import { Router } from 'express';
import { authenticate } from '@/middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} from '@/controllers/user.controller';

const router = Router();

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