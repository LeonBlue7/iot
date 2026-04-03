// src/controllers/batchController.ts
import { Response } from 'express';
import { z } from 'zod';
import { deviceService } from '../services/index.js';
import { asyncHandler, successResponse } from '../utils/index.js';
import { AdminRequest } from '../middleware/admin/auth.js';
import type { Request } from 'express';

const batchControlSchema = z.object({
  deviceIds: z.array(z.string().min(1)).min(1, 'At least one device is required'),
  action: z.enum(['on', 'off', 'reset'], {
    errorMap: () => ({ message: 'Invalid action. Must be on, off, or reset' }),
  }),
});

const batchParamsSchema = z.object({
  deviceIds: z.array(z.string().min(1)).min(1, 'At least one device is required'),
  params: z.record(z.union([z.number(), z.null()])).refine((obj) => Object.keys(obj).length > 0, {
    message: 'At least one parameter is required',
  }),
});

const batchMoveSchema = z.object({
  deviceIds: z.array(z.string().min(1)).min(1, 'At least one device is required'),
  targetGroupId: z.number().int().positive('Group ID must be a positive integer'),
});

const batchToggleSchema = z.object({
  deviceIds: z.array(z.string().min(1)).min(1, 'At least one device is required'),
  enabled: z.boolean(),
});

const searchSchema = z.object({
  keyword: z.string().optional(),
  customerId: z.coerce.number().int().positive().optional(),
  zoneId: z.coerce.number().int().positive().optional(),
  groupId: z.coerce.number().int().positive().optional(),
  online: z.enum(['true', 'false']).optional(),
  enabled: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * 批量控制设备
 */
export const batchControl = asyncHandler(
  async (req: AdminRequest, res: Response): Promise<void> => {
    const { deviceIds, action } = batchControlSchema.parse(req.body);
    const operator = req.adminUser?.username || 'system';
    const result = await deviceService.batchControl(deviceIds, action, operator);
    res.json(successResponse(result, 'Batch control completed'));
  }
);

/**
 * 批量更新设备参数
 */
export const batchUpdateParams = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { deviceIds, params } = batchParamsSchema.parse(req.body);
    const result = await deviceService.batchUpdateParams(deviceIds, params);
    res.json(successResponse(result, 'Batch params update completed'));
  }
);

/**
 * 批量移动设备到分组
 */
export const batchMoveToGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { deviceIds, targetGroupId } = batchMoveSchema.parse(req.body);
  const result = await deviceService.batchMoveToGroup(deviceIds, targetGroupId);
  res.json(successResponse(result, 'Batch move completed'));
});

/**
 * 批量切换设备启用状态
 */
export const batchToggleEnabled = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { deviceIds, enabled } = batchToggleSchema.parse(req.body);
    const result = await deviceService.batchToggleEnabled(deviceIds, enabled);
    res.json(successResponse(result, 'Batch toggle completed'));
  }
);

/**
 * 搜索设备
 */
export const searchDevices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const query = searchSchema.parse(req.query);

  const options = {
    keyword: query.keyword,
    customerId: query.customerId,
    zoneId: query.zoneId,
    groupId: query.groupId,
    online: query.online === 'true' ? true : query.online === 'false' ? false : undefined,
    enabled: query.enabled === 'true' ? true : query.enabled === 'false' ? false : undefined,
    page: query.page,
    limit: query.limit,
  };

  const devices = await deviceService.searchDevices(options);
  res.json(successResponse(devices));
});
