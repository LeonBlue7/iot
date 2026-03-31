// src/controllers/groupController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { groupService } from '../services/index.js';
import { asyncHandler, successResponse, NotFoundError } from '../utils/index.js';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  zoneId: z.number().int().positive('Zone ID must be a positive integer'),
});

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const setDevicesSchema = z.object({
  deviceIds: z.array(z.string()).min(1, 'At least one device is required'),
});

/**
 * 获取所有分组
 */
export const getGroups = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const groups = await groupService.findAll();
  res.json(successResponse(groups));
});

/**
 * 获取分组详情
 */
export const getGroupById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);

  if (Number.isNaN(id)) {
    throw new NotFoundError('Invalid group ID');
  }

  const group = await groupService.findById(id);

  if (!group) {
    throw new NotFoundError(`Group ${id} not found`);
  }

  res.json(successResponse(group));
});

/**
 * 根据分区ID获取分组
 */
export const getGroupsByZoneId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const zoneId = parseInt(req.params.zoneId ?? '', 10);

  if (Number.isNaN(zoneId)) {
    throw new NotFoundError('Invalid zone ID');
  }

  const groups = await groupService.findByZoneId(zoneId);
  res.json(successResponse(groups));
});

/**
 * 创建分组
 */
export const createGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = createGroupSchema.parse(req.body);
  const group = await groupService.create(data);
  res.status(201).json(successResponse(group, 'Group created'));
});

/**
 * 更新分组
 */
export const updateGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);
  const data = updateGroupSchema.parse(req.body);
  const group = await groupService.update(id, data);
  res.json(successResponse(group, 'Group updated'));
});

/**
 * 删除分组
 */
export const deleteGroup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);
  await groupService.delete(id);
  res.json(successResponse(null, 'Group deleted'));
});

/**
 * 设置分组设备
 */
export const setGroupDevices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);

  if (Number.isNaN(id)) {
    throw new NotFoundError('Invalid group ID');
  }

  const group = await groupService.findById(id);
  if (!group) {
    throw new NotFoundError(`Group ${id} not found`);
  }

  const { deviceIds } = setDevicesSchema.parse(req.body);
  await groupService.setGroupDevices(id, deviceIds);
  res.json(successResponse(null, 'Devices assigned to group'));
});