import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'

export interface OverviewStats {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  totalAlarms: number
  unacknowledgedAlarms: number
}

export const statsApi = {
  /**
   * 获取统计概览
   */
  async getOverview(): Promise<OverviewStats> {
    const response = await axios.get<ApiResponse<OverviewStats>>(
      '/stats/overview',
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取统计数据失败')
    }

    return response.data.data
  },
}
