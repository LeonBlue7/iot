// src/controllers/admin/auth.controller.ts
import { Request, Response } from 'express';
import { verifyPassword, generateToken } from '../../services/admin/auth.service.js';
import { getUserPermissions } from '../../services/admin/rbac.service.js';
import prisma from '../../utils/database.js';
import { asyncHandler } from '../../utils/response.js';
import { successResponse, errorResponse } from '../../utils/response.js';
import type { AdminRequest } from '../../middleware/admin/auth.js';

/**
 * 管理员登录
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body as Record<string, unknown>;

  if (!username || !password) {
    res.status(400).json(errorResponse('Username and password are required'));
    return;
  }

  // 查找管理员用户
  const adminUser = await prisma.adminUser.findUnique({
    where: { username: username as string },
  });

  if (!adminUser) {
    res.status(401).json(errorResponse('Invalid credentials'));
    return;
  }

  // 检查账户是否启用
  if (!adminUser.enabled) {
    res.status(403).json(errorResponse('Account is disabled'));
    return;
  }

  // 验证密码
  const isValid = await verifyPassword(password as string, adminUser.passwordHash);
  if (!isValid) {
    res.status(401).json(errorResponse('Invalid credentials'));
    return;
  }

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
      lastLoginIp: req.ip,
    },
  });

  res.json(successResponse({
    token,
    user: {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      name: adminUser.name,
      permissions,
    },
  }));
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
