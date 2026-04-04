#!/bin/bash
# 生产环境数据库迁移修复脚本
# 用于解决 20260330_add_hierarchy_models 迁移FK约束顺序问题

set -e

echo "=== 开始修复数据库迁移 ==="

# 1. 检查当前数据库状态
echo "1. 检查当前数据库状态..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('customers', 'zones', 'groups', 'device_groups');
"

# 2. 删除失败的迁移记录
echo "2. 删除失败的迁移记录..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
DELETE FROM _prisma_migrations WHERE migration_name = '20260330_add_hierarchy_models';
"

# 3. 如果 groups 表不存在，手动创建基础表
echo "3. 检查是否需要手动创建表..."
GROUPS_EXISTS=$(docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -t -c "
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups');
")

if [[ "$GROUPS_EXISTS" == *"false"* ]] || [[ "$GROUPS_EXISTS" == *"f"* ]]; then
  echo "   groups 表不存在，开始手动创建..."

  # 创建 customers 表
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  CREATE TABLE IF NOT EXISTS \"customers\" (
      \"id\" SERIAL NOT NULL,
      \"name\" VARCHAR(100) NOT NULL,
      \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \"customers_pkey\" PRIMARY KEY (\"id")
  );
  CREATE INDEX IF NOT EXISTS \"customers_name_idx\" ON \"customers\"(\"name");
  "

  # 创建 zones 表
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  CREATE TABLE IF NOT EXISTS \"zones\" (
      \"id\" SERIAL NOT NULL,
      \"name\" VARCHAR(100) NOT NULL,
      \"customer_id\" INTEGER NOT NULL,
      \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \"zones_pkey\" PRIMARY KEY (\"id")
  );
  CREATE INDEX IF NOT EXISTS \"zones_customer_id_idx\" ON \"zones\"(\"customer_id\");
  CREATE INDEX IF NOT EXISTS \"zones_name_idx\" ON \"zones\"(\"name\");
  "

  # 添加 zones FK（如果 customers 表有数据）
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zones_customer_id_fkey') THEN
      ALTER TABLE \"zones\" ADD CONSTRAINT \"zones_customer_id_fkey\" FOREIGN KEY (\"customer_id\") REFERENCES \"customers\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END \$\$;
  "

  # 创建 groups 表
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  CREATE TABLE IF NOT EXISTS \"groups\" (
      \"id\" SERIAL NOT NULL,
      \"name\" VARCHAR(100) NOT NULL,
      \"zone_id\" INTEGER NOT NULL,
      \"created_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \"updated_at\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT \"groups_pkey\" PRIMARY KEY (\"id")
  );
  CREATE INDEX IF NOT EXISTS \"groups_zone_id_idx\" ON \"groups\"(\"zone_id\");
  CREATE INDEX IF NOT EXISTS \"groups_name_idx\" ON \"groups\"(\"name\");
  "

  # 添加 groups FK（如果 zones 表有数据）
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_zone_id_fkey') THEN
      ALTER TABLE \"groups\" ADD CONSTRAINT \"groups_zone_id_fkey\" FOREIGN KEY (\"zone_id\") REFERENCES \"zones\"(\"id\") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END \$\$;
  "

  # 添加 devices.enabled 列
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  DO \$\$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'devices' AND column_name = 'enabled') THEN
      ALTER TABLE \"devices\" ADD COLUMN \"enabled\" BOOLEAN NOT NULL DEFAULT true;
    END IF;
  END \$\$;
  "

  # 添加 devices 索引
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  CREATE INDEX IF NOT EXISTS \"devices_name_idx\" ON \"devices\"(\"name\");
  CREATE INDEX IF NOT EXISTS \"devices_product_id_idx\" ON \"devices\"(\"product_id\");
  "

  # 创建默认客户
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  INSERT INTO \"customers\" (\"id\", \"name\") VALUES (1, '默认客户')
  ON CONFLICT (id) DO NOTHING;
  SELECT setval('customers_id_seq', 1, true);
  "

  # 创建默认分区
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  INSERT INTO \"zones\" (\"id\", \"name\", \"customer_id\") VALUES (1, '默认分区', 1)
  ON CONFLICT (id) DO NOTHING;
  SELECT setval('zones_id_seq', 1, true);
  "

  # 迁移 device_groups 数据到 groups
  docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
  INSERT INTO \"groups\" (\"id\", \"name\", \"zone_id\", \"created_at\", \"updated_at\")
  SELECT \"id\", \"name\", 1, \"created_at\", \"updated_at\" FROM \"device_groups\"
  ON CONFLICT (id) DO NOTHING;
  SELECT setval('groups_id_seq', COALESCE((SELECT MAX(\"id\") FROM \"groups\"), 1), true);
  "
fi

# 4. 关键修复：先删除 FK 约束
echo "4. 删除旧的 FK 约束..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
ALTER TABLE \"devices\" DROP CONSTRAINT IF EXISTS \"devices_group_id_fkey\";
"

# 5. 创建默认分组 999（如果不存在）
echo "5. 创建默认分组..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
INSERT INTO \"groups\" (\"id\", \"name\", \"zone_id\")
SELECT 999, '默认分组', 1
WHERE NOT EXISTS (SELECT 1 FROM \"groups\" WHERE \"id\" = 999);
"

# 6. 更新 NULL group_id 的设备
echo "6. 更新设备的 group_id..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
UPDATE \"devices\" SET \"group_id\" = 999 WHERE \"group_id\" IS NULL;
"

# 7. 删除旧的 device_groups 表
echo "7. 删除旧的 device_groups 表..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
DROP TABLE IF EXISTS \"device_groups\";
"

# 8. 添加新的 FK 约束（指向 groups）
echo "8. 添加新的 FK 约束..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
ALTER TABLE \"devices\" ADD CONSTRAINT \"devices_group_id_fkey\"
FOREIGN KEY (\"group_id\") REFERENCES \"groups\"(\"id\") ON DELETE SET NULL ON UPDATE CASCADE;
"

# 9. 标记迁移为已完成
echo "9. 标记迁移为已完成..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
INSERT INTO _prisma_migrations (id, migration_name, started_at, finished_at, logs, success)
VALUES (
  gen_random_uuid(),
  '20260330_add_hierarchy_models',
  NOW(),
  NOW(),
  'Migration manually applied via fix script',
  true
);
"

# 10. 运行后续迁移
echo "10. 运行后续迁移..."
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

echo "=== 迁移修复完成 ==="
echo ""
echo "验证数据库状态..."
docker compose -f docker-compose.prod.yml exec postgres psql -U iot_user -d iot_db -c "
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
"