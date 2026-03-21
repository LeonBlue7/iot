// src/routes/statsRoutes.ts
import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All stats operations require authentication
router.get('/overview', authenticate, statsController.getOverviewStatsHandler);
router.get('/trend', authenticate, statsController.getTrendDataHandler);
router.get('/daily', authenticate, statsController.getDailyStatsHandler);

export default router;
