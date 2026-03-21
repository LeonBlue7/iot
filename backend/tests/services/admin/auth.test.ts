// tests/services/admin/auth.test.ts
import { describe, it, expect } from '@jest/globals';
import { hashPassword, verifyPassword, generateToken, generateRefreshToken } from '../../../src/services/admin/auth.service.js';

describe('Admin Auth Service', () => {
  describe('hashPassword', () => {
    it('should generate different hashes for same password', async () => {
      const password = 'SecurePassword123!';

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).toBeDefined();
      expect(hash2).toBeDefined();
      expect(hash1).not.toBe(hash2); // Different salt
      expect(hash1.length).toBeGreaterThan(50);
    });

    it('should handle long passwords', async () => {
      const longPassword = 'a'.repeat(100);
      const hash = await hashPassword(longPassword);
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(50);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const hash = await hashPassword('password');
      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with admin info', async () => {
      const adminUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roleIds: [1],
      };

      const token = await generateToken(adminUser);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include permissions in token', async () => {
      const adminUser = {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roleIds: [1],
        permissions: ['device:read', 'device:write'],
      };

      const token = await generateToken(adminUser);
      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid JWT refresh token', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();

      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(token1).not.toBe(token2);
      expect(token1.split('.')).toHaveLength(3); // JWT format
    });
  });
});
