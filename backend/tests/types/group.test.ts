// tests/types/group.test.ts
import { describe, it, expect } from '@jest/globals';
import type {
  DeviceGroup,
  CreateGroupInput,
  UpdateGroupInput,
  GroupWithDevices,
} from '../../src/types/group.js';

describe('Group Types', () => {
  describe('DeviceGroup', () => {
    it('should define DeviceGroup type with required fields', () => {
      const group: DeviceGroup = {
        id: 1,
        name: 'Test Group',
        description: 'Test Description',
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(group.id).toBe(1);
      expect(group.name).toBe('Test Group');
      expect(group.description).toBe('Test Description');
      expect(group.sortOrder).toBe(0);
    });

    it('should allow null description', () => {
      const group: DeviceGroup = {
        id: 1,
        name: 'Test',
        description: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(group.description).toBeNull();
    });
  });

  describe('CreateGroupInput', () => {
    it('should require name field', () => {
      const input: CreateGroupInput = {
        name: 'New Group',
      };

      expect(input.name).toBe('New Group');
    });

    it('should allow optional fields', () => {
      const input: CreateGroupInput = {
        name: 'New Group',
        description: 'Description',
        sortOrder: 1,
      };

      expect(input.description).toBe('Description');
      expect(input.sortOrder).toBe(1);
    });

    it('should allow null description', () => {
      const input: CreateGroupInput = {
        name: 'New Group',
        description: null,
      };

      expect(input.description).toBeNull();
    });
  });

  describe('UpdateGroupInput', () => {
    it('should allow partial updates', () => {
      const input: UpdateGroupInput = {
        name: 'Updated Name',
      };

      expect(input.name).toBe('Updated Name');
      expect(input.description).toBeUndefined();
      expect(input.sortOrder).toBeUndefined();
    });

    it('should allow updating all fields', () => {
      const input: UpdateGroupInput = {
        name: 'Updated',
        description: 'New Description',
        sortOrder: 5,
      };

      expect(input.name).toBe('Updated');
      expect(input.description).toBe('New Description');
      expect(input.sortOrder).toBe(5);
    });
  });

  describe('GroupWithDevices', () => {
    it('should extend DeviceGroup with devices array', () => {
      const group: GroupWithDevices = {
        id: 1,
        name: 'Group with Devices',
        description: null,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      expect(group.devices).toHaveLength(1);
      expect(group.devices?.[0]?.id).toBe('device1');
    });
  });
});