// tests/middleware/admin/auth.test.ts
import { describe, it, expect, jest } from '@jest/globals';

// Mock dependencies before importing
jest.mock('../../../src/services/admin/auth.service.js', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../../../src/services/admin/rbac.service.js', () => ({
  hasAllPermissions: jest.fn(),
  getUserPermissions: jest.fn(),
}));

import { authenticate, requirePermissions } from '../../../src/middleware/admin/auth.js';
import { verifyToken } from '../../../src/services/admin/auth.service.js';
import { hasAllPermissions } from '../../../src/services/admin/rbac.service.js';

describe('Admin Auth Middleware', () => {
  describe('authenticate', () => {
    it('should reject requests without Authorization header', async () => {
      const mockReq = { headers: {} };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Authorization') })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      const mockReq = { headers: { authorization: 'Bearer invalid_token' } };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with valid token', async () => {
      const mockReq = {
        headers: { authorization: 'Bearer valid_token' },
        adminUser: null,
      };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      const mockPayload = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roleIds: [1],
        permissions: ['device:read'],
      };

      (verifyToken as jest.Mock).mockResolvedValue(mockPayload);

      await authenticate(mockReq as any, mockRes as any, mockNext);

      expect(mockReq.adminUser).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('requirePermissions', () => {
    it('should allow access with required permission', async () => {
      const mockReq = {
        adminUser: {
          id: 1,
          username: 'admin',
          permissions: ['device:read', 'device:write'],
        },
      };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      (hasAllPermissions as jest.Mock).mockReturnValue(true);

      const middleware = requirePermissions('device:read');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access without required permission', async () => {
      const mockReq = {
        adminUser: {
          id: 1,
          username: 'admin',
          permissions: ['device:read'],
        },
      };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      (hasAllPermissions as jest.Mock).mockReturnValue(false);

      const middleware = requirePermissions('user:write');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow access for super_admin', async () => {
      const mockReq = {
        adminUser: {
          id: 1,
          username: 'admin',
          permissions: ['*'],
        },
      };
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockNext = jest.fn();

      const middleware = requirePermissions('user:write');
      await middleware(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
