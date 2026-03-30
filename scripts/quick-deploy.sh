#!/bin/bash
# 快速部署脚本 - 重建后端容器应用最新代码
# 在服务器上执行：cd /opt/iot && sudo ./scripts/quick-deploy.sh

set -e

cd /opt/iot

echo "========================================="
echo "IoT 平台快速部署"
echo "时间：$(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# 拉取最新代码
echo "1. 拉取最新代码..."
sudo git pull origin main

# 重建后端容器
echo "2. 重建后端容器..."
sudo docker compose -f docker-compose.prod.yml build backend --no-cache

# 重启后端服务
echo "3. 重启后端服务..."
sudo docker compose -f docker-compose.prod.yml up -d backend

# 等待容器启动
echo "4. 等待容器启动..."
sleep 5

# 运行数据库迁移
echo "5. 运行数据库迁移..."
sudo docker exec iot-backend npx prisma migrate deploy

# 验证服务状态
echo "6. 验证服务状态..."
sudo docker compose -f docker-compose.prod.yml ps

# 健康检查
echo "7. 健康检查..."
curl -s http://localhost/health && echo " - API正常" || echo "API异常"

echo ""
echo "========================================="
echo "部署完成"
echo "========================================="
echo ""
echo "验证步骤："
echo "1. 访问 https://www.jxbonner.cloud 查看仪表盘"
echo "2. 查看设备列表是否显示已连接的设备"
echo "3. 查看后端日志: sudo docker logs iot-backend --tail 50"
echo ""