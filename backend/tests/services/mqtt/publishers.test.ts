// tests/services/mqtt/publishers.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock MQTT client
const mockSubscribe = jest.fn().mockResolvedValue(undefined);
const mockPublish = jest.fn().mockResolvedValue(undefined);
const mockOn = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({
  subscribe: mockSubscribe,
  publish: mockPublish,
  on: mockOn,
});

jest.mock('../../../src/services/mqtt/client.js', () => ({
  default: {
    connect: mockConnect,
    subscribe: mockSubscribe,
    publish: mockPublish,
    getClient: jest.fn(() => ({
      subscribe: mockSubscribe,
      publish: mockPublish,
      on: mockOn,
    })),
  },
}));

jest.mock('../../../src/utils/database.js', () => ({
  default: {
    controlLog: {
      create: jest.fn().mockResolvedValue({ id: 1 }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('MQTT Publishers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initMQTTService', () => {
    it('should be importable', async () => {
      const { initMQTTService } = await import('../../../src/services/mqtt/publishers.js');
      expect(typeof initMQTTService).toBe('function');
    });
  });

  describe('Topic format', () => {
    it('should use correct down topic format', async () => {
      const { getDownTopic } = await import('../../../src/services/mqtt/publishers.js');
      expect(getDownTopic('866965081754902', 'login_reply')).toBe(
        '/down/866965081754902/login_reply'
      );
      expect(getDownTopic('866965081754902', 'getdatas')).toBe('/down/866965081754902/getdatas');
      expect(getDownTopic('866965081754902', 'ctr')).toBe('/down/866965081754902/ctr');
    });
  });

  describe('UP_TOPIC_PATTERN', () => {
    it('should match device topics', async () => {
      const { UP_TOPIC_PATTERN } = await import('../../../src/services/mqtt/publishers.js');
      expect(UP_TOPIC_PATTERN).toBe('/up/+/+');
    });
  });
});
