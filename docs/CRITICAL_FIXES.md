# 关键修复清单

根据 ECC 工作流审查结果，以下是必须修复的问题清单。

---

## 审查概要

**审查日期**: 2026-03-21

### 测试覆盖率结果

| 指标 | 覆盖率 | 目标 | 状态 |
|------|--------|------|------|
| 语句覆盖率 | 88.38% | 80% | ✅ 通过 |
| 分支覆盖率 | 74.64% | 80% | ❌ 未达标 |
| 函数覆盖率 | 84.44% | 80% | ✅ 通过 |
| 行覆盖率 | 88.02% | 80% | ✅ 通过 |

### 安全审查结果

| 严重级别 | 数量 | 状态 |
|----------|------|------|
| 🔴 严重 (CRITICAL) | 2 | 必须修复 |
| 🟠 高 (HIGH) | 5 | 应该修复 |
| 🟡 中 (MEDIUM) | 4 | 建议修复 |
| 🟢 低 (LOW) | 3 | 可选修复 |

### 代码审查结果

| 严重级别 | 数量 | 状态 |
|----------|------|------|
| 🔴 严重 (CRITICAL) | 5 | 必须修复 |
| 🟠 高 (HIGH) | 6 | 应该修复 |
| 🟡 中 (MEDIUM) | 4 | 建议修复 |
| 🟢 低 (LOW) | 3 | 可选修复 |

---

## 🔴 严重问题 (必须修复 - 阻断生产部署)

### CRITICAL-001: 缺少认证/授权中间件

**类别**: 安全 / 代码质量
**文件**: `src/app.ts:40-43`, `src/routes/*.ts`
**影响**: 所有 API 端点完全公开，任何人都可以控制设备

**当前代码**:
```typescript
// 没有任何认证中间件
app.use('/api/devices', deviceRoutes);
app.use('/api/alarms', alarmRoutes);
app.use('/api/stats', statsRoutes);
```

**修复方案**:

1. 创建认证中间件 `src/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '缺少认证令牌'
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string; role: string };
    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '无效的认证令牌'
    });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role || !allowedRoles.includes(req.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: '权限不足'
      });
      return;
    }
    next();
  };
};
```

2. 更新 `src/app.ts`:
```typescript
import { authenticate } from './middleware/auth.js';

// 对所有 API 路由应用认证
app.use('/api/devices', authenticate, deviceRoutes);
app.use('/api/alarms', authenticate, alarmRoutes);
app.use('/api/stats', authenticate, statsRoutes);
```

3. 对敏感操作添加授权:
```typescript
// src/routes/deviceRoutes.ts
router.post('/:id/control', authenticate, authorize('admin', 'operator'), controlDevice);
router.put('/:id/params', authenticate, authorize('admin'), updateDeviceParams);
```

**依赖安装**:
```bash
npm install jsonwebtoken @types/jsonwebtoken
```

---

### CRITICAL-002: MQTT TLS 证书验证被禁用

**类别**: 安全
**文件**: `src/services/mqtt/client.ts:21`
**影响**: 中间人攻击风险，设备通信可被窃听/篡改

**当前代码**:
```typescript
this.client = mqtt.connect(config.mqtt.brokerUrl, {
  // ...
  rejectUnauthorized: false, // 危险！
});
```

**修复方案**:
```typescript
import fs from 'fs';
import config from '../../config/index.js';

this.client = mqtt.connect(config.mqtt.brokerUrl, {
  protocol: config.mqtt.protocol || 'mqtt',
  port: config.mqtt.port,
  clientId: `backend_${process.pid}`,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30000,
  // 生产环境启用 TLS 验证
  rejectUnauthorized: config.nodeEnv === 'production',
  // 使用 CA 证书
  ca: config.mqtt.caCertPath ? fs.readFileSync(config.mqtt.caCertPath) : undefined,
});
```

**环境配置** (`.env`):
```bash
# MQTT TLS 配置
MQTT_PROTOCOL=mqtts
MQTT_PORT=8883
MQTT_CA_CERT_PATH=/app/certs/ca-cert.pem
```

---

### CRITICAL-003: MQTT 消息缺少输入验证

**类别**: 安全 / 代码质量
**文件**: `src/services/mqtt/handlers.ts:61-123`
**影响**: 恶意 payload 可导致服务崩溃或数据污染

