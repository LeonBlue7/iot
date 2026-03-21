// src/middleware/admin/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../../services/admin/auth.service.js';
import { hasAllPermissions, getUserPermissions } from '../../services/admin/rbac.service.js';
import { logger } from '../../utils/logger.js';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  roleIds: number[];
  permissions?: string[];
}

// Extend Express Request interface
export interface AdminRequest extends Request {
  adminUser?: AdminUser;
}

/**
 * 验证管理员身份
 */
export async function authenticate(
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.security('Authentication failed - missing token', {
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token);
      req.adminUser = {
        id: payload.id,
        username: payload.username,
        email: payload.email,
        roleIds: payload.roleIds,
        permissions: payload.permissions,
      };
      next();
    } catch (error) {
      logger.security('Authentication failed - invalid token', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  } catch (error) {
    logger.error('Authentication middleware error', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * 要求指定权限
 */
export function requirePermissions(...requiredPermissions: string[]) {
  return async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.adminUser) {
        logger.security('Permission check failed - not authenticated', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      // 如果是 super_admin（有全局通配符），直接通过
      if (req.adminUser.permissions?.includes('*')) {
        next();
        return;
      }

      // 从数据库获取最新权限
      const effectivePermissions = req.adminUser.permissions ||
        await getUserPermissions(req.adminUser.id);

      if (hasAllPermissions(effectivePermissions, requiredPermissions)) {
        next();
      } else {
        logger.security('Permission denied', {
          adminUserId: req.adminUser.id,
          username: req.adminUser.username,
          path: req.path,
          method: req.method,
          ip: req.ip,
          requiredPermissions: requiredPermissions
        });
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
      }
    } catch (error) {
      logger.error('Permission check failed', {
        adminUserId: req.adminUser?.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
}

/**
 * 可选认证 - 如果认证成功则附加用户信息
 */
export async function optionalAuth(
  req: AdminRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = await verifyToken(token);
    req.adminUser = {
      id: payload.id,
      username: payload.username,
      email: payload.email,
      roleIds: payload.roleIds,
      permissions: payload.permissions,
    };
  } catch {
    // Token invalid, continue without auth
  }

  next();
}
