-- 生产环境迁移修复SQL（带事务和完整性检查）
-- 解决FK约束顺序问题：先删除FK，再更新group_id，最后添加新FK

BEGIN;

-- 创建 customers 表
CREATE TABLE IF NOT EXISTS "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "customers_name_idx" ON "customers"("name");

-- 创建 zones 表
CREATE TABLE IF NOT EXISTS "zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "zones_customer_id_idx" ON "zones"("customer_id");
CREATE INDEX IF NOT EXISTS "zones_name_idx" ON "zones"("name");

-- zones 表外键约束
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'zones_customer_id_fkey') THEN
        ALTER TABLE "zones" ADD CONSTRAINT "zones_customer_id_fkey"
        FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 创建 groups 表
CREATE TABLE IF NOT EXISTS "groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "zone_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "groups_zone_id_idx" ON "groups"("zone_id");
CREATE INDEX IF NOT EXISTS "groups_name_idx" ON "groups"("name");

-- groups 表外键约束
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_zone_id_fkey') THEN
        ALTER TABLE "groups" ADD CONSTRAINT "groups_zone_id_fkey"
        FOREIGN KEY ("zone_id") REFERENCES "zones"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 添加 devices.enabled 列
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'devices' AND column_name = 'enabled'
    ) THEN
        ALTER TABLE "devices" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- 添加 devices 索引
CREATE INDEX IF NOT EXISTS "devices_name_idx" ON "devices"("name");
CREATE INDEX IF NOT EXISTS "devices_product_id_idx" ON "devices"("product_id");

-- 创建默认客户
INSERT INTO "customers" ("id", "name")
VALUES (1, '默认客户')
ON CONFLICT (id) DO NOTHING;

SELECT setval('customers_id_seq', 1, true);

-- 创建默认分区
INSERT INTO "zones" ("id", "name", "customer_id")
VALUES (1, '默认分区', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('zones_id_seq', 1, true);

-- 迁移 device_groups 数据到 groups（仅当表存在时）
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'device_groups') THEN
        INSERT INTO "groups" ("id", "name", "zone_id", "created_at", "updated_at")
        SELECT "id", "name", 1, "created_at", "updated_at"
        FROM "device_groups"
        ON CONFLICT (id) DO NOTHING;

        SELECT setval('groups_id_seq', COALESCE((SELECT MAX("id") FROM "groups"), 1), true);
    END IF;
END $$;

-- ===== 关键修复：先删除FK约束 =====
ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_group_id_fkey";

-- 创建默认分组 999
INSERT INTO "groups" ("id", "name", "zone_id")
SELECT 999, '默认分组', 1
WHERE NOT EXISTS (SELECT 1 FROM "groups" WHERE "id" = 999);

-- 更新 NULL group_id 的设备
UPDATE "devices" SET "group_id" = 999 WHERE "group_id" IS NULL;

-- 删除旧的 device_groups 表（仅当存在时）
DROP TABLE IF EXISTS "device_groups";

-- 添加新的 FK 约束（指向 groups）
ALTER TABLE "devices"
ADD CONSTRAINT "devices_group_id_fkey"
FOREIGN KEY ("group_id")
REFERENCES "groups"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;