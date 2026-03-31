// tests/types/group.test.ts
import { describe, it, expect } from '@jest/globals';
import type {
  Group,
  CreateGroupInput,
  UpdateGroupInput,
  GroupWithDevices,
} from '../../src/types/group.js';

describe('Group Types', () => {
  describe('Group', () => {
    it('should define Group type with required fields', () => {
      const group: Group = {
        id: 1,
        name: 'Test Group',
        zoneId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(group.id).toBe(1);
      expect(group.name).toBe('Test Group');
      expect(group.zoneId).toBe(1);
    });
  });

  describe('CreateGroupInput', () => {
    it('should require name and zoneId fields', () => {
      const input: CreateGroupInput = {
        name: 'New Group',
        zoneId: 1,
      };

      expect(input.name).toBe('New Group');
      expect(input.zoneId).toBe(1);
    });
  });

  describe('UpdateGroupInput', () => {
    it('should allow partial updates', () => {
      const input: UpdateGroupInput = {
        name: 'Updated Name',
      };

      expect(input.name).toBe('Updated Name');
    });

    it('should allow empty update', () => {
      const input: UpdateGroupInput = {};

      expect(input.name).toBeUndefined();
    });
  });

  describe('GroupWithDevices', () => {
    it('should extend Group with devices array', () => {
      const group: GroupWithDevices = {
        id: 1,
        name: 'Group with Devices',
        zoneId: 1,
        zone: { id: 1, name: 'Zone 1', customerId: 1, createdAt: new Date(), updatedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
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

      expect(group.devices).toHaveLength(1);
      expect(group.devices?.[0]?.id).toBe('device1');
      expect(group.zone.name).toBe('Zone 1');
    });
  });
});