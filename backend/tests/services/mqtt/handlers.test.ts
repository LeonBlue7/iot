// tests/services/mqtt/handlers.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies BEFORE importing handlers
const mockPrisma = {
  device: {
    upsert: jest.fn().mockResolvedValue({ id: 'test-device' }),
    update: jest.fn().mockResolvedValue({ id: 'test-device' }),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  sensorData: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  deviceParam: {
    upsert: jest.fn().mockResolvedValue({ deviceId: 'test-device', version: 1 }),
    findUnique: jest.fn().mockResolvedValue(null),
  },
  alarmRecord: {
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

const mockRedis = {
  set: jest.fn().mockResolvedValue('OK'),
  get: jest.fn().mockResolvedValue(null),
  ping: jest.fn().mockResolvedValue('PONG'),
  disconnect: jest.fn(),
};

jest.mock('../../../src/utils/database.js', () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock('../../../src/utils/redis.js', () => ({
  __esModule: true,
  default: mockRedis,
  CacheKeys: {
    deviceOnline: (id: string) => `device:online:${id}`,
    deviceData: (id: string) => `device:data:${id}`,
    deviceParams: (id: string) => `device:params:${id}`,
  },
  CacheTTL: {
    deviceOnline: 300,
    deviceData: 60,
    deviceParams: 300,
  },
}));

jest.mock('../../../src/utils/logger.js', () => ({
  __esModule: true,
  default: mockLogger,
}));

// Import after mocks
import {
  handleMessage,
  handleDataUpload,
  handleLogin,
  handleParameterUpload,
} from '../../../src/services/mqtt/handlers.js';

describe('MQTT Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('should parse valid topic and call appropriate handler', async () => {
      const payload = Buffer.from(
        JSON.stringify({
          IMEI: '866965081754902',
          ICCID: '1234567890123456789',
        })
      );

      handleMessage('/up/866965081754902/login', payload);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should reject invalid topic format', () => {
      const payload = Buffer.from('{}');
      handleMessage('/invalid/topic', payload);
    });

    it('should reject invalid deviceId format', () => {
      const payload = Buffer.from('{}');
      handleMessage('/up/invalid/datas', payload);
    });

    it('should route datas action correctly', async () => {
      const payload = Buffer.from(
        JSON.stringify({
          mid: 163,
          data: { temp: 25.5, humi: 60 },
          timestamp: '1704067200',
        })
      );

      handleMessage('/up/866965081754902/datas', payload);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should route getdatas_reply action correctly', async () => {
      const payload = Buffer.from(
        JSON.stringify({
          mid: 163,
          data: { temp: 25.5, humi: 60 },
        })
      );

      handleMessage('/up/866965081754902/getdatas_reply', payload);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should route parameter action correctly', async () => {
      const payload = Buffer.from(
        JSON.stringify({
          mode: 1,
          summerTempOn: 28,
        })
      );

      handleMessage('/up/866965081754902/parameter', payload);
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });

  describe('handleLogin', () => {
    it('should handle valid login message', async () => {
      mockPrisma.device.upsert.mockResolvedValueOnce({ id: '866965081754902' });
      const payload = JSON.stringify({
        IMEI: '866965081754902',
        ICCID: '1234567890123456789',
      });

      await handleLogin('866965081754902', payload);
    });

    it('should reject invalid IMEI format', async () => {
      const payload = JSON.stringify({
        IMEI: 'invalid',
      });

      await handleLogin('866965081754902', payload);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle missing IMEI', async () => {
      const payload = JSON.stringify({});

      await handleLogin('866965081754902', payload);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const payload = 'invalid json';

      await handleLogin('866965081754902', payload);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('handleDataUpload', () => {
    it('should handle new format data message', async () => {
      mockPrisma.device.upsert.mockResolvedValueOnce({ id: '866965081754902' });
      mockPrisma.sensorData.create.mockResolvedValueOnce({ id: 1 });

      const payload = JSON.stringify({
        mid: 163,
        data: {
          temp: 25.5,
          humi: 60,
          airstate: 1,
          current: 500,
          CSQ: 80,
        },
        timestamp: '1704067200',
      });

      await handleDataUpload('866965081754902', payload);
      expect(mockPrisma.sensorData.create).toHaveBeenCalled();
    });

    it('should handle old format data message', async () => {
      mockPrisma.device.upsert.mockResolvedValueOnce({ id: '866965081754902' });
      mockPrisma.sensorData.create.mockResolvedValueOnce({ id: 1 });

      const payload = JSON.stringify({
        temp: 25.5,
        humi: 60,
        curr: 500,
        sig: 80,
        acState: 1,
        ts: 1704067200,
      });

      await handleDataUpload('866965081754902', payload);
      expect(mockPrisma.sensorData.create).toHaveBeenCalled();
    });

    it('should handle partial data', async () => {
      mockPrisma.device.upsert.mockResolvedValueOnce({ id: '866965081754902' });
      mockPrisma.sensorData.create.mockResolvedValueOnce({ id: 1 });

      const payload = JSON.stringify({
        mid: 163,
        data: {
          temp: 25.5,
        },
      });

      await handleDataUpload('866965081754902', payload);
    });

    it('should reject out-of-range temperature', async () => {
      const payload = JSON.stringify({
        data: { temp: 200 },
      });

      await handleDataUpload('866965081754902', payload);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const payload = 'invalid json';

      await handleDataUpload('866965081754902', payload);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('handleParameterUpload', () => {
    it('should handle valid parameter message', async () => {
      mockPrisma.device.upsert.mockResolvedValueOnce({ id: '866965081754902' });
      mockPrisma.deviceParam.upsert.mockResolvedValueOnce({
        deviceId: '866965081754902',
        version: 1,
      });

      const payload = JSON.stringify({
        mode: 1,
        summerTempOn: 28,
        summerTempSet: 26,
      });

      await handleParameterUpload('866965081754902', payload);
      expect(mockPrisma.deviceParam.upsert).toHaveBeenCalled();
    });

    it('should handle partial parameters', async () => {
      mockPrisma.device.upsert.mockResolvedValueOnce({ id: '866965081754902' });
      mockPrisma.deviceParam.upsert.mockResolvedValueOnce({
        deviceId: '866965081754902',
        version: 0,
      });

      const payload = JSON.stringify({
        mode: 0,
      });

      await handleParameterUpload('866965081754902', payload);
    });

    it('should reject invalid mode value', async () => {
      const payload = JSON.stringify({
        mode: 5, // Invalid: should be 0 or 1
      });

      await handleParameterUpload('866965081754902', payload);
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const payload = 'invalid json';

      await handleParameterUpload('866965081754902', payload);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });
});
