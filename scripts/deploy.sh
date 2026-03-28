#!/bin/bash
#
# IoT平台生产环境一键部署脚本
# 支持蓝绿部署、自动备份、健康检查、自动回滚
#
# 用法: deploy.sh <command> [options]
#
# 命令:
#   deploy      执行部署
#   rollback    回滚到指定版本
#   status      查看服务状态
#   health      健康检查
#
# 选项:
#   --dry-run           模拟运行，不执行实际操作
#   --blue-green        启用蓝绿部署
#   --target <env>      指定目标环境 (blue/green)
#   --version <tag>     指定部署版本
#   --skip-tests        跳过测试
#   --backup-dir <dir>  备份目录
#   --retention <days>  备份保留天数
#   --log-dir <dir>     日志目录
#   --log-level <level> 日志级别 (debug/info/warn/error)
#   --notify <webhook>  通知webhook地址
#   --wechat-webhook <url> 企业微信webhook
#   --timeout <seconds> 超时时间
#   --config <file>     配置文件路径
#   --verify-health     部署后验证健康状态
#   --verify-script <path> 自定义验证脚本
#   --verbose           详细输出
#   --quiet             静默模式
#   --color             启用彩色输出
#   --no-color          禁用彩色输出
#   --json              JSON格式输出
#   -h, --help          显示帮助信息

set -euo pipefail

# ===========================================
# 全局配置
# ===========================================
readonly SCRIPT_NAME=$(basename "$0")
readonly SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
readonly PROJECT_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

# 默认配置
BACKUP_DIR="${BACKUP_DIR:-/opt/iot/backups}"
LOG_DIR="${LOG_DIR:-/var/log/iot}"
LOG_LEVEL="${LOG_LEVEL:-info}"
LOG_FILE=""
RETENTION_DAYS=7
TIMEOUT=300
DRY_RUN=false
VERBOSE=false
QUIET=false
USE_COLOR=true
JSON_OUTPUT=false
BLUE_GREEN_ENABLED=false
BLUE_GREEN_TARGET=""
SKIP_TESTS=true  # 生产部署默认跳过测试（测试应在CI中运行）
VERIFY_HEALTH=false
VERIFY_SCRIPT=""
DEPLOY_VERSION="latest"
NOTIFY_WEBHOOK=""
WECHAT_WEBHOOK=""
CONFIG_FILE=""
COMMAND=""  # 存储解析后的命令

# 服务列表
SERVICES=("backend" "admin-web" "postgres" "redis" "emqx" "nginx")
HEALTH_ENDPOINTS=("backend:3000/health" "postgres:5432" "redis:6379")

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ===========================================
# 工具函数
# ===========================================

# 初始化颜色支持
init_colors() {
    if [[ ! -t 1 ]] || [[ "$USE_COLOR" == "false" ]]; then
        RED=''
        GREEN=''
        YELLOW=''
        BLUE=''
        CYAN=''
        NC=''
    fi
}

# 日志函数
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # 日志级别过滤
    local level_num=0
    case "$level" in
        debug) level_num=0 ;;
        info)  level_num=1 ;;
        warn)  level_num=2 ;;
        error) level_num=3 ;;
    esac

    local config_level_num=0
    case "$LOG_LEVEL" in
        debug) config_level_num=0 ;;
        info)  config_level_num=1 ;;
        warn)  config_level_num=2 ;;
        error) config_level_num=3 ;;
    esac

    if [[ $level_num -lt $config_level_num ]]; then
        return
    fi

    # 格式化输出
    local prefix=""
    case "$level" in
        debug) prefix="${CYAN}[DEBUG]" ;;
        info)  prefix="${GREEN}[INFO]" ;;
        warn)  prefix="${YELLOW}[WARN]" ;;
        error) prefix="${RED}[ERROR]" ;;
    esac

    local log_message="[$timestamp] $prefix ${NC}$message"

    # 控制台输出
    if [[ "$QUIET" != "true" ]]; then
        echo -e "$log_message"
    fi

    # 文件输出
    if [[ -n "$LOG_FILE" ]] && [[ -d "$(dirname "$LOG_FILE")" ]]; then
        echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    fi
}

log_debug() { log "debug" "$@"; }
log_info()  { log "info" "$@"; }
log_warn()  { log "warn" "$@"; }
log_error() { log "error" "$@"; }

