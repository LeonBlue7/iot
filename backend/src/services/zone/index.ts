// src/services/zone/index.ts
import prisma from '../../utils/database.js';
import { NotFoundError, BadRequestError, ValidationError } from '../../utils/errors.js';
import type {
  Zone,
  ZoneWithGroups,
  ZoneWithGroupCount,
  ZoneWithGroupCountOnly,
  CreateZoneInput,
  UpdateZoneInput,
} from '../../types/zone.js';

class ZoneService {
  /**
   * 获取所有分区
   */
  async findAll(): Promise<ZoneWithGroupCount[]> {
    return prisma.zone.findMany({
      include: {
        customer: true,
        _count: {
          select: { groups: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据客户ID获取分区
   */
  async findByCustomerId(customerId: number): Promise<ZoneWithGroupCountOnly[]> {
    return prisma.zone.findMany({
      where: { customerId },
      include: {
        _count: {
          select: { groups: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据ID获取分区详情
   */
  async findById(id: number): Promise<ZoneWithGroups | null> {
    return prisma.zone.findUnique({
      where: { id },
      include: { customer: true, groups: true },
    });
  }

  /**
   * 创建分区
   */
  async create(data: CreateZoneInput): Promise<Zone> {
    // 验证名称
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Zone name is required');
    }
    if (data.name.length > 100) {
      throw new ValidationError('Zone name must be at most 100 characters');
    }

    // 检查客户是否存在
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });
    if (!customer) {
      throw new NotFoundError(`Customer ${data.customerId} not found`);
    }

    return prisma.zone.create({
      data: {
        name: data.name.trim(),
        customerId: data.customerId,
      },
    });
  }

  /**
   * 更新分区
   */
  async update(id: number, data: UpdateZoneInput): Promise<Zone> {
    // 检查分区是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Zone ${id} not found`);
    }

    // 验证名称
    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === '') {
        throw new ValidationError('Zone name is required');
      }
      if (data.name.length > 100) {
        throw new ValidationError('Zone name must be at most 100 characters');
      }
    }

    return prisma.zone.update({
      where: { id },
      data: {
        name: data.name?.trim(),
      },
    });
  }

  /**
   * 删除分区
   */
  async delete(id: number): Promise<void> {
    // 检查分区是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Zone ${id} not found`);
    }

    // 检查是否有分组关联
    if (existing.groups.length > 0) {
      throw new BadRequestError('Cannot delete zone with groups');
    }

    await prisma.zone.delete({
      where: { id },
    });
  }
}

export const zoneService = new ZoneService();
export default zoneService;