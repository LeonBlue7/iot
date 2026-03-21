import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export interface AuthRequest extends Request {
  userId?: string;
  role?: string;
}

/**
 * JWT 认证中间件
 *
 * 验证请求头中的 Bearer Token，解析并验证 JWT
 * 验证通过后将用户信息附加到请求对象
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express 下一个中间件
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: '缺少认证令牌',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      config.jwt.secret
    ) as { userId: string; role: string };

    req.userId = decoded.userId;
    req.role = decoded.role;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: '认证令牌已过期',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: '无效的认证令牌',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '认证服务错误',
    });
  }
};

/**
 * 角色授权中间件
 *
 * 检查用户角色是否在允许的角色列表中
 * 必须与 authenticate 中间件一起使用
 *
 * @param allowedRoles - 允许访问的角色列表
 * @returns Express 中间件函数
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.role) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: '未认证用户',
      });
      return;
    }

    if (!allowedRoles.includes(req.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `权限不足，需要角色：${allowedRoles.join(' 或 ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * 可选认证中间件
 *
 * 尝试解析 Token，但如果不存在或无效也不失败
 * 用于公共端点但需要知道用户身份的场景
 *
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - Express 下一个中间件
 */
export const optionalAuth = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 无 Token，继续处理但不设置用户信息
    next();
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(
      token,
      config.jwt.secret
    ) as { userId: string; role: string };

    req.userId = decoded.userId;
    req.role = decoded.role;
  } catch {
    // Token 无效，但不失败，继续处理
  }

  next();
};
