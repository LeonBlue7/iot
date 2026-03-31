import { describe, it, expect, beforeEach, vi } from 'vitest'
import { deviceApi } from '../device.service'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('deviceApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return device list on successful request', async () => {
      const mockDevices = [
        { id: '123456789012345', name: 'Test Device', online: true, enabled: true },
      ]
      const mockResponse = { success: true as const, data: mockDevices }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await deviceApi.getList()

      expect(mockAxios.get).toHaveBeenCalledWith('/devices', { params: undefined })
      expect(result.data).toEqual(mockDevices)
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'API Error' }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(deviceApi.getList()).rejects.toThrow('API Error')
    })

    it('should pass params to API', async () => {
      const mockDevices = [{ id: '123456789012345', name: 'Test', online: true, enabled: true }]
      const mockResponse = { success: true as const, data: mockDevices }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.getList({ page: 1, limit: 10, online: true })

      expect(mockAxios.get).toHaveBeenCalledWith('/devices', {
        params: { page: 1, limit: 10, online: true },
      })
    })
  })

  describe('getById', () => {
    it('should return device detail on successful request', async () => {
      const mockDevice = { id: '123456789012345', name: 'Test Device', online: true, enabled: true }
      const mockResponse = { success: true as const, data: mockDevice }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await deviceApi.getById('123456789012345')

      expect(mockAxios.get).toHaveBeenCalledWith('/devices/123456789012345')
      expect(result).toEqual(mockDevice)
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'Not found' }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(deviceApi.getById('123456789012345')).rejects.toThrow('Not found')
    })
  })

  describe('getRealtimeData', () => {
    it('should return realtime sensor data', async () => {
      const mockData = { temperature: 25.5, humidity: 60 }
      const mockResponse = { success: true as const, data: mockData }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await deviceApi.getRealtimeData('123456789012345')

      expect(mockAxios.get).toHaveBeenCalledWith('/devices/123456789012345/realtime')
      expect(result).toEqual(mockData)
    })
  })

  describe('getHistoryData', () => {
    it('should return history data with params', async () => {
      const mockData = [{ temperature: 25, humidity: 60 }]
      const mockResponse = { success: true as const, data: mockData }
      mockAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.getHistoryData('123456789012345', {
        startTime: '2024-01-01',
        endTime: '2024-01-02',
        limit: 100,
      })

      expect(mockAxios.get).toHaveBeenCalledWith('/devices/123456789012345/history', {
        params: { startTime: '2024-01-01', endTime: '2024-01-02', limit: 100 },
      })
    })
  })

  describe('controlDevice', () => {
    it('should send control command', async () => {
      const mockResponse = { success: true as const, data: undefined }
      mockAxios.post.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.controlDevice('123456789012345', 'on')

      expect(mockAxios.post).toHaveBeenCalledWith('/devices/123456789012345/control', {
        action: 'on',
      })
    })

    it('should throw error on control failure', async () => {
      const mockResponse = { success: false as const, error: 'Control failed' }
      mockAxios.post.mockResolvedValue({ data: mockResponse } as any)

      await expect(deviceApi.controlDevice('123456789012345', 'on')).rejects.toThrow('Control failed')
    })
  })

  describe('update', () => {
    it('should update device info', async () => {
      const mockDevice = { id: '123456789012345', name: 'Updated', online: true, enabled: true }
      const mockResponse = { success: true as const, data: mockDevice }
      mockAxios.put.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.update('123456789012345', { name: 'Updated' })

      expect(mockAxios.put).toHaveBeenCalledWith('/devices/123456789012345', {
        name: 'Updated',
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty device list', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      const result = await deviceApi.getList()

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should handle network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      await expect(deviceApi.getList()).rejects.toThrow('Network error')
    })
  })
})