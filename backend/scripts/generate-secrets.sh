#!/bin/bash
# 生成安全密钥脚本
# 用法：./scripts/generate-secrets.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

echo "正在生成安全密钥..."

# 生成 JWT_SECRET (64 字符)
JWT_SECRET=$(openssl rand -base64 64)

# 生成 DB_PASSWORD
DB_PASSWORD=$(openssl rand -base64 32)

# 生成 REDIS_PASSWORD
REDIS_PASSWORD=$(openssl rand -base64 32)

# 生成 EMQX_PASSWORD
EMQX_PASSWORD=$(openssl rand -base64 32)

# 检查 .env 文件是否存在
if [ -f "$ENV_FILE" ]; then
    echo "警告：.env 文件已存在，将更新密钥..."

    # 更新已存在的密钥
    if grep -q "^JWT_SECRET=" "$ENV_FILE"; then
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
    else
        echo "JWT_SECRET=$JWT_SECRET" >> "$ENV_FILE"
    fi

    if grep -q "^DB_PASSWORD=" "$ENV_FILE"; then
        sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" "$ENV_FILE"
    else
        echo "DB_PASSWORD=$DB_PASSWORD" >> "$ENV_FILE"
    fi

    if grep -q "^REDIS_PASSWORD=" "$ENV_FILE"; then
        sed -i "s|^REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|" "$ENV_FILE"
    else
        echo "REDIS_PASSWORD=$REDIS_PASSWORD" >> "$ENV_FILE"
    fi
else
    # 创建新的 .env 文件
    cat > "$ENV_FILE" << EOF
# 自动生成的安全配置
# 生成时间：$(date -Iseconds)

# JWT 认证
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h

# 数据库
DB_USER=iot_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=iot_db
DATABASE_URL="postgresql://\${DB_USER}:\${DB_PASSWORD}@localhost:5432/\${DB_NAME}?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD

# EMQX
EMQX_USERNAME=admin
EMQX_PASSWORD=$EMQX_PASSWORD

# 服务器
NODE_ENV=development
PORT=3000
EOF
fi

echo "密钥生成完成！"
echo ""
echo "⚠️  重要提示："
echo "1. 请妥善保管 .env 文件，不要提交到版本控制"
echo "2. 生产环境请使用不同的密钥"
echo "3. 建议将密钥存储在安全的密钥管理服务中"
