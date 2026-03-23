#!/bin/bash
# 数据库备份脚本
# 用法：./backup.sh [backup_dir]

set -e

# 配置变量
BACKUP_DIR="${1:-/opt/iot/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
DB_NAME="${DB_NAME:-iot_db}"
DB_USER="${DB_USER:-iot_user}"
POSTGRES_CONTAINER="iot-postgres"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "IoT 数据库备份"
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo "备份目录：$BACKUP_DIR"
echo "========================================="

# 检查 Docker 是否运行
if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
    echo "错误：PostgreSQL 容器未运行"
    exit 1
fi

# 创建备份文件
BACKUP_FILE="$BACKUP_DIR/db_${DB_NAME}_${DATE}.sql.gz"
echo "开始备份数据库：$DB_NAME"

docker exec -t "$POSTGRES_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" | gzip > "$BACKUP_FILE"

# 验证备份
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ 备份成功：$BACKUP_FILE (大小：$BACKUP_SIZE)"
else
    echo "❌ 备份失败"
    exit 1
fi

# 清理旧备份（保留最近 7 天）
echo "清理 ${RETENTION_DAYS} 天前的旧备份..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
REMAINING=$(ls -1 "$BACKUP_DIR"/db_*.sql.gz 2>/dev/null | wc -l)
echo "剩余备份数量：$REMAINING"

# 创建 Redis 备份
echo ""
echo "开始备份 Redis 数据..."
REDIS_CONTAINER="iot-redis"
REDIS_BACKUP="$BACKUP_DIR/redis_${DATE}.rdb"

if docker ps | grep -q "$REDIS_CONTAINER"; then
    # 触发 Redis 保存
    docker exec "$REDIS_CONTAINER" redis-cli BGSAVE

    # 等待保存完成
    sleep 2

    # 复制 RDB 文件
    if docker exec "$REDIS_CONTAINER" test -f /data/dump.rdb; then
        docker cp "$REDIS_CONTAINER":/data/dump.rdb "$REDIS_BACKUP"
        echo "✅ Redis 备份成功：$REDIS_BACKUP"
    else
        echo "⚠️ Redis RDB 文件不存在，跳过"
    fi
else
    echo "⚠️ Redis 容器未运行，跳过备份"
fi

echo ""
echo "========================================="
echo "备份完成"
echo "========================================="

# 列出最近的备份
echo ""
echo "最近的备份:"
ls -lht "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -5 || echo "无备份文件"
