-- CreateEnum
-- This migration adds the hierarchy models: Customer, Zone, and refactors DeviceGroup to Group

-- Step 1: Create customers table
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "customers_name_idx" ON "customers"("name");

-- Step 2: Create zones table
CREATE TABLE "zones" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "zones_customer_id_idx" ON "zones"("customer_id");
CREATE INDEX "zones_name_idx" ON "zones"("name");

ALTER TABLE "zones" ADD CONSTRAINT "zones_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: Create groups table (renamed from device_groups)
CREATE TABLE "groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "zone_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "groups_zone_id_idx" ON "groups"("zone_id");
CREATE INDEX "groups_name_idx" ON "groups"("name");

ALTER TABLE "groups" ADD CONSTRAINT "groups_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: Add enabled column to devices table
ALTER TABLE "devices" ADD COLUMN "enabled" BOOLEAN NOT NULL DEFAULT true;

-- Step 5: Add indexes for device search
CREATE INDEX "devices_name_idx" ON "devices"("name");
CREATE INDEX "devices_product_id_idx" ON "devices"("product_id");

-- Step 6: Data migration - Create default hierarchy for existing data
-- Create default customer
INSERT INTO "customers" ("id", "name") VALUES (1, '默认客户');
SELECT setval('customers_id_seq', 1, true);

-- Create default zone
INSERT INTO "zones" ("id", "name", "customer_id") VALUES (1, '默认分区', 1);
SELECT setval('zones_id_seq', 1, true);

-- Step 7: Migrate existing device_groups to groups
-- Copy existing device_groups data to groups with zone_id = 1
INSERT INTO "groups" ("id", "name", "zone_id", "created_at", "updated_at")
SELECT "id", "name", 1, "created_at", "updated_at" FROM "device_groups";

-- Update sequence for groups
SELECT setval('groups_id_seq', COALESCE((SELECT MAX("id") FROM "groups"), 1), true);

-- Step 8: Update devices to use new groups table
-- The groupId foreign key already points to the same id values
-- No need to update device data as ids remain the same

-- Step 9: Drop foreign key constraint from devices to device_groups FIRST
-- This must be done BEFORE updating group_id to a value that doesn't exist in device_groups
ALTER TABLE "devices" DROP CONSTRAINT IF EXISTS "devices_group_id_fkey";

-- Step 10: Create default group if no groups exist
INSERT INTO "groups" ("id", "name", "zone_id")
SELECT 999, '默认分组', 1
WHERE NOT EXISTS (SELECT 1 FROM "groups" WHERE "id" = 999);

-- Step 11: Assign devices without group to default group
-- Now we can safely update group_id since FK constraint is dropped
UPDATE "devices" SET "group_id" = 999 WHERE "group_id" IS NULL;

-- Step 12: Drop old device_groups table
DROP TABLE "device_groups";

-- Step 13: Add foreign key constraint from devices to groups
ALTER TABLE "devices" ADD CONSTRAINT "devices_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;