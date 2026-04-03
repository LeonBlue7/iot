// src/middleware/admin/tenant.ts
import prisma from '../../utils/database.js';

/**
 * 检查用户是否为超级管理员
 */
export async function isSuperAdmin(userId: number): Promise<boolean> {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  return user?.isSuperAdmin === true;
}

/**
 * 获取用户可访问的客户ID列表
 * 超级管理员返回空数组（表示可访问所有）
 * 普通用户返回分配的客户ID列表
 */
export async function getUserCustomerIds(userId: number): Promise<number[]> {
  // 检查是否为超级管理员
  if (await isSuperAdmin(userId)) {
    return []; // 空数组表示可访问所有客户
  }

  // 获取用户的customerId（主客户）
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { customerId: true },
  });

  // 获取额外分配的客户
  const assignments = await prisma.adminUserCustomer.findMany({
    where: { adminUserId: userId },
    select: { customerId: true },
  });

  const customerIds: number[] = [];

  // 添加主客户
  if (user?.customerId) {
    customerIds.push(user.customerId);
  }

  // 添加额外分配的客户
  for (const assignment of assignments) {
    if (!customerIds.includes(assignment.customerId)) {
      customerIds.push(assignment.customerId);
    }
  }

  return customerIds;
}

/**
 * 检查用户是否有权限访问指定客户
 */
export async function hasTenantAccess(userId: number, customerId: number): Promise<boolean> {
  // 超级管理员可访问所有客户
  if (await isSuperAdmin(userId)) {
    return true;
  }

  const customerIds = await getUserCustomerIds(userId);
  return customerIds.includes(customerId);
}

/**
 * 根据租户权限过滤查询条件
 * 直接修改传入的whereClause对象
 */
export async function filterByTenant(
  whereClause: Record<string, unknown>,
  userId: number
): Promise<void> {
  const customerIds = await getUserCustomerIds(userId);

  // 非超级管理员需要添加客户过滤
  if (customerIds.length > 0) {
    whereClause.customerId = { in: customerIds };
  }
}

/**
 * 租户隔离中间件工厂
 * 返回一个中间件函数，自动过滤请求中的客户数据
 */
export function createTenantFilter(userId: number): {
  getWhereClause: (baseWhere?: Record<string, unknown>) => Promise<Record<string, unknown>>;
  canAccessCustomer: (customerId: number) => Promise<boolean>;
  assertCustomerAccess: (customerId: number) => Promise<void>;
} {
  return {
    /**
     * 获取过滤条件
     */
    async getWhereClause(
      baseWhere: Record<string, unknown> = {}
    ): Promise<Record<string, unknown>> {
      const result = { ...baseWhere };
      await filterByTenant(result, userId);
      return result;
    },

    /**
     * 检查是否可以访问指定客户
     */
    async canAccessCustomer(customerId: number): Promise<boolean> {
      return hasTenantAccess(userId, customerId);
    },

    /**
     * 断言客户访问权限，无权限则抛出异常
     */
    async assertCustomerAccess(customerId: number): Promise<void> {
      const hasAccess = await hasTenantAccess(userId, customerId);
      if (!hasAccess) {
        throw new Error('无权访问该客户数据');
      }
    },
  };
}
