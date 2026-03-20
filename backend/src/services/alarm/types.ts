// src/services/alarm/types.ts
import type { AlarmRecord, AlarmStatus } from '../../types/index.js';

export interface IAlarmService {
  findAll(filters: AlarmFilters): Promise<{ data: AlarmRecord[]; total: number }>;
  findById(id: number): Promise<AlarmRecord | null>;
  create(data: CreateAlarmInput): Promise<AlarmRecord>;
  acknowledge(id: number, acknowledgedBy: string): Promise<AlarmRecord>;
  resolve(id: number, acknowledgedBy: string): Promise<AlarmRecord>;
  getUnacknowledgedCount(): Promise<number>;
}

export interface AlarmFilters {
  deviceId?: string;
  status?: AlarmStatus;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export interface CreateAlarmInput {
  deviceId: string;
  alarmType: string;
  alarmValue?: number;
  threshold?: number;
}