**当前代码**:
```typescript
const data: LoginMessage = JSON.parse(payload); // 无验证!
```

**修复方案**:
```typescript
import { z } from 'zod';

// 定义验证 schema
const loginSchema = z.object({
  IMEI: z.string().regex(/^\d{15}$/, 'IMEI 必须为 15 位数字'),
  ICCID: z.string().regex(/^\d{19,20}$/, 'ICCID 格式错误').optional(),
});

const sensorDataSchema = z.object({
  temp: z.number().min(-50).max(100).optional(),
  humi: z.number().min(0).max(100).optional(),
  curr: z.number().min(0).max(10000).optional(),
  sig: z.number().min(0).max(100).optional(),
  acState: z.number().min(0).max(1).optional(),
  acErr: z.number().min(0).max(255).optional(),
  tempAlm: z.number().min(0).max(1).optional(),
  humiAlm: z.number().min(0).max(1).optional(),
  ts: z.number().optional(),
});

// 使用 schema 验证
export async function handleLogin(deviceId: string, payload: string): Promise<void> {
  try {
    const parsed = JSON.parse(payload);
    const data = loginSchema.parse(parsed);

    // 验证 deviceId 与 IMEI 匹配
    if (deviceId !== data.IMEI) {
      console.warn(`设备 ID 不匹配：topic=${deviceId}, IMEI=${data.IMEI}`);
      return;
    }

    await prisma.device.upsert({ ... });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`MQTT 登录数据验证失败：${error.errors.map(e => e.message).join(', ')}`);
      return;
    }
    throw error;
  }
}
```

---

### CRITICAL-004: MQTT 错误处理仅记录日志

**类别**: 代码质量
**文件**: `src/services/mqtt/handlers.ts`
**影响**: 数据库写入失败无声失败，导致数据丢失

**当前代码**:
```typescript
catch (error) {
  console.error(`Error handling login for ${deviceId}:`, error);
  // 然后什么都不做 - 静默失败
}
```

**修复方案**:
```typescript
import { AppError } from '../../utils/errors.js';

export async function handleLogin(deviceId: string, payload: string): Promise<void> {
  try {
    // ... 处理逻辑
  } catch (error) {
    console.error(`Error handling login for ${deviceId}:`, error);

    // 记录到错误追踪服务
    // await errorTracker.report(error, { deviceId, payload });

    // 增加到告警队列
    // await errorQueue.push({ type: 'MQTT_LOGIN_ERROR', deviceId, error });

    // 抛出应用错误以便上游处理
    throw new AppError(`处理设登录失败：${deviceId}`, 500);
  }
}
```

---

### CRITICAL-005: `.env.example` 包含硬编码的弱密钥

**类别**: 安全
**文件**: `.env.example:20`
**影响**: 开发者可能直接使用示例密钥

**当前代码**:
```bash
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**修复方案**:
```bash
# 使用明确占位符，提示需要生成
JWT_SECRET=<请运行以下命令生成：openssl rand -base64 64>

# 添加生成脚本
# scripts/generate-secrets.sh:
#!/bin/bash
echo "JWT_SECRET=$(openssl rand -base64 64)" >> .env
echo "DB_PASSWORD=$(openssl rand -base64 32)" >> .env
echo "REDIS_PASSWORD=$(openssl rand -base64 32)" >> .env
```

---

## 🟠 高优先级问题 (应该修复)

### HIGH-001: 速率限制过于宽松

**文件**: `src/app.ts:23-29`

**当前配置**: 100 请求/15 分钟 (6.67 请求/分钟)

**修复方案**:
```typescript
// 全局速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 请求/15 分钟
  message: { success: false, error: 'RATE_LIMIT_EXCEEDED', message: '请求过于频繁' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 控制端点严格限制
const controlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 5,              // 5 次控制/分钟
  message: { success: false, error: 'RATE_LIMIT_EXCEEDED', message: '控制命令过于频繁' },
});
router.post('/:id/control', controlLimiter, deviceController.controlDevice);
```

---

### HIGH-002: 告警控制器响应头顺序错误

**文件**: `src/controllers/alarmController.ts:18-19`

**当前代码**:
```typescript
res.json(successResponse(result.data));
res.setHeader('X-Total-Count', result.total); // 太晚！
```

**修复方案**:
```typescript
res.setHeader('X-Total-Count', result.total);
res.json(successResponse(result.data));
```

---

### HIGH-003: 优雅关闭缺少 MQTT 清理

**文件**: `src/index.ts:29-44`

**当前代码**:
```typescript
await prisma.$disconnect();
redis.disconnect();
// 缺少 MQTT 清理!
```

**修复方案**:
```typescript
import { mqttClient } from './services/mqtt/index.js';

