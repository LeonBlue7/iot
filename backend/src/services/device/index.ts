// src/services/device/index.ts
import prisma from '../../utils/database.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import type { IDeviceService } from './types.js';
import type {
  Device,
  CreateDeviceInput,
  UpdateDeviceInput,
  SensorData,
  DeviceParam,
  BatchOperationResult,
  SearchDevicesOptions,
} from '../../types/index.js';
import { Prisma } from '@prisma/client';

interface FindAllOptions {
  page?: number;
  limit?: number;
  online?: boolean;
  includeRealtime?: boolean;
}

interface DeviceWithRealtime extends Device {
  realtimeData?: {
    temperature: number | null;
    humidity: number | null;
    current: number | null;
    signalStrength: number | null;
    acState: number | null;
    acError: number | null;
    tempAlarm: number | null;
    humiAlarm: number | null;
    recordedAt: Date;
  } | null;
}

interface FindAllResult {
  devices: Device[] | DeviceWithRealtime[];
  total: number;
  page: number;
  limit: number;
}

// Valid control actions
const VALID_ACTIONS = ['on', 'off', 'reset'];

class DeviceService implements IDeviceService {
  async findAll(options: FindAllOptions = {}): Promise<FindAllResult> {
    const { page = 1, limit = 50, online, includeRealtime = true } = options;

    const where = online !== undefined ? { online } : undefined;

    // 获取总数
    const total = await prisma.device.count({ where });

    // 获取分页数据
    const devices = await prisma.device.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100), // 最大 100 条
      skip: (page - 1) * limit,
      include: { params: true },
    });

    // 如果需要实时数据，批量获取
    if (includeRealtime && devices.length > 0) {
      const deviceIds = devices.map((d) => d.id);

      // 使用子查询获取每个设备的最新数据
      const latestData = await prisma.$queryRaw<
        Array<{
          deviceId: string;
          id: number;
          temperature: number | null;
          humidity: number | null;
          current: number | null;
          signalStrength: number | null;
          acState: number | null;
          acError: number | null;
          tempAlarm: number | null;
          humiAlarm: number | null;
          recordedAt: Date;
        }>
      >`
        SELECT DISTINCT ON ("deviceId")
          "deviceId", id, temperature, humidity, current, "signalStrength", "acState", "acError", "tempAlarm", "humiAlarm", "recordedAt"
        FROM "SensorData"
        WHERE "deviceId" IN (${Prisma.join(deviceIds)})
        ORDER BY "deviceId", "recordedAt" DESC
      `;

      // 创建映射
      const realtimeMap = new Map(latestData.map((d) => [d.deviceId, d]));

      // 合并数据
      const devicesWithRealtime: DeviceWithRealtime[] = devices.map((device) => ({
        ...device,
        realtimeData: realtimeMap.get(device.id) || null,
      }));

      return {
        devices: devicesWithRealtime,
        total,
        page,
        limit,
      };
    }

    return {
      devices,
      total,
      page,
      limit,
    };
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

  async addSensorData(
    data: import('../../types/index.js').CreateSensorDataInput
  ): Promise<SensorData> {
    return prisma.sensorData.create({
      data,
    });
  }

  async getParams(deviceId: string): Promise<DeviceParam | null> {
    return prisma.deviceParam.findUnique({
      where: { deviceId },
    });
  }

  async updateParams(deviceId: string, params: Partial<DeviceParam>): Promise<DeviceParam> {
    return prisma.deviceParam.upsert({
      where: { deviceId },
      update: params,
      create: {
        deviceId,
        ...params,
      } as import('../../types/index.js').DeviceParam,
    });
  }

  async controlDevice(deviceId: string, action: string, operator: string): Promise<void> {
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

  // ========== Batch Operations ==========

  /**
   * 批量控制设备
   */
  async batchControl(
    deviceIds: string[],
    action: string,
    operator: string
  ): Promise<BatchOperationResult> {
    // Validate input
    if (!deviceIds || deviceIds.length === 0) {
      throw new ValidationError('At least one device is required');
    }
    if (!VALID_ACTIONS.includes(action)) {
      throw new ValidationError('Invalid action. Must be one of: on, off, reset');
    }

    // Find existing devices
    const existingDevices = await prisma.device.findMany({
      where: { id: { in: deviceIds } },
      select: { id: true },
    });

    const existingIds = existingDevices.map((d) => d.id);
    const failedDevices = deviceIds.filter((id) => !existingIds.includes(id));

    // Create control logs for existing devices
    if (existingIds.length > 0) {
      await prisma.controlLog.createMany({
        data: existingIds.map((deviceId) => ({
          deviceId,
          action,
          operator,
        })),
      });
    }

    return {
      success: true,
      successCount: existingIds.length,
      failCount: failedDevices.length,
      failedDevices: failedDevices.length > 0 ? failedDevices : undefined,
    };
  }

  /**
   * 批量更新设备参数
   */
  async batchUpdateParams(
    deviceIds: string[],
    params: Partial<DeviceParam>
  ): Promise<BatchOperationResult> {
    // Validate input
    if (!deviceIds || deviceIds.length === 0) {
      throw new ValidationError('At least one device is required');
    }
    if (!params || Object.keys(params).length === 0) {
      throw new ValidationError('At least one parameter is required');
    }

    // Find existing devices
    const existingDevices = await prisma.device.findMany({
      where: { id: { in: deviceIds } },
      select: { id: true },
    });

    const existingIds = existingDevices.map((d) => d.id);
    const failedDevices = deviceIds.filter((id) => !existingIds.includes(id));

    // Update params for existing devices
    if (existingIds.length > 0) {
      // Update each device's params individually since Prisma doesn't support bulk upsert
      for (const deviceId of existingIds) {
        await prisma.deviceParam.upsert({
          where: { deviceId },
          update: params,
          create: {
            deviceId,
            ...params,
          },
        });
      }
    }

    return {
      success: true,
      successCount: existingIds.length,
      failCount: failedDevices.length,
      failedDevices: failedDevices.length > 0 ? failedDevices : undefined,
    };
  }

  /**
   * 批量移动设备到分组
   */
  async batchMoveToGroup(deviceIds: string[], groupId: number): Promise<BatchOperationResult> {
    // Validate input
    if (!deviceIds || deviceIds.length === 0) {
      throw new ValidationError('At least one device is required');
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundError(`Group ${groupId} not found`);
    }

    // Update devices
    const result = await prisma.device.updateMany({
      where: { id: { in: deviceIds } },
      data: { groupId },
    });

    return {
      success: true,
      successCount: result.count,
      failCount: deviceIds.length - result.count,
    };
  }

  /**
   * 批量切换设备启用状态
   */
  async batchToggleEnabled(deviceIds: string[], enabled: boolean): Promise<BatchOperationResult> {
    // Validate input
    if (!deviceIds || deviceIds.length === 0) {
      throw new ValidationError('At least one device is required');
    }

    // Update devices
    const result = await prisma.device.updateMany({
      where: { id: { in: deviceIds } },
      data: { enabled },
    });

    return {
      success: true,
      successCount: result.count,
      failCount: deviceIds.length - result.count,
    };
  }

  /**
   * 搜索设备
   */
  async searchDevices(options: SearchDevicesOptions): Promise<Device[]> {
    const { keyword, customerId, zoneId, groupId, online, enabled, page = 1, limit = 50 } = options;

    // Build where clause with proper typing
    const where: Prisma.DeviceWhereInput = {};

    // Keyword search
    if (keyword) {
      where.OR = [
        { id: { contains: keyword, mode: 'insensitive' } },
        { name: { contains: keyword, mode: 'insensitive' } },
        { productId: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    // Hierarchy filters
    if (groupId) {
      where.groupId = groupId;
    }
    if (zoneId) {
      where.group = { zoneId };
    }
    if (customerId) {
      where.group = { zone: { customerId } };
    }

    // Status filters
    if (online !== undefined) {
      where.online = online;
    }
    if (enabled !== undefined) {
      where.enabled = enabled;
    }

    return prisma.device.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),
      include: { params: true, group: { include: { zone: true } } },
    });
  }
}

export const deviceService = new DeviceService();
export default deviceService;
