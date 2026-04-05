import type { AlarmRecord } from '../types/alarm'
import type { ApiResponse } from '../types/api'
import axios from '../utils/axios'

export interface AlarmListParams {
  page?: number
  limit?: number
  status?: number
  deviceId?: string
  alarmType?: string
}

export const alarmApi = {
  /**
   * Get alarm list
   */
  async getList(params?: AlarmListParams): Promise<AlarmRecord[]> {
    const response = await axios.get<ApiResponse<AlarmRecord[]>>(
      '/alarms',
      { params },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取告警列表失败')
    }

    return response.data.data
  },

  /**
   * Acknowledge alarm
   */
  async acknowledge(id: number): Promise<void> {
    const response = await axios.put<ApiResponse<void>>(
      `/alarms/${id}/acknowledge`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '确认告警失败')
    }
  },

  /**
   * Resolve alarm
   */
  async resolve(id: number): Promise<void> {
    const response = await axios.put<ApiResponse<void>>(
      `/alarms/${id}/resolve`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '解决告警失败')
    }
  },
}