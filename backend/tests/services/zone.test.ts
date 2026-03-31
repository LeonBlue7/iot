// tests/services/zone.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../src/utils/database.js';

// Mock prisma
jest.mock('../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    zone: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    group: {
      count: jest.fn(),
    },
  },
}));

// Import service after mocking
import { zoneService } from '../../src/services/zone/index.js';

describe('ZoneService', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all zones with group count', async () => {
      const mockZones = [
        {
          id: 1,
          name: 'Zone A',
          customerId: 1,
          customer: { id: 1, name: 'Customer A' },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { groups: 3 },
        },
        {
          id: 2,
          name: 'Zone B',
          customerId: 1,
          customer: { id: 1, name: 'Customer A' },
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          _count: { groups: 0 },
        },
      ];

      mockPrisma.zone.findMany.mockResolvedValue(mockZones);

      const result = await zoneService.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Zone A');
      expect(result[1]?.name).toBe('Zone B');
      expect(mockPrisma.zone.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            customer: true,
            _count: {
              select: { groups: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty array when no zones exist', async () => {
      mockPrisma.zone.findMany.mockResolvedValue([]);

      const result = await zoneService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByCustomerId', () => {
    it('should return zones for a specific customer', async () => {
      const mockZones = [
        {
          id: 1,
          name: 'Zone 1',
          customerId: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { groups: 2 },
        },
      ];

      mockPrisma.zone.findMany.mockResolvedValue(mockZones);

      const result = await zoneService.findByCustomerId(1);

      expect(result).toHaveLength(1);
      expect(result[0]?.customerId).toBe(1);
      expect(mockPrisma.zone.findMany).toHaveBeenCalledWith({
        where: { customerId: 1 },
        include: {
          _count: {
            select: { groups: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return zone with groups', async () => {
      const mockZone = {
        id: 1,
        name: 'Test Zone',
        customerId: 1,
        customer: { id: 1, name: 'Customer A' },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        groups: [
          {
            id: 1,
            name: 'Group 1',
            zoneId: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      };

      mockPrisma.zone.findUnique.mockResolvedValue(mockZone);

      const result = await zoneService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Zone');
      expect(result?.groups).toHaveLength(1);
      expect(mockPrisma.zone.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { customer: true, groups: true },
      });
    });

    it('should return null for non-existent zone', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      const result = await zoneService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new zone', async () => {
      const input = {
        name: 'New Zone',
        customerId: 1,
      };

      const mockCustomer = {
        id: 1,
        name: 'Customer A',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreated = {
        id: 1,
        name: 'New Zone',
        customerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrisma.zone.create.mockResolvedValue(mockCreated);

      const result = await zoneService.create(input);

      expect(result.name).toBe('New Zone');
      expect(result.customerId).toBe(1);
      expect(mockPrisma.zone.create).toHaveBeenCalledWith({
        data: {
          name: 'New Zone',
          customerId: 1,
        },
      });
    });

    it('should throw NotFoundError for non-existent customer', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(zoneService.create({ name: 'Zone', customerId: 999 })).rejects.toThrow(
        'Customer 999 not found'
      );
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(zoneService.create({ name: '', customerId: 1 })).rejects.toThrow(
        'Zone name is required'
      );
    });

    it('should throw ValidationError for name exceeding 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(zoneService.create({ name: longName, customerId: 1 })).rejects.toThrow(
        'Zone name must be at most 100 characters'
      );
    });
  });

  describe('update', () => {
    it('should update zone name', async () => {
      const mockExisting = {
        id: 1,
        name: 'Old Name',
        customerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [],
      };

      const mockUpdated = {
        id: 1,
        name: 'New Name',
        customerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.zone.findUnique.mockResolvedValue(mockExisting);
      mockPrisma.zone.update.mockResolvedValue(mockUpdated);

      const result = await zoneService.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockPrisma.zone.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
    });

    it('should throw NotFoundError for non-existent zone', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      await expect(zoneService.update(999, { name: 'Test' })).rejects.toThrow(
        'Zone 999 not found'
      );
    });

    it('should throw ValidationError for empty name in update', async () => {
      const mockExisting = {
        id: 1,
        name: 'Old Name',
        customerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [],
      };

      mockPrisma.zone.findUnique.mockResolvedValue(mockExisting);

      await expect(zoneService.update(1, { name: '' })).rejects.toThrow(
        'Zone name is required'
      );
    });
  });

  describe('delete', () => {
    it('should delete zone without groups', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue({
        id: 1,
        name: 'Zone',
        customerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [],
      });
      mockPrisma.group.count.mockResolvedValue(0);
      mockPrisma.zone.delete.mockResolvedValue({ id: 1 });

      await zoneService.delete(1);

      expect(mockPrisma.zone.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundError for non-existent zone', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      await expect(zoneService.delete(999)).rejects.toThrow(
        'Zone 999 not found'
      );
    });

    it('should throw BadRequestError when zone has groups', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue({
        id: 1,
        name: 'Zone',
        customerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        groups: [{ id: 1 }],
      });

      await expect(zoneService.delete(1)).rejects.toThrow(
        'Cannot delete zone with groups'
      );

      expect(mockPrisma.zone.delete).not.toHaveBeenCalled();
    });
  });
});