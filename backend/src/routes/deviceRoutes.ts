// src/routes/deviceRoutes.ts
import { Router } from 'express';
import * as deviceController from '../controllers/deviceController.js';

const router = Router();

router.get('/', deviceController.getDevices);
router.get('/:id', deviceController.getDeviceById);
router.get('/:id/realtime', deviceController.getRealtimeData);
router.get('/:id/history', deviceController.getHistoryData);
router.put('/:id', deviceController.updateDevice);
router.post('/:id/control', deviceController.controlDevice);
router.get('/:id/params', deviceController.getDeviceParams);
router.put('/:id/params', deviceController.updateDeviceParams);

export default router;