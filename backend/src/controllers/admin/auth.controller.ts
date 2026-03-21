// src/controllers/admin/auth.controller.ts
import { Request, Response } from 'express';
import { verifyPassword, generateToken, verifyRefreshToken } from '../../services/admin/auth.service.js';
import { getUserPermissions } from '../../services/admin/rbac.service.js';
import { createAuditLog } from '../../services/admin/audit.service.js';
import prisma from '../../utils/database.js';
import { asyncHandler } from '../../utils/response.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import type { AdminRequest } from '../../middleware/admin/auth.js';
import { logger } from '../../utils/logger.js';
import { getClientIp, sanitizeForLogging } from '../../utils/sanitizer.js';

/**
 * 登录失败处理
 */
async function handleLoginFailure(
  adminUserId: number,
  username: string,
  reason: string,
  clientIp: string,
  userAgent: string | undefined,
  logLevel: 'warn' | 'security' = 'security'
): Promise<void> {
  if (logLevel === 'warn') {
    logger.warn(`Login failed: ${reason}`, sanitizeForLogging({ username, ip: clientIp }));
  } else {
    logger.security(`Login failed - ${reason}`, sanitizeForLogging({
      adminUserId: adminUserId || 0,
      username,
      ip: clientIp
    }));
  }

  await createAuditLog({
    adminUserId: adminUserId || 0,
    action: 'LOGIN_FAILED',
    resource: 'ADMIN_AUTH',
    details: { username, reason },
    ipAddress: clientIp,
    userAgent,
  });
}

/**
 * 登录成功处理
 */
async function handleLoginSuccess(
  adminUser: { id: number; username: string; email: string; roleIds: number[] },
  clientIp: string,
  userAgent: string | undefined
): Promise<{ token: string; user: unknown }> {
  // 获取用户权限
  const permissions = await getUserPermissions(adminUser.id);

  // 生成 token
  const token = await generateToken({
    id: adminUser.id,
    username: adminUser.username,
    email: adminUser.email,
    roleIds: adminUser.roleIds,
    permissions,
  });

  // 更新最后登录信息
  await prisma.adminUser.update({
    where: { id: adminUser.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: clientIp,
    },
  });

  // 记录登录成功审计日志
  await createAuditLog({
    adminUserId: adminUser.id,
    action: 'LOGIN_SUCCESS',
    resource: 'ADMIN_AUTH',
    details: { username: adminUser.username },
    ipAddress: clientIp,
    userAgent,
  });

  logger.info('Login successful', sanitizeForLogging({
    adminUserId: adminUser.id,
    username: adminUser.username,
    ip: clientIp
  }));

  return {
    token,
    user: {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      name: adminUser.name,
      permissions,
    },
  };
}

/**
 * 管理员登录
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as Record<string, unknown>;
  const clientIp = getClientIp(req);
  const userAgent = req.headers['user-agent'];

  // 验证输入
  if (!username || !password) {
    await handleLoginFailure(0, username as string || '', 'MISSING_CREDENTIALS', clientIp, userAgent, 'warn');
    res.status(400).json(errorResponse('Username and password are required'));
    return;
  }

  // 查找管理员用户
  const adminUser = await prisma.adminUser.findUnique({
    where: { username: username as string },
  });

  // 用户不存在
  if (!adminUser) {
    await handleLoginFailure(0, username as string, 'USER_NOT_FOUND', clientIp, userAgent);
    res.status(401).json(errorResponse('Invalid credentials'));
    return;
  }

  // 检查账户是否启用
  if (!adminUser.enabled) {
    await handleLoginFailure(
      adminUser.id,
      adminUser.username,
      'ACCOUNT_DISABLED',
      clientIp,
      userAgent
    );
    res.status(403).json(errorResponse('Account is disabled'));
    return;
  }

  // 验证密码
  const isValid = await verifyPassword(password as string, adminUser.passwordHash);
  if (!isValid) {
    await handleLoginFailure(
      adminUser.id,
      adminUser.username,
      'INVALID_PASSWORD',
      clientIp,
      userAgent
    );
    res.status(401).json(errorResponse('Invalid credentials'));
    return;
  }

  // 登录成功
  const result = await handleLoginSuccess(adminUser, clientIp, userAgent);
  res.json(successResponse(result));
});

/**
 * 获取当前管理员信息
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const adminReq = req as AdminRequest;

  if (!adminReq.adminUser) {
    res.status(401).json(errorResponse('Not authenticated'));
    return;
  }

  const adminUser = await prisma.adminUser.findUnique({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    where: { id: Number(adminReq.adminUser.id) },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      roleIds: true,
      enabled: true,
      lastLoginAt: true,
    },
  });

  if (!adminUser) {
    res.status(404).json(errorResponse('User not found'));
    return;
  }

  const permissions = await getUserPermissions(adminUser.id);

  res.json(successResponse({
    ...adminUser,
    permissions,
  }));
});

/**
 * 刷新 token
 * 使用刷新 token 获取新的访问 token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: refreshTokenStr } = req.body as Record<string, unknown>;
  const clientIp = getClientIp(req);

  if (!refreshTokenStr) {
    logger.warn('Refresh token request missing token', sanitizeForLogging({ ip: clientIp }));
    res.status(400).json(errorResponse('Refresh token is required'));
    return;
  }

  try {
    // 验证刷新 token
    const payload = await verifyRefreshToken(refreshTokenStr as string);

    // 从数据库中获取用户信息
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: payload.jti ? parseInt(payload.jti, 10) : 0 },
      select: {
        id: true,
        username: true,
        email: true,
        roleIds: true,
        enabled: true,
      },
    });

    if (!adminUser || !adminUser.enabled) {
      logger.security('Refresh token failed - user not found or disabled', sanitizeForLogging({ ip: clientIp }));
      res.status(401).json(errorResponse('Invalid refresh token'));
      return;
    }

    // 获取最新权限
    const permissions = await getUserPermissions(adminUser.id);

    // 生成新的访问 token
    const newToken = await generateToken({
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      roleIds: adminUser.roleIds,
      permissions,
    });

    logger.info('Token refreshed successfully', sanitizeForLogging({
      adminUserId: adminUser.id,
      username: adminUser.username,
      ip: clientIp
    }));

    res.json(successResponse({
      token: newToken,
    }));
  } catch (error) {
    logger.security('Refresh token failed - invalid token', sanitizeForLogging({
      ip: clientIp,
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
    res.status(401).json(errorResponse('Invalid refresh token'));
  }
});
