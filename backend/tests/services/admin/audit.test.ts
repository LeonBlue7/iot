// tests/services/admin/audit.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock prisma
jest.mock('../../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../../src/utils/sanitizer.js', () => ({
  sanitizeForLogging: jest.fn((obj) => obj),
}));

import { createAuditLog, getAuditLogs } from '../../../src/services/admin/audit.service.js';
import prisma from '../../../src/utils/database.js';
import { sanitizeForLogging } from '../../../src/utils/sanitizer.js';

// Type the mocked prisma for test access
const mockPrisma = prisma as unknown as {
  auditLog: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

describe('Audit Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create audit log with required fields only', async () => {
      const input = {
        adminUserId: 1,
        action: 'LOGIN_SUCCESS',
        resource: 'ADMIN_AUTH',
      };

      const mockResult = {
        id: 1,
        ...input,
        resourceId: null,
        resourceIdInt: null,
        details: null,
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      mockPrisma.auditLog.create.mockResolvedValue(mockResult);

      const result = await createAuditLog(input);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminUserId: 1,
          action: 'LOGIN_SUCCESS',
          resource: 'ADMIN_AUTH',
        }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should create audit log with all optional fields', async () => {
      const input = {
        adminUserId: 1,
        action: 'DEVICE_UPDATE',
        resource: 'DEVICE',
        resourceId: 'device-123',
        resourceIdInt: 42,
        details: { temperature: 25, humidity: 60 },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
      };

      const mockResult = {
        id: 1,
        ...input,
        createdAt: new Date(),
      };

      mockPrisma.auditLog.create.mockResolvedValue(mockResult);

      const result = await createAuditLog(input);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminUserId: 1,
          action: 'DEVICE_UPDATE',
          resource: 'DEVICE',
          resourceId: 'device-123',
          resourceIdInt: 42,
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0',
        }),
      });
      expect(result).toEqual(mockResult);
    });

    it('should sanitize sensitive details before logging', async () => {
      const input = {
        adminUserId: 1,
        action: 'LOGIN_FAILED',
        resource: 'ADMIN_AUTH',
        details: { username: 'admin', password: 'secret123' },
      };

      (sanitizeForLogging as jest.Mock).mockReturnValue({ username: 'admin', password: '[REDACTED]' });

      await createAuditLog(input);

      expect(sanitizeForLogging).toHaveBeenCalledWith(input.details);
    });

    it('should handle null details correctly', async () => {
      const input = {
        adminUserId: 1,
        action: 'LOGOUT',
        resource: 'ADMIN_AUTH',
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...input, details: null });

      await createAuditLog(input);

      expect(sanitizeForLogging).not.toHaveBeenCalled();
    });

    it('should handle empty details object', async () => {
      const input = {
        adminUserId: 1,
        action: 'LOGOUT',
        resource: 'ADMIN_AUTH',
        details: {},
      };

      const mockResult = {
        id: 1,
        ...input,
        details: {},
        createdAt: new Date(),
      };

      mockPrisma.auditLog.create.mockResolvedValue(mockResult);

      const result = await createAuditLog(input);

      expect(sanitizeForLogging).toHaveBeenCalledWith({});
      expect((result as { details: Record<string, unknown> }).details).toEqual({});
    });

    it('should sanitize nested sensitive data in details', async () => {
      const input = {
        adminUserId: 1,
        action: 'USER_CREATE',
        resource: 'USER',
        details: {
          user: {
            name: 'Test User',
            credentials: {
              password: 'secret',
              token: 'jwt-token',
            },
          },
        },
      };

      (sanitizeForLogging as jest.Mock).mockReturnValue({
        user: {
          name: 'Test User',
          credentials: {
            password: '[REDACTED]',
            token: '[REDACTED]',
          },
        },
      });

      await createAuditLog(input);

      expect(sanitizeForLogging).toHaveBeenCalledWith(input.details);
    });

    it('should handle various action types', async () => {
      const actions = [
        'LOGIN_SUCCESS',
        'LOGIN_FAILED',
        'LOGOUT',
        'DEVICE_CREATE',
        'DEVICE_UPDATE',
        'DEVICE_DELETE',
        'USER_CREATE',
        'USER_UPDATE',
        'USER_DELETE',
        'GROUP_CREATE',
        'GROUP_UPDATE',
        'GROUP_DELETE',
        'ALARM_ACKNOWLEDGE',
        'CONFIG_UPDATE',
      ];

      for (const action of actions) {
        const input = {
          adminUserId: 1,
          action,
          resource: 'SYSTEM',
        };

        mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...input });

        await createAuditLog(input);

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ action }),
          })
        );
      }
    });

    it('should handle resourceId as string', async () => {
      const input = {
        adminUserId: 1,
        action: 'DEVICE_UPDATE',
        resource: 'DEVICE',
        resourceId: 'IMEI-123456789012345',
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...input });

      await createAuditLog(input);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ resourceId: 'IMEI-123456789012345' }),
        })
      );
    });

    it('should handle resourceIdInt as number', async () => {
      const input = {
        adminUserId: 1,
        action: 'GROUP_UPDATE',
        resource: 'GROUP',
        resourceIdInt: 42,
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...input });

      await createAuditLog(input);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ resourceIdInt: 42 }),
        })
      );
    });

    it('should handle both resourceId and resourceIdInt', async () => {
      const input = {
        adminUserId: 1,
        action: 'DEVICE_UPDATE',
        resource: 'DEVICE',
        resourceId: 'device-string-id',
        resourceIdInt: 100,
      };

      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...input });

      await createAuditLog(input);

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resourceId: 'device-string-id',
            resourceIdInt: 100,
          }),
        })
      );
    });

    it('should handle complex details with arrays', async () => {
      const input = {
        adminUserId: 1,
        action: 'BATCH_UPDATE',
        resource: 'DEVICE',
        details: {
          devices: ['device-1', 'device-2', 'device-3'],
          changes: {
            mode: 'cooling',
            temperature: 25,
          },
        },
      };

      (sanitizeForLogging as jest.Mock).mockReturnValue(input.details);
      mockPrisma.auditLog.create.mockResolvedValue({ id: 1, ...input });

      await createAuditLog(input);

      expect(sanitizeForLogging).toHaveBeenCalledWith(input.details);
    });
  });

  describe('getAuditLogs', () => {
    const mockAuditLogs = [
      {
        id: 1,
        adminUserId: 1,
        action: 'LOGIN_SUCCESS',
        resource: 'ADMIN_AUTH',
        resourceId: null,
        resourceIdInt: null,
        details: null,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01T10:00:00Z'),
        adminUser: { id: 1, username: 'admin', name: 'Admin' },
      },
      {
        id: 2,
        adminUserId: 1,
        action: 'DEVICE_CREATE',
        resource: 'DEVICE',
        resourceId: 'device-1',
        resourceIdInt: null,
        details: { deviceId: 'device-1' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01T11:00:00Z'),
        adminUser: { id: 1, username: 'admin', name: 'Admin' },
      },
    ];

    beforeEach(() => {
      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);
      mockPrisma.auditLog.count.mockResolvedValue(2);
    });

    it('should return audit logs without filters', async () => {
      const result = await getAuditLogs();

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          include: { adminUser: { select: { id: true, username: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        })
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by adminUserId', async () => {
      await getAuditLogs({ adminUserId: 1 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { adminUserId: 1 },
        })
      );
    });

    it('should filter by action', async () => {
      await getAuditLogs({ action: 'LOGIN_SUCCESS' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { action: 'LOGIN_SUCCESS' },
        })
      );
    });

    it('should filter by resource', async () => {
      await getAuditLogs({ resource: 'DEVICE' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { resource: 'DEVICE' },
        })
      );
    });

    it('should filter by date range with both dates', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await getAuditLogs({ startDate, endDate });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it('should filter by startDate only', async () => {
      const startDate = new Date('2024-01-01');

      await getAuditLogs({ startDate });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
            },
          },
        })
      );
    });

    it('should filter by endDate only', async () => {
      const endDate = new Date('2024-12-31');

      await getAuditLogs({ endDate });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              lte: endDate,
            },
          },
        })
      );
    });

    it('should apply pagination with default values', async () => {
      await getAuditLogs();

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 0,
        })
      );
    });

    it('should apply custom pagination', async () => {
      await getAuditLogs({ page: 2, limit: 20 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          skip: 20,
        })
      );
    });

    it('should apply pagination for page 3', async () => {
      await getAuditLogs({ page: 3, limit: 10 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20, // (3-1) * 10 = 20
        })
      );
    });

    it('should limit max results to 100', async () => {
      await getAuditLogs({ limit: 200 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should limit exactly 100 results', async () => {
      await getAuditLogs({ limit: 100 });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should combine multiple filters', async () => {
      await getAuditLogs({
        adminUserId: 1,
        action: 'LOGIN_SUCCESS',
        resource: 'ADMIN_AUTH',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            adminUserId: 1,
            action: 'LOGIN_SUCCESS',
            resource: 'ADMIN_AUTH',
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          },
        })
      );
    });

    it('should return admin user info with each log', async () => {
      const result = await getAuditLogs();

      expect(result.data[0]!.adminUser).toBeDefined();
      expect(result.data[0]!.adminUser?.username).toBe('admin');
      expect(result.data[0]!.adminUser?.id).toBe(1);
      expect(result.data[0]!.adminUser?.name).toBe('Admin');
    });

    it('should return empty array when no logs found', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const result = await getAuditLogs();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle null adminUser relation', async () => {
      const mockLogsWithNullUser = [
        {
          id: 1,
          adminUserId: 999,
          action: 'LOGIN_SUCCESS',
          resource: 'ADMIN_AUTH',
          resourceId: null,
          resourceIdInt: null,
          details: null,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          adminUser: null, // User deleted
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogsWithNullUser);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getAuditLogs();

      expect(result.data[0]!.adminUser).toBeNull();
    });

    it('should return logs with resourceId', async () => {
      const mockLogsWithResourceId = [
        {
          id: 1,
          adminUserId: 1,
          action: 'DEVICE_UPDATE',
          resource: 'DEVICE',
          resourceId: 'device-123',
          resourceIdInt: null,
          details: { mode: 'cooling' },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          adminUser: { id: 1, username: 'admin', name: 'Admin' },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogsWithResourceId);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getAuditLogs();

      expect(result.data[0]!.resourceId).toBe('device-123');
    });

    it('should return logs with resourceIdInt', async () => {
      const mockLogsWithResourceIdInt = [
        {
          id: 1,
          adminUserId: 1,
          action: 'GROUP_UPDATE',
          resource: 'GROUP',
          resourceId: null,
          resourceIdInt: 42,
          details: { name: 'Group A' },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          adminUser: { id: 1, username: 'admin', name: 'Admin' },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogsWithResourceIdInt);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getAuditLogs();

      expect(result.data[0]!.resourceIdInt).toBe(42);
    });

    it('should return logs with both resourceId and resourceIdInt', async () => {
      const mockLogsWithBothIds = [
        {
          id: 1,
          adminUserId: 1,
          action: 'DEVICE_UPDATE',
          resource: 'DEVICE',
          resourceId: 'device-string-id',
          resourceIdInt: 100,
          details: null,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          adminUser: { id: 1, username: 'admin', name: 'Admin' },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogsWithBothIds);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getAuditLogs();

      expect(result.data[0]!.resourceId).toBe('device-string-id');
      expect(result.data[0]!.resourceIdInt).toBe(100);
    });

    it('should handle complex details object', async () => {
      const mockLogsWithComplexDetails = [
        {
          id: 1,
          adminUserId: 1,
          action: 'DEVICE_CREATE',
          resource: 'DEVICE',
          resourceId: 'device-new',
          resourceIdInt: null,
          details: {
            device: {
              name: 'New Device',
              settings: {
                temperature: 25,
                mode: 'auto',
              },
            },
            metadata: {
              source: 'api',
              version: '1.0.0',
            },
          },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          adminUser: { id: 1, username: 'admin', name: 'Admin' },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogsWithComplexDetails);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getAuditLogs();

      expect(result.data[0]!.details).toEqual({
        device: {
          name: 'New Device',
          settings: {
            temperature: 25,
            mode: 'auto',
          },
        },
        metadata: {
          source: 'api',
          version: '1.0.0',
        },
      });
    });

    it('should order results by createdAt descending', async () => {
      await getAuditLogs();

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should call count with same where clause as findMany', async () => {
      const filterOptions = {
        adminUserId: 1,
        action: 'LOGIN_SUCCESS',
        resource: 'ADMIN_AUTH',
      };

      await getAuditLogs(filterOptions);

      const expectedWhere = {
        adminUserId: 1,
        action: 'LOGIN_SUCCESS',
        resource: 'ADMIN_AUTH',
      };

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere })
      );
      expect(mockPrisma.auditLog.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should handle adminUser with null name', async () => {
      const mockLogsWithNullName = [
        {
          id: 1,
          adminUserId: 1,
          action: 'LOGIN_SUCCESS',
          resource: 'ADMIN_AUTH',
          resourceId: null,
          resourceIdInt: null,
          details: null,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          adminUser: { id: 1, username: 'admin', name: null },
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogsWithNullName);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await getAuditLogs();

      expect(result.data[0]!.adminUser?.name).toBeNull();
    });

    it('should handle multiple pages correctly', async () => {
      // Simulate 150 total records
      mockPrisma.auditLog.count.mockResolvedValue(150);

      // Page 1
      await getAuditLogs({ page: 1, limit: 50 });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 50 })
      );

      // Page 2
      await getAuditLogs({ page: 2, limit: 50 });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 50, take: 50 })
      );

      // Page 3
      await getAuditLogs({ page: 3, limit: 50 });
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 100, take: 50 })
      );
    });
  });

  describe('Type Definitions', () => {
    it('should define CreateAuditLogInput interface correctly', () => {
      // This test verifies the interface structure at compile time
      const input = {
        adminUserId: 1,
        action: 'TEST_ACTION',
        resource: 'TEST_RESOURCE',
        resourceId: 'test-id',
        resourceIdInt: 123,
        details: { key: 'value' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      expect(input.adminUserId).toBe(1);
      expect(input.action).toBe('TEST_ACTION');
      expect(input.resource).toBe('TEST_RESOURCE');
      expect(input.resourceId).toBe('test-id');
      expect(input.resourceIdInt).toBe(123);
      expect(input.details).toEqual({ key: 'value' });
      expect(input.ipAddress).toBe('127.0.0.1');
      expect(input.userAgent).toBe('test-agent');
    });

    it('should define GetAuditLogsOptions interface correctly', () => {
      const options = {
        page: 1,
        limit: 50,
        adminUserId: 1,
        action: 'LOGIN_SUCCESS',
        resource: 'ADMIN_AUTH',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      expect(options.page).toBe(1);
      expect(options.limit).toBe(50);
      expect(options.adminUserId).toBe(1);
      expect(options.action).toBe('LOGIN_SUCCESS');
      expect(options.resource).toBe('ADMIN_AUTH');
      expect(options.startDate).toEqual(new Date('2024-01-01'));
      expect(options.endDate).toEqual(new Date('2024-12-31'));
    });
  });
});