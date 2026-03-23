#!/bin/bash
# 日志管理脚本
# 用法：./logs.sh [command]
# 命令：view, tail, search, clean, stats

set -e

LOG_DIR="${LOG_DIR:-/opt/iot/logs}"
BACKEND_LOG="$LOG_DIR/backend.log"
NGINX_LOG="$LOG_DIR/nginx/access.log"
ERROR_LOG="$LOG_DIR/nginx/error.log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
    echo "用法：./logs.sh [command]"
    echo ""
    echo "命令:"
    echo "  view        查看所有日志文件"
    echo "  tail        实时查看日志（默认 backend）"
    echo "  search      搜索日志关键字"
    echo "  clean       清理旧日志（30 天前）"
    echo "  stats       显示日志统计信息"
    echo "  size        显示日志文件大小"
    echo ""
    echo "示例:"
    echo "  ./logs.sh tail backend    # 实时查看后端日志"
    echo "  ./logs.sh search error    # 搜索包含 'error' 的日志"
    echo "  ./logs.sh clean           # 清理旧日志"
}

view_logs() {
    echo "日志文件列表:"
    ls -lht "$LOG_DIR"/*.log 2>/dev/null || echo "未找到日志文件"
    echo ""
    ls -lht "$LOG_DIR/nginx/"*.log 2>/dev/null || echo "未找到 Nginx 日志"
}

tail_logs() {
    local target="${1:-backend}"
    case "$target" in
        backend)
            tail -f "$BACKEND_LOG" 2>/dev/null || echo "后端日志不存在"
            ;;
        nginx|access)
            tail -f "$NGINX_LOG" 2>/dev/null || echo "Nginx 访问日志不存在"
            ;;
        error)
            tail -f "$ERROR_LOG" 2>/dev/null || echo "Nginx 错误日志不存在"
            ;;
        *)
            echo "未知目标：$target"
            echo "可用选项：backend, nginx, access, error"
            ;;
    esac
}

search_logs() {
    local keyword="$1"
    if [ -z "$keyword" ]; then
        echo "请指定搜索关键字"
        echo "用法：./logs.sh search <keyword>"
        exit 1
    fi

    echo "搜索关键字：$keyword"
    echo "========================================="

    if [ -f "$BACKEND_LOG" ]; then
        echo -e "${GREEN}后端日志:${NC}"
        grep -i "$keyword" "$BACKEND_LOG" | tail -20
    fi

    if [ -f "$NGINX_LOG" ]; then
        echo -e "${GREEN}Nginx 访问日志:${NC}"
        grep -i "$keyword" "$NGINX_LOG" | tail -20
    fi
}

clean_logs() {
    echo "清理 30 天前的日志文件..."
    find "$LOG_DIR" -name "*.log" -type f -mtime +30 -delete
    find "$LOG_DIR" -name "*.gz" -type f -mtime +30 -delete
    echo "清理完成"
}

show_stats() {
    echo "日志统计信息:"
    echo "========================================="

    if [ -f "$BACKEND_LOG" ]; then
        local lines=$(wc -l < "$BACKEND_LOG")
        local size=$(du -h "$BACKEND_LOG" | cut -f1)
        echo -e "${GREEN}后端日志:${NC} $lines 行，$size"
    fi

    if [ -f "$NGINX_LOG" ]; then
        local lines=$(wc -l < "$NGINX_LOG")
        local size=$(du -h "$NGINX_LOG" | cut -f1)
        echo -e "${GREEN}Nginx 访问日志:${NC} $lines 行，$size"
    fi

    if [ -f "$ERROR_LOG" ]; then
        local lines=$(wc -l < "$ERROR_LOG")
        local size=$(du -h "$ERROR_LOG" | cut -f1)
        echo -e "${GREEN}Nginx 错误日志:${NC} $lines 行，$size"
    fi
}

show_size() {
    echo "日志文件大小:"
    echo "========================================="
    du -sh "$LOG_DIR"/* 2>/dev/null || echo "未找到日志目录"
}

# 主逻辑
case "${1:-help}" in
    view)
        view_logs
        ;;
    tail)
        tail_logs "$2"
        ;;
    search)
        search_logs "$2"
        ;;
    clean)
        clean_logs
        ;;
    stats)
        show_stats
        ;;
    size)
        show_size
        ;;
    *)
        show_help
        ;;
esac
