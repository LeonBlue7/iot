// tests/services/customer.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../src/utils/database.js';

// Mock prisma
jest.mock('../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    customer: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    zone: {
      count: jest.fn(),
    },
  },
}));

// Import service after mocking
import { customerService } from '../../src/services/customer/index.js';

describe('CustomerService', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all customers with zone count', async () => {
      const mockCustomers = [
        {
          id: 1,
          name: 'Customer A',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { zones: 3 },
        },
        {
          id: 2,
          name: 'Customer B',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          _count: { zones: 0 },
        },
      ];

      mockPrisma.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await customerService.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Customer A');
      expect(result[1]?.name).toBe('Customer B');
      expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: { zones: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty array when no customers exist', async () => {
      mockPrisma.customer.findMany.mockResolvedValue([]);

      const result = await customerService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return customer with zones', async () => {
      const mockCustomer = {
        id: 1,
        name: 'Test Customer',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        zones: [
          {
            id: 1,
            name: 'Zone 1',
            customerId: 1,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        ],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await customerService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Customer');
      expect(result?.zones).toHaveLength(1);
      expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { zones: true },
      });
    });

    it('should return null for non-existent customer', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const result = await customerService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const input = {
        name: 'New Customer',
      };

      const mockCreated = {
        id: 1,
        name: 'New Customer',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.customer.create.mockResolvedValue(mockCreated);

      const result = await customerService.create(input);

      expect(result.name).toBe('New Customer');
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          name: 'New Customer',
        },
      });
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(customerService.create({ name: '' })).rejects.toThrow(
        'Customer name is required'
      );
    });

    it('should throw ValidationError for name exceeding 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(customerService.create({ name: longName })).rejects.toThrow(
        'Customer name must be at most 100 characters'
      );
    });
  });

  describe('update', () => {
    it('should update customer name', async () => {
      const mockExisting = {
        id: 1,
        name: 'Old Name',
        createdAt: new Date(),
        updatedAt: new Date(),
        zones: [],
      };

      const mockUpdated = {
        id: 1,
        name: 'New Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockExisting);
      mockPrisma.customer.update.mockResolvedValue(mockUpdated);

      const result = await customerService.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
    });

    it('should throw NotFoundError for non-existent customer', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(customerService.update(999, { name: 'Test' })).rejects.toThrow(
        'Customer 999 not found'
      );
    });

    it('should throw ValidationError for empty name in update', async () => {
      const mockExisting = {
        id: 1,
        name: 'Old Name',
        createdAt: new Date(),
        updatedAt: new Date(),
        zones: [],
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockExisting);

      await expect(customerService.update(1, { name: '' })).rejects.toThrow(
        'Customer name is required'
      );
    });
  });

  describe('delete', () => {
    it('should delete customer without zones', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 1,
        name: 'Customer',
        createdAt: new Date(),
        updatedAt: new Date(),
        zones: [],
      });
      mockPrisma.zone.count.mockResolvedValue(0);
      mockPrisma.customer.delete.mockResolvedValue({ id: 1 });

      await customerService.delete(1);

      expect(mockPrisma.customer.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundError for non-existent customer', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      await expect(customerService.delete(999)).rejects.toThrow(
        'Customer 999 not found'
      );
    });

    it('should throw BadRequestError when customer has zones', async () => {
      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 1,
        name: 'Customer',
        createdAt: new Date(),
        updatedAt: new Date(),
        zones: [{ id: 1 }],
      });

      await expect(customerService.delete(1)).rejects.toThrow(
        'Cannot delete customer with zones'
      );

      expect(mockPrisma.customer.delete).not.toHaveBeenCalled();
    });
  });
});