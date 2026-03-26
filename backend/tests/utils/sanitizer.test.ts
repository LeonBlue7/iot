// tests/utils/sanitizer.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  getClientIp,
  sanitizeObject,
  sanitizeForLogging,
} from '../../src/utils/sanitizer.js';
import { Request } from 'express';

describe('Sanitizer Utils', () => {
  describe('getClientIp', () => {
    it('should return IP from X-Forwarded-For header', () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const result = getClientIp(mockReq);
      expect(result).toBe('192.168.1.1');
    });

    it('should return IP from X-Real-IP header', () => {
      const mockReq = {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const result = getClientIp(mockReq);
      expect(result).toBe('192.168.1.2');
    });

    it('should return req.ip when no headers present', () => {
      const mockReq = {
        headers: {},
        ip: '127.0.0.1',
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request;

      const result = getClientIp(mockReq);
      expect(result).toBe('127.0.0.1');
    });

    it('should return socket.remoteAddress when no req.ip', () => {
      const mockReq = {
        headers: {},
        ip: undefined,
        socket: { remoteAddress: '10.0.0.1' },
      } as unknown as Request;

      const result = getClientIp(mockReq);
      expect(result).toBe('10.0.0.1');
    });

    it('should return unknown when no IP available', () => {
      const mockReq = {
        headers: {},
        ip: undefined,
        socket: {},
      } as unknown as Request;

      const result = getClientIp(mockReq);
      expect(result).toBe('unknown');
    });

    it('should handle single IP in X-Forwarded-For', () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': '192.168.1.3',
        },
      } as unknown as Request;

      const result = getClientIp(mockReq);
      expect(result).toBe('192.168.1.3');
    });
  });

  describe('sanitizeObject', () => {
    it('should return null for null input', () => {
      const result = sanitizeObject(null);
      expect(result).toBeNull();
    });

    it('should return undefined for undefined input', () => {
      const result = sanitizeObject(undefined);
      expect(result).toBeUndefined();
    });

    it('should return primitive values as-is', () => {
      expect(sanitizeObject('string')).toBe('string');
      expect(sanitizeObject(123)).toBe(123);
      expect(sanitizeObject(true)).toBe(true);
    });

    it('should sanitize password field', () => {
      const input = { username: 'admin', password: 'secret123' };
      const result = sanitizeObject(input);
      expect(result.password).toBe('[REDACTED]');
      expect(result.username).toBe('admin');
    });

    it('should sanitize token field', () => {
      const input = { user: 'test', token: 'abc123' };
      const result = sanitizeObject(input);
      expect(result.token).toBe('[REDACTED]');
    });

    it('should sanitize secret field', () => {
      const input = { apiKey: 'key123', secret: 'mysecret' };
      const result = sanitizeObject(input);
      expect(result.secret).toBe('[REDACTED]');
    });

    it('should sanitize fields containing sensitive keywords', () => {
      const input = { apiKey: 'key123', userPassword: 'pass123' };
      const result = sanitizeObject(input);
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.userPassword).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: 'admin',
          authData: {
            password: 'secret',
          },
        },
      };
      const result = sanitizeObject(input);
      const typedResult = result as typeof input;
      expect(typedResult.user.name).toBe('admin');
      expect(typedResult.user.authData.password).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const input = [
        { username: 'user1', password: 'pass1' },
        { username: 'user2', password: 'pass2' },
      ];
      const result = sanitizeObject(input) as typeof input;
      expect(result[0]!.password).toBe('[REDACTED]');
      expect(result[1]!.password).toBe('[REDACTED]');
    });

    it('should handle empty objects', () => {
      const result = sanitizeObject({});
      expect(result).toEqual({});
    });

    it('should handle empty arrays', () => {
      const result = sanitizeObject([]);
      expect(result).toEqual([]);
    });

    it('should preserve undefined values for non-sensitive fields', () => {
      const input = { username: 'admin', nickname: undefined };
      const result = sanitizeObject(input);
      expect(result.username).toBe('admin');
      expect(result.nickname).toBeUndefined();
    });

    it('should handle custom sensitive fields', () => {
      const input = { customSecret: 'hidden', normal: 'visible' };
      const result = sanitizeObject(input, ['custom']);
      expect(result.customSecret).toBe('[REDACTED]');
      expect(result.normal).toBe('visible');
    });
  });

  describe('sanitizeForLogging', () => {
    it('should sanitize context for logging', () => {
      const context = {
        username: 'admin',
        password: 'secret123',
        token: 'jwt-token',
        data: 'normal',
      };
      const result = sanitizeForLogging(context);
      expect(result.password).toBe('[REDACTED]');
      expect(result.token).toBe('[REDACTED]');
      expect(result.username).toBe('admin');
      expect(result.data).toBe('normal');
    });

    it('should handle empty context', () => {
      const result = sanitizeForLogging({});
      expect(result).toEqual({});
    });

    it('should handle nested context', () => {
      const context = {
        user: {
          name: 'admin',
          authData: {
            password: 'secret',
          },
        },
        request: {
          token: 'bearer-token',
          path: '/api/test',
        },
      };
      const result = sanitizeForLogging(context) as typeof context;
      expect(result.user.authData.password).toBe('[REDACTED]');
      expect(result.request.token).toBe('[REDACTED]');
      expect(result.user.name).toBe('admin');
      expect(result.request.path).toBe('/api/test');
    });
  });
});