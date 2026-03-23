# 部署指南

本文档描述如何在生产环境中部署物联网智能办公空调控制系统。

## 前置要求

### 服务器要求

- **操作系统**: Ubuntu 22.04 LTS 或更高版本
- **CPU**: 2 核心 (推荐 4 核心)
- **内存**: 4GB RAM (推荐 8GB)
- **存储**: 20GB 可用空间
- **网络**: 静态公网 IP

### 域名要求

- 已备案的域名 (如：jxbonner.cloud)
- DNS A 记录指向服务器 IP

## 安全配置（必读）

### 生成强密码

**所有密码必须使用随机生成的强密码！**

```bash
# 数据库密码 (32 字节)
openssl rand -base64 32

# Redis 密码 (32 字节)
openssl rand -base64 32

# JWT 密钥 (64 字节)
openssl rand -base64 64

# 初始管理员密码 (16 字节)
openssl rand -base64 16

# EMQX 密码 (32 字节)
openssl rand -base64 32
```

### 安全清单

部署前请确认：

- [ ] 所有密码使用强随机密码
- [ ] `.env` 文件权限设置为 `600`
- [ ] `.env` 未提交到版本控制
- [ ] 生产环境使用 HTTPS
- [ ] 生产环境使用 MQTTS (TLS)
- [ ] 防火墙只开放必要端口 (80, 443, 1883)
- [ ] 数据库不暴露在公网
- [ ] 启用审计日志

### 默认账号处理

运行 `npm run prisma:seed` 后创建默认管理员：

- **用户名**: `admin`
- **密码**: 通过 `INITIAL_ADMIN_PASSWORD` 环境变量设置
- **注意**: 首次登录时**必须**修改密码

建议在生产部署后立即：
1. 创建新的管理员账号
2. 禁用或删除默认 `admin` 账号

## 快速部署 (Docker Compose)

### 步骤 1: 安装依赖

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤 2: 克隆项目

```bash
cd /opt
sudo git clone https://github.com/your-org/iot.git
sudo chown -R $USER:$USER iot
cd iot
```

### 步骤 3: 配置环境变量

```bash
# 复制环境变量模板
cp backend/.env.example backend/.env
cp nginx/ssl.example nginx/ssl

# 编辑环境变量
vim backend/.env
```

**必需配置的环境变量**:

```bash
# 数据库配置
DATABASE_URL="postgresql://iot_user:STRONG_PASSWORD@postgres:5432/iot_db"
DB_USER=iot_user
DB_PASSWORD=使用 openssl rand -base64 32 生成强密码
DB_NAME=iot_db

# Redis 配置
REDIS_PASSWORD=使用 openssl rand -base64 32 生成强密码

# JWT 配置 (重要!)
JWT_SECRET=使用 openssl rand -base64 64 生成强密码
JWT_EXPIRES_IN=24h

# MQTT 配置
MQTT_BROKER_URL=mqtt://emqx:1883
MQTT_CA_CERT_PATH=/app/certs/ca-cert.pem  # 如果使用 TLS

# EMQX 配置
EMQX_USERNAME=admin
EMQX_PASSWORD=使用 openssl rand -base64 32 生成强密码

# 服务器配置
NODE_ENV=production
PORT=3000
SERVER_URL=https://www.jxbonner.cloud
```

### 步骤 4: 配置 SSL 证书

```bash
# 创建 SSL 目录
sudo mkdir -p nginx/ssl

# 使用 Let's Encrypt 获取证书
sudo apt install certbot -y
sudo certbot certonly --standalone -d www.jxbonner.cloud -d jxbonner.cloud

# 复制证书到 nginx 目录
sudo cp /etc/letsencrypt/live/www.jxbonner.cloud/fullchain.pem nginx/ssl/jxbonner.cloud_bundle.pem
sudo cp /etc/letsencrypt/live/www.jxbonner.cloud/privkey.pem nginx/ssl/jxbonner.cloud.key

# 设置权限
sudo chmod 600 nginx/ssl/*.key
sudo chmod 644 nginx/ssl/*.pem
```

### 步骤 5: 配置 MQTT Broker (EMQX)

```bash
# 创建 EMQX 配置目录
sudo mkdir -p emqx

# 创建 EMQX 配置文件
cat > emqx/emqx.conf << EOF
## MQTT TCP 端口
listener.tcp.default = 1883

## MQTT SSL 端口 (可选)
# listener.ssl.default = 8883
# listener.ssl.default.certfile = /opt/emqx/etc/certs/cert.pem
# listener.ssl.default.keyfile = /opt/emqx/etc/certs/key.pem

## 认证 - 简单用户名密码
authentication.password_hash = plain
authentication.mechanism = password_based
authentication.user.1.username = device_user
authentication.user.1.password = 使用 openssl rand -base64 32 生成强密码

## ACL 访问控制
authorization.sources.1.type = file
authorization.sources.1.file = /opt/emqx/etc/acl.conf
EOF

# 创建 ACL 配置
cat > emqx/acl.conf << EOF
{allow, {user, "device_user"}, subscribe, ["/up/#", "/down/#"]}.
{allow, {user, "device_user"}, publish, ["/up/#"]}.
{deny, all, subscribe, ["$SYS/#", "#"]}.
{allow, all}.
EOF
```

