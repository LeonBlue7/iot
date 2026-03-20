// tests/services/stats.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import * as statsService from '../../src/services/stats/index.js';
import prisma from '../../src/utils/database.js';

// Mock prisma
jest.mock('../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    device: {
      count: jest.fn(),
    },
    alarmRecord: {
      count: jest.fn(),
    },
    sensorData: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

describe('Stats Service', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverviewStats', () => {
    it('should return overview statistics', async () => {
      mockPrisma.device.count.mockResolvedValueOnce(20).mockResolvedValueOnce(15);
      mockPrisma.alarmRecord.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

      const result = await statsService.getOverviewStats();

      expect(result).toEqual({
        totalDevices: 20,
        onlineDevices: 15,
        offlineDevices: 5,
        totalAlarms: 10,
        unacknowledgedAlarms: 3,
      });
    });
  });

  describe('getTrendData', () => {
    it('should return temperature trend data', async () => {
      const mockData = [
        {
          recordedAt: new Date('2024-01-01T10:00:00Z'),
          temperature: { toNumber: () => 25.5 },
          humidity: { toNumber: () => 60 },
          current: 100,
        },
        {
          recordedAt: new Date('2024-01-01T11:00:00Z'),
          temperature: { toNumber: () => 26.5 },
          humidity: { toNumber: () => 62 },
          current: 105,
        },
      ];

      mockPrisma.sensorData.findMany.mockResolvedValue(mockData);

      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T23:59:59Z');
      const result = await statsService.getTrendData(
        'device1',
        'temperature',
        startTime,
        endTime
      );

      expect(result).toEqual([
        { time: new Date('2024-01-01T10:00:00Z'), value: 25.5 },
        { time: new Date('2024-01-01T11:00:00Z'), value: 26.5 },
      ]);
    });

    it('should return humidity trend data', async () => {
      const mockData = [
        {
          recordedAt: new Date('2024-01-01T10:00:00Z'),
          temperature: { toNumber: () => 25.5 },
          humidity: { toNumber: () => 60 },
          current: 100,
        },
      ];

      mockPrisma.sensorData.findMany.mockResolvedValue(mockData);

      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T23:59:59Z');
      const result = await statsService.getTrendData(
        'device1',
        'humidity',
        startTime,
        endTime
      );

      expect(result).toEqual([
        { time: new Date('2024-01-01T10:00:00Z'), value: 60 },
      ]);
    });

    it('should return current trend data', async () => {
      const mockData = [
        {
          recordedAt: new Date('2024-01-01T10:00:00Z'),
          temperature: { toNumber: () => 25.5 },
          humidity: { toNumber: () => 60 },
          current: 100,
        },
      ];

      mockPrisma.sensorData.findMany.mockResolvedValue(mockData);

      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T23:59:59Z');
      const result = await statsService.getTrendData(
        'device1',
        'current',
        startTime,
        endTime
      );

      expect(result).toEqual([
        { time: new Date('2024-01-01T10:00:00Z'), value: 100 },
      ]);
    });

    it('should handle null values', async () => {
      const mockData = [
        {
          recordedAt: new Date('2024-01-01T10:00:00Z'),
          temperature: null,
          humidity: null,
          current: null,
        },
      ];

      mockPrisma.sensorData.findMany.mockResolvedValue(mockData);

      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T23:59:59Z');
      const result = await statsService.getTrendData(
        'device1',
        'temperature',
        startTime,
        endTime
      );

      expect(result).toEqual([
        { time: new Date('2024-01-01T10:00:00Z'), value: null },
      ]);
    });
  });

  describe('getDailyStats', () => {
    it('should return daily statistics', async () => {
      const mockSensorStats = {
        _avg: {
          temperature: { toNumber: () => 25.5 },
          humidity: { toNumber: () => 60 },
        },
        _max: {
          temperature: { toNumber: () => 30 },
        },
        _min: {
          temperature: { toNumber: () => 20 },
        },
      };

      mockPrisma.sensorData.aggregate.mockResolvedValue(mockSensorStats);
      mockPrisma.alarmRecord.count.mockResolvedValue(2);

      const date = new Date('2024-01-01');
      const result = await statsService.getDailyStats('device1', date);

      expect(result).toEqual({
        avgTemperature: 25.5,
        avgHumidity: 60,
        maxTemperature: 30,
        minTemperature: 20,
        alarmCount: 2,
      });
    });

    it('should handle null stats', async () => {
      const mockSensorStats = {
        _avg: {
          temperature: null,
          humidity: null,
        },
        _max: {
          temperature: null,
        },
        _min: {
          temperature: null,
        },
      };

      mockPrisma.sensorData.aggregate.mockResolvedValue(mockSensorStats);
      mockPrisma.alarmRecord.count.mockResolvedValue(0);

      const date = new Date('2024-01-01');
      const result = await statsService.getDailyStats('device1', date);

      expect(result).toEqual({
        avgTemperature: null,
        avgHumidity: null,
        maxTemperature: null,
        minTemperature: null,
        alarmCount: 0,
      });
    });
  });
});
