// tests/utils/database.test.ts
import { describe, it, expect } from '@jest/globals';

describe('Database Utils', () => {
  describe('prisma client', () => {
    it('should be importable', async () => {
      const database = await import('../../src/utils/database.js');
      expect(database.default).toBeDefined();
    });

    it('should have $connect method', async () => {
      const database = await import('../../src/utils/database.js');
      const prisma = database.default;
      expect(prisma.$connect).toBeDefined();
      expect(typeof prisma.$connect).toBe('function');
    });

    it('should have $disconnect method', async () => {
      const database = await import('../../src/utils/database.js');
      const prisma = database.default;
      expect(prisma.$disconnect).toBeDefined();
      expect(typeof prisma.$disconnect).toBe('function');
    });
  });
});