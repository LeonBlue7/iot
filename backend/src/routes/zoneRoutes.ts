// src/routes/zoneRoutes.ts
import { Router } from 'express';
import {
  getZones,
  getZoneById,
  getZonesByCustomerId,
  createZone,
  updateZone,
  deleteZone,
} from '../controllers/zoneController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 分区CRUD
router.get('/', getZones);
router.get('/customer/:customerId', getZonesByCustomerId);  // 特定路径必须在参数路由之前
router.get('/:id', getZoneById);
router.post('/', createZone);
router.put('/:id', updateZone);
router.delete('/:id', deleteZone);

export default router;