// tests/controllers/alarm.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  getAlarmsHandler,
  acknowledgeAlarmHandler,
  resolveAlarmHandler,
} from '../../src/controllers/alarmController.js';
import * as alarmService from '../../src/services/alarm/index.js';

// Mock the alarm service
jest.mock('../../src/services/alarm/index.js');

const mockAlarmService = alarmService as jest.Mocked<typeof alarmService>;

describe('Alarm Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSetHeader: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();
    mockSetHeader = jest.fn();
    mockNext = jest.fn();
    mockRequest = {
      query: {},
      params: {},
      body: {},
    };
    mockResponse = {
      json: mockJson as any,
      status: mockStatus as any,
      setHeader: mockSetHeader as any,
    };
  });

  describe('getAlarmsHandler', () => {
    it('should return alarms with default parameters', async () => {
      const mockAlarms = [
        { id: 1, deviceId: '123456789012345', alarmType: 'TEMP_HIGH', status: 0 },
      ];
      mockAlarmService.getAlarms.mockResolvedValue({
        data: mockAlarms as any,
        total: 1,
      });

      await getAlarmsHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAlarmService.getAlarms).toHaveBeenCalledWith({
        deviceId: undefined,
        status: undefined,
        startTime: undefined,
        endTime: undefined,
        limit: 20,
        offset: 0,
      });
      expect(mockSetHeader).toHaveBeenCalledWith('X-Total-Count', 1);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAlarms,
      });
    });

    it('should pass query parameters to service', async () => {
      mockRequest.query = {
        deviceId: '123456789012345',
        status: '0',
        limit: '50',
        offset: '10',
      };
      mockAlarmService.getAlarms.mockResolvedValue({ data: [], total: 0 });

      await getAlarmsHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAlarmService.getAlarms).toHaveBeenCalledWith({
        deviceId: '123456789012345',
        status: 0,
        startTime: undefined,
        endTime: undefined,
        limit: 50,
        offset: 10,
      });
    });
  });

  describe('acknowledgeAlarmHandler', () => {
    it('should acknowledge alarm with valid ID', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { operator: 'admin' };
      const mockAlarm = { id: 1, status: 1, acknowledgedAt: new Date() };
      mockAlarmService.acknowledgeAlarm.mockResolvedValue(mockAlarm as any);

      await acknowledgeAlarmHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAlarmService.acknowledgeAlarm).toHaveBeenCalledWith(1, 'admin');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAlarm,
        message: 'Alarm acknowledged',
      });
    });

    it('should use default operator when not provided', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = {};
      const mockAlarm = { id: 1, status: 1 };
      mockAlarmService.acknowledgeAlarm.mockResolvedValue(mockAlarm as any);

      await acknowledgeAlarmHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAlarmService.acknowledgeAlarm).toHaveBeenCalledWith(1, 'user');
    });

    it('should return 404 for invalid ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await acknowledgeAlarmHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('resolveAlarmHandler', () => {
    it('should resolve alarm with valid ID', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.body = { operator: 'admin' };
      const mockAlarm = { id: 1, status: 2, resolvedAt: new Date() };
      mockAlarmService.resolveAlarm.mockResolvedValue(mockAlarm as any);

      await resolveAlarmHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockAlarmService.resolveAlarm).toHaveBeenCalledWith(1, 'admin');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockAlarm,
        message: 'Alarm resolved',
      });
    });

    it('should return 404 for invalid ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await resolveAlarmHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });
});