// tests/services/device-batch.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../src/utils/database.js';

// Mock prisma
jest.mock('../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    device: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    controlLog: {
      create: jest.fn(),
      createMany: jest.fn(),
    },
    deviceParam: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
    },
    group: {
      findUnique: jest.fn(),
    },
  },
}));

// Import service after mocking
import { deviceService } from '../../src/services/device/index.js';

describe('DeviceService - Batch Operations', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('batchControl', () => {
    it('should control multiple devices', async () => {
      const deviceIds = ['dev1', 'dev2', 'dev3'];
      const action = 'on';
      const operator = 'admin';

      mockPrisma.device.findMany.mockResolvedValue(
        deviceIds.map((id) => ({ id, online: true }))
      );
      mockPrisma.controlLog.createMany.mockResolvedValue({ count: 3 });

      const result = await deviceService.batchControl(deviceIds, action, operator);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(3);
      expect(result.failCount).toBe(0);
      expect(mockPrisma.controlLog.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          { deviceId: 'dev1', action: 'on', operator: 'admin' },
          { deviceId: 'dev2', action: 'on', operator: 'admin' },
          { deviceId: 'dev3', action: 'on', operator: 'admin' },
        ]),
      });
    });

    it('should handle partial failures', async () => {
      const deviceIds = ['dev1', 'dev2', 'dev_not_exist'];
      const action = 'off';
      const operator = 'admin';

      mockPrisma.device.findMany.mockResolvedValue([
        { id: 'dev1', online: true },
        { id: 'dev2', online: true },
      ]);

      const result = await deviceService.batchControl(deviceIds, action, operator);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failCount).toBe(1);
      expect(result.failedDevices).toContain('dev_not_exist');
    });

    it('should throw ValidationError for empty device list', async () => {
      await expect(deviceService.batchControl([], 'on', 'admin')).rejects.toThrow(
        'At least one device is required'
      );
    });

    it('should throw ValidationError for invalid action', async () => {
      await expect(
        deviceService.batchControl(['dev1'], 'invalid_action', 'admin')
      ).rejects.toThrow('Invalid action');
    });

    it('should support actions: on, off, reset', async () => {
      const validActions = ['on', 'off', 'reset'];
      mockPrisma.device.findMany.mockResolvedValue([{ id: 'dev1', online: true }]);
      mockPrisma.controlLog.createMany.mockResolvedValue({ count: 1 });

      for (const action of validActions) {
        const result = await deviceService.batchControl(['dev1'], action, 'admin');
        expect(result.success).toBe(true);
        expect(result.successCount).toBe(1);
      }
    });
  });

  describe('batchUpdateParams', () => {
    it('should update params for multiple devices', async () => {
      const deviceIds = ['dev1', 'dev2'];
      const params = { mode: 1, summerTempOn: 26 };

      mockPrisma.device.findMany.mockResolvedValue(
        deviceIds.map((id) => ({ id, online: true }))
      );
      mockPrisma.deviceParam.upsert.mockResolvedValue({ id: 1 });

      const result = await deviceService.batchUpdateParams(deviceIds, params);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(result.failCount).toBe(0);
    });

    it('should handle partial failures in params update', async () => {
      const deviceIds = ['dev1', 'dev_not_exist'];
      const params = { mode: 1 };

      mockPrisma.device.findMany.mockResolvedValue([{ id: 'dev1', online: true }]);
      mockPrisma.deviceParam.upsert.mockResolvedValue({ id: 1 });

      const result = await deviceService.batchUpdateParams(deviceIds, params);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(1);
      expect(result.failCount).toBe(1);
      expect(result.failedDevices).toContain('dev_not_exist');
    });

    it('should throw ValidationError for empty device list', async () => {
      await expect(deviceService.batchUpdateParams([], { mode: 1 })).rejects.toThrow(
        'At least one device is required'
      );
    });

    it('should throw ValidationError for empty params', async () => {
      await expect(deviceService.batchUpdateParams(['dev1'], {})).rejects.toThrow(
        'At least one parameter is required'
      );
    });
  });

  describe('batchMoveToGroup', () => {
    it('should move multiple devices to a group', async () => {
      const deviceIds = ['dev1', 'dev2'];
      const groupId = 1;

      mockPrisma.group.findUnique.mockResolvedValue({ id: 1, name: 'Group 1' });
      mockPrisma.device.updateMany.mockResolvedValue({ count: 2 });

      const result = await deviceService.batchMoveToGroup(deviceIds, groupId);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(mockPrisma.device.updateMany).toHaveBeenCalledWith({
        where: { id: { in: deviceIds } },
        data: { groupId: 1 },
      });
    });

    it('should throw NotFoundError for non-existent group', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      await expect(deviceService.batchMoveToGroup(['dev1'], 999)).rejects.toThrow(
        'Group 999 not found'
      );
    });

    it('should throw ValidationError for empty device list', async () => {
      mockPrisma.group.findUnique.mockResolvedValue({ id: 1, name: 'Group 1' });
      await expect(deviceService.batchMoveToGroup([], 1)).rejects.toThrow(
        'At least one device is required'
      );
    });
  });

  describe('batchToggleEnabled', () => {
    it('should toggle enabled status for multiple devices', async () => {
      const deviceIds = ['dev1', 'dev2'];
      const enabled = false;

      mockPrisma.device.updateMany.mockResolvedValue({ count: 2 });

      const result = await deviceService.batchToggleEnabled(deviceIds, enabled);

      expect(result.success).toBe(true);
      expect(result.successCount).toBe(2);
      expect(mockPrisma.device.updateMany).toHaveBeenCalledWith({
        where: { id: { in: deviceIds } },
        data: { enabled: false },
      });
    });

    it('should throw ValidationError for empty device list', async () => {
      await expect(deviceService.batchToggleEnabled([], true)).rejects.toThrow(
        'At least one device is required'
      );
    });
  });

  describe('searchDevices', () => {
    it('should search devices by keyword (IMEI)', async () => {
      mockPrisma.device.findMany.mockResolvedValue([
        { id: 'IMEI12345', name: 'Device A', productId: 'P001' },
      ]);

      const result = await deviceService.searchDevices({ keyword: 'IMEI123' });

      expect(result).toHaveLength(1);
      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { id: { contains: 'IMEI123', mode: 'insensitive' } },
              { name: { contains: 'IMEI123', mode: 'insensitive' } },
              { productId: { contains: 'IMEI123', mode: 'insensitive' } },
            ],
          },
        })
      );
    });

    it('should search devices by keyword (name)', async () => {
      mockPrisma.device.findMany.mockResolvedValue([
        { id: 'IMEI001', name: '空调A', productId: 'P001' },
      ]);

      const result = await deviceService.searchDevices({ keyword: '空调' });

      expect(result).toHaveLength(1);
    });

    it('should filter devices by hierarchy (customerId)', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      await deviceService.searchDevices({ customerId: 1 });

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            group: {
              zone: {
                customerId: 1,
              },
            },
          },
        })
      );
    });

    it('should filter devices by hierarchy (zoneId)', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      await deviceService.searchDevices({ zoneId: 1 });

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            group: {
              zoneId: 1,
            },
          },
        })
      );
    });

    it('should filter devices by hierarchy (groupId)', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      await deviceService.searchDevices({ groupId: 1 });

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            groupId: 1,
          },
        })
      );
    });

    it('should filter devices by online status', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      await deviceService.searchDevices({ online: true });

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            online: true,
          },
        })
      );
    });

    it('should filter devices by enabled status', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      await deviceService.searchDevices({ enabled: true });

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            enabled: true,
          },
        })
      );
    });

    it('should combine multiple filters', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      await deviceService.searchDevices({
        keyword: '空调',
        customerId: 1,
        online: true,
      });

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { id: { contains: '空调', mode: 'insensitive' } },
              { name: { contains: '空调', mode: 'insensitive' } },
              { productId: { contains: '空调', mode: 'insensitive' } },
            ],
            group: {
              zone: {
                customerId: 1,
              },
            },
            online: true,
          },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrisma.device.findMany.mockResolvedValue([]);

      await deviceService.searchDevices({ page: 2, limit: 10 });

      expect(mockPrisma.device.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });
});