# 运行手册 (Runbook)

本文档提供运维人员日常操作、故障排查和应急响应的详细指南。

> **适用环境**: 生产环境 (https://www.jxbonner.cloud)
> **开发环境**: 请参考 [贡献指南](./CONTRIBUTING.md)

---

## 目录

- [服务概览](#服务概览)
- [常用操作命令](#常用操作命令)
- [一键部署](#一键部署)
- [健康检查](#健康检查)
- [监控告警](#监控告警)
- [故障排查](#故障排查)
- [回滚操作](#回滚操作)
- [备份恢复](#备份恢复)

## 服务概览

### 生产环境状态

- ✅ 已部署运行
- ✅ admin-web 管理后台正常
- ✅ API 服务正常
- ✅ MQTT Broker (EMQX) 正常
- ✅ SSL 证书已配置

### 服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 管理后台 | https://www.jxbonner.cloud | 用户界面 |
| API 服务 | https://www.jxbonner.cloud/api | REST API |
| MQTT Broker | mqtt://www.jxbonner.cloud:1883 | 设备连接 |
| EMQX 控制台 | http://www.jxbonner.cloud:18083 | 管理界面 |

### 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Nginx (反向代理)                       │
│                      端口: 80, 443                           │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   Admin-Web      │ │     Backend      │ │      EMQX        │
│   (前端静态)      │ │   (API 服务)     │ │  (MQTT Broker)   │
│   端口: 80       │ │   端口: 3000     │ │  端口: 1883      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │                   │
          ┌───────────────────┼───────────────────┤
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   PostgreSQL     │ │      Redis       │ │   设备端         │
│   (数据库)        │ │    (缓存)        │ │   (4G模组)       │
│   端口: 5432     │ │   端口: 6379     │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### 服务依赖关系

| 服务 | 依赖 | 启动顺序 |
|------|------|----------|
| PostgreSQL | 无 | 1 |
| Redis | 无 | 1 |
| EMQX | 无 | 1 |
| Backend | PostgreSQL, Redis, EMQX | 2 |
| Admin-Web | Backend | 3 |
| Nginx | Backend, Admin-Web | 4 |

### 端口清单

| 端口 | 服务 | 协议 | 说明 |
|------|------|------|------|
| 80 | Nginx | HTTP | 重定向到 HTTPS |
| 443 | Nginx | HTTPS | Web 入口 |
| 3000 | Backend | HTTP | API 服务 |
| 1883 | EMQX | MQTT | 设备连接 |
| 8083 | EMQX | WebSocket | MQTT WS |
| 8883 | EMQX | MQTTS | MQTT TLS |
| 18083 | EMQX | HTTP | 管理控制台 |
| 5432 | PostgreSQL | TCP | 数据库 |
| 6379 | Redis | TCP | 缓存 |
| 9090 | Prometheus | HTTP | 监控 |
| 3003 | Grafana | HTTP | 可视化 |

---

## 常用操作命令

### 服务管理

**⚠️ 重要：生产环境必须使用 `-f docker-compose.prod.yml` 指定配置文件！**

```bash
# ========== 生产环境 ==========
# 查看所有服务状态
sudo docker-compose -f docker-compose.prod.yml ps

# 启动所有服务
sudo docker-compose -f docker-compose.prod.yml up -d

# 停止所有服务
sudo docker-compose -f docker-compose.prod.yml down

# 重启单个服务
sudo docker-compose -f docker-compose.prod.yml restart backend
sudo docker-compose -f docker-compose.prod.yml restart admin-web
sudo docker-compose -f docker-compose.prod.yml restart nginx

# 查看服务日志
sudo docker-compose -f docker-compose.prod.yml logs -f backend
sudo docker-compose -f docker-compose.prod.yml logs -f --tail=100 emqx
sudo docker-compose -f docker-compose.prod.yml logs -f nginx

# 重新构建并启动服务（代码更新后）
sudo docker-compose -f docker-compose.prod.yml up -d --build backend
sudo docker-compose -f docker-compose.prod.yml up -d --build admin-web

# ========== 开发环境（本地开发）==========
# 开发环境使用默认 docker-compose.yml
docker compose ps
docker compose up -d
docker compose down
docker compose logs -f backend
```

### 一键部署脚本

<!-- AUTO-GENERATED: scripts/deploy.sh -->

```bash
# 查看帮助
./scripts/deploy.sh --help

# 标准部署
./scripts/deploy.sh deploy --version v1.2.0

# 蓝绿部署
./scripts/deploy.sh deploy --blue-green --target green

# 模拟运行（不执行实际操作）
./scripts/deploy.sh deploy --dry-run

# 跳过测试部署
./scripts/deploy.sh deploy --skip-tests

# 查看服务状态
./scripts/deploy.sh status

# JSON 格式输出
./scripts/deploy.sh status --json

# 健康检查
./scripts/deploy.sh health

# 回滚到上一版本
./scripts/deploy.sh rollback --previous
```

<!-- END AUTO-GENERATED -->

### 数据库操作

```bash
# 进入数据库容器
sudo docker-compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db

# 备份数据库
./scripts/backup.sh

# 恢复数据库
./scripts/restore.sh /opt/iot/backups/db_20260327_020000.sql.gz

# 查看 Prisma 迁移状态
sudo docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate status
```

### Redis 操作

```bash
# 连接 Redis
sudo docker-compose -f docker-compose.prod.yml exec redis redis-cli -a <REDIS_PASSWORD>

# 查看所有键
sudo docker-compose -f docker-compose.prod.yml exec redis redis-cli -a <REDIS_PASSWORD> KEYS '*'

# 清空缓存
sudo docker-compose -f docker-compose.prod.yml exec redis redis-cli -a <REDIS_PASSWORD> FLUSHDB
```

---

## 一键部署

### 部署命令详解

| 命令 | 说明 |
|------|------|
| `deploy` | 执行部署 |
| `rollback` | 回滚到指定版本 |
| `status` | 查看服务状态 |
| `health` | 健康检查 |

### 部署选项

| 选项 | 说明 |
|------|------|
| `--dry-run` | 模拟运行，不执行实际操作 |
| `--blue-green` | 启用蓝绿部署 |
| `--target <env>` | 指定目标环境 (blue/green) |
| `--version <tag>` | 指定部署版本 |
| `--skip-tests` | 跳过测试 |
| `--verify-health` | 部署后验证健康状态 |
| `--backup-dir <dir>` | 备份目录 |
| `--retention <days>` | 备份保留天数 |
| `--notify <webhook>` | 通知 webhook 地址 |
| `--wechat-webhook <url>` | 企业微信 webhook |
| `--json` | JSON 格式输出 |
| `--verbose` | 详细输出 |

### 部署流程

```
1. 预检查
   ├── 检查 Docker 服务
   ├── 检查环境变量
   └── 检查依赖服务

2. 备份
   ├── 数据库备份
   └── 当前版本备份

3. 部署
   ├── 拉取最新镜像/代码
   ├── 运行数据库迁移
   └── 重启服务

4. 验证
   ├── 健康检查
   ├── API 可用性测试
   └── 服务稳定性监控

5. 完成/回滚
   ├── 发送通知
   └── 失败时自动回滚
```

---

## 健康检查

### 健康检查端点

| 端点 | 说明 | 预期响应 |
|------|------|----------|
| `GET /health` | 后端健康检查 | `{"status":"ok"}` |
| `GET /api/admin/auth/me` | 认证检查 | 需要 Token |
| `EMQX:18083` | MQTT Broker 状态 | Web 控制台 |

### 手动健康检查

```bash
# 后端健康检查
curl -s https://www.jxbonner.cloud/health | jq

# 数据库连接检查
sudo docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# Redis 连接检查
sudo docker-compose -f docker-compose.prod.yml exec redis redis-cli -a <REDIS_PASSWORD> PING

# EMQX 状态检查
sudo docker-compose -f docker-compose.prod.yml exec emqx emqx_ctl status
```

### 使用部署脚本健康检查

```bash
# 完整健康检查
./scripts/deploy.sh health

# 检查特定服务
./scripts/deploy.sh health --check-db --check-redis --check-api
```

---

## 监控告警

### Prometheus 监控

```bash
# 访问 Prometheus
http://<server>:9090

# 常用查询
# CPU 使用率
100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# 内存使用率
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# 磁盘使用率
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
```

### Grafana 仪表盘

```bash
# 访问 Grafana
http://<server>:3003
# 默认账号: admin / admin (首次登录需修改)
```

### 告警规则

| 告警名称 | 条件 | 级别 | 处理 |
|----------|------|------|------|
| HighCPU | CPU > 80% 持续 5 分钟 | Warning | 检查进程 |
| HighMemory | 内存 > 90% | Warning | 检查内存泄漏 |
| DiskSpaceLow | 磁盘 < 10% | Critical | 清理日志/备份 |
| ServiceDown | 服务不可达 | Critical | 重启服务 |
| DatabaseDown | 数据库不可达 | Critical | 检查 PostgreSQL |

---

## 故障排查

### 常见问题诊断

#### 1. 服务无法启动

```bash
# 查看服务日志
sudo docker-compose -f docker-compose.prod.yml logs backend

# 检查端口占用
sudo netstat -tlnp | grep 3000

# 检查容器状态
sudo docker-compose -f docker-compose.prod.yml ps

# 检查资源使用
docker stats
```

#### 2. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
sudo docker-compose -f docker-compose.prod.yml exec postgres pg_isready

# 检查连接字符串
sudo docker-compose -f docker-compose.prod.yml exec backend env | grep DATABASE

# 检查数据库日志
sudo docker-compose -f docker-compose.prod.yml logs postgres

# 测试连接
sudo docker-compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect().then(() => console.log('OK')).catch(console.error);
"
```

#### 3. MQTT 连接问题

```bash
# 检查 EMQX 状态
sudo docker-compose -f docker-compose.prod.yml exec emqx emqx_ctl status

# 查看连接数
sudo docker-compose -f docker-compose.prod.yml exec emqx emqx_ctl listeners

# 查看 EMQX 日志
sudo docker-compose -f docker-compose.prod.yml logs emqx

# 测试 MQTT 连接（使用设备认证凭据）
# 用户名: test1, 密码: test123
mosquitto_pub -h localhost -p 1883 -u test1 -P test123 -t test -m "hello"
```

> **⚠️ MQTT 设备认证**: 用户名 `test1`，密码 `test123`
> 此凭据已写入 4G模组嵌入式程序，无法更改。

#### 4. API 响应慢

```bash
# 检查后端日志
sudo docker-compose -f docker-compose.prod.yml logs backend | grep -i "slow\|timeout"

# 检查数据库慢查询
sudo docker-compose -f docker-compose.prod.yml exec postgres psql -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# 检查 Redis 延迟
sudo docker-compose -f docker-compose.prod.yml exec redis redis-cli --latency
```

### 日志分析

```bash
# 使用日志脚本
./scripts/logs.sh

# 查看错误日志
sudo docker-compose -f docker-compose.prod.yml logs backend 2>&1 | grep -i error

# 实时监控
sudo docker-compose -f docker-compose.prod.yml logs -f --tail=100 backend
```

---

## 回滚操作

### 使用部署脚本回滚

```bash
# 回滚到上一版本
./scripts/deploy.sh rollback --previous

# 回滚到指定版本
./scripts/deploy.sh rollback --version v1.1.0

# 模拟回滚
./scripts/deploy.sh rollback --dry-run
```

### 手动回滚

```bash
# 1. 停止当前服务
sudo docker-compose -f docker-compose.prod.yml down

# 2. 切换到上一版本
git log --oneline -5
git checkout <previous-commit>

# 3. 重新部署
sudo docker-compose -f docker-compose.prod.yml up -d --build

# 4. 恢复数据库（如需要）
./scripts/restore.sh /opt/iot/backups/db_<timestamp>.sql.gz
```

### 蓝绿部署切换

```bash
# 当前运行 blue，切换到 green
./scripts/deploy.sh deploy --blue-green --target green

# 验证后切换回 blue
./scripts/deploy.sh deploy --blue-green --target blue
```

---

## 备份恢复

### 自动备份

```bash
# 备份脚本已配置 crontab
# 查看定时任务
crontab -l

# 手动执行备份
./scripts/backup.sh

# 指定备份目录
./scripts/backup.sh /custom/backup/path
```

### 备份内容

| 组件 | 备份方式 | 保留期限 |
|------|----------|----------|
| PostgreSQL | pg_dump + gzip | 7 天 |
| Redis | RDB 快照 | 7 天 |
| 环境配置 | 文件复制 | 永久 |

### 恢复流程

```bash
# 1. 停止服务
sudo docker-compose -f docker-compose.prod.yml stop backend

# 2. 恢复数据库
./scripts/restore.sh /opt/iot/backups/db_20260327_020000.sql.gz

# 3. 验证数据
sudo docker-compose -f docker-compose.prod.yml exec postgres psql -c "SELECT COUNT(*) FROM devices;"

# 4. 重启服务
sudo docker-compose -f docker-compose.prod.yml start backend

# 5. 验证服务
./scripts/deploy.sh health
```

---

## 应急响应

### P1 级别故障（服务不可用）

1. **确认故障范围**
   ```bash
   ./scripts/deploy.sh status --json
   ./scripts/deploy.sh health
   ```

2. **尝试快速恢复**
   ```bash
   sudo docker-compose -f docker-compose.prod.yml restart backend
   sudo docker-compose -f docker-compose.prod.yml restart nginx
   ```

3. **如果重启失败，执行回滚**
   ```bash
   ./scripts/deploy.sh rollback --previous
   ```

4. **通知相关人员**
   - 记录故障时间和现象
   - 通知开发团队
   - 更新状态页面

### P2 级别故障（性能下降）

1. **收集诊断信息**
   ```bash
   docker stats
   sudo docker-compose -f docker-compose.prod.yml logs --tail=500 backend
   ```

2. **检查资源使用**
   ```bash
   htop
   df -h
   ```

3. **临时扩容**
   ```bash
   sudo docker-compose -f docker-compose.prod.yml up -d --scale backend=2
   ```

---

## 联系方式

| 角色 | 联系方式 |
|------|----------|
| 运维负责人 | @ops-lead |
| 开发负责人 | @dev-lead |
| 紧急热线 | +86-xxx-xxxx-xxxx |

---

## 相关文档

- [部署指南](./DEPLOYMENT.md)
- [API 文档](./API.md)
- [环境变量](./ENV.md)
- [贡献指南](./CONTRIBUTING.md)