import type { AlarmRecord } from '../types/alarm'
import type { ApiResponse } from '../types/api'
import axios from 'axios'

export interface AlarmListParams {
  page?: number
  limit?: number
  status?: number
}

export const alarmApi = {
  /**
   * 获取告警列表
   */
  async getList(params?: AlarmListParams): Promise<AlarmRecord[]> {
    const response = await axios.get<ApiResponse<AlarmRecord[]>>(
      '/api/alarms',
      { params },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取告警列表失败')
    }

    return response.data.data
  },

  /**
   * 确认告警
   */
  async acknowledge(id: number): Promise<void> {
    const response = await axios.put<ApiResponse<void>>(
      `/api/alarms/${id}/acknowledge`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '确认告警失败')
    }
  },
}
