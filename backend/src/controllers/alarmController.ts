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

  // 设置响应头必须在 res.json() 之前
  res.setHeader('X-Total-Count', result.total);
  res.json(successResponse(result.data));
});

export const acknowledgeAlarmHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.id;
    const id = parseInt(idParam ?? '', 10);

    // 验证 ID 有效性
    if (!idParam || isNaN(id)) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Alarm ${req.params.id} not found`,
      });
      return;
    }

    const operator = getOperatorFromBody((req.body as Record<string, unknown>)?.operator);
    const alarm = await acknowledgeAlarm(id, operator);
    res.json(successResponse(alarm, 'Alarm acknowledged'));
  }
);

export const resolveAlarmHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const idParam = req.params.id;
    const id = parseInt(idParam ?? '', 10);

    // 验证 ID 有效性
    if (!idParam || isNaN(id)) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Alarm ${req.params.id} not found`,
      });
      return;
    }

    const operator = getOperatorFromBody((req.body as Record<string, unknown>)?.operator);
    const alarm = await resolveAlarm(id, operator);
    res.json(successResponse(alarm, 'Alarm resolved'));
  }
);

/**
 * 从请求体中获取操作者名称
 * 如果未提供则返回默认值'user'
 */
function getOperatorFromBody(operator: unknown): string {
  if (typeof operator === 'string' && operator.length > 0) {
    return operator;
  }
  return 'user';
}