### 步骤 6: 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 检查服务状态
docker-compose ps
```

### 步骤 7: 运行数据库迁移

```bash
# 进入后端容器
docker-compose exec backend sh

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 退出容器
exit
```

### 步骤 8: 验证部署

```bash
# 健康检查
curl https://www.jxbonner.cloud/health

# 预期响应
# {"status":"ok","timestamp":"2026-03-21T..."}
```

## 手动部署 (不使用 Docker)

### 步骤 1: 安装 Node.js

```bash
# 使用 NVM 安装 Node.js 20
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 步骤 2: 安装 PostgreSQL

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE iot_db;
CREATE USER iot_user WITH PASSWORD '强密码';
GRANT ALL PRIVILEGES ON DATABASE iot_db TO iot_user;
EOF
```

### 步骤 3: 安装 Redis

```bash
sudo apt install redis-server -y

# 配置 Redis 密码
sudo vim /etc/redis/redis.conf
# 找到 requirepass 行，设置密码

# 重启 Redis
sudo systemctl restart redis
```

### 步骤 4: 安装 EMQX

```bash
# 添加 EMQX 仓库
curl -s https://repos.emqx.io/gpg/gpg.key | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/emqx.gpg
echo "deb [trusted=yes] https://repos.emqx.io/emqx-ce/v5.21.0/ /" | sudo tee /etc/apt/sources.list.d/emqx.list

# 安装 EMQX
sudo apt update
sudo apt install emqx -y
sudo systemctl enable emqx
sudo systemctl start emqx
```

### 步骤 5: 部署后端应用

```bash
cd /opt/iot/backend

# 安装依赖
npm ci --only=production

# 生成 Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 编译 TypeScript
npm run build

# 使用 PM2 管理进程
npm install -g pm2
pm2 start dist/app.js --name iot-backend
pm2 save
pm2 startup
```

### 步骤 6: 配置 Nginx

```bash
sudo vim /etc/nginx/sites-available/iot

# 添加配置 (参考 nginx/nginx.conf)

# 启用配置
sudo ln -s /etc/nginx/sites-available/iot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 监控和维护

### 日志查看

```bash
# Docker 方式
docker-compose logs -f backend
docker-compose logs -f emqx
docker-compose logs -f postgres
docker-compose logs -f redis

# PM2 方式
pm2 logs iot-backend
```

### 备份数据库

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/iot/backups"
mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U iot_user iot_db > $BACKUP_DIR/db_$DATE.sql
docker-compose exec -T redis redis-cli --raw BGSAVE
docker-compose exec -T redis redis-cli --raw ACL SAVE

# 保留最近 7 天的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
EOF

chmod +x backup.sh

# 添加到 crontab (每天凌晨 2 点)
crontab -e
# 0 2 * * * /opt/iot/backup.sh
```

### 恢复数据库

```bash
# 从备份恢复
docker-compose exec -T postgres psql -U iot_user iot_db < /opt/iot/backups/db_20260321_020000.sql
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新构建并重启
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 运行迁移 (如果有)
docker-compose exec backend npx prisma migrate deploy
```

## 故障排查

### 常见问题

#### 1. 后端无法启动

```bash
# 检查日志
docker-compose logs backend

# 常见原因:
# - 数据库未就绪 (检查 postgres 健康状态)
# - 环境变量配置错误
# - 端口被占用
```

#### 2. MQTT 连接失败

```bash
# 检查 EMQX 状态
docker-compose exec emqx emqx_ctl status

# 检查防火墙
sudo ufw status
sudo ufw allow 1883/tcp
```

#### 3. SSL 证书问题

```bash
# 检查证书有效期
openssl x509 -in nginx/ssl/jxbonner.cloud_bundle.pem -text -noout | grep "Not After"

# 自动续期
sudo certbot renew
```

#### 4. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
docker-compose exec postgres pg_isready

# 检查连接字符串
docker-compose exec backend env | grep DATABASE
```

## 安全建议

1. **定期更新**: 每月更新系统包和依赖
2. **防火墙配置**: 只开放必要端口 (80, 443, 1883)
3. **监控告警**: 配置服务器监控 (Prometheus + Grafana)
4. **备份验证**: 定期测试备份恢复流程
5. **日志审计**: 定期审查访问日志和错误日志

## 性能优化

### 数据库优化

```sql
-- 添加索引 (Prisma 迁移中已包含)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sensor_data_device_id_idx" ON "sensor_data"("device_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "sensor_data_recorded_at_idx" ON "sensor_data"("recorded_at");
```

### Redis 缓存

```bash
# 配置 Redis 内存限制
redis-cli CONFIG SET maxmemory 512mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Nginx 优化

```nginx
# 在 nginx.conf 中添加
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}
```

## 联系支持

如有部署问题，请查看:
- 项目文档：/docs/
- API 文档：/docs/API.md
- 问题反馈：GitHub Issues
