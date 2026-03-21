// src/services/device/index.ts
import prisma from '../../utils/database.js';
import { NotFoundError } from '../../utils/errors.js';
import type { IDeviceService } from './types.js';
import type { Device, CreateDeviceInput, UpdateDeviceInput, SensorData, DeviceParam } from '../../types/index.js';

interface FindAllOptions {
  page?: number;
  limit?: number;
  online?: boolean;
}

class DeviceService implements IDeviceService {
  async findAll(options: FindAllOptions = {}): Promise<Device[]> {
    const { page = 1, limit = 1000, online } = options;

    return prisma.device.findMany({
      where: online !== undefined ? { online } : undefined,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 1000), // 最大 1000 条
      skip: (page - 1) * limit,
      include: { params: true },
    });
  }

  async findById(id: string): Promise<Device | null> {
    return prisma.device.findUnique({
      where: { id },
      include: { params: true },
    });
  }

  async create(data: CreateDeviceInput): Promise<Device> {
    return prisma.device.create({
      data: {
        id: data.id,
        productId: data.productId,
        name: data.name,
        simCard: data.simCard,
        online: false,
      },
      include: { params: true },
    });
  }

  async update(id: string, data: UpdateDeviceInput): Promise<Device> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError(`Device ${id} not found`);
    }

    return prisma.device.update({
      where: { id },
      data: {
        name: data.name,
        productId: data.productId,
      },
      include: { params: true },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.device.delete({
      where: { id },
    });
  }

  async setOnline(id: string, online: boolean): Promise<void> {
    await prisma.device.update({
      where: { id },
      data: { online },
    });
  }

  async updateLastSeen(id: string): Promise<void> {
    await prisma.device.update({
      where: { id },
      data: { lastSeenAt: new Date() },
    });
  }

  async getLatestData(deviceId: string): Promise<SensorData | null> {
    return prisma.sensorData.findFirst({
      where: { deviceId },
      orderBy: { recordedAt: 'desc' },
    });
  }

  async getHistoryData(
    deviceId: string,
    startTime: Date,
    endTime: Date,
    limit: number = 100
  ): Promise<SensorData[]> {
    return prisma.sensorData.findMany({
      where: {
        deviceId,
        recordedAt: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(limit, 1000), // 最大 1000 条
    });
  }

  async addSensorData(data: import('../../types/index.js').CreateSensorDataInput): Promise<SensorData> {
    return prisma.sensorData.create({
      data,
    });
  }

  async getParams(deviceId: string): Promise<DeviceParam | null> {
    return prisma.deviceParam.findUnique({
      where: { deviceId },
    });
  }

  async updateParams(
    deviceId: string,
    params: Partial<DeviceParam>
  ): Promise<DeviceParam> {
    return prisma.deviceParam.upsert({
      where: { deviceId },
      update: params,
      create: {
        deviceId,
        ...params,
      } as import('../../types/index.js').DeviceParam,
    });
  }

  async controlDevice(
    deviceId: string,
    action: string,
    operator: string
  ): Promise<void> {
    // Log control command
    await prisma.controlLog.create({
      data: {
        deviceId,
        action,
        operator,
      },
    });

    // Send MQTT command would be implemented here
    // For now, just log the action
  }
}

export const deviceService = new DeviceService();
export default deviceService;