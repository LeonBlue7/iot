// tests/services/admin/rbac.test.ts
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getEffectivePermissions,
  loadRoles,
  getCachedRoles,
  invalidateRolesCache,
  invalidateUserPermissionsCache,
  getUserPermissions,
} from '../../../src/services/admin/rbac.service.js';
import prisma from '../../../src/utils/database.js';
import redis from '../../../src/utils/redis.js';

// Mock prisma
jest.mock('../../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    adminRole: {
      findMany: jest.fn(),
    },
    adminUser: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock redis
jest.mock('../../../src/utils/redis.js', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Admin RBAC Service', () => {
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;
  const mockRedis = redis as jest.Mocked<typeof redis>;

  const mockRoles = {
    1: { id: 1, name: 'super_admin', permissions: ['*'] },
    2: { id: 2, name: 'operator', permissions: ['device:*', 'user:read'] },
    3: { id: 3, name: 'viewer', permissions: ['*:read'] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('hasPermission', () => {
    it('should grant access when user has exact permission', () => {
      const userPermissions = ['device:read', 'device:write'];
      expect(hasPermission(userPermissions, 'device:read')).toBe(true);
    });

    it('should grant access when user has wildcard permission', () => {
      const userPermissions = ['device:*'];
      expect(hasPermission(userPermissions, 'device:read')).toBe(true);
      expect(hasPermission(userPermissions, 'device:write')).toBe(true);
      expect(hasPermission(userPermissions, 'device:delete')).toBe(true);
    });

    it('should grant access when user has global wildcard', () => {
      const userPermissions = ['*'];
      expect(hasPermission(userPermissions, 'device:read')).toBe(true);
      expect(hasPermission(userPermissions, 'user:write')).toBe(true);
      expect(hasPermission(userPermissions, 'system:delete')).toBe(true);
    });

    it('should grant access when user has action-level wildcard', () => {
      const userPermissions = ['*:read'];
      expect(hasPermission(userPermissions, 'device:read')).toBe(true);
      expect(hasPermission(userPermissions, 'user:read')).toBe(true);
      expect(hasPermission(userPermissions, 'alarm:read')).toBe(true);
    });

    it('should deny access when user lacks permission', () => {
      const userPermissions = ['device:read'];
      expect(hasPermission(userPermissions, 'device:write')).toBe(false);
      expect(hasPermission(userPermissions, 'user:read')).toBe(false);
    });

    it('should deny access for non-matching wildcards', () => {
      const userPermissions = ['device:read'];
      expect(hasPermission(userPermissions, 'device:write')).toBe(false);
    });

    it('should deny access when permission array is empty', () => {
      expect(hasPermission([], 'device:read')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all required permissions', () => {
      const userPermissions = ['device:read', 'device:write', 'user:read'];
      expect(hasAllPermissions(userPermissions, ['device:read', 'user:read'])).toBe(true);
    });

    it('should return false when user lacks any required permission', () => {
      const userPermissions = ['device:read', 'device:write'];
      expect(hasAllPermissions(userPermissions, ['device:read', 'user:read'])).toBe(false);
    });

    it('should return true for empty required permissions', () => {
      const userPermissions = ['device:read'];
      expect(hasAllPermissions(userPermissions, [])).toBe(true);
    });

    it('should work with wildcard permissions', () => {
      const userPermissions = ['device:*'];
      expect(hasAllPermissions(userPermissions, ['device:read', 'device:write'])).toBe(true);
    });

    it('should return false when user has no permissions', () => {
      expect(hasAllPermissions([], ['device:read'])).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one required permission', () => {
      const userPermissions = ['device:read', 'device:write'];
      expect(hasAnyPermission(userPermissions, ['device:read', 'user:read'])).toBe(true);
    });

    it('should return false when user has none of the required permissions', () => {
      const userPermissions = ['device:read'];
      expect(hasAnyPermission(userPermissions, ['user:read', 'user:write'])).toBe(false);
    });

    it('should return false for empty required permissions', () => {
      const userPermissions = ['device:read'];
      expect(hasAnyPermission(userPermissions, [])).toBe(false);
    });

    it('should return false when user has no permissions', () => {
      expect(hasAnyPermission([], ['device:read'])).toBe(false);
    });

    it('should work with wildcard permissions', () => {
      const userPermissions = ['*'];
      expect(hasAnyPermission(userPermissions, ['device:read', 'user:write'])).toBe(true);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return combined permissions from all roles', () => {
      const roleIds = [2, 3]; // operator + viewer
      const permissions = getEffectivePermissions(roleIds, mockRoles as any);
      expect(permissions).toContain('device:*');
      expect(permissions).toContain('user:read');
      expect(permissions).toContain('*:read');
    });

    it('should return empty array for unknown roles', () => {
      const permissions = getEffectivePermissions([999], mockRoles as any);
      expect(permissions).toEqual([]);
    });

    it('should handle empty role list', () => {
      const permissions = getEffectivePermissions([], mockRoles as any);
      expect(permissions).toEqual([]);
    });

    it('should deduplicate permissions', () => {
      const rolesWithDupes = {
        1: { id: 1, name: 'role1', permissions: ['device:read', 'user:read'] },
        2: { id: 2, name: 'role2', permissions: ['device:read', 'alarm:read'] },
      };
      const permissions = getEffectivePermissions([1, 2], rolesWithDupes as any);
      expect(permissions.filter(p => p === 'device:read')).toHaveLength(1);
    });

    it('should handle super admin wildcard', () => {
      const permissions = getEffectivePermissions([1], mockRoles as any);
      expect(permissions).toContain('*');
    });

    it('should combine multiple roles correctly', () => {
      const roles = {
        1: { id: 1, name: 'role1', permissions: ['a:read'] },
        2: { id: 2, name: 'role2', permissions: ['b:write'] },
        3: { id: 3, name: 'role3', permissions: ['c:delete'] },
      };
      const permissions = getEffectivePermissions([1, 2, 3], roles as any);
      expect(permissions).toHaveLength(3);
      expect(permissions).toContain('a:read');
      expect(permissions).toContain('b:write');
      expect(permissions).toContain('c:delete');
    });
  });

  describe('loadRoles', () => {
    it('should successfully load roles from database', async () => {
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
        { id: 2, name: 'operator', permissions: ['device:*', 'user:read'] },
        { id: 3, name: 'viewer', permissions: ['*:read'] },
      ];

      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      const result = await loadRoles();

      expect(result).toEqual({
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
        2: { id: 2, name: 'operator', permissions: ['device:*', 'user:read'] },
        3: { id: 3, name: 'viewer', permissions: ['*:read'] },
      });
      expect(mockPrisma.adminRole.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty object when no roles exist', async () => {
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loadRoles();

      expect(result).toEqual({});
      expect(mockPrisma.adminRole.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle roles with empty permissions array', async () => {
      const mockRolesData = [
        { id: 1, name: 'empty_role', permissions: [] },
      ];

      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      const result = await loadRoles();

      expect(result).toEqual({
        1: { id: 1, name: 'empty_role', permissions: [] },
      });
    });

    it('should handle database error', async () => {
      const dbError = new Error('Database connection failed');
      (mockPrisma.adminRole.findMany as jest.Mock).mockRejectedValue(dbError);

      await expect(loadRoles()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getCachedRoles', () => {
    it('should return cached roles when cache hit', async () => {
      const cachedRoles = {
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
        2: { id: 2, name: 'operator', permissions: ['device:*'] },
      };

      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedRoles));

      const result = await getCachedRoles();

      expect(result).toEqual(cachedRoles);
      expect(mockRedis.get).toHaveBeenCalledWith('admin:roles');
      expect(mockPrisma.adminRole.findMany).not.toHaveBeenCalled();
    });

    it('should load from database and cache when cache miss', async () => {
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
        { id: 2, name: 'operator', permissions: ['device:*'] },
      ];

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);
      (mockRedis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await getCachedRoles();

      expect(result).toEqual({
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
        2: { id: 2, name: 'operator', permissions: ['device:*'] },
      });
      expect(mockRedis.get).toHaveBeenCalledWith('admin:roles');
      expect(mockPrisma.adminRole.findMany).toHaveBeenCalledTimes(1);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'admin:roles',
        600, // 10 minutes TTL
        JSON.stringify({
          1: { id: 1, name: 'super_admin', permissions: ['*'] },
          2: { id: 2, name: 'operator', permissions: ['device:*'] },
        })
      );
    });

    it('should fallback to database when Redis error occurs', async () => {
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];

      (mockRedis.get as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      const result = await getCachedRoles();

      expect(result).toEqual({
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
      });
      expect(mockPrisma.adminRole.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle cache with invalid JSON', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue('invalid json');
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      // This should trigger the catch block due to JSON.parse error
      // and fallback to database
      const result = await getCachedRoles();

      expect(result).toEqual({
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
      });
    });

    it('should handle setex failure gracefully', async () => {
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);
      (mockRedis.setex as jest.Mock).mockRejectedValue(new Error('Redis setex error'));

      // Should still return the loaded roles even if caching fails
      const result = await getCachedRoles();

      expect(result).toEqual({
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
      });
    });

    it('should handle non-Error object thrown from Redis', async () => {
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];

      // Throw a non-Error object to test the 'Unknown error' branch
      (mockRedis.get as jest.Mock).mockRejectedValue('string error');
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      const result = await getCachedRoles();

      expect(result).toEqual({
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
      });
    });
  });

  describe('invalidateRolesCache', () => {
    it('should successfully clear roles cache', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(1);

      await invalidateRolesCache();

      expect(mockRedis.del).toHaveBeenCalledWith('admin:roles');
    });

    it('should handle Redis error gracefully', async () => {
      (mockRedis.del as jest.Mock).mockRejectedValue(new Error('Redis delete error'));

      // Should not throw
      await expect(invalidateRolesCache()).resolves.not.toThrow();
      expect(mockRedis.del).toHaveBeenCalledWith('admin:roles');
    });

    it('should handle non-existent key deletion', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(0);

      await invalidateRolesCache();

      expect(mockRedis.del).toHaveBeenCalledWith('admin:roles');
    });

    it('should handle non-Error object thrown from Redis', async () => {
      // Throw a non-Error object to test the 'Unknown error' branch
      (mockRedis.del as jest.Mock).mockRejectedValue('string error');

      // Should not throw
      await expect(invalidateRolesCache()).resolves.not.toThrow();
      expect(mockRedis.del).toHaveBeenCalledWith('admin:roles');
    });
  });

  describe('invalidateUserPermissionsCache', () => {
    it('should successfully clear user permissions cache', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(1);

      await invalidateUserPermissionsCache(123);

      expect(mockRedis.del).toHaveBeenCalledWith('admin:permissions:123');
    });

    it('should handle different user IDs', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(1);

      await invalidateUserPermissionsCache(1);
      expect(mockRedis.del).toHaveBeenCalledWith('admin:permissions:1');

      await invalidateUserPermissionsCache(999);
      expect(mockRedis.del).toHaveBeenCalledWith('admin:permissions:999');
    });

    it('should handle Redis error gracefully', async () => {
      (mockRedis.del as jest.Mock).mockRejectedValue(new Error('Redis delete error'));

      // Should not throw
      await expect(invalidateUserPermissionsCache(123)).resolves.not.toThrow();
      expect(mockRedis.del).toHaveBeenCalledWith('admin:permissions:123');
    });

    it('should handle non-existent key deletion', async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(0);

      await invalidateUserPermissionsCache(123);

      expect(mockRedis.del).toHaveBeenCalledWith('admin:permissions:123');
    });

    it('should handle non-Error object thrown from Redis', async () => {
      // Throw a non-Error object to test the 'Unknown error' branch
      (mockRedis.del as jest.Mock).mockRejectedValue({ message: 'object error' });

      // Should not throw
      await expect(invalidateUserPermissionsCache(123)).resolves.not.toThrow();
      expect(mockRedis.del).toHaveBeenCalledWith('admin:permissions:123');
    });
  });

  describe('getUserPermissions', () => {
    it('should return cached permissions when cache hit', async () => {
      const cachedPermissions = ['device:read', 'device:write'];

      (mockRedis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedPermissions));

      const result = await getUserPermissions(1);

      expect(result).toEqual(cachedPermissions);
      expect(mockRedis.get).toHaveBeenCalledWith('admin:permissions:1');
      expect(mockPrisma.adminUser.findUnique).not.toHaveBeenCalled();
    });

    it('should load from database and cache when cache miss', async () => {
      const mockUser = { roleIds: [2, 3] };
      const mockRolesData = [
        { id: 2, name: 'operator', permissions: ['device:*', 'user:read'] },
        { id: 3, name: 'viewer', permissions: ['*:read'] },
      ];

      (mockRedis.get as jest.Mock)
        .mockResolvedValueOnce(null) // First call for user permissions cache
        .mockResolvedValueOnce(null); // Second call for roles cache (in getCachedRoles)
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);
      (mockRedis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await getUserPermissions(1);

      expect(result).toContain('device:*');
      expect(result).toContain('user:read');
      expect(result).toContain('*:read');
      expect(mockRedis.get).toHaveBeenCalledWith('admin:permissions:1');
      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { roleIds: true },
      });
    });

    it('should return empty array when user does not exist', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getUserPermissions(999);

      expect(result).toEqual([]);
    });

    it('should return empty array when user has no roles', async () => {
      const mockUser = { roleIds: [] };

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getUserPermissions(1);

      expect(result).toEqual([]);
    });

    it('should fallback to database when Redis error occurs', async () => {
      const mockUser = { roleIds: [1] };
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];

      (mockRedis.get as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      const result = await getUserPermissions(1);

      expect(result).toContain('*');
      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalled();
    });

    it('should handle cache with invalid JSON', async () => {
      (mockRedis.get as jest.Mock).mockResolvedValue('invalid json');
      const mockUser = { roleIds: [1] };
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      const result = await getUserPermissions(1);

      expect(result).toContain('*');
    });

    it('should handle setex failure gracefully', async () => {
      const mockUser = { roleIds: [1] };
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];

      (mockRedis.get as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);
      (mockRedis.setex as jest.Mock).mockRejectedValue(new Error('Redis setex error'));

      const result = await getUserPermissions(1);

      expect(result).toContain('*');
    });

    it('should return deduplicated permissions', async () => {
      const mockUser = { roleIds: [1, 2] };
      const mockRolesData = [
        { id: 1, name: 'role1', permissions: ['device:read', 'user:read'] },
        { id: 2, name: 'role2', permissions: ['device:read', 'alarm:read'] },
      ];

      (mockRedis.get as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);
      (mockRedis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await getUserPermissions(1);

      const deviceReadCount = result.filter(p => p === 'device:read').length;
      expect(deviceReadCount).toBe(1);
      expect(result).toContain('device:read');
      expect(result).toContain('user:read');
      expect(result).toContain('alarm:read');
    });

    it('should use cached roles from getCachedRoles', async () => {
      const cachedRoles = {
        1: { id: 1, name: 'super_admin', permissions: ['*'] },
      };
      const mockUser = { roleIds: [1] };

      // First call returns null for user permissions cache
      // Second call returns cached roles
      (mockRedis.get as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(cachedRoles));
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockRedis.setex as jest.Mock).mockResolvedValue('OK');

      const result = await getUserPermissions(1);

      expect(result).toContain('*');
      expect(mockPrisma.adminRole.findMany).not.toHaveBeenCalled();
    });

    it('should handle database error in fallback', async () => {
      (mockRedis.get as jest.Mock).mockRejectedValue(new Error('Redis error'));
      (mockPrisma.adminUser.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(getUserPermissions(1)).rejects.toThrow('Database error');
    });

    it('should return empty array when user does not exist in fallback', async () => {
      (mockRedis.get as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getUserPermissions(999);

      expect(result).toEqual([]);
      expect(mockPrisma.adminUser.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        select: { roleIds: true },
      });
    });

    it('should handle non-Error object thrown from Redis', async () => {
      const mockUser = { roleIds: [1] };
      const mockRolesData = [
        { id: 1, name: 'super_admin', permissions: ['*'] },
      ];

      // Throw a non-Error object to test the 'Unknown error' branch
      (mockRedis.get as jest.Mock).mockRejectedValue('string error');
      (mockPrisma.adminUser.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.adminRole.findMany as jest.Mock).mockResolvedValue(mockRolesData);

      const result = await getUserPermissions(1);

      expect(result).toContain('*');
    });
  });
});