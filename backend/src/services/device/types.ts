// src/services/device/types.ts
import type { Device, CreateDeviceInput, UpdateDeviceInput, SensorData, DeviceParam, CreateSensorDataInput } from '../../types/index.js';

export interface IDeviceService {
  // Device CRUD
  findAll(): Promise<Device[]>;
  findById(id: string): Promise<Device | null>;
  create(data: CreateDeviceInput): Promise<Device>;
  update(id: string, data: UpdateDeviceInput): Promise<Device>;
  delete(id: string): Promise<void>;

  // Device status
  setOnline(id: string, online: boolean): Promise<void>;
  updateLastSeen(id: string): Promise<void>;

  // Sensor data
  getLatestData(deviceId: string): Promise<SensorData | null>;
  getHistoryData(deviceId: string, startTime: Date, endTime: Date, limit?: number): Promise<SensorData[]>;
  addSensorData(data: CreateSensorDataInput): Promise<SensorData>;

  // Parameters
  getParams(deviceId: string): Promise<DeviceParam | null>;
  updateParams(deviceId: string, params: Partial<DeviceParam>): Promise<DeviceParam>;
}