# 显示帮助信息
show_help() {
    local exit_code="${1:-0}"
    cat << 'EOF'
IoT平台生产环境一键部署脚本

用法: deploy.sh <command> [options]

命令:
  deploy      执行部署
  rollback    回滚到指定版本
  status      查看服务状态
  health      健康检查

选项:
  --dry-run           模拟运行，不执行实际操作
  --blue-green        启用蓝绿部署
  --target <env>      指定目标环境 (blue/green)
  --version <tag>     指定部署版本
  --skip-tests        跳过测试
  --backup-dir <dir>  备份目录
  --retention <days>  备份保留天数
  --log-dir <dir>     日志目录
  --log-level <level> 日志级别 (debug/info/warn/error)
  --notify <webhook>  通知webhook地址
  --wechat-webhook <url> 企业微信webhook
  --timeout <seconds> 超时时间
  --config <file>     配置文件路径
  --verify-health     部署后验证健康状态
  --verify-script <path> 自定义验证脚本
  --verbose           详细输出
  --quiet             静默模式
  --color             启用彩色输出
  --no-color          禁用彩色输出
  --json              JSON格式输出
  -h, --help          显示帮助信息

示例:
  # 标准部署
  ./deploy.sh deploy --version v1.2.0

  # 蓝绿部署
  ./deploy.sh deploy --blue-green --target green

  # 回滚到上一版本
  ./deploy.sh rollback --previous

  # 查看状态
  ./deploy.sh status --json

  # 健康检查
  ./deploy.sh health --check-db --check-redis --check-api

EOF
    exit $exit_code
}

# 检查依赖
check_dependencies() {
    log_debug "检查依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或不在PATH中"
        return 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker 未运行或权限不足"
        return 1
    fi

    if ! command -v curl &> /dev/null; then
        log_warn "curl 未安装，部分健康检查功能可能受限"
    fi

    log_debug "依赖检查通过"
    return 0
}

# 加载配置文件
load_config() {
    if [[ -n "$CONFIG_FILE" ]] && [[ -f "$CONFIG_FILE" ]]; then
        log_info "加载配置文件: $CONFIG_FILE"
        source "$CONFIG_FILE"
    fi

    # 加载环境变量 - 使用set +u防止特殊字符问题
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        log_debug "加载环境变量文件: $PROJECT_ROOT/.env"
        set +u
        set -a
        source "$PROJECT_ROOT/.env"
        set +a
        set -u
    fi
}

# 解析命令行参数
parse_args() {
    local command=""

    if [[ $# -eq 0 ]]; then
        echo ""
        return 1
    fi

    # 检查第一个参数是否是有效命令
    case "$1" in
        deploy|rollback|status|health)
            command="$1"
            shift
            ;;
        *)
            echo "错误: 未知命令 '$1'" >&2
            echo "" >&2
            echo "有效命令: deploy, rollback, status, health" >&2
            echo "使用 -h 或 --help 查看帮助信息" >&2
            exit 1
            ;;
    esac

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --blue-green)
                BLUE_GREEN_ENABLED=true
                shift
                ;;
            --target)
                BLUE_GREEN_TARGET="$2"
                shift 2
                ;;
            --version)
                DEPLOY_VERSION="$2"
                shift 2
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --backup-dir)
                BACKUP_DIR="$2"
                shift 2
                ;;
            --retention)
                RETENTION_DAYS="$2"
                shift 2
                ;;
            --log-dir)
                LOG_DIR="$2"
                shift 2
                ;;
            --log-level)
                LOG_LEVEL="$2"
                shift 2
                ;;
            --notify)
                NOTIFY_WEBHOOK="$2"
                shift 2
                ;;
            --wechat-webhook)
                WECHAT_WEBHOOK="$2"
                shift 2
                ;;
            --timeout)
                TIMEOUT="$2"
                shift 2
                ;;
            --config)
                CONFIG_FILE="$2"
                shift 2
                ;;
            --verify-health)
                VERIFY_HEALTH=true
                shift
                ;;
            --verify-script)
                VERIFY_SCRIPT="$2"
                shift 2
                ;;
            --verbose|-v)
                VERBOSE=true
                LOG_LEVEL="debug"
                shift
                ;;
            --quiet|-q)
                QUIET=true
                shift
                ;;
            --color)
                USE_COLOR=true
                shift
                ;;
            --no-color)
                USE_COLOR=false
                shift
                ;;
            --json)
                JSON_OUTPUT=true
                shift
                ;;
            --check-db|--check-redis|--check-api|--wait|--previous|--fail-test)
                # 这些参数在具体命令中处理
                shift
                ;;
            --to)
                # rollback命令参数
                shift
                if [[ $# -gt 0 ]]; then
                    shift
                fi
                ;;
            -h|--help)
                # 帮助已经在上面处理了
                shift
                ;;
            *)
                # 初始化日志以记录错误
                init_colors
                mkdir -p "$LOG_DIR" 2>/dev/null || LOG_DIR="/tmp/iot-logs"
                mkdir -p "$LOG_DIR" 2>/dev/null
                LOG_FILE="$LOG_DIR/deploy.log"
                log_error "未知参数: $1"
                echo "使用 --help 查看帮助信息" >&2
                exit 1
                ;;
        esac
    done

    # 初始化颜色
    init_colors

    # 设置日志文件
    mkdir -p "$LOG_DIR" 2>/dev/null || LOG_DIR="/tmp/iot-logs"
    mkdir -p "$LOG_DIR" 2>/dev/null
    LOG_FILE="$LOG_DIR/deploy.log"

    # 设置全局命令变量
    COMMAND="$command"
}

