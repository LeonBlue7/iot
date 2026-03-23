#!/bin/bash
# 数据库恢复脚本
# 用法：./restore.sh <backup_file.sql.gz>

set -e

if [ -z "$1" ]; then
    echo "用法：./restore.sh <backup_file.sql.gz>"
    echo ""
    echo "可用的备份文件:"
    ls -lht /opt/iot/backups/*.sql.gz 2>/dev/null | head -10 || echo "无备份文件"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${DB_NAME:-iot_db}"
DB_USER="${DB_USER:-iot_user}"
POSTGRES_CONTAINER="iot-postgres"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误：备份文件不存在：$BACKUP_FILE"
    exit 1
fi

echo "========================================="
echo "⚠️  警告：即将恢复数据库"
echo "========================================="
echo "备份文件：$BACKUP_FILE"
echo "数据库：$DB_NAME"
echo ""
read -p "确认继续？(yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "取消恢复"
    exit 0
fi

echo "开始恢复数据库..."

# 解压并恢复
gunzip -c "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME"

echo "✅ 数据库恢复完成"
echo ""
echo "建议操作:"
echo "1. 验证数据是否正确恢复"
echo "2. 重启应用服务以确保缓存更新"
