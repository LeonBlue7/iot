// src/routes/admin.ts
import { Router } from 'express';
import { login, getMe } from '../controllers/admin/auth.controller.js';
import { authenticate, requirePermissions } from '../middleware/admin/auth.js';

const router = Router();

// Public routes
router.post('/auth/login', login);

// Protected routes
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/me', authenticate, getMe);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/dashboard', authenticate, requirePermissions('dashboard:read'), (_req, res) => {
  res.json({ success: true, data: { message: 'Dashboard stats' } });
});

export default router;
