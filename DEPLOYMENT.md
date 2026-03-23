# 物联网管理系统 - 部署文档

## 快速开始

### 1. 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 18+ (本地开发)

### 2. 一键部署

```bash
# 进入项目目录
cd /home/leon/projects/iot

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 3. 初始化数据库

```bash
# 进入后端目录
cd backend

# 运行数据库迁移
npx prisma migrate deploy

# 生成 Prisma 客户端
npx prisma generate

# 运行种子数据（创建默认管理员）
npx tsx prisma/seed.ts
```

## 服务说明

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 3000 | REST API 服务 |
| EMQX Dashboard | 18083 | MQTT Broker 管理界面 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |
| MQTT Broker | 1883 | MQTT 协议接入 |

## 默认账号

### 管理后台
- 用户名：`admin`
- 密码：`admin123`

### EMQX Dashboard
- 用户名：`admin`
- 密码：`public`

### 数据库
- 用户名：`iot_user`
- 密码：`iot_password`
- 数据库：`iot_db`

### Redis
- 密码：`redis_password`

## 常用命令

### 服务管理
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启服务
docker-compose restart

# 查看日志
docker-compose logs -f backend
```

### 数据库操作
```bash
# 进入数据库容器
docker exec -it iot-postgres psql -U iot_user -d iot_db

# 备份数据库
docker exec iot-postgres pg_dump -U iot_user iot_db > backup.sql
```

### 后端开发
```bash
cd backend

# 开发模式
npm run dev

# 运行测试
npm run test

# 构建生产版本
npm run build
```

## 生产环境部署

### 1. 修改配置

编辑 `backend/.env` 文件：

```bash
NODE_ENV=production
JWT_SECRET=<强随机密钥>
DB_PASSWORD=<强密码>
REDIS_PASSWORD=<强密码>
```

### 2. 健康检查

```bash
# 检查 API 健康
curl http://localhost:3000/health

# 检查 EMQX 状态
docker exec iot-emqx emqx_ctl status
```

## 故障排查

### 后端无法启动
```bash
docker-compose logs backend
```

### MQTT 无法连接
```bash
docker exec iot-emqx emqx_ctl status
docker-compose logs emqx
```

### 重置数据库
```bash
docker exec iot-postgres psql -U iot_user -d iot_db \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
cd backend && npx prisma migrate deploy
```

## 安全建议

1. **修改默认密码**：所有服务的默认密码都应修改
2. **JWT 密钥**：生产环境使用强随机密钥
3. **网络隔离**：数据库和 Redis 不暴露在公网
4. **SSL/TLS**：生产环境启用 HTTPS 和 MQTTS
5. **定期备份**：配置数据库定期备份

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **MQTT Broker**: EMQX 5.0
- **前端**: 微信小程序
