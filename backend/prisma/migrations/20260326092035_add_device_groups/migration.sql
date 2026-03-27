-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "group_id" INTEGER;

-- CreateTable
CREATE TABLE "device_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "device_groups_name_idx" ON "device_groups"("name");

-- CreateIndex
CREATE INDEX "devices_group_id_idx" ON "devices"("group_id");

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "device_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
