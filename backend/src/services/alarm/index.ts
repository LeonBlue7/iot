// src/services/alarm/index.ts
import prisma from '../../utils/database.js';
import { NotFoundError } from '../../utils/errors.js';

export interface AlarmFilters {
  deviceId?: string;
  status?: number;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export async function getAlarms(filters: AlarmFilters = {}): Promise<{ data: any[]; total: number }> {
  const { deviceId, status, startTime, endTime, limit = 20, offset = 0 } = filters;

  const where: any = {
    ...(deviceId && { deviceId }),
    ...(status !== undefined && { status }),
    ...(startTime || endTime
      ? {
          createdAt: {
            ...(startTime && { gte: startTime }),
            ...(endTime && { lte: endTime }),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.alarmRecord.findMany({
      where,
      include: {
        device: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.alarmRecord.count({ where }),
  ]);

  return { data, total };
}

export async function acknowledgeAlarm(alarmId: number, acknowledgedBy: string) {
  const alarm = await prisma.alarmRecord.findUnique({
    where: { id: alarmId },
  });

  if (!alarm) {
    throw new NotFoundError(`Alarm ${alarmId} not found`);
  }

  return prisma.alarmRecord.update({
    where: { id: alarmId },
    data: {
      status: 1,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    },
  });
}

export async function resolveAlarm(alarmId: number, acknowledgedBy: string) {
  const alarm = await prisma.alarmRecord.findUnique({
    where: { id: alarmId },
  });

  if (!alarm) {
    throw new NotFoundError(`Alarm ${alarmId} not found`);
  }

  return prisma.alarmRecord.update({
    where: { id: alarmId },
    data: {
      status: 2,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    },
  });
}

export async function getUnacknowledgedCount(): Promise<number> {
  return prisma.alarmRecord.count({
    where: { status: 0 },
  });
}