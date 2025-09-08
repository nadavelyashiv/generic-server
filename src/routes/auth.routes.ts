import { Router } from 'express';
import * as authController from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/auth.middleware';
import { validateBody } from '@/middleware/validation.middleware';
import { authRateLimit, passwordResetRateLimit, emailVerificationRateLimit } from '@/middleware/rateLimiter.middleware';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
} from '@/types/validation.schemas';

const router = Router();

// Registration and email verification
router.post('/register', authRateLimit, validateBody(RegisterSchema), authController.register);
router.get('/verify-email', emailVerificationRateLimit, authController.verifyEmail);
router.post('/resend-verification', emailVerificationRateLimit, validateBody(ForgotPasswordSchema), authController.resendVerificationEmail);

// Authentication
router.post('/login', authRateLimit, validateBody(LoginSchema), authController.login);
router.post('/refresh', authController.refreshTokens);
router.post('/logout', authController.logout);
router.post('/logout-all', authenticate, authController.logoutAll);

// Password management
router.post('/forgot-password', passwordResetRateLimit, validateBody(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', passwordResetRateLimit, validateBody(ResetPasswordSchema), authController.resetPassword);
router.post('/change-password', authenticate, validateBody(ChangePasswordSchema), authController.changePassword);

// OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/facebook', authController.facebookAuth);
router.get('/facebook/callback', authController.facebookCallback);

export default router;