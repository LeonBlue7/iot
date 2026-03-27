// src/services/group/index.ts
import prisma from '../../utils/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import type {
  DeviceGroup,
  CreateGroupInput,
  UpdateGroupInput,
  GroupWithDevices,
} from '../../types/group.js';

class GroupService {
  /**
   * 获取所有分组
   */
  async findAll(): Promise<(DeviceGroup & { _count: { devices: number } })[]> {
    return prisma.deviceGroup.findMany({
      include: {
        _count: {
          select: { devices: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * 根据ID获取分组详情
   */
  async findById(id: number): Promise<GroupWithDevices | null> {
    return prisma.deviceGroup.findUnique({
      where: { id },
      include: {
        devices: true,
      },
    });
  }

  /**
   * 创建分组
   */
  async create(data: CreateGroupInput): Promise<DeviceGroup> {
    return prisma.deviceGroup.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  /**
   * 更新分组
   */
  async update(id: number, data: UpdateGroupInput): Promise<DeviceGroup> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Group ${id} not found`);
    }

    return prisma.deviceGroup.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder,
      },
    });
  }

  /**
   * 删除分组
   */
  async delete(id: number): Promise<void> {
    // 检查是否有设备关联
    const deviceCount = await prisma.device.count({
      where: { groupId: id },
    });

    if (deviceCount > 0) {
      throw new BadRequestError('Cannot delete group with devices');
    }

    await prisma.deviceGroup.delete({
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