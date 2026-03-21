// src/utils/redis.ts
import Redis from 'ioredis';
import config from '../config/index.js';

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  retryStrategy: (times: number): number | null => {
    if (times > 3) {
      // eslint-disable-next-line no-console
      console.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 100, 2000);
  },
});

redis.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('Redis connected');
});

redis.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Redis error:', err);
});

export default redis;

// Cache keys
export const CacheKeys = {
  deviceOnline: (deviceId: string): string => `device:online:${deviceId}`,
  deviceData: (deviceId: string): string => `device:data:${deviceId}`,
  deviceParams: (deviceId: string): string => `device:params:${deviceId}`,
} as const;

// Cache TTL (seconds)
export const CacheTTL = {
  deviceData: 300, // 5 minutes
  deviceParams: 600, // 10 minutes
  deviceOnline: 60, // 1 minute
} as const;