# 发送通知
send_notification() {
    local status="$1"
    local message="$2"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 发送通知: $status - $message"
        return 0
    fi

    # 发送Webhook通知
    if [[ -n "$NOTIFY_WEBHOOK" ]]; then
        log_debug "发送Webhook通知到: $NOTIFY_WEBHOOK"
        curl -s -X POST "$NOTIFY_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$status\",\"message\":\"$message\",\"timestamp\":\"$(date -Iseconds)\"}" &>/dev/null || true
    fi

    # 发送企业微信通知
    if [[ -n "$WECHAT_WEBHOOK" ]]; then
        log_debug "发送企业微信通知到: $WECHAT_WEBHOOK"
        curl -s -X POST "$WECHAT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"msgtype\":\"markdown\",\"markdown\":{\"content\":\"## IoT部署通知\n\n**状态**: $status\n\n**信息**: $message\n\n**时间**: $(date '+%Y-%m-%d %H:%M:%S')\"}}" &>/dev/null || true
    fi
}

# ===========================================
# 部署相关函数
# ===========================================

# 执行测试
run_tests() {
    log_info "执行部署前测试..."

    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warn "已跳过测试"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟执行测试"
        return 0
    fi

    # 后端测试
    if [[ -f "$PROJECT_ROOT/backend/package.json" ]]; then
        log_debug "执行后端测试..."
        cd "$PROJECT_ROOT/backend"

        # 检查是否需要安装依赖
        if [[ ! -d "node_modules" ]]; then
            log_info "安装后端依赖..."
            npm ci --only=production 2>/dev/null || npm install --production
        fi

        if npm test; then
            log_info "后端测试通过"
        else
            log_error "后端测试失败"
            return 1
        fi
    fi

    # 前端测试
    if [[ -f "$PROJECT_ROOT/admin-web/package.json" ]]; then
        log_debug "执行前端测试..."
        cd "$PROJECT_ROOT/admin-web"

        # 检查是否需要安装依赖
        if [[ ! -d "node_modules" ]]; then
            log_info "安装前端依赖..."
            npm ci 2>/dev/null || npm install
        fi

        if npm run test; then
            log_info "前端测试通过"
        else
            log_error "前端测试失败"
            return 1
        fi
    fi

    cd "$PROJECT_ROOT"
    log_info "所有测试通过"
    return 0
}

# 创建备份
create_backup() {
    local version="$1"
    local backup_name="backup_${version}_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"

    log_info "创建部署备份: $backup_name"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟创建备份: $backup_path"
        return 0
    fi

    mkdir -p "$backup_path"

    # 备份Docker镜像版本
    for service in "${SERVICES[@]}"; do
        local container_name="iot-$service"
        if docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
            local image=$(docker inspect --format='{{.Config.Image}}' "$container_name" 2>/dev/null || echo "unknown")
            echo "$image" > "$backup_path/${service}_image.txt"
            log_debug "备份 $service 镜像: $image"
        fi
    done

    # 备份配置文件
    if [[ -f "$PROJECT_ROOT/.env" ]]; then
        cp "$PROJECT_ROOT/.env" "$backup_path/.env.backup"
    fi

    if [[ -f "$PROJECT_ROOT/docker-compose.prod.yml" ]]; then
        cp "$PROJECT_ROOT/docker-compose.prod.yml" "$backup_path/docker-compose.prod.yml.backup"
    fi

    # 记录备份元信息
    echo "{\"version\":\"$version\",\"timestamp\":\"$(date -Iseconds)\",\"backup_name\":\"$backup_name\"}" > "$backup_path/metadata.json"

    log_info "备份创建完成: $backup_path"

    # 清理旧备份
    cleanup_old_backups

    return 0
}

