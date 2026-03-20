// miniprogram/pages/params/params.test.ts
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
const mockGetDeviceParams = jest.fn();
const mockUpdateDeviceParams = jest.fn();

jest.mock('../../utils/api', () => ({
  getDeviceParams: (...args: any[]) => mockGetDeviceParams(...args),
  updateDeviceParams: (...args: any[]) => mockUpdateDeviceParams(...args),
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
import './params';

describe('Params Page', () => {
  let pageInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPageData.deviceId = '';
    mockPageData.loading = false;
    mockPageData.params = null;
    pageInstance = capturedPageConfig;
  });

  describe('onLoad', () => {
    it('should set deviceId and load params', () => {
      pageInstance.onLoad({ id: 'device1' });

      expect(mockPageData.deviceId).toBe('device1');
      expect(mockGetDeviceParams).toHaveBeenCalledWith('device1');
    });
  });

  describe('loadParams', () => {
    it('should load params successfully', async () => {
      const mockParams = {
        mode: 1,
        summerTempOn: 28,
        summerTempSet: 26,
        summerTempOff: 30,
      };

      // @ts-ignore - Mock return value
      mockGetDeviceParams.mockResolvedValue(mockParams);

      await pageInstance.loadParams('device1');

      expect(mockPageData.params).toEqual(mockParams);
      expect(mockPageData.loading).toBe(false);
    });

    it('should handle load failure', async () => {
      // @ts-ignore - Mock rejection
      mockGetDeviceParams.mockRejectedValue(new Error('Load failed'));

      await pageInstance.loadParams('device1');

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '加载失败',
          icon: 'none',
        })
      );
      expect(mockPageData.loading).toBe(false);
    });
  });

  describe('onSave', () => {
    it('should save params successfully', async () => {
      pageInstance.data = { deviceId: 'device1', params: { mode: 1, summerTempOn: 28 } };

      // @ts-ignore - Mock return value
      mockUpdateDeviceParams.mockResolvedValue({ mode: 1, summerTempOn: 28 });

      await pageInstance.onSave();

      expect(mockUpdateDeviceParams).toHaveBeenCalledWith('device1', { mode: 1, summerTempOn: 28 });
      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '保存成功',
          icon: 'success',
        })
      );
    });

    it('should handle save failure', async () => {
      pageInstance.data = { deviceId: 'device1', params: { mode: 1 } };

      // @ts-ignore - Mock rejection
      mockUpdateDeviceParams.mockRejectedValue(new Error('Save failed'));

      await pageInstance.onSave();

      expect(mockWx.showToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '保存失败',
          icon: 'none',
        })
      );
    });
  });

  describe('onParamChange', () => {
    it('should update params on change', () => {
      pageInstance.data = { params: { mode: 0, summerTempOn: 25 } };

      pageInstance.onParamChange({
        detail: {
          key: 'summerTempOn',
          value: 28,
        },
      });

      // Verify setData was called with updated params
      expect(mockSetData).toHaveBeenCalledWith({
        params: {
          mode: 0,
          summerTempOn: 28,
        },
      });
    });
  });

  describe('onBack', () => {
    it('should navigate back', () => {
      pageInstance.onBack();

      expect(mockWx.navigateBack).toHaveBeenCalled();
    });
  });
});
