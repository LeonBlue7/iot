import { describe, it, expect, beforeEach, vi } from 'vitest'
import { statsApi } from '../stats.service'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('statsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOverview', () => {
    it('should return overview statistics on successful request', async () => {
      const mockStats = {
        totalDevices: 10,
        onlineDevices: 8,
        offlineDevices: 2,
        totalAlarms: 5,
        unacknowledgedAlarms: 3,
      }
      const mockResponse = { success: true as const, data: mockStats }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await statsApi.getOverview()

      expect(mockAxios.get).toHaveBeenCalledWith('/stats/overview')
      expect(result).toEqual(mockStats)
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'Stats Error' }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(statsApi.getOverview()).rejects.toThrow('Stats Error')
    })
  })

  describe('Edge cases', () => {
    it('should handle zero values', async () => {
      const mockStats = {
        totalDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        totalAlarms: 0,
        unacknowledgedAlarms: 0,
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockStats } })

      const result = await statsApi.getOverview()

      expect(result.totalDevices).toBe(0)
    })

    it('should handle network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      await expect(statsApi.getOverview()).rejects.toThrow('Network error')
    })
  })
})