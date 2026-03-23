import { describe, it, expect, beforeEach, vi } from 'vitest'
import { statsApi } from '../stats.service'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

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
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await statsApi.getOverview()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/stats/overview')
      expect(result).toEqual(mockStats)
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'Stats Error' }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(statsApi.getOverview()).rejects.toThrow('Stats Error')
    })
  })
})
