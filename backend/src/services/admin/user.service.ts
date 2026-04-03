// src/services/admin/user.service.ts
import prisma from '../../utils/database.js';
import { hashPassword } from './auth.service.js';
import { isSuperAdmin, getUserCustomerIds } from '../../middleware/admin/tenant.js';
import type { AdminUser } from '@prisma/client';

// Return types for user queries
type UserSelectResult = Pick<
  AdminUser,
  | 'id'
  | 'username'
  | 'email'
  | 'name'
  | 'customerId'
  | 'isSuperAdmin'
  | 'roleIds'
  | 'enabled'
  | 'createdAt'
>;

type UserDetailResult = Pick<
  AdminUser,
  | 'id'
  | 'username'
  | 'email'
  | 'name'
  | 'customerId'
  | 'isSuperAdmin'
  | 'roleIds'
  | 'enabled'
  | 'lastLoginAt'
  | 'createdAt'
  | 'updatedAt'
> & {
  customer: { id: number; name: string } | null;
  customerAssignments: Array<{
    customerId: number;
    role: string;
    customer: { id: number; name: string };
  }>;
};

type UserListResult = Pick<
  AdminUser,
  | 'id'
  | 'username'
  | 'email'
  | 'name'
  | 'customerId'
  | 'isSuperAdmin'
  | 'enabled'
  | 'lastLoginAt'
  | 'createdAt'
> & {
  customer: { id: number; name: string } | null;
};

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  name?: string;
  customerId?: number;
  isSuperAdmin?: boolean;
  roleIds?: number[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  enabled?: boolean;
  customerId?: number;
  isSuperAdmin?: boolean;
  roleIds?: number[];
}

export interface UserQueryOptions {
  requesterId: number;
  customerId?: number;
  enabled?: boolean;
  search?: string;
}

/**
 * 创建用户
 */
export async function createUser(data: CreateUserData): Promise<UserSelectResult> {
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.adminUser.create({
    data: {
      username: data.username,
      email: data.email,
      passwordHash,
      name: data.name,
      customerId: data.customerId || null,
      isSuperAdmin: data.isSuperAdmin || false,
      roleIds: data.roleIds || [],
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      customerId: true,
      isSuperAdmin: true,
      roleIds: true,
      enabled: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * 获取用户详情
 */
export async function getUserById(id: number): Promise<UserDetailResult | null> {
  const user = await prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      customerId: true,
      isSuperAdmin: true,
      roleIds: true,
      enabled: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: { id: true, name: true },
      },
      customerAssignments: {
        select: {
          customerId: true,
          role: true,
          customer: { select: { id: true, name: true } },
        },
      },
    },
  });

  return user;
}

/**
 * 获取用户列表
 */
export async function getUsers(options: UserQueryOptions): Promise<UserListResult[]> {
  const whereClause: Record<string, unknown> = {};

  // 租户过滤：非超级管理员只能看到自己客户的用户
  const isSuper = await isSuperAdmin(options.requesterId);
  if (!isSuper) {
    const customerIds = await getUserCustomerIds(options.requesterId);
    whereClause.AND = [
      {
        OR: [
          { customerId: { in: customerIds } },
          { id: options.requesterId }, // 可以看到自己
        ],
      },
    ];
  }

  // 其他过滤条件
  if (options.customerId) {
    whereClause.customerId = options.customerId;
  }
  if (options.enabled !== undefined) {
    whereClause.enabled = options.enabled;
  }
  if (options.search) {
    // 搜索条件与租户过滤使用AND组合，不会绕过租户隔离
    whereClause.OR = [
      { username: { contains: options.search, mode: 'insensitive' } },
      { email: { contains: options.search, mode: 'insensitive' } },
      { name: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.adminUser.findMany({
    where: whereClause,
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      customerId: true,
      isSuperAdmin: true,
      enabled: true,
      lastLoginAt: true,
      createdAt: true,
      customer: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
}

/**
 * 更新用户
 */
export async function updateUser(
  id: number,
  data: UpdateUserData,
  options?: { requesterId?: number }
): Promise<UserSelectResult> {
  // 权限检查：非超级管理员不能将用户升级为超级管理员
  if (data.isSuperAdmin === true && options?.requesterId) {
    const isSuper = await isSuperAdmin(options.requesterId);
    if (!isSuper) {
      throw new Error('只有超级管理员可以创建或升级超级管理员');
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;
  if (data.customerId !== undefined) updateData.customerId = data.customerId;
  if (data.isSuperAdmin !== undefined) updateData.isSuperAdmin = data.isSuperAdmin;
  if (data.roleIds !== undefined) updateData.roleIds = data.roleIds;
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
  }

  const user = await prisma.adminUser.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      customerId: true,
      isSuperAdmin: true,
      roleIds: true,
      enabled: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * 删除用户
 */
export async function deleteUser(id: number): Promise<void> {
  await prisma.adminUser.delete({
    where: { id },
  });
}

/**
 * 给用户分配客户
 */
export async function assignCustomerToUser(
  adminUserId: number,
  customerId: number,
  role: 'viewer' | 'editor' | 'admin' = 'viewer'
): Promise<{
  id: number;
  adminUserId: number;
  customerId: number;
  role: string;
  customer: { id: number; name: string };
}> {
  const assignment = await prisma.adminUserCustomer.create({
    data: {
      adminUserId,
      customerId,
      role,
    },
    select: {
      id: true,
      adminUserId: true,
      customerId: true,
      role: true,
      customer: { select: { id: true, name: true } },
    },
  });

  return assignment;
}

/**
 * 移除用户的客户分配
 */
export async function removeCustomerFromUser(
  adminUserId: number,
  customerId: number
): Promise<void> {
  await prisma.adminUserCustomer.delete({
    where: {
      adminUserId_customerId: {
        adminUserId,
        customerId,
      },
    },
  });
}

/**
 * 获取用户分配的所有客户
 */
export async function getUserCustomers(
  adminUserId: number
): Promise<Array<{ id: number; name: string; role: string }>> {
  // 获取用户的customerId（主客户）
  const user = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { customerId: true, customer: { select: { id: true, name: true } } },
  });

  // 获取额外分配的客户
  const assignments = await prisma.adminUserCustomer.findMany({
    where: { adminUserId },
    select: {
      role: true,
      customer: { select: { id: true, name: true } },
    },
  });

  const customers: Array<{ id: number; name: string; role: string }> = [];

  // 添加主客户
  if (user?.customer) {
    customers.push({
      id: user.customer.id,
      name: user.customer.name,
      role: 'primary',
    });
  }

  // 添加额外分配的客户
  for (const assignment of assignments) {
    if (assignment.customer) {
      customers.push({
        id: assignment.customer.id,
        name: assignment.customer.name,
        role: assignment.role,
      });
    }
  }

  return customers;
}
