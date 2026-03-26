import { describe, it, expect, beforeEach, vi } from 'vitest'
import { statsApi } from '../stats.service'

// Use vi.hoisted to define mock before vi.mock is hoisted
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

      expect(mockAxios.get).toHaveBeenCalledWith('/api/stats/overview')
      expect(result).toEqual(mockStats)
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'Stats Error' }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(statsApi.getOverview()).rejects.toThrow('Stats Error')
    })
  })
})