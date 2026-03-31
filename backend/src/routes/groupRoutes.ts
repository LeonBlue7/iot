// src/routes/groupRoutes.ts
import { Router } from 'express';
import * as groupController from '../controllers/groupController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 所有路由都需要认证
router.get('/', authenticate, groupController.getGroups);
router.get('/zone/:zoneId', authenticate, groupController.getGroupsByZoneId);
router.get('/:id', authenticate, groupController.getGroupById);
router.post('/', authenticate, groupController.createGroup);
router.put('/:id', authenticate, groupController.updateGroup);
router.delete('/:id', authenticate, groupController.deleteGroup);
router.put('/:id/devices', authenticate, groupController.setGroupDevices);

export default router;