// miniprogram/pages/device/device.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock wx and Page
const mockPageData: any = {};
const mockSetData = jest.fn((data: any) => {
  Object.assign(mockPageData, data);
});

const mockWx = {
  navigateTo: jest.fn(),
  showToast: jest.fn(),
  stopPullDownRefresh: jest.fn(),
};

// Mock API functions
const mockGetDeviceById = jest.fn();
const mockGetRealtimeData = jest.fn();

jest.mock('../../utils/api', () => ({
  getDeviceById: (...args: any[]) => mockGetDeviceById(...args),
  getRealtimeData: (...args: any[]) => mockGetRealtimeData(...args),
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
import './device';

describe('Device Detail Page', () => {
  let pageInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPageData.device = null;
    mockPageData.loading = false;
    mockPageData.deviceId = '';
    mockPageData.temperature = null;
    mockPageData.humidity = null;
    mockPageData.realtimeData = null;
    pageInstance = capturedPageConfig;
  });

  describe('onLoad', () => {
    it('should load device data with provided id', () => {
      const spy = jest.spyOn(pageInstance, 'loadDeviceData');

      pageInstance.onLoad({ id: 'device1' });

      expect(spy).toHaveBeenCalledWith('device1');
      expect(mockPageData.deviceId).toBe('device1');
      spy.mockRestore();
    });

    it('should handle missing id', () => {
      const spy = jest.spyOn(pageInstance, 'loadDeviceData');

      pageInstance.onLoad({});

      expect(spy).toHaveBeenCalledWith('');
      spy.mockRestore();
    });
  });

  describe('loadDeviceData', () => {
    it('should set loading to true', async () => {
      // @ts-ignore - Mock return values
      mockGetDeviceById.mockResolvedValue({ id: 'device1', name: 'Test', online: true });
      // @ts-ignore - Mock return values
      mockGetRealtimeData.mockResolvedValue({ temperature: 25, humidity: 60 });

      await pageInstance.loadDeviceData('device1');

      expect(mockSetData).toHaveBeenCalledWith(expect.objectContaining({ loading: true }));
    });

    it('should load device and realtime data successfully', async () => {
      const mockDevice = { id: 'device1', name: '空调 1', online: true };
      const mockData = { temperature: 25.5, humidity: 60 };

      // @ts-ignore - Mock return values
      mockGetDeviceById.mockResolvedValue(mockDevice);
      // @ts-ignore - Mock return values
      mockGetRealtimeData.mockResolvedValue(mockData);

      await pageInstance.loadDeviceData('device1');

      expect(mockPageData.device).toEqual(mockDevice);
      expect(mockPageData.realtimeData).toEqual(mockData);
      expect(mockPageData.temperature).toBe(25.5);
      expect(mockPageData.humidity).toBe(60);
      expect(mockPageData.loading).toBe(false);
    });

    it('should handle null realtime data', async () => {
      const mockDevice = { id: 'device1', name: '空调 1', online: true };

      // @ts-ignore - Mock return values
      mockGetDeviceById.mockResolvedValue(mockDevice);
      // @ts-ignore - Mock return values
      mockGetRealtimeData.mockResolvedValue(null);

      await pageInstance.loadDeviceData('device1');

      expect(mockPageData.device).toEqual(mockDevice);
      expect(mockPageData.temperature).toBe(null);
      expect(mockPageData.humidity).toBe(null);
    });

    it('should handle load failure', async () => {
      // @ts-ignore - Mock return values
      mockGetDeviceById.mockRejectedValue(new Error('Network error'));

      await pageInstance.loadDeviceData('device1');

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '加载失败',
          icon: 'none',
        })
      );
      expect(mockPageData.loading).toBe(false);
    });
  });

  describe('onRefresh', () => {
    it('should reload device data', async () => {
      pageInstance.data = { deviceId: 'device1' };

      // @ts-ignore - Mock return values
      mockGetDeviceById.mockResolvedValue({ id: 'device1', name: 'Test', online: true });
      // @ts-ignore - Mock return values
      mockGetRealtimeData.mockResolvedValue({ temperature: 26, humidity: 55 });

      await pageInstance.onRefresh();

      expect(mockGetDeviceById).toHaveBeenCalledWith('device1');
    });
  });

  describe('onControlTap', () => {
    it('should navigate to control page', () => {
      pageInstance.data = { deviceId: 'device1' };

      pageInstance.onControlTap();

      expect(mockWx.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/pages/control/control?id=device1',
        })
      );
    });
  });

  describe('onParamsTap', () => {
    it('should navigate to params page', () => {
      pageInstance.data = { deviceId: 'device1' };

      pageInstance.onParamsTap();

      expect(mockWx.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/pages/params/params?id=device1',
        })
      );
    });
  });

  describe('onPullDownRefresh', () => {
    it('should refresh and stop pull animation', async () => {
      pageInstance.data = { deviceId: 'device1' };

      // @ts-ignore - Mock return values
      mockGetDeviceById.mockResolvedValue({ id: 'device1', name: 'Test', online: true });
      // @ts-ignore - Mock return values
      mockGetRealtimeData.mockResolvedValue({ temperature: 25, humidity: 60 });

      await pageInstance.onPullDownRefresh();

      expect(mockWx.stopPullDownRefresh).toHaveBeenCalled();
    });
  });
});
