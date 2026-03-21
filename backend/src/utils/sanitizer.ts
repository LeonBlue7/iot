// src/utils/sanitizer.ts
import { Request } from 'express';

/**
 * 敏感字段列表（这些字段会被脱敏）
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'credential',
];

/**
 * 获取客户端真实 IP 地址
 * 支持 X-Forwarded-For 和 X-Real-IP 头部
 */
export function getClientIp(req: Request): string {
  // 从 X-Forwarded-For 获取（可能被伪造，仅用于日志）
  const xForwardedFor = req.headers?.['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    // X-Forwarded-For 可能是多个 IP：client, proxy1, proxy2
    // 第一个 IP 是客户端
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips[0]) {
      return ips[0];
    }
  }

  // 从 X-Real-IP 获取（更可靠）
  const xRealIp = req.headers?.['x-real-ip'];
  if (typeof xRealIp === 'string') {
    return xRealIp;
  }

  // 返回直接连接的 IP
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

/**
 * 脱敏敏感字段
 * 递归处理对象，将敏感字段的值替换为 [REDACTED]
 */
export function sanitizeObject<T>(obj: T, sensitiveFields: string[] = SENSITIVE_FIELDS): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return obj.map(item => sanitizeObject(item, sensitiveFields)) as unknown as T;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some(field => lowerKey.includes(field));

    if (isSensitive && value !== undefined) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * 脱敏日志上下文
 */
export function sanitizeForLogging(context: Record<string, unknown>): Record<string, unknown> {
  return sanitizeObject(context);
}
