// src/routes/customerRoutes.ts
import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 客户CRUD
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;