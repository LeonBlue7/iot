// src/services/admin/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
  exp: number;
}

// JWT 密钥版本 - 用于密钥轮转
const JWT_KEY_VERSION = 'v1';

/**
 * 哈希密码 - 使用 bcrypt
 * @param password - 明文密码
 * @returns 哈希后的密码
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * 验证密码
 * @param password - 明文密码
 * @param hash - bcrypt 哈希密码
 * @returns 密码是否匹配
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * 生成 JWT token - 包含密钥版本
 * @param adminUser - 管理员用户信息
 * @returns JWT token
 */
export function generateToken(adminUser: AdminUserPayload): Promise<string> {
  return Promise.resolve().then(() => {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> & { keyVersion: string } = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      roleIds: adminUser.roleIds,
      permissions: adminUser.permissions || [],
      keyVersion: JWT_KEY_VERSION,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn || '24h',
    } as jwt.SignOptions);
  });
}

/**
 * 验证 JWT token - 检查密钥版本
 * @param token - JWT token
 * @returns 解码后的 payload
 */
export function verifyToken(token: string): Promise<JWTPayload & { keyVersion?: string }> {
  return Promise.resolve().then(() => {
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload & { keyVersion?: string };

    // 验证密钥版本，如果不匹配则拒绝
    if (decoded.keyVersion && decoded.keyVersion !== JWT_KEY_VERSION) {
      throw new Error('Invalid token key version');
    }

    return decoded;
  });
}

/**
 * 生成刷新 token - 用于实现 refresh token 流程
 * @returns 随机刷新 token
 */
export function generateRefreshToken(): string {
  return jwt.sign(
    { type: 'refresh', jti: crypto.randomUUID() },
    config.jwt.secret,
    { expiresIn: '7d' }
  );
}

/**
 * 验证刷新 token
 * @param refreshToken 刷新 token
 */
export function verifyRefreshToken(refreshToken: string): Promise<{ type: string; jti: string; iat: number; exp: number }> {
  return Promise.resolve().then(() => {
    return jwt.verify(refreshToken, config.jwt.secret) as { type: string; jti: string; iat: number; exp: number };
  });
}
