// tests/utils/redis.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Redis Utils', () => {
  describe('redis client', () => {
    it('should be importable', async () => {
      const redis = await import('../../src/utils/redis.js');
      expect(redis.default).toBeDefined();
      expect(redis.CacheKeys).toBeDefined();
      expect(redis.CacheTTL).toBeDefined();
    });

    it('should have CacheKeys defined', async () => {
      const { CacheKeys } = await import('../../src/utils/redis.js');

      expect(CacheKeys.deviceOnline).toBeDefined();
      expect(CacheKeys.deviceData).toBeDefined();
      expect(CacheKeys.deviceParams).toBeDefined();

      // Test key generation
      expect(CacheKeys.deviceOnline('test123')).toBe('device:online:test123');
      expect(CacheKeys.deviceData('test123')).toBe('device:data:test123');
      expect(CacheKeys.deviceParams('test123')).toBe('device:params:test123');
    });

    it('should have CacheTTL defined', async () => {
      const { CacheTTL } = await import('../../src/utils/redis.js');

      expect(CacheTTL.deviceData).toBeDefined();
      expect(CacheTTL.deviceParams).toBeDefined();
      expect(CacheTTL.deviceOnline).toBeDefined();

      // Verify TTL values are positive numbers
      expect(CacheTTL.deviceData).toBeGreaterThan(0);
      expect(CacheTTL.deviceParams).toBeGreaterThan(0);
      expect(CacheTTL.deviceOnline).toBeGreaterThan(0);
    });

    it('redis client should have ping method', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      expect(client.ping).toBeDefined();
      expect(typeof client.ping).toBe('function');
    });

    it('redis client should have set method', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      expect(client.set).toBeDefined();
      expect(typeof client.set).toBe('function');
    });

    it('redis client should have get method', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      expect(client.get).toBeDefined();
      expect(typeof client.get).toBe('function');
    });
  });
});