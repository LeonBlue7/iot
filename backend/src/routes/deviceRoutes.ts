// src/routes/deviceRoutes.ts
import { Router } from 'express';
import * as deviceController from '../controllers/deviceController.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';

const router = Router();

// Read operations - optional authentication (can view without login, but user info available if logged in)
router.get('/', optionalAuth, deviceController.getDevices);
router.get('/:id', optionalAuth, deviceController.getDeviceById);
router.get('/:id/realtime', optionalAuth, deviceController.getRealtimeData);
router.get('/:id/history', optionalAuth, deviceController.getHistoryData);
router.get('/:id/params', optionalAuth, deviceController.getDeviceParams);

// Write operations - require authentication
router.put('/:id', authenticate, deviceController.updateDevice);
router.put('/:id/params', authenticate, deviceController.updateDeviceParams);
router.post('/:id/control', authenticate, deviceController.controlDevice);

export default router;
