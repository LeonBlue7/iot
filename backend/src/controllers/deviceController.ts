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
  startTime: z.string().transform((v) => new Date(v)),
  endTime: z.string().transform((v) => new Date(v)),
  limit: z.string().transform((v) => parseInt(v, 10)).optional(),
});

export const getDevices = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const devices = await deviceService.findAll();
  res.json(successResponse(devices));
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
  const data = await deviceService.getHistoryData(id, query.startTime, query.endTime, query.limit ?? 100);
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
    const params = await deviceService.updateParams(id, req.body);
    res.json(successResponse(params, 'Parameters updated'));
  }
);