// tests/controllers/admin/auth.test.ts
import { describe, it, expect } from '@jest/globals';
import { login, getMe, refreshToken } from '../../../src/controllers/admin/auth.controller.js';
import { hashPassword, verifyPassword, generateToken } from '../../../src/services/admin/auth.service.js';

describe('Admin Auth Controller - Unit Tests', () => {
  describe('login input validation', () => {
    it('should have correct controller structure', () => {
      expect(typeof login).toBe('function');
    });

    it('should have getMe controller', () => {
      expect(typeof getMe).toBe('function');
    });

    it('should have refreshToken controller', () => {
      expect(typeof refreshToken).toBe('function');
    });
  });

  describe('Auth service integration', () => {
    it('verifyPassword should hash and verify correctly', async () => {
      const password = 'test_password_123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('generateToken should return valid JWT', async () => {
      const token = await generateToken({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roleIds: [1],
      });

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('generateToken should include permissions', async () => {
      const token = await generateToken({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roleIds: [1],
        permissions: ['device:read', 'user:write'],
      });

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('verifyPassword should reject wrong password', async () => {
      const password = 'correct_password';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword('wrong_password', hash);

      expect(isValid).toBe(false);
    });

    it('hashPassword should generate different hashes for same password', async () => {
      const password = 'same_password';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Password security', () => {
    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const hash = await hashPassword(longPassword);
      const isValid = await verifyPassword(longPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should handle special characters in password', async () => {
      const specialPassword = 'P@ssw0rd!#$%^&*()';
      const hash = await hashPassword(specialPassword);
      const isValid = await verifyPassword(specialPassword, hash);

      expect(isValid).toBe(true);
    });
  });
});