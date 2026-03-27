#!/usr/bin/env bats
# -*- coding: utf-8 -*-
#
# deploy.sh 测试套件
# 测试生产环境一键部署脚本的所有功能

# 测试环境设置
setup() {
    export SCRIPT_DIR="$(cd "$(dirname "$BATS_TEST_FILENAME")/../.." && pwd)/scripts"
    export DEPLOY_SCRIPT="$SCRIPT_DIR/deploy.sh"
    export TEST_DIR="$(mktemp -d)"
}

# 测试环境清理
teardown() {
    if [[ -d "$TEST_DIR" ]]; then
        rm -rf "$TEST_DIR"
    fi
}

# ===========================================
# 基础功能测试
# ===========================================

@test "deploy.sh 脚本存在且可执行" {
    [ -f "$DEPLOY_SCRIPT" ]
    [ -x "$DEPLOY_SCRIPT" ]
}

@test "deploy.sh --help 显示帮助信息并退出码为0" {
    run "$DEPLOY_SCRIPT" --help
    [ "$status" -eq 0 ]
    [[ "$output" == *"用法"* ]] || [[ "$output" == *"命令"* ]]
}

@test "deploy.sh -h 显示帮助信息并退出码为0" {
    run "$DEPLOY_SCRIPT" -h
    [ "$status" -eq 0 ]
    [[ "$output" == *"用法"* ]] || [[ "$output" == *"命令"* ]]
}

@test "deploy.sh help 显示帮助信息并退出码为0" {
    run "$DEPLOY_SCRIPT" help
    [ "$status" -eq 0 ]
    [[ "$output" == *"用法"* ]] || [[ "$output" == *"命令"* ]]
}

@test "deploy.sh 无参数时显示错误并退出码为1" {
    run "$DEPLOY_SCRIPT"
    [ "$status" -eq 1 ]
    [[ "$output" == *"错误"* ]] || [[ "$output" == *"请指定"* ]]
}

@test "deploy.sh 无效子命令时返回错误退出码1" {
    run "$DEPLOY_SCRIPT" invalid_command_xyz
    [ "$status" -eq 1 ]
    [[ "$output" == *"未知"* ]] || [[ "$output" == *"无效"* ]]
}

# ===========================================
# status 子命令测试
# ===========================================

@test "status 子命令: 执行成功并显示服务状态" {
    run "$DEPLOY_SCRIPT" status --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
    [[ "$output" == *"服务"* ]] || [[ "$output" == *"状态"* ]]
}

@test "status 子命令: 支持--json输出" {
    run "$DEPLOY_SCRIPT" status --json --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
    [[ "$output" == *"services"* ]] || [[ "$output" == *"{"* ]]
}

@test "status 子命令: 支持--verbose输出" {
    run "$DEPLOY_SCRIPT" status --verbose --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "status 子命令: 支持--no-color输出" {
    run "$DEPLOY_SCRIPT" status --no-color --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "status 子命令: 支持--quiet输出" {
    run "$DEPLOY_SCRIPT" status --quiet --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

# ===========================================
# health 子命令测试
# ===========================================

@test "health 子命令: 执行健康检查" {
    run "$DEPLOY_SCRIPT" health --log-dir "$TEST_DIR"
    # 健康检查可能失败但命令应执行
    [[ "$output" == *"健康"* ]] || [[ "$output" == *"检查"* ]] || [[ "$output" == *"Docker"* ]]
}

# ===========================================
# rollback 子命令测试 (dry-run)
# ===========================================

@test "rollback 子命令: --dry-run模式执行成功" {
    run "$DEPLOY_SCRIPT" rollback --dry-run --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
    [[ "$output" == *"dry-run"* ]] || [[ "$output" == *"模拟"* ]] || [[ "$output" == *"回滚"* ]]
}

# ===========================================
# 参数验证测试
# ===========================================

@test "参数验证: --log-dir参数有效" {
    run "$DEPLOY_SCRIPT" status --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "参数验证: --log-level debug参数有效" {
    run "$DEPLOY_SCRIPT" status --log-level debug --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "参数验证: --retention参数有效" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --retention 14 --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "参数验证: --version参数有效" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --version v1.0.0 --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "参数验证: --backup-dir参数有效" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --backup-dir "$TEST_DIR" --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

# ===========================================
# 蓝绿部署参数测试
# ===========================================

@test "蓝绿部署: 支持--blue-green参数" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --blue-green --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "蓝绿部署: 支持--target参数" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --blue-green --target green --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

# ===========================================
# 通知参数测试
# ===========================================

@test "通知功能: 支持--notify参数" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --notify "http://example.com/webhook" --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "通知功能: 支持--wechat-webhook参数" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --wechat-webhook "http://example.com/webhook" --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

# ===========================================
# 部署参数测试
# ===========================================

@test "部署选项: 支持--skip-tests参数" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --skip-tests --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "部署选项: 支持--verify-health参数" {
    run "$DEPLOY_SCRIPT" deploy --dry-run --verify-health --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

@test "部署选项: 支持自定义验证脚本" {
    cat > "$TEST_DIR/verify.sh" << 'EOF'
#!/bin/bash
exit 0
EOF
    chmod +x "$TEST_DIR/verify.sh"

    run "$DEPLOY_SCRIPT" deploy --dry-run --verify-script "$TEST_DIR/verify.sh" --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

# ===========================================
# 配置文件测试
# ===========================================

@test "配置文件: 支持--config参数" {
    cat > "$TEST_DIR/config.conf" << 'EOF'
BACKUP_RETENTION_DAYS=14
EOF

    run "$DEPLOY_SCRIPT" status --config "$TEST_DIR/config.conf" --log-dir "$TEST_DIR"
    [ "$status" -eq 0 ]
}

# ===========================================
# 帮助信息完整性测试
# ===========================================

@test "帮助信息: 包含deploy命令" {
    run "$DEPLOY_SCRIPT" --help
    [[ "$output" == *"deploy"* ]]
}

@test "帮助信息: 包含rollback命令" {
    run "$DEPLOY_SCRIPT" --help
    [[ "$output" == *"rollback"* ]]
}

@test "帮助信息: 包含status命令" {
    run "$DEPLOY_SCRIPT" --help
    [[ "$output" == *"status"* ]]
}

@test "帮助信息: 包含health命令" {
    run "$DEPLOY_SCRIPT" --help
    [[ "$output" == *"health"* ]]
}

@test "帮助信息: 包含--dry-run选项" {
    run "$DEPLOY_SCRIPT" --help
    [[ "$output" == *"--dry-run"* ]]
}

@test "帮助信息: 包含--blue-green选项" {
    run "$DEPLOY_SCRIPT" --help
    [[ "$output" == *"--blue-green"* ]]
}

@test "帮助信息: 包含--version选项" {
    run "$DEPLOY_SCRIPT" --help
    [[ "$output" == *"--version"* ]]
}