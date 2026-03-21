// src/services/admin/audit.service.ts
import prisma from '../../utils/database.js';

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
  return prisma.auditLog.create({
    data: {
      adminUserId: input.adminUserId,
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId,
      resourceIdInt: input.resourceIdInt,
      details: input.details as unknown,
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
    where.createdAt = {};
    if (startDate) {
      Object.assign(where.createdAt, { gte: startDate });
    }
    if (endDate) {
      Object.assign(where.createdAt, { lte: endDate });
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

  return { data, total };
}
