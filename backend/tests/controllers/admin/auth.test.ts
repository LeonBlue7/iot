// tests/controllers/admin/auth.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies before importing
jest.mock('../../../src/services/admin/auth.service.js', () => ({
  __esModule: true,
  verifyPassword: jest.fn(),
  generateToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../../../src/services/admin/rbac.service.js', () => ({
  __esModule: true,
  getUserPermissions: jest.fn(),
}));

jest.mock('../../../src/services/admin/audit.service.js', () => ({
  __esModule: true,
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    adminUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../../../src/utils/logger.js', () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    security: jest.fn(),
  },
}));

jest.mock('../../../src/utils/sanitizer.js', () => ({
  __esModule: true,
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
  sanitizeForLogging: jest.fn((ctx) => ctx),
}));

import { login, getMe, refreshToken } from '../../../src/controllers/admin/auth.controller.js';
import { verifyPassword, generateToken, verifyRefreshToken } from '../../../src/services/admin/auth.service.js';
import { getUserPermissions } from '../../../src/services/admin/rbac.service.js';
import { createAuditLog } from '../../../src/services/admin/audit.service.js';
import prisma from '../../../src/utils/database.js';
import { logger } from '../../../src/utils/logger.js';
import { getClientIp } from '../../../src/utils/sanitizer.js';

/**
 * Helper to wait for async handlers that don't return promises
 * The asyncHandler wrapper returns void, so we need to wait for microtasks to complete
 */
function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

