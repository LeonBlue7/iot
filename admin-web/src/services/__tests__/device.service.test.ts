import { describe, it, expect, beforeEach, vi } from 'vitest'
import { deviceApi } from '../device.service'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

describe('deviceApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return device list on successful request', async () => {
      const mockDevices = [
        { id: '123456789012345', name: 'Test Device', online: true },
      ]
      const mockResponse = { success: true as const, data: mockDevices }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await deviceApi.getList()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/devices', { params: undefined })
      expect(result.data).toEqual(mockDevices)
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'API Error' }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(deviceApi.getList()).rejects.toThrow('API Error')
    })

    it('should pass params to API', async () => {
      const mockDevices = [{ id: '123456789012345', name: 'Test', online: true }]
      const mockResponse = { success: true as const, data: mockDevices }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.getList({ page: 1, limit: 10, online: true })

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/devices', {
        params: { page: 1, limit: 10, online: true },
      })
    })
  })

  describe('getById', () => {
    it('should return device detail on successful request', async () => {
      const mockDevice = { id: '123456789012345', name: 'Test Device', online: true }
      const mockResponse = { success: true as const, data: mockDevice }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await deviceApi.getById('123456789012345')

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/devices/123456789012345')
      expect(result).toEqual(mockDevice)
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'Not found' }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(deviceApi.getById('123456789012345')).rejects.toThrow('Not found')
    })
  })

  describe('getRealtimeData', () => {
    it('should return realtime sensor data', async () => {
      const mockData = { temperature: 25.5, humidity: 60 }
      const mockResponse = { success: true as const, data: mockData }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await deviceApi.getRealtimeData('123456789012345')

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/devices/123456789012345/realtime')
      expect(result).toEqual(mockData)
    })
  })

  describe('getHistoryData', () => {
    it('should return history data with params', async () => {
      const mockData = [{ temperature: 25, humidity: 60 }]
      const mockResponse = { success: true as const, data: mockData }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.getHistoryData('123456789012345', {
        startTime: '2024-01-01',
        endTime: '2024-01-02',
        limit: 100,
      })

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/devices/123456789012345/history', {
        params: { startTime: '2024-01-01', endTime: '2024-01-02', limit: 100 },
      })
    })
  })

  describe('controlDevice', () => {
    it('should send control command', async () => {
      const mockResponse = { success: true as const, data: undefined }
      mockedAxios.post.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.controlDevice('123456789012345', 'on')

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/devices/123456789012345/control', {
        action: 'on',
      })
    })

    it('should throw error on control failure', async () => {
      const mockResponse = { success: false as const, error: 'Control failed' }
      mockedAxios.post.mockResolvedValue({ data: mockResponse } as any)

      await expect(deviceApi.controlDevice('123456789012345', 'on')).rejects.toThrow('Control failed')
    })
  })

  describe('update', () => {
    it('should update device info', async () => {
      const mockDevice = { id: '123456789012345', name: 'Updated' }
      const mockResponse = { success: true as const, data: mockDevice }
      mockedAxios.put.mockResolvedValue({ data: mockResponse } as any)

      await deviceApi.update('123456789012345', { name: 'Updated' })

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/devices/123456789012345', {
        name: 'Updated',
      })
    })
  })
})
