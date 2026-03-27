// tests/services/group.test.ts
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { groupService } from '../../src/services/group/index.js';
import prisma from '../../src/utils/database.js';

// Mock prisma
jest.mock('../../src/utils/database.js', () => ({
  __esModule: true,
  default: {
    deviceGroup: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    device: {
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

describe('GroupService', () => {
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
          description: 'Description 1',
          sortOrder: 0,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          _count: { devices: 5 },
        },
        {
          id: 2,
          name: 'Group 2',
          description: null,
          sortOrder: 1,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          _count: { devices: 0 },
        },
      ];

      mockPrisma.deviceGroup.findMany.mockResolvedValue(mockGroups);

      const result = await groupService.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Group 1');
      expect(result[1]?.name).toBe('Group 2');
      expect(mockPrisma.deviceGroup.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { sortOrder: 'asc' },
        })
      );
    });

    it('should return empty array when no groups exist', async () => {
      mockPrisma.deviceGroup.findMany.mockResolvedValue([]);

      const result = await groupService.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return group with devices', async () => {
      const mockGroup = {
        id: 1,
        name: 'Test Group',
        description: 'Test Description',
        sortOrder: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        devices: [
          {
            id: 'device1',
            name: 'Device 1',
            productId: null,
            simCard: null,
            online: true,
            lastSeenAt: null,
            createdAt: new Date(),
            groupId: 1,
          },
        ],
      };

      mockPrisma.deviceGroup.findUnique.mockResolvedValue(mockGroup);

      const result = await groupService.findById(1);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Test Group');
      expect(result?.devices).toHaveLength(1);
      expect(mockPrisma.deviceGroup.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { devices: true },
      });
    });

    it('should return null for non-existent group', async () => {
      mockPrisma.deviceGroup.findUnique.mockResolvedValue(null);

      const result = await groupService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new group', async () => {
      const input = {
        name: 'New Group',
        description: 'New Description',
      };

      const mockCreated = {
        id: 1,
        name: 'New Group',
        description: 'New Description',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.deviceGroup.create.mockResolvedValue(mockCreated);

      const result = await groupService.create(input);

      expect(result.name).toBe('New Group');
      expect(result.description).toBe('New Description');
      expect(mockPrisma.deviceGroup.create).toHaveBeenCalledWith({
        data: {
          name: 'New Group',
          description: 'New Description',
          sortOrder: 0,
        },
      });
    });

    it('should create group with custom sortOrder', async () => {
      const input = {
        name: 'Ordered Group',
        sortOrder: 5,
      };

      const mockCreated = {
        id: 1,
        name: 'Ordered Group',
        description: null,
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.deviceGroup.create.mockResolvedValue(mockCreated);

      const result = await groupService.create(input);

      expect(result.sortOrder).toBe(5);
    });
  });

  describe('update', () => {
    it('should update group name', async () => {
      const mockExisting = {
        id: 1,
        name: 'Old Name',
        description: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        devices: [],
      };

      const mockUpdated = {
        id: 1,
        name: 'New Name',
        description: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.deviceGroup.findUnique.mockResolvedValue(mockExisting);
      mockPrisma.deviceGroup.update.mockResolvedValue(mockUpdated);

      const result = await groupService.update(1, { name: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockPrisma.deviceGroup.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'New Name' },
      });
    });

    it('should throw NotFoundError for non-existent group', async () => {
      mockPrisma.deviceGroup.findUnique.mockResolvedValue(null);

      await expect(groupService.update(999, { name: 'Test' })).rejects.toThrow(
        'Group 999 not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete group without devices', async () => {
      mockPrisma.device.count.mockResolvedValue(0);
      mockPrisma.deviceGroup.delete.mockResolvedValue({ id: 1 });

      await groupService.delete(1);

      expect(mockPrisma.deviceGroup.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error when group has devices', async () => {
      mockPrisma.device.count.mockResolvedValue(5);

      await expect(groupService.delete(1)).rejects.toThrow(
        'Cannot delete group with devices'
      );

      expect(mockPrisma.deviceGroup.delete).not.toHaveBeenCalled();
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