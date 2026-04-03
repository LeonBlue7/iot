# 环境变量配置

本文档列出项目中所有环境变量的详细说明，明确区分开发环境和生产环境。

> **重要**: 生产环境配置已预填充，部署时无需修改。开发环境使用 Docker Compose 一键启动。
> **最后更新**: 2026-04-03（Docker 化重构）

---

## 目录

- [环境概述](#环境概述)
- [开发环境（Docker 化）](#开发环境docker-化)
- [生产环境配置](#生产环境配置)
- [安全检查清单](#安全检查清单)

---

## 环境概述

| 环境 | 配置文件位置 | 启动方式 |
|------|-------------|----------|
| **开发环境** | `.env.example` → `.env` | `docker compose up -d` |
| **生产环境** | `.env` + `backend/.env` | `./scripts/deploy.sh deploy` |

### 配置文件说明

| 文件 | 作用 | Git 追踪 |
|------|------|----------|
| `.env.example` | 开发环境模板 | ✅ 已追踪 |
| `.env` | 开发/生产环境变量 | ❌ 禁止追踪（安全） |
| `backend/.env.example` | 后端开发模板 | ✅ 已追踪 |
| `backend/.env` | 后端生产环境变量 | ❌ 禁止追踪（安全） |

---

## 开发环境（Docker 化）

### 快速启动

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 启动完整开发环境
docker compose up -d

# 3. 初始化数据库
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run prisma:seed
```

### 开发环境访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 后端 API | http://localhost:3000 | Express 服务 |
| 管理后台 | http://localhost:3001 | Vite 开发服务器 |
| EMQX 控制台 | http://localhost:18083 | MQTT 管理 (admin/public) |
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 缓存 |

### Docker Compose 服务架构

<!-- AUTO-GENERATED: docker-compose.yml 服务 -->

```
┌─────────────────────────────────────────────────────────┐
│                    iot-dev-network                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐ │
│  │   backend   │───▶│  postgres   │    │    redis    │ │
│  │   :3000     │    │   :5432     │    │   :6379     │ │
│  └─────────────┘    └─────────────┘    └─────────────┘ │
│         │                   │                   │       │
│         ▼                   │                   │       │
│  ┌─────────────┐            │                   │       │
│  │  admin-web  │            │                   │       │
│  │   :3001     │            │                   │       │
│  └─────────────┘            │                   │       │
│         │                   │                   │       │
│         └───────────────────┼───────────────────┘       │
│                             ▼                           │
│                    ┌─────────────┐                      │
│                    │    emqx     │                      │
│                    │  :1883      │                      │
│                    │  :18083     │                      │
│                    └─────────────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

<!-- END AUTO-GENERATED -->

### Docker 网络配置要点

在 Docker 环境中，服务之间使用服务名而非 localhost：

| 配置项 | Docker 环境 | 本地开发 |
|--------|-------------|----------|
| `DATABASE_URL` | `postgresql://...@postgres:5432/iot_db` | `postgresql://...@localhost:5432/iot_db` |
| `REDIS_HOST` | `redis` | `localhost` |
| `MQTT_BROKER_URL` | `mqtt://emqx:1883` | `mqtt://localhost:1883` |

> **注意**: `docker-compose.yml` 已自动配置 Docker 网络，无需手动设置。

### 开发环境变量模板

`.env.example` 默认配置（使用占位符）：

```bash
# 数据库配置
DB_USER=iot_user
DB_PASSWORD=<your_database_password>
DB_NAME=iot_db
DB_PORT=5432

# Redis 配置
REDIS_PASSWORD=<your_redis_password>
REDIS_PORT=6379

# EMQX 配置
EMQX_USERNAME=admin
EMQX_PASSWORD=<your_emqx_dashboard_password>
MQTT_USERNAME=          # 开发环境允许匿名
MQTT_PASSWORD=

# JWT 配置
JWT_SECRET=<generate_random_secret_min_32_chars>
JWT_EXPIRES_IN=7d

# 初始管理员密码
INITIAL_ADMIN_PASSWORD=<your_admin_password>
```

## 生产环境配置

### 生产环境状态

- ✅ 已完成初步部署
- ✅ admin-web 管理后台正常运行
- ✅ SSL 证书已配置
- ✅ MQTT Broker (EMQX) 已配置设备认证

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 管理后台 | https://www.jxbonner.cloud | React + Ant Design |
| API 服务 | https://www.jxbonner.cloud/api | REST API |
| MQTT Broker | mqtt://www.jxbonner.cloud:1883 | 设备连接端口 |
| MQTT WebSocket | ws://www.jxbonner.cloud:8083 | WebSocket 连接 |
| EMQX 控制台 | http://www.jxbonner.cloud:18083 | 管理界面 |

### 生产环境变量清单

<!-- AUTO-GENERATED: 生产环境配置 -->

#### Docker Compose 环境变量 (`.env`)

| 变量 | 值 | 说明 |
|------|-----|------|
| `DB_USER` | `iot_user` | PostgreSQL 用户名 |
| `DB_PASSWORD` | *(强随机密码)* | PostgreSQL 密码 |
| `DB_NAME` | `iot_db` | 数据库名称 |
| `DB_PORT` | `5432` | PostgreSQL 端口 |
| `REDIS_PASSWORD` | *(强随机密码)* | Redis 密码 |
| `REDIS_PORT` | `6379` | Redis 端口 |
| `EMQX_USERNAME` | `admin` | EMQX 控制台用户名 |
| `EMQX_PASSWORD` | *(强随机密码)* | EMQX 控制台密码 |
| **`MQTT_USERNAME`** | **`test1`** | **设备认证用户名（固定值）** |
| **`MQTT_PASSWORD`** | **`test123`** | **设备认证密码（固定值）** |
| `JWT_SECRET` | *(64字符随机密钥)* | JWT 签名密钥 |
| `INITIAL_ADMIN_PASSWORD` | *(随机密码)* | 管理员初始密码 |
| `WECHAT_APPID` | `wx9fcb70ddbcf43ecd` | 微信小程序 AppID |
| `WECHAT_SECRET` | *(已配置)* | 微信小程序 Secret |
| `SERVER_DOMAIN` | `www.jxbonner.cloud` | 服务器域名 |

#### 后端环境变量 (`backend/.env`)

| 变量 | 值 | 说明 |
|------|-----|------|
| `NODE_ENV` | `production` | 运行环境 |
| `PORT` | `3000` | 服务端口（容器内部） |
| `SERVER_URL` | `https://www.jxbonner.cloud` | 服务器地址 |
| `DATABASE_URL` | `postgresql://iot_user:...@postgres:5432/iot_db` | 完整连接字符串 |
| `REDIS_HOST` | `redis` | Redis 主机（Docker 网络） |
| `REDIS_PORT` | `6379` | Redis 端口 |
| `REDIS_PASSWORD` | *(强随机密码)* | Redis 密码 |
| `MQTT_BROKER_URL` | `mqtt://emqx:1883` | MQTT Broker（Docker 网络） |
| `MQTT_CLIENT_ID` | `iot_server_` | MQTT 客户端 ID 前缀 |
| `JWT_EXPIRES_IN` | `24h` | Token 有效期 |

<!-- END AUTO-GENERATED -->

### ⚠️ MQTT 设备认证（重要）

**`MQTT_USERNAME=test1` 和 `MQTT_PASSWORD=test123` 是固定的设备认证凭据。**

| 属性 | 值 | 说明 |
|------|-----|------|
| 用户名 | `test1` | 设备端已硬编码，不可更改 |
| 密码 | `test123` | 设备端已硬编码，不可更改 |

**原因**: 4G模组嵌入式程序已将此认证信息写入固件，无法远程更新。此凭据用于：
- 设备与服务器之间的 MQTT 通信
- 上行主题 `/up/{deviceID}/{action}` 数据上报
- 下行主题 `/down/{deviceID}/{action}` 指令下发

---

## 开发环境配置

### 前置要求

- Node.js 20.x+
- npm 10.x+
- PostgreSQL 15.x（或 Docker）
- Redis 7.x（或 Docker）

### 设置步骤

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 启动完整开发环境（推荐）
docker compose up -d

# 3. 初始化数据库
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run prisma:seed
```

### 本地开发模式（可选）

如果需要本地运行服务而非容器：

```bash
# 1. 仅启动基础设施服务
docker compose up -d postgres redis emqx

# 2. 配置后端环境变量
cd backend
cp .env.example .env
# 编辑 .env，将主机名改为 localhost

# 3. 运行服务
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 开发环境变量

#### 服务器配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `NODE_ENV` | 否 | `development` | 运行环境 | `development`, `production`, `test` |
| `PORT` | 否 | `3000` | HTTP 服务端口 | `3000` |
| `SERVER_URL` | 否 | `http://localhost:3000` | 服务器地址 | `https://api.example.com` |

#### 数据库配置 (PostgreSQL)

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `DB_USER` | 是 | - | 数据库用户名 | `iot_user` |
| `DB_PASSWORD` | 是 | - | 数据库密码 | `openssl rand -base64 32` |
| `DB_NAME` | 是 | - | 数据库名称 | `iot_db` |
| `DATABASE_URL` | 是 | - | 完整连接字符串 | `postgresql://user:pass@host:5432/db` |

**生成强密码**:
```bash
openssl rand -base64 32
```

#### Redis 配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `REDIS_HOST` | 否 | `localhost` | Redis 主机地址 | `redis` (Docker 网络) |
| `REDIS_PORT` | 否 | `6379` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | 开发可选 | - | Redis 密码 | `openssl rand -base64 32` |

#### MQTT 配置 (EMQX)

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `MQTT_BROKER_URL` | 否 | `mqtt://localhost:1883` | MQTT Broker 地址 | `mqtt://emqx:1883` |
| `MQTT_USERNAME` | 否 | - | MQTT 用户名 | `device_user` |
| `MQTT_PASSWORD` | 否 | - | MQTT 密码 | - |
| `MQTT_CLIENT_ID` | 否 | `iot_server_` | MQTT 客户端 ID 前缀 | `iot_server_` |
| `MQTT_CA_CERT_PATH` | 否 | - | CA 证书路径 (TLS) | `/app/certs/ca-cert.pem` |

**开发环境说明**:
- 本地开发可使用 `mqtt://localhost:1883`（非 TLS）
- Docker 网络使用 `mqtt://emqx:1883`

#### JWT 认证配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `JWT_SECRET` | 否 | *(随机生成)* | JWT 签名密钥 | `openssl rand -base64 64` |
| `JWT_EXPIRES_IN` | 否 | `7d` | Token 有效期 | `24h`, `7d`, `30d` |

**⚠️ 开发环境说明**:
- 未设置 `JWT_SECRET` 时将自动生成随机密钥
- 每次重启服务后 Token 会失效（开发环境可接受）

**生成强密钥**:
```bash
openssl rand -base64 64
```

#### 微信小程序配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `WECHAT_APPID` | 小程序必需 | - | 小程序 AppID | `wx9fcb70ddbcf43ecd` |
| `WECHAT_SECRET` | 小程序必需 | - | 小程序 Secret | - |

#### 初始化管理员配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `INITIAL_ADMIN_PASSWORD` | 否 | 自动生成 | 初始管理员密码 | `openssl rand -base64 16` |

---

## 前端环境变量

### 管理后台 (admin-web)

创建 `admin-web/.env` 或 `admin-web/.env.local`:

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `VITE_API_URL` | 否 | `/api` | API 基础路径 | `https://api.example.com` |

### 微信小程序

小程序的环境变量在 `miniprogram/utils/config.ts` 中配置:

| 变量 | 必需 | 描述 | 示例 |
|------|------|------|------|
| `API_BASE_URL` | 否 | API 服务器地址 | `https://www.jxbonner.cloud/api` |

---

## 环境变量优先级

环境变量按以下优先级加载（高优先级覆盖低优先级）：

1. Shell 环境变量（最高）
2. `.env.local` (本地开发，不提交到 Git)
3. `.env` (项目配置)
4. `.env.example` 中的默认值（最低）

---

## 安全检查清单

### 生产环境部署前确认

- [x] `DB_PASSWORD` 使用强随机密码
- [x] `REDIS_PASSWORD` 使用强随机密码
- [x] `JWT_SECRET` 使用 64 字符随机密钥
- [x] `WECHAT_SECRET` 未暴露在客户端代码
- [x] `.env` 文件配置完成（禁止 Git 追踪，确保安全）
- [x] 生产环境使用 HTTPS
- [x] MQTT 设备认证已配置

### 开发环境建议

- [ ] 使用 `.env.local` 存储敏感配置
- [ ] 不要将生产环境凭据用于开发
- [ ] 定期更新依赖包

---

## 相关文件

- `.env.example` - 开发环境变量模板
- `.env` - 开发/生产环境 Docker Compose 配置
- `backend/.env.example` - 后端开发模板
- `backend/.env` - 后端生产配置
- `docker-compose.yml` - 开发环境 Docker 配置（完全容器化）
- `docker-compose.prod.yml` - 生产环境 Docker 配置
- `backend/Dockerfile.dev` - 后端开发环境 Dockerfile
- `admin-web/Dockerfile.dev` - 前端开发环境 Dockerfile
- `admin-web/vite.config.docker.ts` - Docker 环境专用 Vite 配置
- [部署指南](./DEPLOYMENT.md) - 生产部署流程
- [贡献指南](./CONTRIBUTING.md) - 开发环境设置
