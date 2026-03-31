// src/types/device.ts
import type { Prisma } from '@prisma/client';

export type Device = Prisma.DeviceGetPayload<{ include: { params: true } }>;

export interface CreateDeviceInput {
  id: string;
  productId?: string | null;
  name?: string | null;
  simCard?: string | null;
}

export interface UpdateDeviceInput {
  name?: string | null;
  productId?: string | null;
}

export type SensorData = Prisma.SensorDataGetPayload<Record<string, never>>;

export interface CreateSensorDataInput {
  deviceId: string;
  temperature?: number | null;
  humidity?: number | null;
  current?: number | null;
  signalStrength?: number | null;
  acState?: number | null;
  acError?: number | null;
  tempAlarm?: number | null;
  humiAlarm?: number | null;
  recordedAt?: Date | null;
}

export type DeviceParam = Prisma.DeviceParamGetPayload<Record<string, never>>;

export interface AlarmRecord {
  id: number;
  deviceId: string;
  alarmType: string;
  alarmValue?: number | null;
  threshold?: number | null;
  status: number;
  acknowledgedBy?: string | null;
  acknowledgedAt?: Date | null;
  createdAt: Date;
}

export type AlarmStatus = 0 | 1 | 2;

// 批量操作结果
export interface BatchOperationResult {
  success: boolean;        // 操作是否成功执行
  successCount: number;    // 成功处理的设备数量
  failCount: number;       // 处理失败的设备数量
  failedDevices?: string[]; // 失败的设备ID列表
  errors?: string[];       // 错误信息列表
}

// 搜索选项
export interface SearchDevicesOptions {
  keyword?: string;
  customerId?: number;
  zoneId?: number;
  groupId?: number;
  online?: boolean;
  enabled?: boolean;
  page?: number;
  limit?: number;
}