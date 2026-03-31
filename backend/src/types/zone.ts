// src/types/zone.ts
import type { Prisma } from '@prisma/client';

// 基础分区类型（从 Prisma 生成）
export type Zone = Prisma.ZoneGetPayload<Record<string, never>>;

// 包含分组的分区类型
export type ZoneWithGroups = Prisma.ZoneGetPayload<{
  include: { customer: true; groups: true };
}>;

// 包含分组数量的分区类型
export type ZoneWithGroupCount = Prisma.ZoneGetPayload<{
  include: { customer: true; _count: { select: { groups: true } } };
}>;

// 仅包含分组数量的分区类型（不包含customer）
export type ZoneWithGroupCountOnly = Prisma.ZoneGetPayload<{
  include: { _count: { select: { groups: true } } };
}>;

// 创建分区输入
export interface CreateZoneInput {
  name: string;
  customerId: number;
}

// 更新分区输入
export interface UpdateZoneInput {
  name?: string;
}