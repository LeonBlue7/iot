// src/controllers/zoneController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { zoneService } from '../services/index.js';
import { asyncHandler, successResponse, NotFoundError } from '../utils/index.js';

const createZoneSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  customerId: z.number().int().positive('Customer ID must be a positive integer'),
});

const updateZoneSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

/**
 * 获取所有分区
 */
export const getZones = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const zones = await zoneService.findAll();
  res.json(successResponse(zones));
});

/**
 * 获取分区详情
 */
export const getZoneById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);

  if (Number.isNaN(id)) {
    throw new NotFoundError('Invalid zone ID');
  }

  const zone = await zoneService.findById(id);

  if (!zone) {
    throw new NotFoundError(`Zone ${id} not found`);
  }

  res.json(successResponse(zone));
});

/**
 * 根据客户ID获取分区
 */
export const getZonesByCustomerId = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const customerId = parseInt(req.params.customerId ?? '', 10);

    if (Number.isNaN(customerId)) {
      throw new NotFoundError('Invalid customer ID');
    }

    const zones = await zoneService.findByCustomerId(customerId);
    res.json(successResponse(zones));
  }
);

/**
 * 创建分区
 */
export const createZone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = createZoneSchema.parse(req.body);
  const zone = await zoneService.create(data);
  res.status(201).json(successResponse(zone, 'Zone created'));
});

/**
 * 更新分区
 */
export const updateZone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);
  const data = updateZoneSchema.parse(req.body);
  const zone = await zoneService.update(id, data);
  res.json(successResponse(zone, 'Zone updated'));
});

/**
 * 删除分区
 */
export const deleteZone = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);
  await zoneService.delete(id);
  res.json(successResponse(null, 'Zone deleted'));
});