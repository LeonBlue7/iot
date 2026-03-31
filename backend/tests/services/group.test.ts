// tests/services/group-new.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import prisma from '../../src/utils/database.js';

// Mock prisma
jest.mock('../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    group: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    zone: {
      findUnique: jest.fn(),
    },
    device: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

// Import service after mocking
import { groupService } from '../../src/services/group/index.js';

describe('GroupService (Refactored)', () => {
  const mockPrisma = prisma as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all groups with device count', async () => {
      const mockGroups = [
        {
          id: 1,
          name: 'Group 1',
          zoneId: 1,
          zone: { id: 1, name: 'Zone 1', customerId: 1 },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { devices: 5 },
        },
        {
          id: 2,
          name: 'Group 2',
          zoneId: 1,
          zone: { id: 1, name: 'Zone 1', customerId: 1 },
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          _count: { devices: 0 },
        },
      ];

      mockPrisma.group.findMany.mockResolvedValue(mockGroups);

      const result = await groupService.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Group 1');
      expect(result[1]?.name).toBe('Group 2');
      expect(mockPrisma.group.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            zone: true,
            _count: {
              select: { devices: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should return empty array when no groups exist', async () => {
      mockPrisma.group.findMany.mockResolvedValue([]);

      const result = await groupService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByZoneId', () => {
    it('should return groups for a specific zone', async () => {
      const mockGroups = [
        {
          id: 1,
          name: 'Group 1',
          zoneId: 1,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { devices: 2 },
        },
      ];

      mockPrisma.group.findMany.mockResolvedValue(mockGroups);

      const result = await groupService.findByZoneId(1);

      expect(result).toHaveLength(1);
      expect(result[0]?.zoneId).toBe(1);
      expect(mockPrisma.group.findMany).toHaveBeenCalledWith({
        where: { zoneId: 1 },
        include: {
          _count: {
            select: { devices: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return group with devices', async () => {
      const mockGroup = {
        id: 1,
        name: 'Test Group',
        zoneId: 1,
        zone: { id: 1, name: 'Zone 1', customerId: 1 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        devices: [
          {
            id: 'device1',
            name: 'Device 1',
            productId: null,
            simCard: null,
            online: true,
            enabled: true,
            lastSeenAt: null,
            createdAt: new Date(),
            groupId: 1,
          },
        ],
      };

      mockPrisma.group.findUnique.mockResolvedValue(mockGroup);

      const result = await groupService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Group');
      expect(result?.devices).toHaveLength(1);
      expect(mockPrisma.group.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { zone: true, devices: true },
      });
    });

    it('should return null for non-existent group', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      const result = await groupService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new group with zoneId', async () => {
      const input = {
        name: 'New Group',
        zoneId: 1,
      };

      const mockZone = {
        id: 1,
        name: 'Zone 1',
        customerId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreated = {
        id: 1,
        name: 'New Group',
        zoneId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.zone.findUnique.mockResolvedValue(mockZone);
      mockPrisma.group.create.mockResolvedValue(mockCreated);

      const result = await groupService.create(input);

      expect(result.name).toBe('New Group');
      expect(result.zoneId).toBe(1);
      expect(mockPrisma.group.create).toHaveBeenCalledWith({
        data: {
          name: 'New Group',
          zoneId: 1,
        },
      });
    });

    it('should throw NotFoundError for non-existent zone', async () => {
      mockPrisma.zone.findUnique.mockResolvedValue(null);

      await expect(groupService.create({ name: 'Group', zoneId: 999 })).rejects.toThrow(
        'Zone 999 not found'
      );
    });

    it('should throw ValidationError for empty name', async () => {
      await expect(groupService.create({ name: '', zoneId: 1 })).rejects.toThrow(
        'Group name is required'
      );
    });

    it('should throw ValidationError for name exceeding 100 characters', async () => {
      const longName = 'a'.repeat(101);
      await expect(groupService.create({ name: longName, zoneId: 1 })).rejects.toThrow(
        'Group name must be at most 100 characters'
      );
    });
  });

  describe('update', () => {
    it('should update group name', async () => {
      const mockExisting = {
        id: 1,
        name: 'Old Name',
        zoneId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        devices: [],
      };

      const mockUpdated = {
        id: 1,
        name: 'New Name',
        zoneId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.group.findUnique.mockResolvedValue(mockExisting);
      mockPrisma.group.update.mockResolvedValue(mockUpdated);

      const result = await groupService.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockPrisma.group.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
    });

    it('should throw NotFoundError for non-existent group', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      await expect(groupService.update(999, { name: 'Test' })).rejects.toThrow(
        'Group 999 not found'
      );
    });

    it('should throw ValidationError for empty name in update', async () => {
      const mockExisting = {
        id: 1,
        name: 'Old Name',
        zoneId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        devices: [],
      };

      mockPrisma.group.findUnique.mockResolvedValue(mockExisting);

      await expect(groupService.update(1, { name: '' })).rejects.toThrow(
        'Group name is required'
      );
    });
  });

  describe('delete', () => {
    it('should delete group without devices', async () => {
      mockPrisma.group.findUnique.mockResolvedValue({
        id: 1,
        name: 'Group',
        zoneId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        devices: [],
      });
      mockPrisma.device.count.mockResolvedValue(0);
      mockPrisma.group.delete.mockResolvedValue({ id: 1 });

      await groupService.delete(1);

      expect(mockPrisma.group.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundError for non-existent group', async () => {
      mockPrisma.group.findUnique.mockResolvedValue(null);

      await expect(groupService.delete(999)).rejects.toThrow(
        'Group 999 not found'
      );
    });

    it('should throw BadRequestError when group has devices', async () => {
      mockPrisma.group.findUnique.mockResolvedValue({
        id: 1,
        name: 'Group',
        zoneId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        devices: [{ id: 'device1' }],
      });

      await expect(groupService.delete(1)).rejects.toThrow(
        'Cannot delete group with devices'
      );

      expect(mockPrisma.group.delete).not.toHaveBeenCalled();
    });
  });

  describe('setGroupDevices', () => {
    it('should assign devices to group', async () => {
      mockPrisma.device.updateMany.mockResolvedValue({ count: 3 });

      await groupService.setGroupDevices(1, ['dev1', 'dev2', 'dev3']);

      expect(mockPrisma.device.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['dev1', 'dev2', 'dev3'] } },
        data: { groupId: 1 },
      });
    });

    it('should handle empty device list', async () => {
      mockPrisma.device.updateMany.mockResolvedValue({ count: 0 });

      await groupService.setGroupDevices(1, []);

      expect(mockPrisma.device.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        data: { groupId: 1 },
      });
    });
  });

  describe('removeDevicesFromGroup', () => {
    it('should remove devices from group', async () => {
      mockPrisma.device.updateMany.mockResolvedValue({ count: 2 });

      await groupService.removeDevicesFromGroup(['dev1', 'dev2']);

      expect(mockPrisma.device.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['dev1', 'dev2'] } },
        data: { groupId: null },
      });
    });
  });
});