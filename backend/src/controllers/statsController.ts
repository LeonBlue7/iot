// src/controllers/statsController.ts
import { Request, Response } from 'express';
import { getOverviewStats, getTrendData, getDailyStats } from '../services/stats/index.js';
import { asyncHandler, successResponse } from '../utils/index.js';

export const getOverviewStatsHandler = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const stats = await getOverviewStats();
    res.json(successResponse(stats));
  }
);

export const getTrendDataHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { deviceId, metric, startTime, endTime } = req.query;

    if (!deviceId || !metric || !startTime || !endTime) {
      res.status(400).json({ success: false, error: 'Missing required parameters' });
      return;
    }

    const data = await getTrendData(
      deviceId as string,
      metric as 'temperature' | 'humidity' | 'current',
      new Date(startTime as string),
      new Date(endTime as string)
    );

    res.json(successResponse(data));
  }
);

export const getDailyStatsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { deviceId, date } = req.query;

    if (!deviceId || !date) {
      res.status(400).json({ success: false, error: 'Missing required parameters' });
      return;
    }

    const stats = await getDailyStats(deviceId as string, new Date(date as string));
    res.json(successResponse(stats));
  }
);