# 清理旧备份
cleanup_old_backups() {
    log_debug "清理超过 $RETENTION_DAYS 天的旧备份..."

    if [[ "$DRY_RUN" == "true" ]]; then
        return 0
    fi

    local count=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" -mtime +${RETENTION_DAYS} 2>/dev/null | wc -l)
    if [[ $count -gt 0 ]]; then
        find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" -mtime +${RETENTION_DAYS} -exec rm -rf {} \;
        log_info "清理了 $count 个旧备份"
    fi
}

# 蓝绿部署准备
prepare_blue_green() {
    local target="${BLUE_GREEN_TARGET:-green}"

    log_info "准备蓝绿部署，目标环境: $target"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟准备蓝绿环境"
        return 0
    fi

    # 检查当前活跃环境
    local current_env=$(get_active_blue_green_env)
    log_debug "当前活跃环境: $current_env"

    # 设置目标环境变量
    export COMPOSE_PROJECT_NAME="iot_${target}"

    log_info "蓝绿环境准备完成"
    return 0
}

# 获取当前活跃的蓝绿环境
get_active_blue_green_env() {
    if docker ps --format "{{.Names}}" | grep -q "iot_blue_"; then
        echo "blue"
    elif docker ps --format "{{.Names}}" | grep -q "iot_green_"; then
        echo "green"
    else
        echo "blue"
    fi
}

# 拉取镜像
pull_images() {
    log_info "拉取最新镜像..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟拉取镜像"
        return 0
    fi

    cd "$PROJECT_ROOT"

    if docker compose -f docker-compose.prod.yml pull; then
        log_info "镜像拉取完成"
        return 0
    else
        log_error "镜像拉取失败"
        return 1
    fi
}

# 构建镜像
build_images() {
    log_info "构建镜像..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟构建镜像"
        return 0
    fi

    cd "$PROJECT_ROOT"

    if docker compose -f docker-compose.prod.yml build --no-cache; then
        log_info "镜像构建完成"
        return 0
    else
        log_error "镜像构建失败"
        return 1
    fi
}

# 部署服务
deploy_services() {
    log_info "部署服务..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟部署服务"
        return 0
    fi

    cd "$PROJECT_ROOT"

    local compose_flags=""
    if [[ "$BLUE_GREEN_ENABLED" == "true" ]]; then
        compose_flags="-p iot_${BLUE_GREEN_TARGET:-green}"
    fi

    # 停止旧容器
    log_debug "停止旧容器..."
    docker compose -f docker-compose.prod.yml $compose_flags down --remove-orphans || true

    # 启动新容器
    log_debug "启动新容器..."
    if docker compose -f docker-compose.prod.yml $compose_flags up -d; then
        log_info "服务部署完成"
        return 0
    else
        log_error "服务部署失败"
        return 1
    fi
}

