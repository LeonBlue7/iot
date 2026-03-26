// tests/services/admin/rbac.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getEffectivePermissions,
} from '../../../src/services/admin/rbac.service.js';

describe('Admin RBAC Service', () => {
  const mockRoles = {
    1: { id: 1, name: 'super_admin', permissions: ['*'] },
    2: { id: 2, name: 'operator', permissions: ['device:*', 'user:read'] },
    3: { id: 3, name: 'viewer', permissions: ['*:read'] },
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
});