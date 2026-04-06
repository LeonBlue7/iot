// src/controllers/deviceController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { deviceService } from '../services/index.js';
import { asyncHandler, successResponse, NotFoundError } from '../utils/index.js';

const updateDeviceSchema = z.object({
  name: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
});

const controlSchema = z.object({
  action: z.enum(['on', 'off', 'reset']),
});

const historyQuerySchema = z.object({
  startTime: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  endTime: z
    .string()
    .transform((v) => new Date(v))
    .optional(),
  limit: z
    .string()
    .transform((v) => {
      const parsed = parseInt(v, 10);
      if (Number.isNaN(parsed)) {
        throw new Error('limit must be a valid integer');
      }
      return parsed;
    })
    .refine((v) => v >= 1 && v <= 1000, 'limit must be between 1 and 1000')
    .optional()
    .default('100'),
});

const listQuerySchema = z.object({
  page: z
    .string()
    .transform((v) => {
      const parsed = parseInt(v, 10);
      if (Number.isNaN(parsed)) {
        throw new Error('page must be a valid integer');
      }
      return parsed;
    })
    .refine((v) => v >= 1, 'page must be greater than or equal to 1')
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((v) => {
      const parsed = parseInt(v, 10);
      if (Number.isNaN(parsed)) {
        throw new Error('limit must be a valid integer');
      }
      return parsed;
    })
    .refine((v) => v >= 1 && v <= 100, 'limit must be between 1 and 100')
    .optional()
    .default('50'),
  online: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  includeRealtime: z
    .string()
    .transform((v) => v === 'true')
    .optional()
    .default('true'),
});

export const getDevices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = listQuerySchema.parse(req.query);

  const page = Math.max(1, query.page);
  const limit = Math.min(100, Math.max(1, query.limit));

  const result = await deviceService.findAll({
    page,
    limit,
    online: query.online,
    includeRealtime: query.includeRealtime,
  });

  res.json({
    success: true,
    data: result.devices,
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

export const getDeviceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const device = await deviceService.findById(id);
  if (!device) {
    throw new NotFoundError(`Device ${id} not found`);
  }
  res.json(successResponse(device));
});

export const getRealtimeData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = await deviceService.getLatestData(id);
  res.json(successResponse(data));
});

export const getHistoryData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const query = historyQuerySchema.parse(req.query);

  // 如果没有提供时间范围，默认查询最近 1 小时
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const startTime = query.startTime || oneHourAgo;
  const endTime = query.endTime || now;
  const limit = query.limit || 100;

  const data = await deviceService.getHistoryData(id, startTime, endTime, limit);
  res.json(successResponse(data));
});

export const updateDevice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const data = updateDeviceSchema.parse(req.body);
  const device = await deviceService.update(id, data);
  res.json(successResponse(device, 'Device updated'));
});

export const controlDevice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { action } = controlSchema.parse(req.body);
  await deviceService.controlDevice(id, action ?? 'on', 'user');
  res.json(successResponse(null, `Control command ${action} sent`));
});

export const getDeviceParams = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const params = await deviceService.getParams(id);
  res.json(successResponse(params));
});

export const updateDeviceParams = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const params = await deviceService.updateParams(id, req.body as Record<string, unknown>);
    res.json(successResponse(params, 'Parameters updated'));
  }
);
