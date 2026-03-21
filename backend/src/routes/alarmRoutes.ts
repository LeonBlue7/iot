// src/routes/alarmRoutes.ts
import { Router } from 'express';
import * as alarmController from '../controllers/alarmController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All alarm operations require authentication
router.get('/', authenticate, alarmController.getAlarmsHandler);
router.put('/:id/acknowledge', authenticate, alarmController.acknowledgeAlarmHandler);
router.put('/:id/resolve', authenticate, alarmController.resolveAlarmHandler);

export default router;