# 部署后验证
verify_deployment() {
    log_info "验证部署..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟验证部署"
        return 0
    fi

    # 等待服务启动
    log_debug "等待服务启动..."
    sleep 10

    # 检查容器状态
    local failed_containers=()
    for service in "${SERVICES[@]}"; do
        local container_name="iot-$service"
        if ! docker ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
            failed_containers+=("$service")
        fi
    done

    if [[ ${#failed_containers[@]} -gt 0 ]]; then
        log_error "以下容器启动失败: ${failed_containers[*]}"
        return 1
    fi

    # 健康检查
    if [[ "$VERIFY_HEALTH" == "true" ]]; then
        if ! check_all_health; then
            log_error "健康检查失败"
            return 1
        fi
    fi

    # 自定义验证脚本
    if [[ -n "$VERIFY_SCRIPT" ]] && [[ -x "$VERIFY_SCRIPT" ]]; then
        log_debug "执行自定义验证脚本: $VERIFY_SCRIPT"
        if ! "$VERIFY_SCRIPT"; then
            log_error "自定义验证脚本执行失败"
            return 1
        fi
    fi

    log_info "部署验证通过"
    return 0
}

# 执行回滚
do_rollback() {
    local target_version="$1"

    log_info "执行回滚到版本: $target_version"

    # 干运行模式提前返回
    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 模拟回滚到版本: $target_version"
        return 0
    fi

    # 查找备份
    local backup_path=""
    if [[ -n "$target_version" ]] && [[ "$target_version" != "previous" ]]; then
        backup_path=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_${target_version}*" | head -1)
    else
        # 回滚到上一版本
        backup_path=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "backup_*" | sort -r | sed -n '2p')
    fi

    if [[ -z "$backup_path" ]] || [[ ! -d "$backup_path" ]]; then
        log_error "未找到备份: $target_version"
        return 1
    fi

    log_info "使用备份: $backup_path"

    # 恢复配置
    if [[ -f "$backup_path/.env.backup" ]]; then
        cp "$backup_path/.env.backup" "$PROJECT_ROOT/.env"
        log_info "已恢复环境配置"
    fi

    if [[ -f "$backup_path/docker-compose.prod.yml.backup" ]]; then
        cp "$backup_path/docker-compose.prod.yml.backup" "$PROJECT_ROOT/docker-compose.prod.yml"
        log_info "已恢复docker-compose配置"
    fi

    # 恢复镜像版本并重启
    cd "$PROJECT_ROOT"
    docker compose -f docker-compose.prod.yml down
    docker compose -f docker-compose.prod.yml up -d

    log_info "回滚完成"
    return 0
}

# ===========================================
# 健康检查函数
# ===========================================

# 检查数据库健康
check_database_health() {
    log_debug "检查数据库健康状态..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] 数据库健康检查通过"
        return 0
    fi

    if docker exec iot-postgres pg_isready -U "${DB_USER:-postgres}" &>/dev/null; then
        log_debug "数据库连接正常"
        return 0
    else
        log_error "数据库连接失败"
        return 1
    fi
}

# 检查Redis健康
check_redis_health() {
    log_debug "检查Redis健康状态..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] Redis健康检查通过"
        return 0
    fi

    if docker exec iot-redis redis-cli ping &>/dev/null | grep -q "PONG"; then
        log_debug "Redis连接正常"
        return 0
    else
        log_error "Redis连接失败"
        return 1
    fi
}

# 检查后端API健康
check_api_health() {
    log_debug "检查后端API健康状态..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log_debug "[DRY-RUN] API健康检查通过"
        return 0
    fi

    local api_url="http://localhost:3000/health"

    if command -v curl &>/dev/null; then
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$api_url" 2>/dev/null || echo "000")
        if [[ "$response" == "200" ]]; then
            log_debug "API健康检查通过"
            return 0
        fi
    fi

    # 尝试通过docker检查
    if docker exec iot-backend curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null | grep -q "200"; then
        log_debug "API健康检查通过"
        return 0
    fi

    log_error "API健康检查失败"
    return 1
}

# 检查所有服务健康
check_all_health() {
    log_info "检查所有服务健康状态..."

    local failed=0

    if ! check_database_health; then
        failed=$((failed + 1))
    fi

    if ! check_redis_health; then
        failed=$((failed + 1))
    fi

    if ! check_api_health; then
        failed=$((failed + 1))
    fi

    if [[ $failed -gt 0 ]]; then
        log_error "健康检查失败: $failed 个服务异常"
        return 1
    fi

    log_info "所有服务健康"
    return 0
}

# 等待健康状态
wait_for_health() {
    local timeout="${TIMEOUT:-300}"
    local interval=5
    local elapsed=0

    log_info "等待服务健康 (超时: ${timeout}秒)..."

    while [[ $elapsed -lt $timeout ]]; do
        if check_all_health; then
            log_info "所有服务已就绪"
            return 0
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
        log_debug "等待中... (${elapsed}/${timeout}秒)"
    done

    log_error "等待超时，服务未就绪"
    return 1
}

# ===========================================
# 状态查看函数
# ===========================================

# 获取服务状态
get_service_status() {
    local service="$1"
    local container_name="iot-$service"

    local status=$(docker ps --filter "name=^${container_name}$" --format "{{.Status}}" 2>/dev/null)
    local state="stopped"

    if [[ -n "$status" ]]; then
        if echo "$status" | grep -q "Up"; then
            state="running"
        else
            state="stopped"
        fi
    fi

    echo "{\"service\":\"$service\",\"state\":\"$state\",\"status\":\"$status\"}"
}

# 显示所有服务状态
show_status() {
    log_info "获取服务状态..."

    if ! check_dependencies; then
        return 1
    fi

    if [[ "$JSON_OUTPUT" == "true" ]]; then
        echo -n "{\"services\":["
        local first=true
        for service in "${SERVICES[@]}"; do
            if [[ "$first" == "true" ]]; then
                first=false
            else
                echo -n ","
            fi
            get_service_status "$service"
        done
        echo "],\"timestamp\":\"$(date -Iseconds)\"}"
    else
        echo "========================================="
        echo "IoT 服务状态"
        echo "========================================="
        echo ""

        printf "%-15s %-15s %s\n" "服务" "状态" "详情"
        printf "%-15s %-15s %s\n" "-------" "-------" "-------"

        for service in "${SERVICES[@]}"; do
            local status=$(docker ps --filter "name=^iot-$service$" --format "{{.Status}}" 2>/dev/null || echo "N/A")
            local state=""

            if [[ -n "$status" ]]; then
                if echo "$status" | grep -q "Up"; then
                    state="${GREEN}运行中${NC}"
                else
                    state="${RED}已停止${NC}"
                fi
            else
                state="${YELLOW}未部署${NC}"
            fi

            printf "%-15s " "$service"
            echo -e "$state"
        done

        echo ""

        # 蓝绿状态
        if [[ "$BLUE_GREEN_ENABLED" == "true" ]] || docker ps --format "{{.Names}}" | grep -q "iot_\(blue\|green\)"; then
            local active_env=$(get_active_blue_green_env)
            echo "蓝绿部署状态:"
            echo "  当前活跃环境: $active_env"
            echo ""
        fi

        echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "========================================="
    fi

    return 0
}

# ===========================================
# 主命令函数
# ===========================================

# 部署命令
cmd_deploy() {
    log_info "开始部署流程..."
    log_info "版本: $DEPLOY_VERSION"
    log_info "蓝绿部署: $BLUE_GREEN_ENABLED"
    log_info "干运行模式: $DRY_RUN"

    # 检查依赖
    if ! check_dependencies; then
        return 1
    fi

    # 加载配置
    load_config

    # 执行测试
    if ! run_tests; then
        log_error "测试失败，部署中止"
        send_notification "failed" "部署测试失败"
        return 1
    fi

    # 创建备份
    if ! create_backup "$DEPLOY_VERSION"; then
        log_error "备份失败，部署中止"
        return 1
    fi

    # 蓝绿部署准备
    if [[ "$BLUE_GREEN_ENABLED" == "true" ]]; then
        if ! prepare_blue_green; then
            log_error "蓝绿部署准备失败"
            return 1
        fi
    fi

    # 拉取/构建镜像
    if ! pull_images; then
        log_error "镜像拉取失败"
        return 1
    fi

    if ! build_images; then
        log_error "镜像构建失败"
        do_rollback "previous"
        return 1
    fi

    # 部署服务
    if ! deploy_services; then
        log_error "服务部署失败，执行回滚"
        do_rollback "previous"
        send_notification "failed" "服务部署失败，已回滚"
        return 1
    fi

    # 验证部署
    if ! verify_deployment; then
        log_error "部署验证失败，执行回滚"
        do_rollback "previous"
        send_notification "failed" "部署验证失败，已回滚"
        return 1
    fi

    log_info "部署完成"
    send_notification "success" "部署成功完成，版本: $DEPLOY_VERSION"

    return 0
}

# 回滚命令
cmd_rollback() {
    local target_version=""

    # 解析额外参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --to)
                target_version="$2"
                shift 2
                ;;
            --previous)
                target_version="previous"
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    log_info "开始回滚..."
    log_info "目标版本: ${target_version:-latest}"

    # 检查依赖
    if ! check_dependencies; then
        return 1
    fi

    # 检查备份是否存在
    if [[ "$DRY_RUN" != "true" ]]; then
        if [[ ! -d "$BACKUP_DIR" ]] || [[ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]]; then
            log_error "备份目录为空或不存在: $BACKUP_DIR"
            return 1
        fi
    fi

    # 执行回滚
    if ! do_rollback "$target_version"; then
        log_error "回滚失败"
        send_notification "failed" "回滚失败"
        return 1
    fi

    log_info "回滚完成"
    send_notification "success" "回滚成功完成"

    return 0
}

# 状态命令
cmd_status() {
    # 解析额外参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --blue-green)
                BLUE_GREEN_ENABLED=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    show_status
}

# 健康检查命令
cmd_health() {
    local check_db=false
    local check_redis=false
    local check_api=false
    local wait_mode=false

    # 解析额外参数
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --check-db)
                check_db=true
                shift
                ;;
            --check-redis)
                check_redis=true
                shift
                ;;
            --check-api)
                check_api=true
                shift
                ;;
            --wait)
                wait_mode=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    log_info "执行健康检查..."

    # 检查依赖
    if ! check_dependencies; then
        return 1
    fi

    # 等待模式
    if [[ "$wait_mode" == "true" ]]; then
        if ! wait_for_health; then
            return 1
        fi
    fi

    local failed=0

    if [[ "$check_db" == "true" ]] || [[ "$check_db" != "true" && "$check_redis" != "true" && "$check_api" != "true" ]]; then
        if ! check_database_health; then
            failed=$((failed + 1))
        fi
    fi

    if [[ "$check_redis" == "true" ]] || [[ "$check_db" != "true" && "$check_redis" != "true" && "$check_api" != "true" ]]; then
        if ! check_redis_health; then
            failed=$((failed + 1))
        fi
    fi

    if [[ "$check_api" == "true" ]] || [[ "$check_db" != "true" && "$check_redis" != "true" && "$check_api" != "true" ]]; then
        if ! check_api_health; then
            failed=$((failed + 1))
        fi
    fi

    echo ""
    if [[ $failed -gt 0 ]]; then
        echo -e "${RED}健康检查失败: $failed 个服务异常${NC}"
        return 1
    else
        echo -e "${GREEN}所有服务健康${NC}"
        return 0
    fi
}

