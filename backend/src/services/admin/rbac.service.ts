// src/services/admin/rbac.service.ts
import prisma from '../../utils/database.js';

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

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
 * 从数据库加载角色和权限
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
 * 获取用户的权限（从数据库加载角色）
 */
export async function getUserPermissions(adminUserId: number): Promise<string[]> {
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
