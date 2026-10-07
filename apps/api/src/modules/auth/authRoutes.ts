import { Router } from 'express';
import {
  login,
  refresh,
  logout,
  getMe,
  changePassword,
} from './authController.js';
import { validateBody } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { loginSchema, changePasswordSchema } from '@hrx/shared';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  changePassword
);

export const authRoutes = router;
