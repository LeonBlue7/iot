-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "customer_id" INTEGER,
ADD COLUMN     "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "zones" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "admin_user_customers" (
    "id" SERIAL NOT NULL,
    "admin_user_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_user_customers_admin_user_id_idx" ON "admin_user_customers"("admin_user_id");

-- CreateIndex
CREATE INDEX "admin_user_customers_customer_id_idx" ON "admin_user_customers"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_customers_admin_user_id_customer_id_key" ON "admin_user_customers"("admin_user_id", "customer_id");

-- CreateIndex
CREATE INDEX "admin_users_customer_id_idx" ON "admin_users"("customer_id");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_customers" ADD CONSTRAINT "admin_user_customers_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_user_customers" ADD CONSTRAINT "admin_user_customers_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
