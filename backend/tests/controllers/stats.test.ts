// tests/controllers/stats.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  getOverviewStatsHandler,
  getTrendDataHandler,
  getDailyStatsHandler,
} from '../../src/controllers/statsController.js';
import * as statsService from '../../src/services/stats/index.js';

// Mock the stats service
jest.mock('../../src/services/stats/index.js');

const mockStatsService = statsService as jest.Mocked<typeof statsService>;

describe('Stats Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockNext = jest.fn();
    mockRequest = { query: {} };
    mockResponse = {
      json: mockJson as any,
      status: mockStatus as any,
    };
  });

  describe('getOverviewStatsHandler', () => {
    it('should return overview stats', async () => {
      const mockStats = {
        totalDevices: 10,
        onlineDevices: 8,
        offlineDevices: 2,
        totalAlarms: 5,
        unacknowledgedAlarms: 3,
      };
      mockStatsService.getOverviewStats.mockResolvedValue(mockStats);

      await getOverviewStatsHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatsService.getOverviewStats).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });
  });

  describe('getTrendDataHandler', () => {
    it('should return trend data with valid parameters', async () => {
      mockRequest.query = {
        deviceId: '123456789012345',
        metric: 'temperature',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-02T00:00:00Z',
      };
      const mockTrendData = [{ timestamp: new Date(), value: 25.5 }];
      mockStatsService.getTrendData.mockResolvedValue(mockTrendData);

      await getTrendDataHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatsService.getTrendData).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockTrendData,
      });
    });

    it('should return 400 when deviceId is missing', async () => {
      mockRequest.query = {
        metric: 'temperature',
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-02T00:00:00Z',
      };

      await getTrendDataHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Missing required parameters',
      });
    });

    it('should return 400 when parameters are missing', async () => {
      mockRequest.query = {};

      await getTrendDataHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getDailyStatsHandler', () => {
    it('should return daily stats with valid parameters', async () => {
      mockRequest.query = {
        deviceId: '123456789012345',
        date: '2024-01-15',
      };
      const mockDailyStats = {
        avgTemperature: 25.5,
        avgHumidity: 60,
        maxTemperature: 30,
        minTemperature: 20,
        alarmCount: 2,
      };
      mockStatsService.getDailyStats.mockResolvedValue(mockDailyStats);

      await getDailyStatsHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatsService.getDailyStats).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockDailyStats,
      });
    });

    it('should return 400 when deviceId is missing', async () => {
      mockRequest.query = { date: '2024-01-15' };

      await getDailyStatsHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 when date is missing', async () => {
      mockRequest.query = { deviceId: '123456789012345' };

      await getDailyStatsHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });
});