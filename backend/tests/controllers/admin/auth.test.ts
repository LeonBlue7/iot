// tests/controllers/admin/auth.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Admin Auth Controller - Unit Tests', () => {
  describe('login input validation', () => {
    it('should have correct controller structure', () => {
      // Type-level test to verify controller exports exist
      expect(typeof jest.requireActual('../../../src/controllers/admin/auth.controller.js').login).toBe('function');
    });

    it('should have getMe controller', () => {
      expect(typeof jest.requireActual('../../../src/controllers/admin/auth.controller.js').getMe).toBe('function');
    });
  });

  describe('Auth service integration', () => {
    it('verifyPassword should hash and verify correctly', async () => {
      const { hashPassword, verifyPassword } = await import('../../../src/services/admin/auth.service.js');

      const password = 'test_password_123';
      const hash = await hashPassword(password);
      const isValid = await verifyPassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('generateToken should return valid JWT', async () => {
      const { generateToken } = await import('../../../src/services/admin/auth.service.js');

      const token = await generateToken({
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        roleIds: [1],
      });

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });
  });
});
