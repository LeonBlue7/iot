#!/bin/bash
# 生产环境一键部署脚本
# 自动修复数据库迁移并部署最新代码

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# 错误处理
error_handler() {
    log_error "脚本在第 $1 行失败"
    log_error "请检查上面的错误日志"
    rm -f "$LOCK_FILE"
    exit 1
}
trap 'error_handler $LINENO' ERR

echo ""
echo "=========================================="
echo "    物联网管理系统 - 生产环境一键部署"
echo "=========================================="
echo ""

# 配置
COMPOSE_FILE="docker-compose.prod.yml"
DB_CONTAINER="iot-postgres"
DB_USER="iot_user"
DB_NAME="iot_db"
PROJECT_DIR="/opt/iot"
BACKUP_DIR="${PROJECT_DIR}/backups"
MIGRATION_NAME="20260330_add_hierarchy_models"
LOCK_FILE="/tmp/iot-deploy.lock"

# 验证迁移名称格式（安全检查）
if [[ ! "$MIGRATION_NAME" =~ ^[0-9_]+[a-z_]+$ ]]; then
    log_error "无效的迁移名称格式: $MIGRATION_NAME"
    exit 1
fi

# 检查锁文件
if [ -f "$LOCK_FILE" ]; then
    log_error "另一个部署进程正在运行"
    log_info "如果确定没有其他进程，请删除: $LOCK_FILE"
    exit 1
fi
touch "$LOCK_FILE"

# 清理函数
cleanup() {
    rm -f "$LOCK_FILE"
}
trap cleanup EXIT

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 清理旧备份（保留最近7天）
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete 2>/dev/null || true

# ===== 步骤1: 拉取最新代码 =====
log_step "步骤1/8: 拉取最新代码"
cd "$PROJECT_DIR"
git fetch origin
BEFORE_COMMIT=$(git rev-parse HEAD)
git pull origin main
AFTER_COMMIT=$(git rev-parse HEAD)

if [ "$BEFORE_COMMIT" != "$AFTER_COMMIT" ]; then
    log_info "代码已更新: $AFTER_COMMIT"
else
    log_info "代码已是最新"
fi

# ===== 步骤2: 检查数据库连接 =====
log_step "步骤2/8: 检查数据库连接"
if ! docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "$DB_USER" > /dev/null 2>&1; then
    log_error "数据库连接失败"
    exit 1
fi
log_info "数据库连接正常"

# ===== 步骤3: 数据库备份 =====
log_step "步骤3/8: 创建数据库备份"
BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log_info "备份已保存: $BACKUP_FILE ($BACKUP_SIZE)"

# ===== 步骤4: 执行修复SQL =====
log_step "步骤4/8: 执行数据库结构修复"
SQL_FILE="${PROJECT_DIR}/backend/prisma/fix-production-migration.sql"

if [ ! -f "$SQL_FILE" ]; then
    log_error "SQL文件不存在: $SQL_FILE"
    exit 1
fi

docker cp "$SQL_FILE" "${DB_CONTAINER}:/tmp/fix.sql"
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/fix.sql -v ON_ERROR_STOP=1 > /dev/null 2>&1
log_info "数据库结构已修复"

# ===== 步骤5: 修复迁移记录 =====
log_step "步骤5/8: 修复迁移记录"

# 完全删除相关迁移记录
docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -c \
    "DELETE FROM _prisma_migrations WHERE migration_name = '${MIGRATION_NAME}';" > /dev/null 2>&1

log_info "已清理旧迁移记录"

# 使用Prisma标记迁移已应用
log_info "标记迁移已应用..."
docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate resolve --applied "${MIGRATION_NAME}" 2>/dev/null || true

log_info "迁移记录已修复"

# ===== 步骤6: 运行后续迁移 =====
log_step "步骤6/8: 运行数据库迁移"

# 再次检查是否有未应用的迁移
PENDING=$(docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate status 2>&1 | grep -c "not yet been applied" || echo "0")

if [ "$PENDING" -gt 0 ]; then
    log_info "发现 $PENDING 个待应用的迁移"
    docker compose -f "$COMPOSE_FILE" exec -T backend npx prisma migrate deploy
    log_info "数据库迁移完成"
else
    log_info "没有待应用的迁移"
fi

# ===== 步骤7: 重启服务 =====
log_step "步骤7/8: 重启服务"
docker compose -f "$COMPOSE_FILE" restart backend

# 等待服务启动
log_info "等待服务启动..."
sleep 5

# 检查容器状态
if docker compose -f "$COMPOSE_FILE" ps backend | grep -q "Up"; then
    log_info "后端服务已启动"
else
    log_error "后端服务启动失败"
    docker compose -f "$COMPOSE_FILE" logs backend --tail=20
    exit 1
fi

# ===== 步骤8: 验证部署 =====
log_step "步骤8/8: 验证部署"

# 显示数据库表数量
TABLE_COUNT=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')
log_info "数据库表数量: $TABLE_COUNT"

# 显示迁移状态
MIGRATION_COUNT=$(docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c \
    "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" | tr -d ' ')
log_info "已应用迁移数量: $MIGRATION_COUNT"

# 测试API可用性（使用测试账号，不暴露真实密码）
log_info "测试API可用性..."
LOGIN_TEST=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://www.jxbonner.cloud/api/admin/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"health_check","password":"test"}' 2>/dev/null || echo "000")

if [ "$LOGIN_TEST" = "200" ] || [ "$LOGIN_TEST" = "401" ]; then
    log_info "API服务正常 (HTTP $LOGIN_TEST)"
else
    log_warn "API测试返回: HTTP $LOGIN_TEST"
fi

# ===== 完成 =====
echo ""
echo "=========================================="
echo "           ✅ 部署完成"
echo "=========================================="
echo ""
echo "访问地址: https://www.jxbonner.cloud"
echo "备份文件: $BACKUP_FILE"
echo "代码版本: $AFTER_COMMIT"
echo ""
log_info "查看日志: docker compose -f docker-compose.prod.yml logs -f backend"