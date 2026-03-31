// src/services/customer/index.ts
import prisma from '../../utils/database.js';
import { NotFoundError, BadRequestError, ValidationError } from '../../utils/errors.js';
import type {
  Customer,
  CustomerWithZones,
  CustomerWithZoneCount,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../../types/customer.js';

class CustomerService {
  /**
   * 获取所有客户
   */
  async findAll(): Promise<CustomerWithZoneCount[]> {
    return prisma.customer.findMany({
      include: {
        _count: {
          select: { zones: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据ID获取客户详情
   */
  async findById(id: number): Promise<CustomerWithZones | null> {
    return prisma.customer.findUnique({
      where: { id },
      include: { zones: true },
    });
  }

  /**
   * 创建客户
   */
  async create(data: CreateCustomerInput): Promise<Customer> {
    // 验证名称
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Customer name is required');
    }
    if (data.name.length > 100) {
      throw new ValidationError('Customer name must be at most 100 characters');
    }

    return prisma.customer.create({
      data: {
        name: data.name.trim(),
      },
    });
  }

  /**
   * 更新客户
   */
  async update(id: number, data: UpdateCustomerInput): Promise<Customer> {
    // 检查客户是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Customer ${id} not found`);
    }

    // 验证名称
    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === '') {
        throw new ValidationError('Customer name is required');
      }
      if (data.name.length > 100) {
        throw new ValidationError('Customer name must be at most 100 characters');
      }
    }

    return prisma.customer.update({
      where: { id },
      data: {
        name: data.name?.trim(),
      },
    });
  }

  /**
   * 删除客户
   */
  async delete(id: number): Promise<void> {
    // 检查客户是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Customer ${id} not found`);
    }

    // 检查是否有分区关联
    if (existing.zones.length > 0) {
      throw new BadRequestError('Cannot delete customer with zones');
    }

    await prisma.customer.delete({
      where: { id },
    });
  }
}

export const customerService = new CustomerService();
export default customerService;