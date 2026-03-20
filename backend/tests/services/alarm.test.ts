// tests/services/alarm.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { NotFoundError } from '../../src/utils/errors.js';
import * as alarmService from '../../src/services/alarm/index.js';
import prisma from '../../src/utils/database.js';

// Mock prisma
jest.mock('../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    alarmRecord: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Alarm Service', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAlarms', () => {
    it('should return alarms with default pagination', async () => {
      const mockAlarms = [
        { id: 1, deviceId: 'device1', alarmType: 'TEMP_HIGH', status: 0 },
      ];

      mockPrisma.alarmRecord.findMany.mockResolvedValue(mockAlarms);
      mockPrisma.alarmRecord.count.mockResolvedValue(1);

      const result = await alarmService.getAlarms({});

      expect(result.data).toEqual(mockAlarms);
      expect(result.total).toBe(1);
    });

    it('should filter by deviceId', async () => {
      mockPrisma.alarmRecord.findMany.mockResolvedValue([]);
      mockPrisma.alarmRecord.count.mockResolvedValue(0);

      await alarmService.getAlarms({ deviceId: 'device1' });

      expect(mockPrisma.alarmRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deviceId: 'device1' },
        })
      );
    });

    it('should filter by status', async () => {
      mockPrisma.alarmRecord.findMany.mockResolvedValue([]);
      mockPrisma.alarmRecord.count.mockResolvedValue(0);

      await alarmService.getAlarms({ status: 0 });

      expect(mockPrisma.alarmRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 0 },
        })
      );
    });

    it('should filter by date range', async () => {
      const startTime = new Date('2024-01-01');
      const endTime = new Date('2024-01-31');
      mockPrisma.alarmRecord.findMany.mockResolvedValue([]);
      mockPrisma.alarmRecord.count.mockResolvedValue(0);

      await alarmService.getAlarms({ startTime, endTime });

      expect(mockPrisma.alarmRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startTime,
              lte: endTime,
            },
          },
        })
      );
    });

    it('should use custom limit and offset', async () => {
      mockPrisma.alarmRecord.findMany.mockResolvedValue([]);
      mockPrisma.alarmRecord.count.mockResolvedValue(0);

      await alarmService.getAlarms({ limit: 50, offset: 100 });

      expect(mockPrisma.alarmRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
          skip: 100,
        })
      );
    });

    it('should filter by all parameters', async () => {
      const startTime = new Date('2024-01-01');
      const endTime = new Date('2024-01-31');
      mockPrisma.alarmRecord.findMany.mockResolvedValue([]);
      mockPrisma.alarmRecord.count.mockResolvedValue(0);

      await alarmService.getAlarms({
        deviceId: 'device1',
        status: 0,
        startTime,
        endTime,
        limit: 25,
        offset: 50,
      });

      expect(mockPrisma.alarmRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deviceId: 'device1',
            status: 0,
            createdAt: {
              gte: startTime,
              lte: endTime,
            },
          },
          take: 25,
          skip: 50,
        })
      );
    });
  });

  describe('acknowledgeAlarm', () => {
    it('should acknowledge an alarm', async () => {
      const mockAlarm = { id: 1, status: 0 };
      const updatedAlarm = { ...mockAlarm, status: 1 };

      mockPrisma.alarmRecord.findUnique.mockResolvedValue(mockAlarm);
      mockPrisma.alarmRecord.update.mockResolvedValue(updatedAlarm);

      const result = await alarmService.acknowledgeAlarm(1, 'admin');

      expect(result).toEqual(updatedAlarm);
    });

    it('should throw NotFoundError if alarm does not exist', async () => {
      mockPrisma.alarmRecord.findUnique.mockResolvedValue(null);

      await expect(alarmService.acknowledgeAlarm(999, 'admin')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('resolveAlarm', () => {
    it('should resolve an alarm', async () => {
      const mockAlarm = { id: 1, status: 1 };
      const updatedAlarm = { ...mockAlarm, status: 2 };

      mockPrisma.alarmRecord.findUnique.mockResolvedValue(mockAlarm);
      mockPrisma.alarmRecord.update.mockResolvedValue(updatedAlarm);

      const result = await alarmService.resolveAlarm(1, 'admin');

      expect(result).toEqual(updatedAlarm);
    });

    it('should throw NotFoundError if alarm does not exist', async () => {
      mockPrisma.alarmRecord.findUnique.mockResolvedValue(null);

      await expect(alarmService.resolveAlarm(999, 'admin')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getUnacknowledgedCount', () => {
    it('should return count of unacknowledged alarms', async () => {
      mockPrisma.alarmRecord.count.mockResolvedValue(5);

      const result = await alarmService.getUnacknowledgedCount();

      expect(result).toBe(5);
    });
  });
});
