// admin-web/src/services/__tests__/batch.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { batchApi } from '../batch.service'
import type {
  BatchControlInput,
  BatchParamsInput,
  BatchMoveInput,
  BatchToggleInput,
  DeviceSearchParams,
} from '../../types/hierarchy'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('batchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('control', () => {
    it('should send batch control command', async () => {
      const input: BatchControlInput = { deviceIds: ['dev1', 'dev2'], action: 'on' }
      const mockResult = { success: true, successCount: 2, failCount: 0 }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.control(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/batch/control', input)
      expect(result).toEqual(mockResult)
    })

    it('should handle partial failures', async () => {
      const input: BatchControlInput = { deviceIds: ['dev1', 'dev2', 'dev3'], action: 'off' }
      const mockResult = {
        success: true,
        successCount: 2,
        failCount: 1,
        errors: ['dev3: Device offline'],
      }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.control(input)

      expect(result.failCount).toBe(1)
      expect(result.errors).toHaveLength(1)
    })

    it('should throw error on batch control failure', async () => {
      const input: BatchControlInput = { deviceIds: ['dev1'], action: 'reset' }
      mockAxios.post.mockResolvedValue({ data: { success: false, error: 'No devices selected' } })

      await expect(batchApi.control(input)).rejects.toThrow('No devices selected')
    })
  })

  describe('updateParams', () => {
    it('should batch update device params', async () => {
      const input: BatchParamsInput = {
        deviceIds: ['dev1', 'dev2'],
        params: { mode: 1, summerTempOn: 28 },
      }
      const mockResult = { success: true, successCount: 2, failCount: 0 }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.updateParams(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/batch/params', input)
      expect(result.successCount).toBe(2)
    })

    it('should throw error on params update failure', async () => {
      const input: BatchParamsInput = { deviceIds: ['dev1'], params: { mode: 1 } }
      mockAxios.post.mockResolvedValue({ data: { success: false, error: 'Invalid params' } })

      await expect(batchApi.updateParams(input)).rejects.toThrow('Invalid params')
    })
  })

  describe('moveToGroup', () => {
    it('should batch move devices to group', async () => {
      const input: BatchMoveInput = { deviceIds: ['dev1', 'dev2'], targetGroupId: 5 }
      const mockResult = { success: true, successCount: 2, failCount: 0 }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.moveToGroup(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/batch/move', input)
      expect(result.successCount).toBe(2)
    })

    it('should throw error when target group not found', async () => {
      const input: BatchMoveInput = { deviceIds: ['dev1'], targetGroupId: 999 }
      mockAxios.post.mockResolvedValue({ data: { success: false, error: 'Group not found' } })

      await expect(batchApi.moveToGroup(input)).rejects.toThrow('Group not found')
    })
  })

  describe('toggleEnabled', () => {
    it('should batch enable devices', async () => {
      const input: BatchToggleInput = { deviceIds: ['dev1', 'dev2'], enabled: true }
      const mockResult = { success: true, successCount: 2, failCount: 0 }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.toggleEnabled(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/batch/toggle', input)
      expect(result.successCount).toBe(2)
    })

    it('should batch disable devices', async () => {
      const input: BatchToggleInput = { deviceIds: ['dev1', 'dev2'], enabled: false }
      const mockResult = { success: true, successCount: 2, failCount: 0 }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.toggleEnabled(input)

      expect(result.successCount).toBe(2)
    })

    it('should throw error on toggle failure', async () => {
      const input: BatchToggleInput = { deviceIds: [], enabled: true }
      mockAxios.post.mockResolvedValue({ data: { success: false, error: 'No devices selected' } })

      await expect(batchApi.toggleEnabled(input)).rejects.toThrow('No devices selected')
    })
  })

  describe('search', () => {
    it('should search devices by keyword', async () => {
      const params: DeviceSearchParams = { keyword: 'AC-001' }
      const mockDevices = [
        { id: 'dev1', name: 'AC-001', online: true, enabled: true },
        { id: 'dev2', name: 'AC-001-B', online: false, enabled: true },
      ]
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockDevices } })

      const result = await batchApi.search(params)

      expect(mockAxios.get).toHaveBeenCalledWith('/batch/search', { params })
      expect(result).toEqual(mockDevices)
    })

    it('should search devices by hierarchy level', async () => {
      const params: DeviceSearchParams = { customerId: 1, zoneId: 2, groupId: 3 }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      await batchApi.search(params)

      expect(mockAxios.get).toHaveBeenCalledWith('/batch/search', { params })
    })

    it('should search devices by status', async () => {
      const params: DeviceSearchParams = { online: true, enabled: true }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      await batchApi.search(params)

      expect(mockAxios.get).toHaveBeenCalledWith('/batch/search', { params })
    })

    it('should search with combined filters', async () => {
      const params: DeviceSearchParams = {
        keyword: 'AC',
        customerId: 1,
        online: true,
        enabled: true,
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      await batchApi.search(params)

      expect(mockAxios.get).toHaveBeenCalledWith('/batch/search', { params })
    })

    it('should return empty array when no results', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      const result = await batchApi.search({})

      expect(result).toEqual([])
    })

    it('should throw error on search failure', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Search failed' } })

      await expect(batchApi.search({ keyword: 'test' })).rejects.toThrow('Search failed')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty deviceIds array in control', async () => {
      const input: BatchControlInput = { deviceIds: [], action: 'on' }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: { successCount: 0, failCount: 0 } } })

      const result = await batchApi.control(input)

      expect(result.successCount).toBe(0)
    })

    it('should handle all failures in batch operation', async () => {
      const input: BatchControlInput = { deviceIds: ['dev1', 'dev2'], action: 'on' }
      const mockResult = {
        success: true,
        successCount: 0,
        failCount: 2,
        errors: ['dev1: Offline', 'dev2: Disabled'],
      }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.control(input)

      expect(result.successCount).toBe(0)
      expect(result.failCount).toBe(2)
    })

    it('should handle network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      await expect(batchApi.search({})).rejects.toThrow('Network error')
    })

    it('should handle large deviceIds array', async () => {
      const deviceIds = Array.from({ length: 100 }, (_, i) => `dev${i}`)
      const input: BatchControlInput = { deviceIds, action: 'on' }
      const mockResult = { success: true, successCount: 100, failCount: 0 }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockResult } })

      const result = await batchApi.control(input)

      expect(result.successCount).toBe(100)
    })
  })
})