const shutdown = async (): Promise<void> => {
  console.log('优雅关闭中...');

  server.close(async () => {
    await prisma.$disconnect();
    redis.disconnect();
    await mqttClient.end(true); // 清理 MQTT 连接
    console.log('进程已终止');
    process.exit(0);
  });

  // ... 超时处理
};
```

---

### HIGH-004: 设备查询无上限限制

**文件**: `src/services/device/index.ts:9`

**当前代码**:
```typescript
return prisma.device.findMany({
  orderBy: { createdAt: 'desc' },
  // 无 limit!
});
```

**修复方案**:
```typescript
return prisma.device.findMany({
  orderBy: { createdAt: 'desc' },
  take: 1000, // 最大 1000 条
  include: { params: true },
});
```

---

### HIGH-005: 缺少 CSRF 保护

**文件**: `src/app.ts`

**修复方案**:
```bash
npm install csurf @types/csurf
```

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict'
  }
});

// 对状态改变操作应用 CSRF
router.post('/:id/control', csrfProtection, controlDevice);
router.put('/:id/params', csrfProtection, updateDeviceParams);
```

---

## 🟡 中优先级问题 (建议修复)

### MEDIUM-001: 分支覆盖率未达标 (74.64%)

**影响**: 测试覆盖不足，存在未测试代码路径

**修复方案**:

1. **alarmController.ts** (52.94% 覆盖率):
   - 添加 `acknowledgeAlarmHandler` 测试
   - 添加 `resolveAlarmHandler` 测试

2. **statsController.ts** (57.89% 覆盖率):
   - 添加 `getOverviewStatsHandler` 测试
   - 添加 `getTrendDataHandler` 测试

3. **utils/redis.ts** (64.7% 覆盖率):
   - 添加 Redis 工具函数测试

**参考**: `/memory/test-coverage-results.md`

---

### MEDIUM-002: 使用 console.log 代替结构化日志

**修复方案**:
```bash
npm install winston
```

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

export default logger;
```

---

### MEDIUM-003: 设备列表缺少分页

**修复方案**:
```typescript
// src/controllers/deviceController.ts
export const getDevices = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));

  const devices = await deviceService.findAll({ page, limit });

  res.json({
    success: true,
    data: devices,
    page,
    limit,
    total: devices.length,
  });
});
```

---

## 修复优先级

### 第一阶段 (立即修复 - 阻断生产)

1. ✅ CRITICAL-001: 添加认证中间件
2. ✅ CRITICAL-002: 修复 MQTT TLS 验证
3. ✅ CRITICAL-003: 添加 MQTT 输入验证
4. ✅ CRITICAL-004: 修复 MQTT 错误处理
5. ✅ CRITICAL-005: 更新 `.env.example`

### 第二阶段 (本周修复)

1. ✅ HIGH-001: 加强速率限制
2. ✅ HIGH-002: 修复响应头顺序
3. ✅ HIGH-003: 添加 MQTT 优雅关闭
4. ✅ HIGH-004: 添加查询上限
5. ✅ HIGH-005: 添加 CSRF 保护

### 第三阶段 (下周修复)

1. ✅ MEDIUM-001: 提升测试覆盖率至 80%
2. ✅ MEDIUM-002: 实现结构化日志
3. ✅ MEDIUM-003: 实现分页功能

---

## 验证清单

修复完成后，请验证:

- [ ] 所有测试通过 (`npm test`)
- [ ] 分支覆盖率 >= 80%
- [ ] 安全审查无 CRITICAL/HIGH 问题
- [ ] 代码审查无 CRITICAL/HIGH 问题
- [ ] Docker 构建成功
- [ ] CI/CD 流水线通过
- [ ] 生产环境部署测试通过

---

## 相关文档

- [测试覆盖率结果](../memory/test-coverage-results.md)
- [安全审查结果](../memory/security-review-results.md)
- [部署指南](./DEPLOYMENT.md)
- [API 文档](./API.md)
