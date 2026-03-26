import { describe, it, expect, beforeEach, vi } from 'vitest'
import { alarmApi } from '../alarm.service'

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

describe('alarmApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return alarm list on successful request', async () => {
      const mockAlarms = [
        { id: 1, deviceId: '123456789012345', alarmType: 'TEMP_HIGH', status: 0 },
      ]
      const mockResponse = { success: true as const, data: mockAlarms }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await alarmApi.getList()

      expect(mockAxios.get).toHaveBeenCalledWith('/api/alarms', { params: undefined })
      expect(result).toEqual(mockAlarms)
    })

    it('should pass params to API', async () => {
      const mockAlarms = [{ id: 1, deviceId: '123456789012345', alarmType: 'TEMP_HIGH', status: 0 }]
      const mockResponse = { success: true as const, data: mockAlarms }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await alarmApi.getList({ page: 1, limit: 10, status: 0 })

      expect(mockAxios.get).toHaveBeenCalledWith('/api/alarms', {
        params: { page: 1, limit: 10, status: 0 },
      })
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'API Error' }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(alarmApi.getList()).rejects.toThrow('API Error')
    })
  })

  describe('acknowledge', () => {
    it('should acknowledge an alarm', async () => {
      const mockResponse = { success: true as const, data: undefined }
      mockAxios.put.mockResolvedValue({ data: mockResponse } as any)

      await alarmApi.acknowledge(1)

      expect(mockAxios.put).toHaveBeenCalledWith('/api/alarms/1/acknowledge')
    })

    it('should throw error on acknowledge failure', async () => {
      const mockResponse = { success: false as const, error: 'Ack failed' }
      mockAxios.put.mockResolvedValue({ data: mockResponse } as any)

      await expect(alarmApi.acknowledge(1)).rejects.toThrow('Ack failed')
    })
  })
})