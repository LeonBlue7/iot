// miniprogram/pages/control/control.test.ts
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
};

// Mock API functions
const mockControlDevice = jest.fn();

jest.mock('../../utils/api', () => ({
  controlDevice: (...args: any[]) => mockControlDevice(...args),
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
import './control';

describe('Control Page', () => {
  let pageInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPageData.deviceId = '';
    mockPageData.loading = false;
    mockPageData.controlType = null;
    pageInstance = capturedPageConfig;
    // @ts-ignore - Mock return value
    mockControlDevice.mockResolvedValue({ success: true });
  });

  describe('onLoad', () => {
    it('should set deviceId from options', () => {
      pageInstance.onLoad({ id: 'device1' });

      expect(mockPageData.deviceId).toBe('device1');
    });

    it('should handle missing id', () => {
      pageInstance.onLoad({});

      expect(mockPageData.deviceId).toBe('');
    });
  });

  describe('onPowerToggle', () => {
    it('should send power on command', async () => {
      pageInstance.data = { deviceId: 'device1', controlType: 'power' };

      await pageInstance.onPowerToggle();

      expect(mockWx.showLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '发送中...',
        })
      );
      expect(mockControlDevice).toHaveBeenCalledWith('device1', 'on');
      expect(mockWx.hideLoading).toHaveBeenCalled();
    });

    it('should handle control failure', async () => {
      pageInstance.data = { deviceId: 'device1', controlType: 'power' };
      // @ts-ignore - Mock rejection
      mockControlDevice.mockRejectedValue(new Error('Control failed'));

      await pageInstance.onPowerToggle();

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '控制失败',
          icon: 'none',
        })
      );
      expect(mockWx.hideLoading).toHaveBeenCalled();
    });
  });

  describe('onReset', () => {
    it('should send reset command', async () => {
      pageInstance.data = { deviceId: 'device1', controlType: 'reset' };

      await pageInstance.onReset();

      expect(mockWx.showLoading).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '发送中...',
        })
      );
      expect(mockControlDevice).toHaveBeenCalledWith('device1', 'reset');
      expect(mockWx.hideLoading).toHaveBeenCalled();
    });

    it('should handle reset failure', async () => {
      pageInstance.data = { deviceId: 'device1', controlType: 'reset' };
      // @ts-ignore - Mock rejection
      mockControlDevice.mockRejectedValue(new Error('Reset failed'));

      await pageInstance.onReset();

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '控制失败',
          icon: 'none',
        })
      );
    });
  });

  describe('onBack', () => {
    it('should navigate back', () => {
      pageInstance.onBack();

      expect(mockWx.navigateBack).toHaveBeenCalled();
    });
  });
});
