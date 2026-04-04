#!/bin/bash
# 生产环境迁移修复脚本（完整版）
# 解决FK约束顺序问题，包含备份和验证

set -e

# 错误处理
error_handler() {
    echo "❌ 错误发生在第 $1 行"
    echo "请检查日志并手动修复"
    exit 1
}
trap 'error_handler $LINENO' ERR

echo "=== 生产环境数据库迁移修复 ==="

COMPOSE_FILE="docker-compose.prod.yml"
DB_CONTAINER="iot-postgres"
DB_USER="iot_user"
DB_NAME="iot_db"
SQL_FILE="backend/prisma/fix-production-migration.sql"
LOCK_FILE="/tmp/iot-migration.lock"

# 0. 检查锁文件，防止并发执行
if [ -f "$LOCK_FILE" ]; then
    echo "❌ 另一个迁移进程正在运行"
    exit 1
fi
touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# 1. 验证前置条件
echo "1. 验证前置条件..."

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL 文件不存在: $SQL_FILE"
    exit 1
fi

if ! docker compose -f $COMPOSE_FILE ps postgres 2>/dev/null | grep -q "Up"; then
    echo "❌ 数据库容器未运行"
    exit 1
fi

echo "✅ 前置条件验证通过"

# 2. 创建数据库备份
echo "2. 创建数据库备份..."
BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
docker compose -f $COMPOSE_FILE exec -T postgres pg_dump -U $DB_USER $DB_NAME > "$BACKUP_FILE"
echo "✅ 备份已保存到: $BACKUP_FILE"

# 3. 删除失败的迁移记录
echo "3. 清理失败的迁移记录..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d $DB_NAME -c \
    "DELETE FROM _prisma_migrations WHERE migration_name = '20260330_add_hierarchy_models';"
echo "✅ 迁移记录已清理"

# 4. 复制SQL文件到容器
echo "4. 复制SQL文件到容器..."
docker cp "$SQL_FILE" "${DB_CONTAINER}:/tmp/fix.sql"
echo "✅ SQL文件已复制"

# 5. 执行修复SQL
echo "5. 执行修复SQL..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d $DB_NAME -f /tmp/fix.sql
echo "✅ SQL执行完成"

# 6. 标记迁移为已完成
echo "6. 标记迁移为已完成..."
docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d $DB_NAME -c \
    "INSERT INTO _prisma_migrations (id, migration_name, started_at, finished_at, logs)
     VALUES (gen_random_uuid(), '20260330_add_hierarchy_models', NOW(), NOW(), 'Applied via fix script');"
echo "✅ 迁移已标记完成"

# 7. 运行后续迁移
echo "7. 运行后续迁移..."
docker compose -f $COMPOSE_FILE exec -T backend npx prisma migrate deploy
echo "✅ 后续迁移完成"

# 8. 重启后端服务
echo "8. 重启后端服务..."
docker compose -f $COMPOSE_FILE restart backend
echo "✅ 后端服务已重启"

# 9. 验证结果
echo ""
echo "=== 验证结果 ==="

echo "数据库表列表:"
docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d $DB_NAME -c \
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"

echo ""
echo "最近迁移状态:"
docker compose -f $COMPOSE_FILE exec -T postgres psql -U $DB_USER -d $DB_NAME -c \
    "SELECT migration_name, finished_at FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 5;"

echo ""
echo "=== ✅ 迁移修复完成 ==="
echo "备份文件: $BACKUP_FILE"