# 贡献指南

欢迎参与物联网管理系统的开发！本文档提供开发环境设置、代码规范和提交流程的详细说明。

> **重要**: 本文档适用于本地开发环境。生产环境配置请参考 [部署指南](./DEPLOYMENT.md)。
> **最后更新**: 2026-04-08（命令参考表同步）

---

## 目录

- [环境概述](#环境概述)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [测试要求](#测试要求)
- [提交流程](#提交流程)
- [代码审查](#代码审查)

---

## 环境概述

| 环境 | 用途 | 配置文件 |
|------|------|----------|
| **开发环境** | 本地开发、测试 | `backend/.env` (手动创建) |
| **生产环境** | 已部署运行 | `.env` + `backend/.env` (预配置) |

> ⚠️ **注意**: 开发环境配置与生产环境配置需分开，不要混用。

### 生产环境状态

- ✅ 已部署: https://www.jxbonner.cloud
- ✅ admin-web 管理后台正常运行
- ⚠️ 生产环境配置已预填充，本地开发无需修改

---

## 开发环境设置

### 前置要求

| 项目 | 要求 | 说明 |
|------|------|------|
| Docker | 20.x+ | 容器运行时 |
| Docker Compose | V2 | Docker Compose 插件（推荐） |
| Git | 最新稳定版 | 版本控制 |
| Node.js | 20.x+ | 仅用于本地调试（可选） |

> **推荐**: 使用 Docker 开发环境，无需本地安装 Node.js、PostgreSQL、Redis。

### Docker 化开发（推荐）

项目已完全容器化，一键启动所有服务：

```bash
# 1. 克隆仓库
git clone https://github.com/LeonBlue7/iot.git
cd iot

# 2. 复制环境变量模板
cp .env.example .env

# 3. 启动完整开发环境
docker compose up -d

# 4. 初始化数据库（首次启动）
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run prisma:seed

# 5. 验证服务运行
docker compose ps
```

启动后可访问：
- 后端 API：http://localhost:3000
- 管理后台：http://localhost:3001
- EMQX 控制台：http://localhost:18083

### 常用 Docker 开发命令

<!-- AUTO-GENERATED: Docker 开发命令 -->

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f backend
docker compose logs -f admin-web

# 进入容器
docker compose exec backend sh
docker compose exec admin-web sh

# 运行数据库迁移
docker compose exec backend npx prisma migrate dev

# 运行种子数据
docker compose exec backend npm run prisma:seed

# 运行测试
docker compose exec backend npm run test
docker compose exec admin-web npm run test

# 停止服务
docker compose down

# 停止并清理数据
docker compose down -v
```

<!-- END AUTO-GENERATED -->

### 热重载机制

开发环境支持代码热重载：

- **后端**: 挂载 `backend/src/` 目录，修改代码自动重启
- **前端**: 挂载 `admin-web/src/` 目录，Vite HMR 自动更新页面
- **数据库**: 挂载 `backend/prisma/` 目录，迁移后自动生效

### 本地开发模式（可选）

如果需要在本地调试（不使用 Docker），可按以下步骤操作：

```bash
# 1. 仅启动基础设施服务
docker compose up -d postgres redis emqx

# 2. 配置后端环境变量
cd backend
cp .env.example .env
# 编辑 .env，将主机名改为 localhost

# 3. 本地运行后端
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# 4. 本地运行前端
cd ../admin-web
npm install
npm run dev
```

### Docker Compose V2 安装

```bash
# 检查版本
docker compose version

# 安装 Docker Compose V2 插件
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install docker-compose-plugin

# macOS (Docker Desktop 已内置)
brew install docker-compose

# 或使用独立版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 开发环境配置要点

| 配置项 | Docker 开发环境 | 本地开发环境 | 生产环境 |
|--------|-----------------|--------------|----------|
| `NODE_ENV` | `development` | `development` | `production` |
| `DATABASE_URL` | `postgresql://...@postgres:5432/iot_db` | `postgresql://...@localhost:5432/iot_db` | `postgresql://...@postgres:5432/iot_db` |
| `REDIS_HOST` | `redis` | `localhost` | `redis` |
| `MQTT_BROKER_URL` | `mqtt://emqx:1883` | `mqtt://localhost:1883` | `mqtt://emqx:1883` |
| `JWT_SECRET` | *(容器默认值)* | *(可选，自动生成)* | *(已配置)* |

> **Docker 网络**: 在 Docker 环境中使用服务名（postgres、redis、emqx）而非 localhost。

## 代码规范

### TypeScript

- 启用严格模式 (`strict: true`)
- 所有函数必须有显式返回类型
- 使用接口定义对象类型
- 避免使用 `any`，使用 `unknown` 代替

```typescript
// ✅ 好的做法
function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

// ❌ 避免使用
function getUser(id: any): any {
  return db.user.findUnique({ where: { id } });
}
```

### 命名约定

| 类型 | 命名风格 | 示例 |
|------|----------|------|
| 变量/函数 | camelCase | `getUser`, `totalCount` |
| 类/接口 | PascalCase | `UserService`, `DeviceData` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 文件 | kebab-case | `user-service.ts` |
| 测试文件 | `*.test.ts` | `auth.test.ts` |

### 错误处理

```typescript
// ✅ 使用 try-catch 处理异步错误
try {
  await db.user.create({ data });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new BadRequestError('用户已存在');
  }
  throw error;
}

// ✅ 使用 asyncHandler 包装 Express 路由
export const getUser = asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json({ success: true, data: user });
});
```

### 输入验证

使用 Zod 进行请求体验证：

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

export const login = asyncHandler(async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);
  // ...
});
```

## 测试要求

### 运行测试

<!-- AUTO-GENERATED: 测试命令 -->

#### 后端测试 (backend/package.json)

```bash
# 在容器内执行
docker compose exec backend npm run test                # 运行所有测试
docker compose exec backend npm run test:watch          # 监听模式
docker compose exec backend npm run test:coverage       # 带覆盖率报告
docker compose exec backend npm run lint                # ESLint 检查
docker compose exec backend npm run lint:fix            # 自动修复 ESLint 问题
docker compose exec backend npm run format              # Prettier 格式化
```

#### 前端测试 (admin-web/package.json)

```bash
# 在容器内执行
docker compose exec admin-web npm run test              # 运行单元测试 (Vitest)
docker compose exec admin-web npm run test:coverage     # 带覆盖率报告
docker compose exec admin-web npm run lint              # ESLint 检查

# E2E 测试（本地执行，连接 Docker 服务）
cd admin-web
npm run test:e2e                                       # 运行 E2E 测试 (Playwright)
npm run test:e2e:ui                                    # E2E 测试 UI 模式
npm run test:e2e:headed                                # 有界面 E2E 测试
```

#### 数据库命令 (backend/package.json)

```bash
# 在容器内执行
docker compose exec backend npx prisma generate         # 生成 Prisma Client
docker compose exec backend npx prisma migrate dev      # 开发环境迁移
docker compose exec backend npx prisma studio           # 打开 Prisma Studio
docker compose exec backend npm run prisma:seed         # 运行种子数据
```

#### 部署脚本测试

```bash
# 运行 bats 测试套件
bats tests/scripts/deploy.bats
```

<!-- END AUTO-GENERATED -->

### 测试结构

```
backend/tests/
├── controllers/           # 控制器测试
├── services/              # 服务层测试
├── integration/           # 集成测试
├── utils/                 # 工具函数测试
└── setup.ts               # 测试配置

admin-web/src/
├── __tests__/             # 组件测试
├── services/__tests__/    # 服务层测试
└── pages/__tests__/       # 页面测试

admin-web/e2e/             # E2E 测试
```

### 运维脚本

<!-- AUTO-GENERATED: scripts 目录 -->

项目提供运维自动化脚本：

```
scripts/
├── deploy.sh              # 一键部署脚本（主脚本）
├── deploy-production.sh   # 生产环境部署快捷脚本
├── quick-deploy.sh        # 快速部署脚本
├── backup.sh              # 数据库备份脚本
├── restore.sh             # 数据恢复脚本
├── logs.sh                # 日志管理脚本
└── fix-mqtt-auth.sh       # MQTT 认证修复脚本
```

#### 部署脚本用法

```bash
# 查看帮助
./scripts/deploy.sh --help

# 部署
./scripts/deploy.sh deploy --version v1.2.0

# 蓝绿部署
./scripts/deploy.sh deploy --blue-green --target green

# 查看状态
./scripts/deploy.sh status --json

# 健康检查
./scripts/deploy.sh health

# 回滚
./scripts/deploy.sh rollback --previous
```

<!-- END AUTO-GENERATED -->

### 覆盖率要求

- **整体覆盖率**: 最低 80%
- **核心业务逻辑**: 100%
- **新代码**: 必须包含测试

### 测试类型

#### 单元测试

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashPassword } from './auth';

describe('hashPassword', () => {
  it('should hash password with bcrypt', async () => {
    const password = 'securePassword123';
    const hash = await hashPassword(password);

    expect(hash).toHaveLength(60);
    expect(hash).not.toBe(password);
  });
});
```

#### 集成测试

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app';

describe('POST /api/admin/auth/login', () => {
  it('should return token on successful login', async () => {
    const response = await request(app)
      .post('/api/admin/auth/login')
      .send({ username: 'admin', password: 'password123' });

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

### 测试最佳实践

- 测试文件放在 `__tests__/` 目录或 `*.test.ts`
- 使用 `describe` 组织相关测试
- 每个测试只验证一个行为
- 使用有意义的测试名称
- 清理测试数据（使用 `beforeEach`/`afterEach`）

## 提交流程

### Git 工作流

```bash
# 1. 创建功能分支
git checkout -b feature/your-feature-name

# 2. 开发并提交
git add .
git commit -m "feat: 添加新功能"

# 3. 推送分支
git push -u origin feature/your-feature-name

# 4. 创建 Pull Request
# 在 GitHub 上创建 PR 并填写描述
```

### 提交信息格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>: <description>

[optional body]
```

**Type 类型**:

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响代码逻辑） |
| `refactor` | 重构（既不是新功能也不是修复） |
| `test` | 添加或修改测试 |
| `chore` | 构建/工具/配置更新 |
| `perf` | 性能优化 |
| `security` | 安全相关修复 |

**示例**:

```
feat: 添加设备批量导入功能

- 支持 CSV 格式导入
- 添加导入结果反馈
- 添加重复设备检测

Closes #123
```

```
fix(auth): 修复 JWT token 过期时间计算错误

- 修正时区处理逻辑
- 添加过期时间验证测试

Fixes #456
```

### 提交前检查清单

在提交代码前，请确认：

- [ ] 运行 `npm run lint` 无错误
- [ ] 运行 `npm run test` 所有测试通过
- [ ] 代码覆盖率 >= 80%
- [ ] 无 TypeScript 编译错误
- [ ] 敏感信息（密码、密钥）未提交
- [ ] 提交信息符合规范

## 代码审查

### 审查标准

审查者将检查：

1. **功能正确性**
   - 代码是否按预期工作
   - 边界条件是否处理

2. **代码质量**
   - 是否遵循代码规范
   - 是否有重复代码
   - 函数是否足够小（<50 行）

3. **安全性**
   - 输入是否验证
   - 有无 SQL/XSS 注入风险
   - 有无硬编码凭证

4. **测试覆盖**
   - 是否包含单元测试
   - 测试是否覆盖边界情况
   - 测试是否可维护

### 审查流程

1. PR 创建后自动触发 CI 检查
2. 至少需要 1 位维护者审查通过
3. 所有 CI 检查必须通过
4. 解决所有审查意见
5. 合并到主分支

### 审查意见处理

```markdown
# 审查意见示例

## 需要修改
- [ ] 第 45 行：缺少输入验证
- [ ] 添加错误处理

## 建议改进
- [ ] 可以考虑提取为独立函数

## 已解决
- [x] 修复了变量命名
```

## 开发工具推荐

### VS Code 插件

- ESLint
- Prettier - Code formatter
- Prisma
- Jest / Vitest

### 推荐配置

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenpeter.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 相关文档

- [环境变量](./ENV.md) - 环境配置说明
- [部署指南](./DEPLOYMENT.md) - 部署流程
- [运行手册](./RUNBOOK.md) - 运维操作指南
- [API 文档](./API.md) - 接口定义
- [README](../README.md) - 项目概述

## 获取帮助

- 查看 [GitHub Issues](https://github.com/your-org/iot/issues)
- 在 Discussions 中提问
- 联系维护者
