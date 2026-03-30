# 环境变量配置

本文档列出项目中所有环境变量的详细说明，明确区分开发环境和生产环境。

> **重要**: 生产环境配置已预填充，部署时无需修改。开发环境需手动配置。

---

## 目录

- [环境概述](#环境概述)
- [生产环境配置](#生产环境配置)
- [开发环境配置](#开发环境配置)
- [安全检查清单](#安全检查清单)

---

## 环境概述

| 环境 | 配置文件位置 | 说明 |
|------|-------------|------|
| **生产环境** | `.env` + `backend/.env` | 已预配置，服务器上已部署 |
| **开发环境** | `backend/.env.example` → `backend/.env` | 本地开发，需手动创建 |

### 配置文件说明

| 文件 | 作用 | Git追踪 |
|------|------|---------|
| `.env` | Docker Compose 生产环境变量 | ✅ 已追踪（私人仓库） |
| `backend/.env` | 后端生产环境变量 | ✅ 已追踪（私人仓库） |
| `backend/.env.example` | 开发环境模板 | ✅ 已追踪 |
| `backend/.env` (开发) | 本地开发配置 | ❌ 不追踪（需手动创建） |

---

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
cd backend
cp .env.example .env

# 2. 编辑配置文件
# 修改 DATABASE_URL、REDIS_HOST 等本地配置

# 3. 启动基础设施（推荐使用 Docker）
cd ..
docker-compose up -d postgres redis emqx

# 4. 运行数据库迁移
cd backend
npx prisma migrate dev
npx prisma db seed
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
- [x] `.env` 文件配置完成（私人仓库已追踪）
- [x] 生产环境使用 HTTPS
- [x] MQTT 设备认证已配置

### 开发环境建议

- [ ] 使用 `.env.local` 存储敏感配置
- [ ] 不要将生产环境凭据用于开发
- [ ] 定期更新依赖包

---

## 相关文件

- `backend/.env.example` - 开发环境变量模板
- `.env` - 生产环境 Docker Compose 配置（已预配置）
- `backend/.env` - 生产环境后端配置（已预配置）
- `docker-compose.yml` - 开发环境 Docker 配置
- `docker-compose.prod.yml` - 生产环境 Docker 配置
- [部署指南](./DEPLOYMENT.md) - 生产部署流程
- [运行手册](./RUNBOOK.md) - 运维操作指南