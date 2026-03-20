// src/routes/statsRoutes.ts
import { Router } from 'express';
import * as statsController from '../controllers/statsController.js';

const router = Router();

router.get('/overview', statsController.getOverviewStatsHandler);
router.get('/trend', statsController.getTrendDataHandler);
router.get('/daily', statsController.getDailyStatsHandler);

export default router;