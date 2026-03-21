// src/services/alarm/index.ts
import { Prisma } from '@prisma/client';
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

interface AlarmWithDevice {
  id: number;
  deviceId: string;
  alarmType: string;
  alarmValue: number | null;
  threshold: number | null;
  status: number;
  acknowledgedBy: string | null;
  acknowledgedAt: Date | null;
  createdAt: Date;
  device: {
    id: string;
    name: string | null;
  };
}

export async function getAlarms(filters: AlarmFilters = {}): Promise<{ data: AlarmWithDevice[]; total: number }> {
  const { deviceId, status, startTime, endTime, limit = 20, offset = 0 } = filters;

  const where: Prisma.AlarmRecordWhereInput = {
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

  return { data: data as AlarmWithDevice[], total };
}

export async function acknowledgeAlarm(alarmId: number, acknowledgedBy: string): Promise<Prisma.AlarmRecordGetPayload<{ include: { device: true } }>> {
  const alarm = await prisma.alarmRecord.findUnique({
    where: { id: alarmId },
  });

  if (!alarm) {
    throw new NotFoundError(`Alarm ${alarmId} not found`);
  }

  return prisma.alarmRecord.update({
    where: { id: alarmId },
    include: { device: true },
    data: {
      status: 1,
      acknowledgedBy,
      acknowledgedAt: new Date(),
    },
  });
}

export async function resolveAlarm(alarmId: number, acknowledgedBy: string): Promise<Prisma.AlarmRecordGetPayload<{ include: { device: true } }>> {
  const alarm = await prisma.alarmRecord.findUnique({
    where: { id: alarmId },
  });

  if (!alarm) {
    throw new NotFoundError(`Alarm ${alarmId} not found`);
  }

  return prisma.alarmRecord.update({
    where: { id: alarmId },
    include: { device: true },
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
