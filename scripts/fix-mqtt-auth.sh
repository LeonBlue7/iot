#!/bin/bash
# EMQX MQTT认证修复脚本
# 请在服务器上执行: bash scripts/fix-mqtt-auth.sh

set -e

echo "=========================================="
echo " EMQX MQTT认证修复"
echo "=========================================="

cd /opt/iot

# 1. 检查当前.env配置
echo ""
echo "[1] 当前MQTT配置:"
grep -E "^MQTT_USERNAME|^MQTT_PASSWORD" .env 2>/dev/null || echo "  (未找到MQTT配置)"

echo ""
echo "[2] docker-compose.prod.yml默认配置:"
grep -E "MQTT_USERNAME|MQTT_PASSWORD" docker-compose.prod.yml

# 2. 备份原配置
echo ""
echo "[3] 备份原配置..."
sudo cp .env .env.bak.$(date +%Y%m%d%H%M%S)

# 3. 修正配置
echo ""
echo "[4] 修正MQTT凭据配置..."

# 检查是否已有MQTT_USERNAME行
if grep -q "^MQTT_USERNAME" .env 2>/dev/null; then
    # 替换现有值
    sudo sed -i 's/^MQTT_USERNAME=.*/MQTT_USERNAME=test1/' .env
    sudo sed -i 's/^MQTT_PASSWORD=.*/MQTT_PASSWORD=test123/' .env
    echo "  ✓ 已更新现有配置"
else
    # 添加新配置
    echo "" | sudo tee -a .env > /dev/null
    echo "# MQTT设备认证凭据（与EMQX内置数据库用户一致）" | sudo tee -a .env > /dev/null
    echo "MQTT_USERNAME=test1" | sudo tee -a .env > /dev/null
    echo "MQTT_PASSWORD=test123" | sudo tee -a .env > /dev/null
    echo "  ✓ 已添加新配置"
fi

# 4. 验证修改
echo ""
echo "[5] 验证修改后的配置:"
grep -E "^MQTT_USERNAME|^MQTT_PASSWORD" .env

# 5. 重启后端服务
echo ""
echo "[6] 重启后端服务..."
sudo docker-compose -f docker-compose.prod.yml restart backend

# 6. 等待并检查日志
echo ""
echo "[7] 等待服务启动并检查MQTT连接状态..."
sleep 5
echo ""
echo "--- Backend MQTT日志 ---"
sudo docker-compose -f docker-compose.prod.yml logs --tail=50 backend | grep -E "MQTT|mqtt|connected"

echo ""
echo "=========================================="
echo " 修复完成!"
echo "=========================================="
echo ""
echo "请检查:"
echo "  1. 后端日志是否显示 'MQTT connected'"
echo "  2. EMQX Dashboard是否有 'iot_server' 客户端"
echo ""
echo "查看完整日志:"
echo "  sudo docker-compose -f docker-compose.prod.yml logs -f backend"
echo ""