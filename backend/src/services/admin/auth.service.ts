// src/services/admin/auth.service.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config/index.js';

export interface AdminUserPayload {
  id: number;
  username: string;
  email: string;
  roleIds: number[];
  permissions?: string[];
}

export interface JWTPayload extends AdminUserPayload {
  iat: number;
  exp: number;
}

/**
 * 哈希密码
 * 使用 SHA-256 + salt 进行哈希
 */
export function hashPassword(password: string): Promise<string> {
  return Promise.resolve().then(() => {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}.${hash}`;
  });
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Promise.resolve().then(() => {
    try {
      const [salt, storedHash] = hash.split('.');
      if (!salt || !storedHash) {
        return false;
      }
      const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
      return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
    } catch {
      return false;
    }
  });
}

/**
 * 生成 JWT token
 */
export function generateToken(adminUser: AdminUserPayload): Promise<string> {
  return Promise.resolve().then(() => {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      roleIds: adminUser.roleIds,
      permissions: adminUser.permissions || [],
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || '24h',
    } as jwt.SignOptions);
  });
}

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): Promise<JWTPayload> {
  return Promise.resolve().then(() => {
    return jwt.verify(token, config.jwt.secret) as JWTPayload;
  });
}

/**
 * 生成刷新 token
 */
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
