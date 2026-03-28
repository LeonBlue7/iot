# 部署指南

本文档描述如何在生产环境中部署物联网智能办公空调控制系统。

## 一键部署（推荐）

项目已预配置所有生产环境参数，支持一键部署：

```bash
# 1. 克隆项目（如果尚未克隆）
cd /opt
git clone https://github.com/LeonBlue7/iot.git
cd iot

# 2. 一键部署
./scripts/deploy.sh deploy
```

**就是这么简单！** 🎉

部署完成后访问：
- 管理后台：https://www.jxbonner.cloud
- 健康检查：https://www.jxbonner.cloud/health
- EMQX 控制台：http://www.jxbonner.cloud:18083

---

## 前置要求

### 服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|----------|----------|
| 操作系统 | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 核心 | 4 核心 |
| 内存 | 4GB | 8GB |
| 存储 | 20GB | 50GB |
| 网络 | 静态公网 IP | 静态公网 IP |

### 必装软件

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
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

项目已预配置以下内容，无需额外操作：

### SSL 证书

证书文件位置：`nginx/ssl/`
- `jxbonner.cloud_bundle.pem` - SSL证书链
- `jxbonner.cloud.key` - 私钥文件

### 环境变量

生产环境配置已内置在 `.env` 和 `backend/.env` 文件中，包含：
- 数据库连接信息
- Redis 配置
- MQTT 配置
- JWT 密钥
- 微信小程序配置
- 管理员初始密码

### 默认账号

| 系统 | 用户名 | 密码 |
|------|--------|------|
| 管理后台 | admin | 见 `INITIAL_ADMIN_PASSWORD` 环境变量 |
| EMQX 控制台 | admin | 见 `EMQX_PASSWORD` 环境变量 |

⚠️ **首次登录后请立即修改密码**

---

## 服务端口

| 端口 | 服务 | 协议 | 说明 |
|------|------|------|------|
| 80 | Nginx | HTTP | 重定向到 HTTPS |
| 443 | Nginx | HTTPS | Web 入口 |
| 1883 | EMQX | MQTT | 设备连接 |
| 18083 | EMQX | HTTP | 管理控制台 |

---

## 常用操作

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f emqx
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
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
├── backend/           # 后端服务
│   ├── .env          # 后端环境变量（已配置）
│   └── ...
├── admin-web/         # 管理后台前端
├── nginx/             # Nginx 配置
│   ├── nginx.conf    # Nginx 配置文件
│   └── ssl/          # SSL 证书（已配置）
├── scripts/           # 运维脚本
│   ├── deploy.sh     # 一键部署
│   ├── backup.sh     # 数据库备份
│   └── restore.sh    # 数据恢复
├── docker-compose.yml         # 开发环境
├── docker-compose.prod.yml    # 生产环境
└── .env              # Docker Compose 环境变量（已配置）
```

---

## 相关文档

- [运行手册](./RUNBOOK.md) - 运维操作详细指南
- [API 文档](./API.md) - 接口定义
- [贡献指南](./CONTRIBUTING.md) - 开发规范