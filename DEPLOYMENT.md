# 物联网管理系统 - 部署指南

## 目录

1. [前置要求](#前置要求)
2. [快速开始](#快速开始)
3. [生产环境部署](#生产环境部署)
4. [SSL 证书配置](#ssl 证书配置)
5. [故障排查](#故障排查)

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 域名解析已配置 (www.jxbonner.cloud)
- SSL 证书（生产环境必需）

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd iot
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，设置强密码
```

### 3. 启动所有服务

```bash
docker-compose up -d
```

### 4. 检查服务状态

```bash
docker-compose ps
docker-compose logs -f backend
```

### 5. 运行数据库迁移

```bash
docker-compose exec backend npx prisma migrate deploy
```

## 生产环境部署

### 1. SSL 证书配置

使用 Let's Encrypt 免费证书：

```bash
# 创建证书目录
mkdir -p nginx/ssl

# 使用 Certbot 获取证书
docker run --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  -v $(pwd)/nginx/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d www.jxbonner.cloud \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

### 2. 复制证书到 Nginx 目录

```bash
cp nginx/ssl/live/www.jxbonner.cloud/fullchain.pem nginx/ssl/
cp nginx/ssl/live/www.jxbonner.cloud/privkey.pem nginx/ssl/
```

### 3. 启动服务

```bash
docker-compose -f docker-compose.yml up -d
```

### 4. 验证部署

```bash
# 检查后端健康状态
curl https://www.jxbonner.cloud/health

# 检查 API
curl https://www.jxbonner.cloud/api/devices
```

## 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| Nginx HTTP | 80 | 自动重定向到 HTTPS |
| Nginx HTTPS | 443 | 主访问入口 |
| EMQX Dashboard | 18083 | MQTT 管理界面 |
| EMQX MQTT | 1883 | MQTT TCP 端口 |
| EMQX MQTT SSL | 8883 | MQTT SSL 端口 |
| PostgreSQL | 5432 | 数据库（仅内网） |
| Redis | 6379 | 缓存（仅内网） |

## 常用命令

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

# 重启单个服务
docker-compose restart backend
```

### 停止服务

```bash
docker-compose down

# 停止并删除数据卷（谨慎使用）
docker-compose down -v
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入数据库容器
docker-compose exec postgres psql -U iot_user -d iot_db
```

## 故障排查

### 后端无法启动

```bash
# 查看日志
docker-compose logs backend

# 检查数据库连接
docker-compose exec backend npx prisma studio
```

### MQTT 无法连接

```bash
# 检查 EMQX 状态
docker-compose logs emqx

# 访问 Dashboard: http://localhost:18083
# 默认账号：admin / public
```

### SSL 证书问题

```bash
# 检查证书有效期
openssl x509 -in nginx/ssl/fullchain.pem -noout -dates

# 续期证书
docker run --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  certbot/certbot renew
```

## 监控和维护

### 数据库备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U iot_user iot_db > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U iot_user iot_db < backup.sql
```

### 日志轮转

Nginx 日志会自动轮转，如需手动清理：

```bash
docker-compose exec nginx logrotate -f /etc/logrotate.conf
```

## 安全建议

1. **修改默认密码**：数据库、Redis、EMQX 默认密码必须修改
2. **防火墙配置**：仅开放 80、443、1883、8883 端口
3. **定期更新**：保持 Docker 镜像和依赖更新
4. **监控告警**：配置 EMQX 和应用的监控告警
