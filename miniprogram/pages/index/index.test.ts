// miniprogram/pages/index/index.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Page and wx
const mockPageData: any = {};
const mockSetData = jest.fn((data: any) => {
  Object.assign(mockPageData, data);
});

const mockWx = {
  request: jest.fn(),
  showToast: jest.fn(),
  showLoading: jest.fn(),
  hideLoading: jest.fn(),
  navigateTo: jest.fn(),
  stopPullDownRefresh: jest.fn(),
};

// @ts-ignore
global.wx = mockWx;

// Mock getApp
const mockApp = {
  request: jest.fn(),
};
// @ts-ignore
global.getApp = jest.fn(() => mockApp);

// Mock Page to capture config and bind setData
let capturedPageConfig: any = null;
// @ts-ignore
global.Page = (config: any) => {
  // Bind setData to mockPageData
  config.setData = mockSetData;
  capturedPageConfig = config;
};

// Import page logic after mocks are set up
import './index';

describe('Index Page', () => {
  let pageInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPageData.deviceList = [];
    mockPageData.loading = false;
    mockPageData.deviceId = '';
    pageInstance = capturedPageConfig;
    // Reset mockApp.request to default success
    // @ts-ignore - Mock return value
    mockApp.request.mockResolvedValue([]);
  });

  describe('onLoad', () => {
    it('should call loadDevices when page loads', () => {
      const spy = jest.spyOn(pageInstance, 'loadDevices');

      pageInstance.onLoad();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('loadDevices', () => {
    it('should set loading to true', async () => {
      // @ts-ignore - Mock return value
      mockApp.request.mockResolvedValue([]);

      await pageInstance.loadDevices();

      expect(mockSetData).toHaveBeenCalledWith({ loading: true });
    });

    it('should load devices successfully', async () => {
      const mockDevices = [
        { id: 'device1', name: '空调 1', online: true },
        { id: 'device2', name: '空调 2', online: false },
      ];

      // @ts-ignore - Mock return value
      mockApp.request.mockResolvedValue(mockDevices);

      await pageInstance.loadDevices();

      expect(mockSetData).toHaveBeenCalledWith({ loading: true });
      expect(mockSetData).toHaveBeenCalledWith({
        deviceList: mockDevices,
        loading: false,
      });
    });

    it('should handle load failure', async () => {
      // @ts-ignore - Mock rejection
      mockApp.request.mockRejectedValue(new Error('network error'));

      await pageInstance.loadDevices();

      expect(mockSetData).toHaveBeenCalledWith({ loading: true });
      expect(mockSetData).toHaveBeenCalledWith(
        expect.objectContaining({
          loading: false,
        })
      );
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '加载失败',
          icon: 'none',
        })
      );
    });
  });

  describe('onDeviceTap', () => {
    it('should navigate to device detail page', () => {
      pageInstance.onDeviceTap({
        currentTarget: {
          dataset: {
            deviceId: 'device1',
          },
        },
      });

      expect(mockWx.navigateTo).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/pages/device/device?id=device1'),
        })
      );
    });
  });

  describe('onPullDownRefresh', () => {
    it('should reload devices and stop refresh', async () => {
      const mockStopPullRefresh = jest.fn();
      mockWx.stopPullDownRefresh = mockStopPullRefresh;

      // @ts-ignore - Mock return value
      mockApp.request.mockResolvedValue([]);

      await pageInstance.onPullDownRefresh();

      expect(mockStopPullRefresh).toHaveBeenCalled();
    });
  });
});
