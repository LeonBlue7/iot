// miniprogram/pages/alarms/alarms.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock wx and Page
const mockPageData: any = {};
const mockSetData = jest.fn((data: any) => {
  Object.assign(mockPageData, data);
});

const mockWx = {
  navigateBack: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  stopPullDownRefresh: jest.fn(),
};

// Mock API functions
const mockGetAlarms = jest.fn();
const mockAcknowledgeAlarm = jest.fn();

jest.mock('../../utils/api', () => ({
  getAlarms: (...args: any[]) => mockGetAlarms(...args),
  acknowledgeAlarm: (...args: any[]) => mockAcknowledgeAlarm(...args),
}));

// @ts-ignore
global.wx = mockWx;

// Capture page config and bind setData
let capturedPageConfig: any = null;
// @ts-ignore
global.Page = (config: any) => {
  config.setData = mockSetData;
  config.data = mockPageData;
  capturedPageConfig = config;
};

// Import page logic after mocks
import './alarms';

describe('Alarms Page', () => {
  let pageInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPageData.alarms = [];
    mockPageData.loading = false;
    mockPageData.total = 0;
    pageInstance = capturedPageConfig;
    // @ts-ignore - Mock return value
    mockGetAlarms.mockResolvedValue({ data: [], total: 0 });
  });

  describe('onLoad', () => {
    it('should load alarms when page loads', () => {
      pageInstance.onLoad();

      expect(mockGetAlarms).toHaveBeenCalled();
    });
  });

  describe('loadAlarms', () => {
    it('should load alarms successfully', async () => {
      const mockAlarmsData = {
        data: [
          { id: 1, deviceId: 'device1', alarmType: 'temp_high', status: 0 },
          { id: 2, deviceId: 'device2', alarmType: 'humi_low', status: 1 },
        ],
        total: 2,
      };

      // @ts-ignore - Mock return value
      mockGetAlarms.mockResolvedValue(mockAlarmsData);

      await pageInstance.loadAlarms();

      expect(mockPageData.alarms).toEqual(mockAlarmsData.data);
      expect(mockPageData.total).toBe(2);
      expect(mockPageData.loading).toBe(false);
    });

    it('should handle load failure', async () => {
      // @ts-ignore - Mock rejection
      mockGetAlarms.mockRejectedValue(new Error('Load failed'));

      await pageInstance.loadAlarms();

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '加载失败',
          icon: 'none',
        })
      );
      expect(mockPageData.loading).toBe(false);
    });
  });

  describe('onAcknowledge', () => {
    it('should acknowledge alarm successfully', async () => {
      pageInstance.data = { alarms: [{ id: 1, status: 0 }] };

      // @ts-ignore - Mock return value
      mockAcknowledgeAlarm.mockResolvedValue({ id: 1, status: 1 });

      await pageInstance.onAcknowledge(1);

      expect(mockAcknowledgeAlarm).toHaveBeenCalledWith(1);
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认成功',
          icon: 'success',
        })
      );
    });

    it('should handle acknowledge failure', async () => {
      pageInstance.data = { alarms: [{ id: 1, status: 0 }] };

      // @ts-ignore - Mock rejection
      mockAcknowledgeAlarm.mockRejectedValue(new Error('Ack failed'));

      await pageInstance.onAcknowledge(1);

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '确认失败',
          icon: 'none',
        })
      );
    });
  });

  describe('onPullDownRefresh', () => {
    it('should reload alarms and stop refresh', async () => {
      // @ts-ignore - Mock return value
      mockGetAlarms.mockResolvedValue({ data: [], total: 0 });

      // Call onPullDownRefresh and wait for the promise chain
      const promise = pageInstance.onPullDownRefresh();
      await promise;

      // Give the .then() callback time to execute
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockGetAlarms).toHaveBeenCalled();
      expect(mockWx.stopPullDownRefresh).toHaveBeenCalled();
    });
  });

  describe('onBack', () => {
    it('should navigate back', () => {
      pageInstance.onBack();

      expect(mockWx.navigateBack).toHaveBeenCalled();
    });
  });
});
