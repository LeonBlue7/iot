// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { deviceRoutes, alarmRoutes, statsRoutes } from './routes/index.js';
import adminRoutes from './routes/admin.js';
import { errorHandler } from './utils/index.js';
import { authenticate } from './middleware/auth.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      config.nodeEnv === 'production' ? ['https://www.jxbonner.cloud'] : '*',
    credentials: true,
  })
);

// Rate limiting - stricter for control endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 30 : 1000, // 1000 requests per 15 minutes in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'RATE_LIMIT_EXCEEDED', message: '请求过于频繁，请稍后重试' },
});
app.use('/api/', apiLimiter);

// Stricter rate limiting for login endpoint (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 10 : 100, // 100 login attempts per 15 minutes in dev
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'RATE_LIMIT_EXCEEDED', message: '登录尝试过于频繁，请 15 分钟后重试' },
});
app.use('/api/admin/auth/login', loginLimiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (public endpoint)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes with authentication
// Admin routes (public: /auth/login, protected: /me, /dashboard)
app.use('/api/admin', adminRoutes);

// Device routes - use optionalAuth for read operations, authenticate for write operations
app.use('/api/devices', deviceRoutes);
app.use('/api/alarms', authenticate, alarmRoutes);
app.use('/api/stats', authenticate, statsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// Error handler
app.use(errorHandler);

export default app;