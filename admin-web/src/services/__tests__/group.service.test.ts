// admin-web/src/services/__tests__/group.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { groupApi } from '../group.service'
import type { DeviceGroup, CreateGroupInput, UpdateGroupInput } from '../../types/group'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('groupApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return group list', async () => {
      const mockGroups: DeviceGroup[] = [
        { id: 1, name: 'Group 1', zoneId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01', _count: { devices: 5 } },
        { id: 2, name: 'Group 2', zoneId: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02', _count: { devices: 0 } },
      ]
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockGroups } })

      const result = await groupApi.getList()

      expect(mockAxios.get).toHaveBeenCalledWith('/groups')
      expect(result).toEqual(mockGroups)
    })

    it('should throw error on failed request', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Not found' } })

      await expect(groupApi.getList()).rejects.toThrow('Not found')
    })
  })

  describe('getByZoneId', () => {
    it('should return groups for specific zone', async () => {
      const mockGroups: DeviceGroup[] = [
        { id: 1, name: 'Group 1', zoneId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, name: 'Group 2', zoneId: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
      ]
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockGroups } })

      const result = await groupApi.getByZoneId(1)

      expect(mockAxios.get).toHaveBeenCalledWith('/groups/zone/1')
      expect(result).toEqual(mockGroups)
    })

    it('should return empty array when zone has no groups', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      const result = await groupApi.getByZoneId(999)

      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    it('should return group details', async () => {
      const mockGroup: DeviceGroup = {
        id: 1,
        name: 'Test Group',
        zoneId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        devices: [],
        zone: { id: 1, name: 'Zone A', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockGroup } })

      const result = await groupApi.getById(1)

      expect(mockAxios.get).toHaveBeenCalledWith('/groups/1')
      expect(result).toEqual(mockGroup)
    })

    it('should throw error when group not found', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Group not found' } })

      await expect(groupApi.getById(999)).rejects.toThrow('Group not found')
    })
  })

  describe('create', () => {
    it('should create group with zoneId', async () => {
      const input: CreateGroupInput = { name: 'New Group', zoneId: 1 }
      const mockCreated: DeviceGroup = {
        id: 3,
        name: 'New Group',
        zoneId: 1,
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockCreated } })

      const result = await groupApi.create(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/groups', input)
      expect(result).toEqual(mockCreated)
    })

    it('should throw error when zone not found', async () => {
      const input: CreateGroupInput = { name: 'New Group', zoneId: 999 }
      mockAxios.post.mockResolvedValue({ data: { success: false, error: 'Zone not found' } })

      await expect(groupApi.create(input)).rejects.toThrow('Zone not found')
    })
  })

  describe('update', () => {
    it('should update group name', async () => {
      const input: UpdateGroupInput = { name: 'Updated Group' }
      const mockUpdated: DeviceGroup = {
        id: 1,
        name: 'Updated Group',
        zoneId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-04',
      }
      mockAxios.put.mockResolvedValue({ data: { success: true, data: mockUpdated } })

      const result = await groupApi.update(1, input)

      expect(mockAxios.put).toHaveBeenCalledWith('/groups/1', input)
      expect(result).toEqual(mockUpdated)
    })

    it('should update group zoneId', async () => {
      const input: UpdateGroupInput = { zoneId: 2 }
      const mockUpdated: DeviceGroup = {
        id: 1,
        name: 'Group 1',
        zoneId: 2,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-04',
      }
      mockAxios.put.mockResolvedValue({ data: { success: true, data: mockUpdated } })

      const result = await groupApi.update(1, input)

      expect(mockAxios.put).toHaveBeenCalledWith('/groups/1', input)
      expect(result.zoneId).toBe(2)
    })

    it('should throw error on update failure', async () => {
      mockAxios.put.mockResolvedValue({ data: { success: false, error: 'Update failed' } })

      await expect(groupApi.update(1, { name: 'Test' })).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should delete group', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } })

      await groupApi.delete(1)

      expect(mockAxios.delete).toHaveBeenCalledWith('/groups/1')
    })

    it('should throw error when deleting group with devices', async () => {
      mockAxios.delete.mockResolvedValue({
        data: { success: false, error: 'Cannot delete group with devices' }
      })

      await expect(groupApi.delete(1)).rejects.toThrow('Cannot delete group with devices')
    })
  })

  describe('setDevices', () => {
    it('should assign devices to group', async () => {
      mockAxios.put.mockResolvedValue({ data: { success: true } })

      await groupApi.setDevices(1, ['dev1', 'dev2'])

      expect(mockAxios.put).toHaveBeenCalledWith('/groups/1/devices', {
        deviceIds: ['dev1', 'dev2'],
      })
    })

    it('should throw error on set devices failure', async () => {
      mockAxios.put.mockResolvedValue({ data: { success: false, error: 'Group not found' } })

      await expect(groupApi.setDevices(999, ['dev1'])).rejects.toThrow('Group not found')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty group list', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      const result = await groupApi.getList()

      expect(result).toEqual([])
    })

    it('should handle group with devices', async () => {
      const mockGroup: DeviceGroup = {
        id: 1,
        name: 'Group 1',
        zoneId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        devices: [
          { id: 'dev1', name: 'Device 1', online: true, enabled: true, groupId: 1 },
        ],
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockGroup } })

      const result = await groupApi.getById(1)

      expect(result.devices).toHaveLength(1)
    })

    it('should handle network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      await expect(groupApi.getList()).rejects.toThrow('Network error')
    })
  })
})