# ===========================================
# 主入口
# ===========================================

main() {
    local command

    # 先检查是否是帮助请求（不使用子shell）
    case "${1:-}" in
        -h|--help|help)
            show_full_help
            ;;
        "")
            show_usage_error
            ;;
    esac

    # 解析参数（直接调用，不使用子shell）
    parse_args "$@"
    local parse_status=$?

    if [[ $parse_status -ne 0 ]]; then
        exit 1
    fi

    # 执行命令
    case "$COMMAND" in
        deploy)
            cmd_deploy
            ;;
        rollback)
            cmd_rollback "$@"
            ;;
        status)
            cmd_status "$@"
            ;;
        health)
            cmd_health "$@"
            ;;
        *)
            log_error "未知命令: $COMMAND"
            exit 1
            ;;
    esac
}

# 显示完整帮助信息
show_full_help() {
    cat << 'HELP_EOF'
IoT平台生产环境一键部署脚本

用法: deploy.sh <command> [options]

命令:
  deploy      执行部署
  rollback    回滚到指定版本
  status      查看服务状态
  health      健康检查

选项:
  --dry-run           模拟运行，不执行实际操作
  --blue-green        启用蓝绿部署
  --target <env>      指定目标环境 (blue/green)
  --version <tag>     指定部署版本
  --skip-tests        跳过测试
  --backup-dir <dir>  备份目录
  --retention <days>  备份保留天数
  --log-dir <dir>     日志目录
  --log-level <level> 日志级别 (debug/info/warn/error)
  --notify <webhook>  通知webhook地址
  --wechat-webhook <url> 企业微信webhook
  --timeout <seconds> 超时时间
  --config <file>     配置文件路径
  --verify-health     部署后验证健康状态
  --verify-script <path> 自定义验证脚本
  --verbose           详细输出
  --quiet             静默模式
  --color             启用彩色输出
  --no-color          禁用彩色输出
  --json              JSON格式输出
  -h, --help          显示帮助信息

示例:
  # 标准部署
  ./deploy.sh deploy --version v1.2.0

  # 蓝绿部署
  ./deploy.sh deploy --blue-green --target green

  # 回滚到上一版本
  ./deploy.sh rollback --previous

  # 查看状态
  ./deploy.sh status --json

  # 健康检查
  ./deploy.sh health --check-db --check-redis --check-api
HELP_EOF
    exit 0
}

# 显示用法错误
show_usage_error() {
    echo "错误: 请指定命令" >&2
    echo "" >&2
    echo "有效命令: deploy, rollback, status, health" >&2
    echo "使用 -h 或 --help 查看帮助信息" >&2
    exit 1
}

# 运行主函数
main "$@"