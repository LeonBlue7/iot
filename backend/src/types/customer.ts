// src/types/customer.ts
import type { Prisma } from '@prisma/client';

// 基础客户类型（从 Prisma 生成）
export type Customer = Prisma.CustomerGetPayload<Record<string, never>>;

// 包含分区的客户类型
export type CustomerWithZones = Prisma.CustomerGetPayload<{
  include: { zones: true };
}>;

// 包含分区数量的客户类型
export type CustomerWithZoneCount = Prisma.CustomerGetPayload<{
  include: { _count: { select: { zones: true } } };
}>;

// 创建客户输入
export interface CreateCustomerInput {
  name: string;
}

// 更新客户输入
export interface UpdateCustomerInput {
  name?: string;
}