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

    it('redis client should have setex method', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      expect(client.setex).toBeDefined();
      expect(typeof client.setex).toBe('function');
    });

    it('redis client should have del method', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      expect(client.del).toBeDefined();
      expect(typeof client.del).toBe('function');
    });

    it('redis client should have exists method', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      expect(client.exists).toBeDefined();
      expect(typeof client.exists).toBe('function');
    });

    it('should be able to call ping', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      const result = await client.ping();
      expect(result).toBe('PONG');
    });

    it('should be able to set a value', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      const result = await client.set('test-key', 'test-value');
      expect(result).toBe('OK');
    });

    it('should be able to get a value', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      const result = await client.get('test-key');
      expect(result).toBeNull(); // Mock returns null by default
    });

    it('should be able to set with expiration', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      const result = await client.setex('test-key', 60, 'test-value');
      expect(result).toBe('OK');
    });

    it('should be able to delete a key', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      const result = await client.del('test-key');
      expect(result).toBe(1);
    });

    it('should be able to check if key exists', async () => {
      const redis = await import('../../src/utils/redis.js');
      const client = redis.default;

      const result = await client.exists('test-key');
      expect(result).toBe(0);
    });
  });

  describe('CacheKeys', () => {
    it('should generate correct device online key', async () => {
      const { CacheKeys } = await import('../../src/utils/redis.js');

      expect(CacheKeys.deviceOnline('IMEI123456')).toBe('device:online:IMEI123456');
    });

    it('should generate correct device data key', async () => {
      const { CacheKeys } = await import('../../src/utils/redis.js');

      expect(CacheKeys.deviceData('IMEI123456')).toBe('device:data:IMEI123456');
    });

    it('should generate correct device params key', async () => {
      const { CacheKeys } = await import('../../src/utils/redis.js');

      expect(CacheKeys.deviceParams('IMEI123456')).toBe('device:params:IMEI123456');
    });

    it('should handle empty device id', async () => {
      const { CacheKeys } = await import('../../src/utils/redis.js');

      expect(CacheKeys.deviceOnline('')).toBe('device:online:');
    });

    it('should handle special characters in device id', async () => {
      const { CacheKeys } = await import('../../src/utils/redis.js');

      expect(CacheKeys.deviceOnline('device-123_456')).toBe('device:online:device-123_456');
    });
  });

  describe('CacheTTL', () => {
    it('should have correct TTL values', async () => {
      const { CacheTTL } = await import('../../src/utils/redis.js');

      expect(CacheTTL.deviceData).toBe(300); // 5 minutes
      expect(CacheTTL.deviceParams).toBe(600); // 10 minutes
      expect(CacheTTL.deviceOnline).toBe(60); // 1 minute
    });
  });
});