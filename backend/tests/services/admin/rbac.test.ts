// tests/services/admin/rbac.test.ts
import { describe, it, expect } from '@jest/globals';
import { hasPermission, hasAllPermissions, hasAnyPermission, getEffectivePermissions } from '../../../src/services/admin/rbac.service.js';

describe('Admin RBAC Service', () => {
  const mockRoles = {
    1: { name: 'super_admin', permissions: ['*'] },
    2: { name: 'operator', permissions: ['device:*', 'user:read'] },
    3: { name: 'viewer', permissions: ['*:read'] },
  };

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

    it('should deny access when user lacks permission', () => {
      const userPermissions = ['device:read'];
      expect(hasPermission(userPermissions, 'device:write')).toBe(false);
      expect(hasPermission(userPermissions, 'user:read')).toBe(false);
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
  });
});
