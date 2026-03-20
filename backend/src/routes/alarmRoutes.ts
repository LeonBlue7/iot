// src/routes/alarmRoutes.ts
import { Router } from 'express';
import * as alarmController from '../controllers/alarmController.js';

const router = Router();

router.get('/', alarmController.getAlarmsHandler);
router.put('/:id/acknowledge', alarmController.acknowledgeAlarmHandler);
router.put('/:id/resolve', alarmController.resolveAlarmHandler);

export default router;