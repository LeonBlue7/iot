// admin-web/src/services/__tests__/zone.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { zoneApi } from '../zone.service'
import type { Zone, CreateZoneInput, UpdateZoneInput } from '../../types/hierarchy'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('zoneApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return zone list', async () => {
      const mockZones: Zone[] = [
        { id: 1, name: 'Zone A', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01', _count: { groups: 3 } },
        { id: 2, name: 'Zone B', customerId: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02', _count: { groups: 0 } },
      ]
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockZones } })

      const result = await zoneApi.getList()

      expect(mockAxios.get).toHaveBeenCalledWith('/zones')
      expect(result).toEqual(mockZones)
    })

    it('should throw error on failed request', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Not found' } })

      await expect(zoneApi.getList()).rejects.toThrow('Not found')
    })

    it('should throw default error message when no error provided', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false } })

      await expect(zoneApi.getList()).rejects.toThrow('获取分区列表失败')
    })
  })

  describe('getById', () => {
    it('should return zone details with groups', async () => {
      const mockZone: Zone = {
        id: 1,
        name: 'Zone A',
        customerId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        groups: [
          { id: 1, name: 'Group 1', zoneId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockZone } })

      const result = await zoneApi.getById(1)

      expect(mockAxios.get).toHaveBeenCalledWith('/zones/1')
      expect(result).toEqual(mockZone)
    })

    it('should throw error when zone not found', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Zone not found' } })

      await expect(zoneApi.getById(999)).rejects.toThrow('Zone not found')
    })
  })

  describe('getByCustomerId', () => {
    it('should return zones for a specific customer', async () => {
      const mockZones: Zone[] = [
        { id: 1, name: 'Zone A', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, name: 'Zone B', customerId: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
      ]
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockZones } })

      const result = await zoneApi.getByCustomerId(1)

      expect(mockAxios.get).toHaveBeenCalledWith('/zones/customer/1')
      expect(result).toEqual(mockZones)
    })

    it('should return empty array when customer has no zones', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      const result = await zoneApi.getByCustomerId(999)

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create zone successfully', async () => {
      const input: CreateZoneInput = { name: 'New Zone', customerId: 1 }
      const mockCreated: Zone = {
        id: 3,
        name: 'New Zone',
        customerId: 1,
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockCreated } })

      const result = await zoneApi.create(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/zones', input)
      expect(result).toEqual(mockCreated)
    })

    it('should throw error on create failure', async () => {
      const input: CreateZoneInput = { name: 'New Zone', customerId: 1 }
      mockAxios.post.mockResolvedValue({ data: { success: false, error: 'Customer not found' } })

      await expect(zoneApi.create(input)).rejects.toThrow('Customer not found')
    })
  })

  describe('update', () => {
    it('should update zone successfully', async () => {
      const input: UpdateZoneInput = { name: 'Updated Zone' }
      const mockUpdated: Zone = {
        id: 1,
        name: 'Updated Zone',
        customerId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-04',
      }
      mockAxios.put.mockResolvedValue({ data: { success: true, data: mockUpdated } })

      const result = await zoneApi.update(1, input)

      expect(mockAxios.put).toHaveBeenCalledWith('/zones/1', input)
      expect(result).toEqual(mockUpdated)
    })

    it('should throw error on update failure', async () => {
      mockAxios.put.mockResolvedValue({ data: { success: false, error: 'Update failed' } })

      await expect(zoneApi.update(1, { name: 'Test' })).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should delete zone successfully', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } })

      await zoneApi.delete(1)

      expect(mockAxios.delete).toHaveBeenCalledWith('/zones/1')
    })

    it('should throw error when deleting zone with groups', async () => {
      mockAxios.delete.mockResolvedValue({
        data: { success: false, error: 'Cannot delete zone with existing groups' }
      })

      await expect(zoneApi.delete(1)).rejects.toThrow('Cannot delete zone with existing groups')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty zone list', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      const result = await zoneApi.getList()

      expect(result).toEqual([])
    })

    it('should handle zone with no groups count', async () => {
      const mockZone: Zone = {
        id: 1,
        name: 'Zone A',
        customerId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockZone } })

      const result = await zoneApi.getById(1)

      expect(result._count).toBeUndefined()
    })

    it('should handle network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      await expect(zoneApi.getList()).rejects.toThrow('Network error')
    })

    it('should handle zone with customer info', async () => {
      const mockZone: Zone = {
        id: 1,
        name: 'Zone A',
        customerId: 1,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        customer: { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockZone } })

      const result = await zoneApi.getById(1)

      expect(result.customer).toBeDefined()
      expect(result.customer?.name).toBe('Customer A')
    })
  })
})