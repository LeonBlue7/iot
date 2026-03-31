// src/services/group/index.ts
import prisma from '../../utils/database.js';
import { NotFoundError, BadRequestError, ValidationError } from '../../utils/errors.js';
import type {
  Group,
  GroupWithDevices,
  GroupWithDeviceCount,
  GroupWithDeviceCountOnly,
  CreateGroupInput,
  UpdateGroupInput,
} from '../../types/group.js';

class GroupService {
  /**
   * 获取所有分组
   */
  async findAll(): Promise<GroupWithDeviceCount[]> {
    return prisma.group.findMany({
      include: {
        zone: true,
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据分区ID获取分组
   */
  async findByZoneId(zoneId: number): Promise<GroupWithDeviceCountOnly[]> {
    return prisma.group.findMany({
      where: { zoneId },
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 根据ID获取分组详情
   */
  async findById(id: number): Promise<GroupWithDevices | null> {
    return prisma.group.findUnique({
      where: { id },
      include: { zone: true, devices: true },
    });
  }

  /**
   * 创建分组
   */
  async create(data: CreateGroupInput): Promise<Group> {
    // 验证名称
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('Group name is required');
    }
    if (data.name.length > 100) {
      throw new ValidationError('Group name must be at most 100 characters');
    }

    // 检查分区是否存在
    const zone = await prisma.zone.findUnique({
      where: { id: data.zoneId },
    });
    if (!zone) {
      throw new NotFoundError(`Zone ${data.zoneId} not found`);
    }

    return prisma.group.create({
      data: {
        name: data.name.trim(),
        zoneId: data.zoneId,
      },
    });
  }

  /**
   * 更新分组
   */
  async update(id: number, data: UpdateGroupInput): Promise<Group> {
    // 检查分组是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Group ${id} not found`);
    }

    // 验证名称
    if (data.name !== undefined) {
      if (!data.name || data.name.trim() === '') {
        throw new ValidationError('Group name is required');
      }
      if (data.name.length > 100) {
        throw new ValidationError('Group name must be at most 100 characters');
      }
    }

    return prisma.group.update({
      where: { id },
      data: {
        name: data.name?.trim(),
      },
    });
  }

  /**
   * 删除分组
   */
  async delete(id: number): Promise<void> {
    // 检查分组是否存在
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Group ${id} not found`);
    }

    // 检查是否有设备关联
    if (existing.devices.length > 0) {
      throw new BadRequestError('Cannot delete group with devices');
    }

    await prisma.group.delete({
      where: { id },
    });
  }

  /**
   * 设置分组设备
   */
  async setGroupDevices(groupId: number, deviceIds: string[]): Promise<void> {
    await prisma.device.updateMany({
      where: { id: { in: deviceIds } },
      data: { groupId },
    });
  }

  /**
   * 从分组移除设备
   */
  async removeDevicesFromGroup(deviceIds: string[]): Promise<void> {
    await prisma.device.updateMany({
      where: { id: { in: deviceIds } },
      data: { groupId: null },
    });
  }
}

export const groupService = new GroupService();
export default groupService;