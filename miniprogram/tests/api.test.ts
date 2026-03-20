// miniprogram/tests/api.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock wx object
const mockWx = {
  request: jest.fn(),
};

// @ts-ignore - Global wx object
global.wx = mockWx;

// Import after mock
import {
  request,
  getDevices,
  getDeviceById,
  getRealtimeData,
  getHistoryData,
  controlDevice,
  getDeviceParams,
  updateDeviceParams,
  getAlarms,
  acknowledgeAlarm,
  getOverviewStats,
} from '../utils/api';

describe('API Utils', () => {
  beforeEach(() => {
    mockWx.request.mockClear();
  });

  describe('request', () => {
    it('should handle successful GET request', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { success: true, data: { id: '1' } },
      };

      mockWx.request.mockImplementation(({ success }: any) => {
        success(mockResponse);
      });

      const result = await request('/test', 'GET');

      expect(result).toEqual({ success: true, data: { id: '1' } });
      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://www.jxbonner.cloud/api/test',
          method: 'GET',
        })
      );
    });

    it('should handle successful POST request', async () => {
      const mockResponse = {
        statusCode: 200,
        data: { success: true, message: 'Created' },
      };

      mockWx.request.mockImplementation(({ success }: any) => {
        success(mockResponse);
      });

      const result = await request('/test', 'POST', { name: 'test' });

      expect(result).toEqual({ success: true, message: 'Created' });
      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { name: 'test' },
        })
      );
    });

    it('should reject on non-200 status', async () => {
      const mockResponse = {
        statusCode: 404,
      };

      mockWx.request.mockImplementation(({ success }: any) => {
        success(mockResponse);
      });

      await expect(request('/test', 'GET')).rejects.toThrow('Request failed with status 404');
    });

    it('should reject on network error', async () => {
      const mockError = { errMsg: 'network timeout' };

      mockWx.request.mockImplementation(({ fail }: any) => {
        fail(mockError);
      });

      await expect(request('/test', 'GET')).rejects.toEqual(mockError);
    });
  });

  describe('getDevices', () => {
    it('should return devices array', async () => {
      const mockDevices = [
        { id: 'device1', name: 'Device 1', online: true },
        { id: 'device2', name: 'Device 2', online: false },
      ];

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockDevices },
        });
      });

      const result = await getDevices();

      expect(result).toEqual(mockDevices);
      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://www.jxbonner.cloud/api/devices',
          method: 'GET',
        })
      );
    });

    it('should return empty array when data is null', async () => {
      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: null },
        });
      });

      const result = await getDevices();

      expect(result).toEqual([]);
    });
  });

  describe('getDeviceById', () => {
    it('should return single device', async () => {
      const mockDevice = { id: 'device1', name: 'Device 1', online: true };

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockDevice },
        });
      });

      const result = await getDeviceById('device1');

      expect(result).toEqual(mockDevice);
      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://www.jxbonner.cloud/api/devices/device1',
        })
      );
    });
  });

  describe('getRealtimeData', () => {
    it('should return realtime sensor data', async () => {
      const mockData = {
        temperature: 25.5,
        humidity: 60,
        recordedAt: '2024-01-01T10:00:00Z',
      };

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockData },
        });
      });

      const result = await getRealtimeData('device1');

      expect(result).toEqual(mockData);
    });

    it('should return null when no data', async () => {
      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: null },
        });
      });

      const result = await getRealtimeData('device1');

      expect(result).toBeNull();
    });
  });

  describe('getHistoryData', () => {
    it('should return history data', async () => {
      const mockData = [
        { temperature: 25.5, humidity: 60, recordedAt: '2024-01-01T10:00:00Z' },
        { temperature: 26.0, humidity: 58, recordedAt: '2024-01-01T11:00:00Z' },
      ];

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockData },
        });
      });

      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T23:59:59Z');
      const result = await getHistoryData('device1', startTime, endTime, 100);

      expect(result).toEqual(mockData);
      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startTime: '2024-01-01T00:00:00.000Z',
            endTime: '2024-01-01T23:59:59.000Z',
            limit: 100,
          }),
        })
      );
    });

    it('should return empty array when no data', async () => {
      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: null },
        });
      });

      const startTime = new Date('2024-01-01T00:00:00Z');
      const endTime = new Date('2024-01-01T23:59:59Z');
      const result = await getHistoryData('device1', startTime, endTime);

      expect(result).toEqual([]);
    });
  });

  describe('getDeviceParams', () => {
    it('should return device params', async () => {
      const mockParams = {
        mode: 1,
        tempHighLimit: 30,
        tempLowLimit: 18,
      };

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockParams },
        });
      });

      const result = await getDeviceParams('device1');

      expect(result).toEqual(mockParams);
    });

    it('should return null when no params', async () => {
      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: null },
        });
      });

      const result = await getDeviceParams('device1');

      expect(result).toBeNull();
    });
  });

  describe('updateDeviceParams', () => {
    it('should update device params', async () => {
      const mockParams = {
        mode: 1,
        tempHighLimit: 32,
      };

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockParams },
        });
      });

      const result = await updateDeviceParams('device1', { tempHighLimit: 32 });

      expect(result).toEqual(mockParams);
      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          data: { tempHighLimit: 32 },
        })
      );
    });
  });

  describe('controlDevice', () => {
    it('should send control command', async () => {
      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, message: 'Command sent' },
        });
      });

      await controlDevice('device1', 'on');

      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://www.jxbonner.cloud/api/devices/device1/control',
          method: 'POST',
          data: { action: 'on' },
        })
      );
    });
  });

  describe('getAlarms', () => {
    it('should return alarms with total', async () => {
      const mockAlarms = [
        { id: 1, deviceId: 'device1', alarmType: 'TEMP_HIGH', status: 0 },
      ];

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: {
              data: mockAlarms,
              total: '1',
            },
          },
        });
      });

      const result = await getAlarms();

      expect(result).toEqual({
        data: mockAlarms,
        total: 1,
      });
    });

    it('should pass filter options', async () => {
      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: {
            success: true,
            data: { data: [], total: '0' },
          },
        });
      });

      await getAlarms({ deviceId: 'device1', status: 0, limit: 20, offset: 0 });

      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deviceId: 'device1',
            status: 0,
            limit: 20,
            offset: 0,
          }),
        })
      );
    });
  });

  describe('acknowledgeAlarm', () => {
    it('should acknowledge an alarm', async () => {
      const mockAlarm = { id: 1, status: 1 };

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockAlarm },
        });
      });

      const result = await acknowledgeAlarm(1);

      expect(result).toEqual(mockAlarm);
      expect(mockWx.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://www.jxbonner.cloud/api/alarms/1/acknowledge',
          method: 'PUT',
        })
      );
    });
  });

  describe('getOverviewStats', () => {
    it('should return overview statistics', async () => {
      const mockStats = {
        totalDevices: 10,
        onlineDevices: 8,
        offlineDevices: 2,
        totalAlarms: 5,
        unacknowledgedAlarms: 3,
      };

      mockWx.request.mockImplementation(({ success }: any) => {
        success({
          statusCode: 200,
          data: { success: true, data: mockStats },
        });
      });

      const result = await getOverviewStats();

      expect(result).toEqual(mockStats);
    });
  });
});
