// src/types/group.ts
import type { Prisma } from '@prisma/client';

// 基础分组类型（从 Prisma 生成）
export type DeviceGroup = Prisma.DeviceGroupGetPayload<Record<string, never>>;

// 包含设备的分组类型
export type GroupWithDevices = Prisma.DeviceGroupGetPayload<{
  include: { devices: true };
}>;

// 创建分组输入
export interface CreateGroupInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
}

// 更新分组输入
export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  sortOrder?: number;
}