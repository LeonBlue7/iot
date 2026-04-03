// src/routes/admin.ts
import { Router } from 'express';
import { login, getMe, refreshToken } from '../controllers/admin/auth.controller.js';
import {
  listUsers,
  getUser,
  createUserController,
  updateUserController,
  deleteUserController,
  listUserCustomers,
  assignCustomer,
  removeCustomer,
} from '../controllers/admin/userController.js';
import { authenticate, requirePermissions } from '../middleware/admin/auth.js';

const router = Router();

// Public routes
router.post('/auth/login', login);
router.post('/auth/refresh', refreshToken);

// Protected routes
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/me', authenticate, getMe);

// User management routes
/* eslint-disable @typescript-eslint/no-misused-promises */
router.get('/users', authenticate, requirePermissions('user:read'), listUsers);
router.get('/users/:id', authenticate, requirePermissions('user:read'), getUser);
router.post('/users', authenticate, requirePermissions('user:create'), createUserController);
router.put('/users/:id', authenticate, requirePermissions('user:update'), updateUserController);
router.delete('/users/:id', authenticate, requirePermissions('user:delete'), deleteUserController);

// User customer assignment routes
router.get('/users/:id/customers', authenticate, requirePermissions('user:read'), listUserCustomers);
router.post('/users/:id/customers', authenticate, requirePermissions('user:update'), assignCustomer);
router.delete(
  '/users/:id/customers/:customerId',
  authenticate,
  requirePermissions('user:update'),
  removeCustomer
);
/* eslint-enable @typescript-eslint/no-misused-promises */

export default router;