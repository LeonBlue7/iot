// src/controllers/alarmController.ts
import { Request, Response } from 'express';
import { getAlarms, acknowledgeAlarm, resolveAlarm } from '../services/alarm/index.js';
import { asyncHandler, successResponse } from '../utils/index.js';

export const getAlarmsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { deviceId, status, startTime, endTime, limit, offset } = req.query;

  const result = await getAlarms({
    deviceId: deviceId as string | undefined,
    status: status ? parseInt(status as string, 10) : undefined,
    startTime: startTime ? new Date(startTime as string) : undefined,
    endTime: endTime ? new Date(endTime as string) : undefined,
    limit: limit ? parseInt(limit as string, 10) : 20,
    offset: offset ? parseInt(offset as string, 10) : 0,
  });

  res.json(successResponse(result.data));
  res.setHeader('X-Total-Count', result.total);
});

export const acknowledgeAlarmHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const operator = (req.body?.operator as string) ?? 'user';
    const alarm = await acknowledgeAlarm(
      parseInt(id, 10),
      operator
    );
    res.json(successResponse(alarm, 'Alarm acknowledged'));
  }
);

export const resolveAlarmHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const operator = (req.body?.operator as string) ?? 'user';
    const alarm = await resolveAlarm(parseInt(id, 10), operator);
    res.json(successResponse(alarm, 'Alarm resolved'));
  }
);