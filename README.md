# 物联网管理系统

智能办公空调控制系统，支持 MQTT 设备接入、数据存储和 REST API。

## 技术栈

### 后端
- **运行时**: Node.js 20+
- **框架**: Express + TypeScript
- **数据库**: PostgreSQL 15 + Prisma ORM
- **缓存**: Redis 7
- **MQTT Broker**: EMQX 5.21
- **认证**: JWT + bcrypt

### 前端
- **管理后台**: React 18 + TypeScript + Vite
- **UI 组件**: Ant Design 5
- **状态管理**: Zustand
- **HTTP 客户端**: Axios
- **测试**: Vitest + Testing Library

### 小程序
- **框架**: 微信小程序原生
- **测试**: Jest

## 快速开始

### 后端服务

```bash
cd backend

# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 填入必要的配置

# 2. 安装依赖
npm install

# 3. 生成 Prisma Client
npm run prisma:generate

# 4. 运行数据库迁移
npm run prisma:migrate

# 5. 初始化管理员账号
npm run prisma:seed

# 6. 开发模式启动
npm run dev
```

访问 `http://localhost:3000/health` 验证服务运行。

### 管理后台

```bash
cd admin-web

# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev
```

访问 `http://localhost:5173` 打开管理后台。

### 微信小程序

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开微信开发者工具
3. 导入 `miniprogram/` 目录
4. 在 `project.config.json` 中配置你的 AppID
5. 运行项目

### Docker 部署

```bash
# 使用 Docker Compose 一键启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

## 项目结构

```
iot/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── routes/            # 路由定义
│   │   ├── services/          # 业务逻辑
│   │   │   ├── mqtt/         # MQTT 服务
│   │   │   ├── device/       # 设备服务
│   │   │   ├── alarm/        # 告警服务
│   │   │   └── admin/        # 管理服务
│   │   ├── utils/            # 工具函数
│   │   └── app.ts            # 应用入口
│   ├── prisma/                # 数据库迁移和种子
│   ├── tests/                 # 测试文件
│   └── .env.example           # 环境变量模板
├── admin-web/                  # 管理后台前端
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   ├── hooks/             # 自定义 Hooks
│   │   ├── services/          # API 服务
│   │   ├── store/             # 状态管理
│   │   ├── types/             # TypeScript 类型
│   │   └── tests/             # 测试配置
│   └── package.json
├── miniprogram/                # 微信小程序
│   ├── pages/                 # 页面
│   ├── components/            # 组件
│   ├── utils/                 # 工具函数
│   └── tests/                 # 测试文件
├── docs/                       # 项目文档
│   ├── DEPLOYMENT.md          # 部署指南
│   ├── API.md                 # API 文档
│   ├── ENV.md                 # 环境变量文档
│   └── CONTRIBUTING.md        # 贡献指南
├── docker-compose.yml          # Docker Compose 配置
└── README.md                   # 项目说明
```

## 可用命令

### 后端命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 开发模式启动（热重载） |
| `npm run build` | TypeScript 编译 |
| `npm run start` | 生产模式启动 |
| `npm run test` | 运行测试套件 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化代码 |
| `npm run prisma:generate` | 生成 Prisma Client |
| `npm run prisma:migrate` | 创建并运行数据库迁移 |
| `npm run prisma:studio` | 打开 Prisma Studio 数据库管理界面 |
| `npm run prisma:seed` | 运行数据库种子脚本 |

### 管理后台命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产环境构建 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run test` | 运行 Vitest 测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |

## 测试覆盖率

### 后端测试
```bash
cd backend
npm run test:coverage
```

### 前端测试
```bash
cd admin-web
npm run test:coverage
```

**覆盖率要求**:
- 最低覆盖率：80%
- 核心业务逻辑：100%

## 认证与授权

### 默认管理员账号

运行 `npm run prisma:seed` 后创建：
- **用户名**: `admin`
- **密码**: 通过 `INITIAL_ADMIN_PASSWORD` 环境变量设置（未设置时自动生成随机密码）
- **注意**: 首次登录时必须修改密码

### JWT Token

- **有效期**: 24 小时（通过 `JWT_EXPIRES_IN` 配置）
- **存储**: 前端 localStorage
- **刷新**: 支持 refresh token 机制

## MQTT 通信

### 设备接入

设备通过 MQTT 连接到 EMQX Broker，使用 JSON 格式通信。

**上行主题** (`/up/{deviceID}/{action}`):
- `/up/{deviceID}/login` - 设备上线
- `/up/{deviceID}/datas` - 数据上送
- `/up/{deviceID}/parameter` - 参数上送

**下行主题** (`/down/{deviceID}/{action}`):
- `/down/{deviceID}/login_reply` - 上线响应
- `/down/{deviceID}/datas_reply` - 数据上送响应
- `/down/{deviceID}/ctr` - 远程控制

详细协议见 [docs/API.md](./docs/API.md)。

## 数据库

### PostgreSQL 表结构

- `Device` - 设备信息
- `SensorData` - 传感器数据
- `Alarm` - 告警记录
- `AdminUser` - 管理员用户
- `Role` - 角色
- `Permission` - 权限
- `AuditLog` - 审计日志

### 数据库管理

```bash
# 查看迁移历史
npx prisma migrate status

# 创建新迁移
npx prisma migrate dev --name add_new_field

# 重置数据库（开发环境）
npx prisma migrate reset

# 打开数据库管理界面
npx prisma studio
```

## 安全考虑

### 密码策略
- 所有密码使用 bcrypt 哈希
- 默认密码强度：10 轮成本因子
- 强制首次登录修改默认密码

### 速率限制
- 登录接口：10 次/15 分钟
- 普通 API：30 次/15 分钟

### 输入验证
- 所有输入使用 Zod 进行 schema 验证
- 输出序列化防止信息泄露

## 相关文档

- [部署指南](./docs/DEPLOYMENT.md) - 生产环境部署步骤
- [API 文档](./docs/API.md) - REST API 和 MQTT 协议
- [环境变量](./docs/ENV.md) - 完整环境配置说明
- [贡献指南](./docs/CONTRIBUTING.md) - 代码贡献流程

## License

MIT