describe('Admin Auth Controller', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset createAuditLog to return resolved promise
    (createAuditLog as jest.Mock).mockResolvedValue(undefined);

    mockRequest = {
      body: {},
      headers: {},
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('login', () => {
    describe('input validation', () => {
      it('should return 400 when username is missing', async () => {
        mockRequest.body = { password: 'password123' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Username and password are required',
          })
        );
        expect(createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'LOGIN_FAILED',
            details: expect.objectContaining({ reason: 'MISSING_CREDENTIALS' }),
          })
        );
      });

      it('should return 400 when password is missing', async () => {
        mockRequest.body = { username: 'admin' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Username and password are required',
          })
        );
      });

      it('should return 400 when both username and password are missing', async () => {
        mockRequest.body = {};

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Username and password are required',
          })
        );
      });

      it('should return 400 when username is empty string', async () => {
        mockRequest.body = { username: '', password: 'password123' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Username and password are required',
          })
        );
      });

      it('should return 400 when password is empty string', async () => {
        mockRequest.body = { username: 'admin', password: '' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Username and password are required',
          })
        );
      });
    });

    describe('user not found', () => {
      it('should return 401 when user does not exist', async () => {
        mockRequest.body = { username: 'nonexistent', password: 'password123' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Invalid credentials',
          })
        );
        expect(createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'LOGIN_FAILED',
            details: expect.objectContaining({ reason: 'USER_NOT_FOUND' }),
          })
        );
      });
    });

    describe('account disabled', () => {
      it('should return 403 when account is disabled', async () => {
        mockRequest.body = { username: 'admin', password: 'password123' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
          passwordHash: 'hashedpassword',
          enabled: false,
          roleIds: [1],
        });

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Account is disabled',
          })
        );
        expect(createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'LOGIN_FAILED',
            details: expect.objectContaining({ reason: 'ACCOUNT_DISABLED' }),
          })
        );
      });
    });

    describe('invalid password', () => {
      it('should return 401 when password is incorrect', async () => {
        mockRequest.body = { username: 'admin', password: 'wrongpassword' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
          passwordHash: 'hashedpassword',
          enabled: true,
          roleIds: [1],
        });
        (verifyPassword as jest.Mock).mockResolvedValue(false);

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Invalid credentials',
          })
        );
        expect(verifyPassword).toHaveBeenCalledWith('wrongpassword', 'hashedpassword');
        expect(createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'LOGIN_FAILED',
            details: expect.objectContaining({ reason: 'INVALID_PASSWORD' }),
          })
        );
      });
    });

    describe('successful login', () => {
      beforeEach(() => {
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
          passwordHash: 'hashedpassword',
          enabled: true,
          roleIds: [1],
        });
        (verifyPassword as jest.Mock).mockResolvedValue(true);
        (getUserPermissions as jest.Mock).mockResolvedValue(['device:read', 'device:write']);
        (generateToken as jest.Mock).mockResolvedValue('jwt_token_here');
        (prisma.adminUser.update as jest.Mock).mockResolvedValue({});
      });

      it('should return token and user info on successful login', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              token: 'jwt_token_here',
              user: expect.objectContaining({
                id: 1,
                username: 'admin',
                email: 'admin@example.com',
                name: 'Admin User',
                permissions: ['device:read', 'device:write'],
              }),
            }),
          })
        );
      });

      it('should update last login info', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(prisma.adminUser.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            data: expect.objectContaining({
              lastLoginAt: expect.any(Date),
              lastLoginIp: '127.0.0.1',
            }),
          })
        );
      });

      it('should create audit log for successful login', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            adminUserId: 1,
            action: 'LOGIN_SUCCESS',
            resource: 'ADMIN_AUTH',
          })
        );
      });

      it('should get user permissions', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(getUserPermissions).toHaveBeenCalledWith(1);
      });

      it('should generate token with correct payload', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 1,
            username: 'admin',
            email: 'admin@example.com',
            roleIds: [1],
            permissions: ['device:read', 'device:write'],
          })
        );
      });

      it('should use client IP from X-Forwarded-For header', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };
        mockRequest.headers['x-forwarded-for'] = '192.168.1.1, 10.0.0.1';
        (getClientIp as jest.Mock).mockReturnValue('192.168.1.1');

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(getClientIp).toHaveBeenCalledWith(mockRequest);
      });

      it('should use user-agent from headers', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };
        mockRequest.headers['user-agent'] = 'Mozilla/5.0';

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(createAuditLog).toHaveBeenCalledWith(
          expect.objectContaining({
            userAgent: 'Mozilla/5.0',
          })
        );
      });
    });

    describe('edge cases', () => {
      it('should handle user with null name', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: null,
          passwordHash: 'hashedpassword',
          enabled: true,
          roleIds: [1],
        });
        (verifyPassword as jest.Mock).mockResolvedValue(true);
        (getUserPermissions as jest.Mock).mockResolvedValue(['device:read']);
        (generateToken as jest.Mock).mockResolvedValue('jwt_token_here');
        (prisma.adminUser.update as jest.Mock).mockResolvedValue({});

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              user: expect.objectContaining({
                name: null,
              }),
            }),
          })
        );
      });

      it('should handle user with empty roleIds array', async () => {
        mockRequest.body = { username: 'admin', password: 'correctpassword' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin',
          passwordHash: 'hashedpassword',
          enabled: true,
          roleIds: [],
        });
        (verifyPassword as jest.Mock).mockResolvedValue(true);
        (getUserPermissions as jest.Mock).mockResolvedValue([]);
        (generateToken as jest.Mock).mockResolvedValue('jwt_token_here');
        (prisma.adminUser.update as jest.Mock).mockResolvedValue({});

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              user: expect.objectContaining({
                permissions: [],
              }),
            }),
          })
        );
      });

      it('should handle special characters in username', async () => {
        mockRequest.body = { username: 'admin@example.com', password: 'password123' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { username: 'admin@example.com' },
          })
        );
      });

      it('should handle unicode characters in username', async () => {
        mockRequest.body = { username: '\u4e2d\u6587\u7528\u6237', password: 'password123' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

        login(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { username: '\u4e2d\u6587\u7528\u6237' },
          })
        );
      });
    });
  });

  describe('getMe', () => {
    describe('not authenticated', () => {
      it('should return 401 when adminUser is not attached to request', async () => {
        mockRequest.adminUser = undefined;

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Not authenticated',
          })
        );
      });

      it('should return 401 when adminUser is null', async () => {
        mockRequest.adminUser = null;

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Not authenticated',
          })
        );
      });
    });

    describe('user not found', () => {
      it('should return 404 when user is deleted after token was issued', async () => {
        mockRequest.adminUser = { id: 999, username: 'deleted_user' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(404);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'User not found',
          })
        );
      });
    });

    describe('successful response', () => {
      beforeEach(() => {
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: 'Admin User',
          roleIds: [1],
          enabled: true,
          lastLoginAt: new Date('2024-01-01T00:00:00Z'),
        });
        (getUserPermissions as jest.Mock).mockResolvedValue(['device:read', 'device:write']);
      });

      it('should return user info with permissions', async () => {
        mockRequest.adminUser = { id: 1, username: 'admin' };

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              id: 1,
              username: 'admin',
              email: 'admin@example.com',
              name: 'Admin User',
              roleIds: [1],
              enabled: true,
              permissions: ['device:read', 'device:write'],
            }),
          })
        );
      });

      it('should select only specific fields from database', async () => {
        mockRequest.adminUser = { id: 1, username: 'admin' };

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
            select: expect.objectContaining({
              id: true,
              username: true,
              email: true,
              name: true,
              roleIds: true,
              enabled: true,
              lastLoginAt: true,
            }),
          })
        );
      });

      it('should get user permissions', async () => {
        mockRequest.adminUser = { id: 1, username: 'admin' };

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(getUserPermissions).toHaveBeenCalledWith(1);
      });

      it('should handle adminUser.id as string', async () => {
        mockRequest.adminUser = { id: '1', username: 'admin' };

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 1 },
          })
        );
      });

      it('should handle user with null name', async () => {
        mockRequest.adminUser = { id: 1, username: 'admin' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          name: null,
          roleIds: [1],
          enabled: true,
          lastLoginAt: new Date('2024-01-01T00:00:00Z'),
        });

        getMe(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              name: null,
            }),
          })
        );
      });
    });
  });

  describe('refreshToken', () => {
    describe('missing refresh token', () => {
      it('should return 400 when refreshToken is missing', async () => {
        mockRequest.body = {};

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Refresh token is required',
          })
        );
      });

      it('should return 400 when refreshToken is null', async () => {
        mockRequest.body = { refreshToken: null };

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Refresh token is required',
          })
        );
      });

      it('should return 400 when refreshToken is empty string', async () => {
        mockRequest.body = { refreshToken: '' };

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Refresh token is required',
          })
        );
      });
    });

    describe('invalid refresh token', () => {
      it('should return 401 when refresh token is invalid', async () => {
        mockRequest.body = { refreshToken: 'invalid_token' };
        (verifyRefreshToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Invalid refresh token',
          })
        );
      });

      it('should return 401 when refresh token is expired', async () => {
        mockRequest.body = { refreshToken: 'expired_token' };
        (verifyRefreshToken as jest.Mock).mockRejectedValue(new Error('jwt expired'));

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Invalid refresh token',
          })
        );
      });

      it('should return 401 when refresh token has invalid signature', async () => {
        mockRequest.body = { refreshToken: 'tampered_token' };
        (verifyRefreshToken as jest.Mock).mockRejectedValue(new Error('invalid signature'));

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Invalid refresh token',
          })
        );
      });
    });

    describe('user not found or disabled', () => {
      beforeEach(() => {
        (verifyRefreshToken as jest.Mock).mockResolvedValue({
          type: 'refresh',
          jti: 'user-123-uuid',
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
      });

      it('should return 401 when user does not exist', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Invalid refresh token',
          })
        );
      });

      it('should return 401 when user is disabled', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 123,
          username: 'disabled_user',
          email: 'disabled@example.com',
          roleIds: [1],
          enabled: false,
        });

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            error: 'Invalid refresh token',
          })
        );
      });
    });

    describe('successful token refresh', () => {
      beforeEach(() => {
        (verifyRefreshToken as jest.Mock).mockResolvedValue({
          type: 'refresh',
          jti: 'user-123-uuid',
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 123,
          username: 'admin',
          email: 'admin@example.com',
          roleIds: [1],
          enabled: true,
        });
        (getUserPermissions as jest.Mock).mockResolvedValue(['device:read', 'device:write']);
        (generateToken as jest.Mock).mockResolvedValue('new_jwt_token');
      });

      it('should return new token on successful refresh', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              token: 'new_jwt_token',
            }),
          })
        );
      });

      it('should get latest permissions for token', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(getUserPermissions).toHaveBeenCalledWith(123);
      });

      it('should generate token with current permissions', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(generateToken).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 123,
            username: 'admin',
            email: 'admin@example.com',
            roleIds: [1],
            permissions: ['device:read', 'device:write'],
          })
        );
      });

      it('should parse user ID from jti claim', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };
        (verifyRefreshToken as jest.Mock).mockResolvedValue({
          type: 'refresh',
          jti: 'user-456-uuid',
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: expect.any(Number) },
          })
        );
      });
    });

    describe('edge cases', () => {
      it('should handle malformed jti in token', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };
        (verifyRefreshToken as jest.Mock).mockResolvedValue({
          type: 'refresh',
          jti: null,
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.status).toHaveBeenCalledWith(401);
      });

      it('should handle non-numeric jti', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };
        (verifyRefreshToken as jest.Mock).mockResolvedValue({
          type: 'refresh',
          jti: 'not-a-number',
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue(null);

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(prisma.adminUser.findUnique).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: expect.any(Number) },
          })
        );
      });

      it('should log security event on invalid token', async () => {
        mockRequest.body = { refreshToken: 'invalid_token' };
        (verifyRefreshToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(logger.security).toHaveBeenCalled();
      });

      it('should handle empty roleIds array', async () => {
        mockRequest.body = { refreshToken: 'valid_refresh_token' };
        (verifyRefreshToken as jest.Mock).mockResolvedValue({
          type: 'refresh',
          jti: 'user-123-uuid',
          iat: Date.now(),
          exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
        });
        (prisma.adminUser.findUnique as jest.Mock).mockResolvedValue({
          id: 123,
          username: 'admin',
          email: 'admin@example.com',
          roleIds: [],
          enabled: true,
        });
        (getUserPermissions as jest.Mock).mockResolvedValue([]);
        (generateToken as jest.Mock).mockResolvedValue('new_jwt_token');

        refreshToken(mockRequest, mockResponse, mockNext);
        await flushPromises();

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              token: 'new_jwt_token',
            }),
          })
        );
      });
    });
  });

  describe('controller structure', () => {
    it('should have login controller', () => {
      expect(typeof login).toBe('function');
    });

    it('should have getMe controller', () => {
      expect(typeof getMe).toBe('function');
    });

    it('should have refreshToken controller', () => {
      expect(typeof refreshToken).toBe('function');
    });
  });
});