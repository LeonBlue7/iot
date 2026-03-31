// src/types/group.ts
import type { Prisma } from '@prisma/client';

// 基础分组类型（从 Prisma 生成）
export type Group = Prisma.GroupGetPayload<Record<string, never>>;

// 包含设备的分组类型
export type GroupWithDevices = Prisma.GroupGetPayload<{
  include: { zone: true; devices: true };
}>;

// 包含设备数量的分组类型
export type GroupWithDeviceCount = Prisma.GroupGetPayload<{
  include: { zone: true; _count: { select: { devices: true } } };
}>;

// 仅包含设备数量的分组类型（不包含zone）
export type GroupWithDeviceCountOnly = Prisma.GroupGetPayload<{
  include: { _count: { select: { devices: true } } };
}>;

// 创建分组输入
export interface CreateGroupInput {
  name: string;
  zoneId: number;
}

// 更新分组输入
export interface UpdateGroupInput {
  name?: string;
}