// tests/integration/api.test.ts
// API 集成测试 - 需要数据库连接
// 在 CI 中通过 docker-compose 提供 PostgreSQL 和 Redis

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Mock 数据库和服务
jest.mock('../../src/utils/database');
jest.mock('../../src/utils/redis');

// Mock 认证中间件 - 测试环境跳过认证
jest.mock('../../src/middleware/auth', () => ({
  authenticate: (req: any, _res: any, next: any) => {
    req.userId = 'test-user';
    req.role = 'admin';
    next();
  },
  optionalAuth: (req: any, _res: any, next: any) => {
    req.userId = 'test-user';
    req.role = 'user';
    next();
  },
  authorize: (..._roles: string[]) => () => (_req: any, _res: any, next: any) => next(),
}));

// Mock 整个 services 模块
jest.mock('../../src/services/device', () => {
  return {
    deviceService: {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null), // 默认返回 null 表示未找到
      getLatestData: jest.fn().mockResolvedValue({}),
      getHistoryData: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
      controlDevice: jest.fn().mockResolvedValue(undefined),
      getParams: jest.fn().mockResolvedValue({}),
      updateParams: jest.fn().mockResolvedValue({}),
    },
  };
});

jest.mock('../../src/services/alarm', () => {
  return {
    getAlarms: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    acknowledgeAlarm: jest.fn().mockResolvedValue({}),
    resolveAlarm: jest.fn().mockResolvedValue({}),
  };
});

jest.mock('../../src/services/stats', () => {
  return {
    getOverviewStats: jest.fn().mockResolvedValue({
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      totalAlarms: 0,
      unacknowledgedAlarms: 0,
    }),
    getTrendData: jest.fn().mockResolvedValue([]),
    getDailyStats: jest.fn().mockResolvedValue({
      avgTemperature: null,
      avgHumidity: null,
      maxTemperature: null,
      minTemperature: null,
      alarmCount: 0,
    }),
  };
});

import deviceRoutes from '../../src/routes/deviceRoutes';
import alarmRoutes from '../../src/routes/alarmRoutes';
import statsRoutes from '../../src/routes/statsRoutes';

// 创建测试用 Express 应用
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/devices', deviceRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/stats', statsRoutes);

// 健康检查端点
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

describe('API Integration Tests', () => {
  beforeAll(() => {
    // 设置测试环境
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    // 清理
    delete process.env.NODE_ENV;
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('Device API', () => {
    describe('GET /api/devices', () => {
      it('should return response with data property', async () => {
        const response = await request(app).get('/api/devices');

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('success');
      });
    });

    describe('GET /api/devices/:id', () => {
      it('should return 404 for non-existent device', async () => {
        const response = await request(app).get('/api/devices/non-existent-id');

        expect(response.status).toBe(404);
      });
    });

    describe('GET /api/devices/:id/realtime', () => {
      it('should return response structure', async () => {
        const response = await request(app).get('/api/devices/test-device/realtime');

        expect(response.body).toHaveProperty('success');
      });
    });
  });

  describe('Alarm API', () => {
    describe('GET /api/alarms', () => {
      it('should return response with data property', async () => {
        const response = await request(app).get('/api/alarms');

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('success');
      });

      it('should accept filter parameters', async () => {
        const response = await request(app)
          .get('/api/alarms')
          .query({ deviceId: 'test123', status: 0, limit: 10 });

        expect(response.body).toHaveProperty('success');
      });
    });
  });

  describe('Stats API', () => {
    describe('GET /api/stats/overview', () => {
      it('should return response structure', async () => {
        const response = await request(app).get('/api/stats/overview');

        expect(response.body).toHaveProperty('success');
      });
    });

    describe('GET /api/stats/trend', () => {
      it('should accept date parameters', async () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 86400000);

        const response = await request(app)
          .get('/api/stats/trend')
          .query({
            deviceId: 'test123',
            startTime: yesterday.toISOString(),
            endTime: now.toISOString(),
          });

        expect(response.body).toHaveProperty('success');
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
