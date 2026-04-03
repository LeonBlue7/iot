# 部署指南

本文档描述如何在生产环境中部署物联网智能办公空调控制系统。

> **生产环境状态**: 已完成初步部署，admin-web 管理后台正常运行。
> **最后更新**: 2026-04-03（四层层级管理功能）

---

## 目录

- [快速访问](#快速访问)
- [开发环境（Docker 化）](#开发环境docker-化)
- [生产环境部署](#生产环境部署)
  - [一键部署](#一键部署)
  - [前置要求](#前置要求)
  - [部署命令详解](#部署命令详解)
- [预配置信息](#预配置信息)
- [服务端口](#服务端口)
- [常用操作](#常用操作)
- [故障排查](#故障排查)
- [更新部署](#更新部署)

---

## 快速访问

### 生产环境地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 管理后台 | https://www.jxbonner.cloud | React + Ant Design |
| API 健康检查 | https://www.jxbonner.cloud/health | 后端服务状态 |
| EMQX 控制台 | http://www.jxbonner.cloud:18083 | MQTT Broker 管理 |

### 默认账号

| 系统 | 用户名 | 密码来源 |
|------|--------|----------|
| 管理后台 | `admin` | 见 `INITIAL_ADMIN_PASSWORD` 环境变量 |
| EMQX 控制台 | `admin` | 见 `EMQX_PASSWORD` 环境变量 |

⚠️ **首次登录后请立即修改密码**

---

## 开发环境（Docker 化）

项目已完全容器化，开发环境使用 Docker Compose 一键启动所有服务。

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/LeonBlue7/iot.git
cd iot

# 2. 复制环境变量模板
cp .env.example .env

# 3. 启动完整开发环境
docker compose up -d

# 4. 初始化数据库（首次启动）
docker compose exec backend npx prisma migrate dev
docker compose exec backend npm run prisma:seed

# 5. 查看日志
docker compose logs -f
```

### 开发环境服务

启动后可访问：

| 服务 | 地址 | 说明 |
|------|------|------|
| 后端 API | http://localhost:3000 | Express 服务 |
| 管理后台 | http://localhost:3001 | Vite 开发服务器 |
| EMQX 控制台 | http://localhost:18083 | MQTT 管理 |
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 缓存 |

### 常用开发命令

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f admin-web

# 进入后端容器
docker compose exec backend sh

# 运行数据库迁移
docker compose exec backend npx prisma migrate dev

# 运行种子数据
docker compose exec backend npm run prisma:seed

# 停止所有服务
docker compose down

# 停止并清理数据卷
docker compose down -v
```

### 热重载支持

开发环境支持代码热重载：

- **后端**: 挂载 `src/` 和 `prisma/` 目录，使用 `tsx watch` 实现热重载
- **前端**: 挂载 `src/` 目录，Vite HMR 自动更新

### Docker Compose V2 说明

项目使用 Docker Compose V2（`docker compose` 命令，非 `docker-compose`）。

```bash
# 检查版本
docker compose version

# 如果未安装 V2，安装 Docker Compose 插件
# Ubuntu/Debian:
sudo apt-get install docker-compose-plugin

# 或使用独立版本（兼容命令）
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

## 生产环境部署

### 一键部署（推荐）

项目已预配置所有生产环境参数，支持一键部署：

```bash
# 1. 克隆项目（如果尚未克隆）
cd /opt
git clone https://github.com/LeonBlue7/iot.git
cd iot

# 2. 一键部署
./scripts/deploy.sh deploy
```

**就是这么简单！**

部署完成后访问：
- 管理后台：https://www.jxbonner.cloud
- 健康检查：https://www.jxbonner.cloud/health
- EMQX 控制台：http://www.jxbonner.cloud:18083

---

## 前置要求

### 开发环境

| 项目 | 要求 | 说明 |
|------|------|------|
| Docker | 20.x+ | 容器运行时 |
| Docker Compose | V2 | Docker Compose 插件 |
| Git | 最新稳定版 | 版本控制 |

### 生产环境服务器要求

| 项目 | 最低配置 | 推荐配置 | 当前配置 |
|------|----------|----------|----------|
| 操作系统 | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 核心 | 4 核心 | - |
| 内存 | 4GB | 8GB | - |
| 存储 | 20GB | 50GB | - |
| 网络 | 静态公网 IP | 静态公网 IP | 腾讯云 |
| Docker | 26.x | 26.x | Docker 26 |
| Docker Compose | V2 | V2 | 已安装 |

### 必装软件

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose V2（推荐）
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 或安装独立版本 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker compose version   # V2 插件方式
# 或
docker-compose version   # 独立版本
```

---

## 部署命令详解

### 标准部署

```bash
./scripts/deploy.sh deploy
```

### 其他常用命令

```bash
# 查看服务状态
./scripts/deploy.sh status

# 健康检查
./scripts/deploy.sh health

# 查看状态（JSON格式）
./scripts/deploy.sh status --json

# 回滚到上一版本
./scripts/deploy.sh rollback --previous

# 模拟部署（不执行实际操作）
./scripts/deploy.sh deploy --dry-run
```

---

## 预配置信息

项目已预配置以下内容，部署时无需额外操作：

### SSL 证书

证书文件位置：`nginx/ssl/`
- `jxbonner.cloud_bundle.pem` - SSL证书链
- `jxbonner.cloud.key` - 私钥文件

### 环境变量

生产环境配置已内置在以下文件中：

| 文件 | 说明 |
|------|------|
| `.env` | Docker Compose 环境变量 |
| `backend/.env` | 后端服务环境变量 |

配置内容包括：
- 数据库连接信息
- Redis 配置
- MQTT 配置（含设备认证）
- JWT 密钥
- 微信小程序配置
- 管理员初始密码

### MQTT 设备认证（重要）

| 属性 | 值 | 说明 |
|------|-----|------|
| 用户名 | `test1` | 设备端已硬编码 |
| 密码 | `test123` | 设备端已硬编码 |

> **说明**: 4G模组嵌入式程序已将此认证信息写入固件，无法远程更改。
> 此凭据用于设备与服务器之间的 MQTT 通信。

---

## 服务端口

### 外部端口（公网访问）

| 端口 | 服务 | 协议 | 说明 |
|------|------|------|------|
| 80 | Nginx | HTTP | 重定向到 HTTPS |
| 443 | Nginx | HTTPS | Web 入口 |
| 1883 | EMQX | MQTT | 设备连接 |
| 18083 | EMQX | HTTP | 管理控制台 |

### 内部端口（Docker 网络）

| 端口 | 服务 | 说明 |
|------|------|------|
| 3000 | Backend | API 服务 |
| 5432 | PostgreSQL | 数据库 |
| 6379 | Redis | 缓存 |
| 8083 | EMQX | MQTT WebSocket |

---

## 常用操作

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f emqx
docker-compose logs -f nginx
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart nginx
```

### 停止服务

```bash
docker-compose down
```

### 启动服务

```bash
docker-compose up -d
```

---

## 数据库备份

```bash
# 手动备份
./scripts/backup.sh

# 查看备份
ls -la /opt/iot/backups/
```

### 恢复数据库

```bash
./scripts/restore.sh /opt/iot/backups/db_xxxxxx.sql.gz
```

---

## 故障排查

### 服务无法启动

```bash
# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs backend

# 检查端口占用
sudo netstat -tlnp | grep -E '80|443|3000|1883'
```

### 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker-compose exec postgres pg_isready

# 检查连接
docker-compose exec backend env | grep DATABASE
```

### MQTT 连接失败

```bash
# 检查 EMQX 状态
docker-compose exec emqx emqx_ctl status

# 查看 EMQX 日志
docker-compose logs emqx

# 检查设备认证
# 用户名: test1, 密码: test123
```

### Nginx 问题

```bash
# 检查 Nginx 配置
docker-compose exec nginx nginx -t

# 查看 Nginx 日志
docker-compose logs nginx

# 检查 SSL 证书
ls -la nginx/ssl/
```

---

## 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新部署
./scripts/deploy.sh deploy
```

---

## 目录结构

```
/opt/iot/
├── backend/                    # 后端服务
│   ├── .env                   # 生产环境变量（已配置）
│   ├── Dockerfile             # 生产环境 Dockerfile
│   ├── Dockerfile.dev         # 开发环境 Dockerfile
│   └── ...
├── admin-web/                  # 管理后台前端
│   ├── Dockerfile             # 生产环境 Dockerfile
│   ├── Dockerfile.dev         # 开发环境 Dockerfile
│   ├── vite.config.docker.ts  # Docker 环境专用 Vite 配置
│   └── ...
├── nginx/                      # Nginx 配置
│   ├── nginx.conf             # Nginx 配置文件
│   └── ssl/                   # SSL 证书（已配置）
├── scripts/                    # 运维脚本
│   ├── deploy.sh              # 一键部署
│   ├── backup.sh              # 数据库备份
│   └── restore.sh             # 数据恢复
├── docker-compose.yml          # 开发环境（完全容器化）
├── docker-compose.prod.yml     # 生产环境
├── docker-compose.monitoring.yml  # 监控服务（可选）
├── .env                        # Docker Compose 环境变量
├── .env.example                # 开发环境变量模板
└── CLAUDE.md                   # 项目指导文档
```

---

## 相关文档

- [环境变量配置](./ENV.md) - 详细环境变量说明
- [运行手册](./RUNBOOK.md) - 运维操作详细指南
- [API 文档](./API.md) - 接口定义
- [贡献指南](./CONTRIBUTING.md) - 开发规范