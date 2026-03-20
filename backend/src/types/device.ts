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

export type SensorData = Prisma.SensorDataGetPayload<{}>;

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

export type DeviceParam = Prisma.DeviceParamGetPayload<{}>;

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