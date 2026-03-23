import { describe, it, expect, beforeEach, vi } from 'vitest'
import { alarmApi } from '../alarm.service'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

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
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      const result = await alarmApi.getList()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/alarms', { params: undefined })
      expect(result).toEqual(mockAlarms)
    })

    it('should pass params to API', async () => {
      const mockAlarms = [{ id: 1, deviceId: '123456789012345', alarmType: 'TEMP_HIGH', status: 0 }]
      const mockResponse = { success: true as const, data: mockAlarms }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await alarmApi.getList({ page: 1, limit: 10, status: 0 })

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/alarms', {
        params: { page: 1, limit: 10, status: 0 },
      })
    })

    it('should throw error on failed request', async () => {
      const mockResponse = { success: false as const, error: 'API Error' }
      mockedAxios.get.mockResolvedValue({ data: mockResponse } as any)

      await expect(alarmApi.getList()).rejects.toThrow('API Error')
    })
  })

  describe('acknowledge', () => {
    it('should acknowledge an alarm', async () => {
      const mockResponse = { success: true as const, data: undefined }
      mockedAxios.put.mockResolvedValue({ data: mockResponse } as any)

      await alarmApi.acknowledge(1)

      expect(mockedAxios.put).toHaveBeenCalledWith('/api/alarms/1/acknowledge')
    })

    it('should throw error on acknowledge failure', async () => {
      const mockResponse = { success: false as const, error: 'Ack failed' }
      mockedAxios.put.mockResolvedValue({ data: mockResponse } as any)

      await expect(alarmApi.acknowledge(1)).rejects.toThrow('Ack failed')
    })
  })
})
