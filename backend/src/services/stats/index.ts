// src/services/stats/index.ts
import prisma from '../../utils/database.js';

export async function getOverviewStats(): Promise<{
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalAlarms: number;
  unacknowledgedAlarms: number;
}> {
  const [totalDevices, onlineDevices, totalAlarms, unacknowledgedAlarms] =
    await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { online: true } }),
      prisma.alarmRecord.count(),
      prisma.alarmRecord.count({ where: { status: 0 } }),
    ]);

  return {
    totalDevices,
    onlineDevices,
    offlineDevices: totalDevices - onlineDevices,
    totalAlarms,
    unacknowledgedAlarms,
  };
}

export async function getTrendData(
  deviceId: string,
  metric: 'temperature' | 'humidity' | 'current',
  startTime: Date,
  endTime: Date
): Promise<Array<{ time: Date; value: number | null }>> {
  const data = await prisma.sensorData.findMany({
    where: {
      deviceId,
      recordedAt: {
        gte: startTime,
        lte: endTime,
      },
    },
    select: {
      recordedAt: true,
      temperature: true,
      humidity: true,
      current: true,
    },
    orderBy: { recordedAt: 'asc' },
  });

  return data.map((item: any) => ({
    time: item.recordedAt!,
    value:
      metric === 'temperature'
        ? item.temperature?.toNumber() ?? null
        : metric === 'humidity'
          ? item.humidity?.toNumber() ?? null
          : item.current,
  }));
}

export async function getDailyStats(deviceId: string, date: Date): Promise<{
  avgTemperature: number | null;
  avgHumidity: number | null;
  maxTemperature: number | null;
  minTemperature: number | null;
  alarmCount: number;
}> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [sensorStats, alarmCount] = await Promise.all([
    prisma.sensorData.aggregate({
      where: {
        deviceId,
        recordedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _avg: {
        temperature: true,
        humidity: true,
      },
      _max: {
        temperature: true,
      },
      _min: {
        temperature: true,
      },
    }),
    prisma.alarmRecord.count({
      where: {
        deviceId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    }),
  ]);

  return {
    avgTemperature: sensorStats._avg.temperature?.toNumber() ?? null,
    avgHumidity: sensorStats._avg.humidity?.toNumber() ?? null,
    maxTemperature: sensorStats._max.temperature?.toNumber() ?? null,
    minTemperature: sensorStats._min.temperature?.toNumber() ?? null,
    alarmCount,
  };
}