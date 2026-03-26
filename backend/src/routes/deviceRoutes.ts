// src/routes/deviceRoutes.ts
import { Router } from 'express';
import * as deviceController from '../controllers/deviceController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All operations require authentication
router.get('/', authenticate, deviceController.getDevices);
router.get('/:id', authenticate, deviceController.getDeviceById);
router.get('/:id/realtime', authenticate, deviceController.getRealtimeData);
router.get('/:id/history', authenticate, deviceController.getHistoryData);
router.get('/:id/params', authenticate, deviceController.getDeviceParams);

// Write operations - require authentication
router.put('/:id', authenticate, deviceController.updateDevice);
router.put('/:id/params', authenticate, deviceController.updateDeviceParams);
router.post('/:id/control', authenticate, deviceController.controlDevice);

export default router;
