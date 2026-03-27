# 环境变量配置

本文档列出项目中所有环境变量的详细说明。

## 后端环境变量

### 服务器配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `NODE_ENV` | 否 | `development` | 运行环境 | `development`, `production`, `test` |
| `PORT` | 否 | `3000` | HTTP 服务端口 | `3000` |
| `SERVER_URL` | 否 | `http://localhost:3000` | 服务器地址 | `https://api.example.com` |

### 数据库配置 (PostgreSQL)

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

### Redis 配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `REDIS_HOST` | 否 | `localhost` | Redis 主机地址 | `redis` (Docker 网络) |
| `REDIS_PORT` | 否 | `6379` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | 是 (生产) | - | Redis 密码 | `openssl rand -base64 32` |

### MQTT 配置 (EMQX)

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `MQTT_BROKER_URL` | 否 | `mqtt://localhost:1883` | MQTT Broker 地址 | `mqtt://emqx:1883` |
| `MQTT_USERNAME` | 否 | - | MQTT 用户名 | `device_user` |
| `MQTT_PASSWORD` | 否 | - | MQTT 密码 | - |
| `MQTT_CLIENT_ID` | 否 | `iot_server_` | MQTT 客户端 ID 前缀 | `iot_server_` |
| `MQTT_CA_CERT_PATH` | 否 | - | CA 证书路径 (TLS) | `/app/certs/ca-cert.pem` |

**生产环境建议**:
- 使用 `mqtts://` 协议启用 TLS
- 配置 `MQTT_CA_CERT_PATH` 指向 CA 证书

### JWT 认证配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `JWT_SECRET` | 生产必需 | 随机生成 | JWT 签名密钥 | `openssl rand -base64 64` |
| `JWT_EXPIRES_IN` | 否 | `7d` | Token 有效期 | `24h`, `7d`, `30d` |

**⚠️ 安全警告**:
- 生产环境必须设置 `JWT_SECRET`（不设置将导致每次重启服务后 Token 失效）
- 生产环境必须使用随机生成的 64 字符密钥
- 不要使用示例代码中的默认值
- 定期轮换密钥

**生成强密钥**:
```bash
openssl rand -base64 64
```

### 微信小程序配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `WECHAT_APPID` | 是 (小程序) | - | 小程序 AppID | `wx9fcb70ddbcf43ecd` |
| `WECHAT_SECRET` | 是 (小程序) | - | 小程序 Secret | - |

### 初始化管理员配置

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `INITIAL_ADMIN_PASSWORD` | 否 | 自动生成 | 初始管理员密码 | `openssl rand -base64 16` |

**注意**:
- 未设置时自动生成 16 字符随机密码
- 首次登录时必须修改密码

## 前端环境变量

### 管理后台

创建 `admin-web/.env` 或 `admin-web/.env.local`:

| 变量 | 必需 | 默认值 | 描述 | 示例 |
|------|------|--------|------|------|
| `VITE_API_URL` | 否 | `/api` | API 基础路径 | `https://api.example.com` |

### 微信小程序

小程序的环境变量在 `miniprogram/utils/config.ts` 中配置:

| 变量 | 必需 | 描述 | 示例 |
|------|------|------|------|
| `API_BASE_URL` | 否 | API 服务器地址 | `https://www.jxbonner.cloud/api` |

## Docker 环境变量

使用 Docker Compose 时，所有环境变量通过 `.env` 文件传递：

```bash
# .env 文件示例
DB_USER=iot_user
DB_PASSWORD=<强密码>
DB_NAME=iot_db
REDIS_PASSWORD=<强密码>
JWT_SECRET=<64 字符随机密钥>
INITIAL_ADMIN_PASSWORD=<16 字符随机密码>
```

## 环境变量优先级

环境变量按以下优先级加载（高优先级覆盖低优先级）：

1. Shell 环境变量（最高）
2. `.env.local` (本地开发，不提交到 Git)
3. `.env` (项目配置)
4. `.env.example` 中的默认值（最低）

## 安全检查清单

部署前请确认：

- [ ] `DB_PASSWORD` 使用强随机密码
- [ ] `REDIS_PASSWORD` 使用强随机密码
- [ ] `JWT_SECRET` 使用 64 字符随机密钥
- [ ] `WECHAT_SECRET` 未暴露在客户端代码
- [ ] `.env` 文件未提交到版本控制
- [ ] 生产环境使用 HTTPS/MQTTS

## 相关文件

- `backend/.env.example` - 后端环境变量模板
- `admin-web/.env.example` - 前端环境变量模板
- `docker-compose.yml` - Docker 环境变量配置
- `SECURITY_FIXES.md` - 安全修复记录
