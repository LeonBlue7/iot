/*
  Warnings:

  - You are about to alter the column `role` on the `admin_user_customers` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE "admin_user_customers" ALTER COLUMN "role" SET DATA TYPE VARCHAR(20);
