-- Make admin_user_id nullable in audit_logs to support login failure logs without user

-- Drop the existing foreign key constraint
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_admin_user_id_fkey";

-- Alter column to allow NULL
ALTER TABLE "audit_logs" ALTER COLUMN "admin_user_id" DROP NOT NULL;

-- Recreate the foreign key constraint (now optional)
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_fkey"
FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;