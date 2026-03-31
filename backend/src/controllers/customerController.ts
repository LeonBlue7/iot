// src/controllers/customerController.ts
import { Request, Response } from 'express';
import { z } from 'zod';
import { customerService } from '../services/index.js';
import { asyncHandler, successResponse, NotFoundError } from '../utils/index.js';

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
});

const updateCustomerSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

/**
 * 获取所有客户
 */
export const getCustomers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const customers = await customerService.findAll();
  res.json(successResponse(customers));
});

/**
 * 获取客户详情
 */
export const getCustomerById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);

  if (Number.isNaN(id)) {
    throw new NotFoundError('Invalid customer ID');
  }

  const customer = await customerService.findById(id);

  if (!customer) {
    throw new NotFoundError(`Customer ${id} not found`);
  }

  res.json(successResponse(customer));
});

/**
 * 创建客户
 */
export const createCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = createCustomerSchema.parse(req.body);
  const customer = await customerService.create(data);
  res.status(201).json(successResponse(customer, 'Customer created'));
});

/**
 * 更新客户
 */
export const updateCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);
  const data = updateCustomerSchema.parse(req.body);
  const customer = await customerService.update(id, data);
  res.json(successResponse(customer, 'Customer updated'));
});

/**
 * 删除客户
 */
export const deleteCustomer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id ?? '', 10);
  await customerService.delete(id);
  res.json(successResponse(null, 'Customer deleted'));
});