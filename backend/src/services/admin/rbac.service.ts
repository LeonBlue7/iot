// src/services/admin/rbac.service.ts
import prisma from '../../utils/database.js';
import redis from '../../utils/redis.js';
import { logger } from '../../utils/logger.js';

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

// 权限缓存键前缀和过期时间
const PERMISSION_CACHE_PREFIX = 'admin:permissions:';
const PERMISSION_CACHE_TTL = 5 * 60; // 5 分钟

const ROLES_CACHE_KEY = 'admin:roles';
const ROLES_CACHE_TTL = 10 * 60; // 10 分钟

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  // 全局通配符
  if (userPermissions.includes('*')) {
    return true;
  }

  // 精确匹配
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // 通配符匹配 (e.g., device:* matches device:read)
  const [resource, action] = requiredPermission.split(':');
  const wildcardPermission = `${resource}:*`;
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }

  // 资源级别通配符 (e.g., *:read matches device:read)
  const resourceWildcard = `*:${action}`;
  if (userPermissions.includes(resourceWildcard)) {
    return true;
  }

  return false;
}

/**
 * 检查用户是否拥有所有指定权限
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(perm => hasPermission(userPermissions, perm));
}

/**
 * 检查用户是否拥有至少一个指定权限
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(perm => hasPermission(userPermissions, perm));
}

/**
 * 获取角色的有效权限集合
 */
export function getEffectivePermissions(roleIds: number[], roles: Record<number, Role>): string[] {
  const permissions = new Set<string>();

  for (const roleId of roleIds) {
    const role = roles[roleId];
    if (role) {
      role.permissions.forEach(perm => permissions.add(perm));
    }
  }

  return Array.from(permissions);
}

/**
 * 从数据库加载角色
 */
export async function loadRoles(): Promise<Record<number, Role>> {
  const roles = await prisma.adminRole.findMany();

  const rolesMap: Record<number, Role> = {};
  for (const role of roles) {
    rolesMap[role.id] = {
      id: role.id,
      name: role.name,
      permissions: role.permissions,
    };
  }

  return rolesMap;
}

/**
 * 从缓存获取角色（10 分钟过期）
 */
export async function getCachedRoles(): Promise<Record<number, Role>> {
  try {
    const cached = await redis.get(ROLES_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as Record<number, Role>;
    }

    // 从数据库加载
    const roles = await loadRoles();

    // 写入缓存
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await redis.setex(ROLES_CACHE_KEY, ROLES_CACHE_TTL, JSON.stringify(roles));

    return roles;
  } catch (error) {
    logger.error('Failed to get cached roles', { error: error instanceof Error ? error.message : 'Unknown error' });
    // 降级：直接查数据库
    return loadRoles();
  }
}

/**
 * 清除角色缓存（在角色更新时调用）
 */
export async function invalidateRolesCache(): Promise<void> {
  try {
    await redis.del(ROLES_CACHE_KEY);
    logger.info('Roles cache invalidated');
  } catch (error) {
    logger.error('Failed to invalidate roles cache', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * 清除用户权限缓存
 */
export async function invalidateUserPermissionsCache(adminUserId: number): Promise<void> {
  try {
    await redis.del(`${PERMISSION_CACHE_PREFIX}${adminUserId}`);
    logger.info(`User permissions cache invalidated for user ${adminUserId}`);
  } catch (error) {
    logger.error('Failed to invalidate user permissions cache', { adminUserId, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * 获取用户的权限（从数据库加载角色）
 * 使用 Redis 缓存 5 分钟
 */
export async function getUserPermissions(adminUserId: number): Promise<string[]> {
  const cacheKey = `${PERMISSION_CACHE_PREFIX}${adminUserId}`;

  try {
    // 尝试从缓存获取
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    // 从数据库加载
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: { roleIds: true },
    });

    if (!adminUser) {
      return [];
    }

    // 使用缓存的角色数据
    const roles = await getCachedRoles();
    const permissions = getEffectivePermissions(adminUser.roleIds, roles);

    // 写入缓存
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await redis.setex(cacheKey, PERMISSION_CACHE_TTL, JSON.stringify(permissions));

    return permissions;
  } catch (error) {
    logger.error('Failed to get user permissions', { adminUserId, error: error instanceof Error ? error.message : 'Unknown error' });
    // 降级：直接查数据库
    return getUserPermissionsFallback(adminUserId);
  }
}

/**
 * 降级获取权限（无缓存）
 */
async function getUserPermissionsFallback(adminUserId: number): Promise<string[]> {
  const adminUser = await prisma.adminUser.findUnique({
    where: { id: adminUserId },
    select: { roleIds: true },
  });

  if (!adminUser) {
    return [];
  }

  const roles = await loadRoles();
  return getEffectivePermissions(adminUser.roleIds, roles);
}
