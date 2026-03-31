// src/routes/batchRoutes.ts
import { Router } from 'express';
import {
  batchControl,
  batchUpdateParams,
  batchMoveToGroup,
  batchToggleEnabled,
  searchDevices,
} from '../controllers/batchController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有路由需要认证
router.use(authenticate);

// 批量操作
router.post('/control', batchControl);
router.post('/params', batchUpdateParams);
router.post('/move', batchMoveToGroup);
router.post('/toggle', batchToggleEnabled);

// 搜索
router.get('/search', searchDevices);

export default router;