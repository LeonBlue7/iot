-- CreateTable
CREATE TABLE "devices" (
    "id" VARCHAR(20) NOT NULL,
    "product_id" VARCHAR(50),
    "name" VARCHAR(100),
    "sim_card" VARCHAR(20),
    "online" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor_data" (
    "id" SERIAL NOT NULL,
    "device_id" VARCHAR(20) NOT NULL,
    "temperature" DECIMAL(4,1),
    "humidity" DECIMAL(4,1),
    "current" INTEGER,
    "signal_strength" DECIMAL(4,1),
    "ac_state" INTEGER,
    "ac_error" INTEGER,
    "temp_alarm" INTEGER,
    "humi_alarm" INTEGER,
    "recorded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_params" (
    "id" SERIAL NOT NULL,
    "device_id" VARCHAR(20) NOT NULL,
    "mode" INTEGER NOT NULL DEFAULT 0,
    "summer_temp_on" DECIMAL(4,1),
    "summer_temp_set" DECIMAL(4,1),
    "summer_temp_off" DECIMAL(4,1),
    "winter_temp_on" DECIMAL(4,1),
    "winter_temp_set" DECIMAL(4,1),
    "winter_temp_off" DECIMAL(4,1),
    "winter_start" INTEGER,
    "winter_end" INTEGER,
    "ac_off_interval" INTEGER,
    "work_time" VARCHAR(50),
    "overtime_1" VARCHAR(50),
    "overtime_2" VARCHAR(50),
    "overtime_3" VARCHAR(50),
    "ac_code" INTEGER,
    "ac_mode" INTEGER,
    "ac_fan_speed" INTEGER,
    "ac_direction" INTEGER,
    "ac_light" INTEGER,
    "min_current" INTEGER,
    "alarm_enabled" INTEGER,
    "temp_high_limit" INTEGER,
    "temp_low_limit" INTEGER,
    "humi_high_limit" INTEGER,
    "humi_low_limit" INTEGER,
    "upload_interval" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 0,
    "reset_times" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alarm_records" (
    "id" SERIAL NOT NULL,
    "device_id" VARCHAR(20) NOT NULL,
    "alarm_type" VARCHAR(20) NOT NULL,
    "alarm_value" DECIMAL(6,1),
    "threshold" DECIMAL(6,1),
    "status" INTEGER NOT NULL DEFAULT 0,
    "acknowledged_by" VARCHAR(50),
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alarm_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_logs" (
    "id" SERIAL NOT NULL,
    "device_id" VARCHAR(20) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "value" JSONB,
    "result" INTEGER,
    "operator" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "control_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "role_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "permissions" VARCHAR(50)[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "admin_user_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resource_id" VARCHAR(100),
    "resource_id_int" INTEGER,
    "details" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" VARCHAR(500),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sensor_data_device_id_idx" ON "sensor_data"("device_id");

-- CreateIndex
CREATE INDEX "sensor_data_recorded_at_idx" ON "sensor_data"("recorded_at");

-- CreateIndex
CREATE UNIQUE INDEX "device_params_device_id_key" ON "device_params"("device_id");

-- CreateIndex
CREATE INDEX "alarm_records_device_id_idx" ON "alarm_records"("device_id");

-- CreateIndex
CREATE INDEX "alarm_records_status_idx" ON "alarm_records"("status");

-- CreateIndex
CREATE INDEX "alarm_records_created_at_idx" ON "alarm_records"("created_at");

-- CreateIndex
CREATE INDEX "control_logs_device_id_idx" ON "control_logs"("device_id");

-- CreateIndex
CREATE INDEX "control_logs_created_at_idx" ON "control_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_username_idx" ON "admin_users"("username");

-- CreateIndex
CREATE INDEX "admin_users_email_idx" ON "admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_name_key" ON "admin_roles"("name");

-- CreateIndex
CREATE INDEX "admin_roles_name_idx" ON "admin_roles"("name");

-- CreateIndex
CREATE INDEX "audit_logs_admin_user_id_idx" ON "audit_logs"("admin_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "system_configs_key_idx" ON "system_configs"("key");

-- AddForeignKey
ALTER TABLE "sensor_data" ADD CONSTRAINT "sensor_data_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_params" ADD CONSTRAINT "device_params_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alarm_records" ADD CONSTRAINT "alarm_records_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_logs" ADD CONSTRAINT "control_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
