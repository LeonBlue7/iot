// src/services/admin/audit.service.ts
import prisma from '../../utils/database.js';
import { sanitizeForLogging } from '../../utils/sanitizer.js';
import { Prisma } from '@prisma/client';

export interface CreateAuditLogInput {
  adminUserId: number;
  action: string;
  resource: string;
  resourceId?: string;
  resourceIdInt?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface GetAuditLogsOptions {
  page?: number;
  limit?: number;
  adminUserId?: number;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogWithUser {
  id: number;
  adminUserId: number;
  action: string;
  resource: string;
  resourceId: string | null;
  resourceIdInt: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  adminUser: {
    id: number;
    username: string;
    name: string | null;
  } | null;
}

/**
 * 创建审计日志
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<unknown> {
  const sanitizedDetails = input.details ? sanitizeForLogging(input.details) : null;

  return prisma.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      resourceIdInt: input.resourceIdInt,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      details: sanitizedDetails === null ? Prisma.JsonNull : (sanitizedDetails as Prisma.InputJsonValue),
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    },
  });
}

/**
 * 查询审计日志
 */
export async function getAuditLogs(options: GetAuditLogsOptions = {}): Promise<{ data: AuditLogWithUser[]; total: number }> {
  const {
    page = 1,
    limit = 50,
    adminUserId,
    action,
    resource,
    startDate,
    endDate,
  } = options;

  const where: Record<string, unknown> = {};

  if (adminUserId) {
    where.adminUserId = adminUserId;
  }

  if (action) {
    where.action = action;
  }

  if (resource) {
    where.resource = resource;
  }

  if (startDate || endDate) {
    where.createdAt = {} as Record<string, Date>;
    if (startDate) {
      (where.createdAt as Record<string, Date>).gte = startDate;
    }
    if (endDate) {
      (where.createdAt as Record<string, Date>).lte = endDate;
    }
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { adminUser: { select: { id: true, username: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      skip: (page - 1) * limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data: data as unknown as AuditLogWithUser[], total };
}
