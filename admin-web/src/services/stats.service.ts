import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'

export interface OverviewStats {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  totalAlarms: number
  unacknowledgedAlarms: number
}

export interface TrendDataPoint {
  time: string
  value: number | null
}

export interface DailyStats {
  avgTemperature: number | null
  avgHumidity: number | null
  maxTemperature: number | null
  minTemperature: number | null
  alarmCount: number
}

export type TrendMetric = 'temperature' | 'humidity' | 'current'

export interface TrendParams {
  deviceId: string
  metric: TrendMetric
  startTime: Date | string
  endTime: Date | string
}

export interface DailyParams {
  deviceId: string
  date: Date | string
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

  /**
   * 获取趋势数据
   */
  async getTrendData(params: TrendParams): Promise<TrendDataPoint[]> {
    const response = await axios.get<ApiResponse<TrendDataPoint[]>>(
      '/stats/trend',
      {
        params: {
          deviceId: params.deviceId,
          metric: params.metric,
          startTime: params.startTime instanceof Date
            ? params.startTime.toISOString()
            : params.startTime,
          endTime: params.endTime instanceof Date
            ? params.endTime.toISOString()
            : params.endTime,
        },
      },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取趋势数据失败')
    }

    return response.data.data
  },

  /**
   * 获取日统计数据
   */
  async getDailyStats(params: DailyParams): Promise<DailyStats> {
    const response = await axios.get<ApiResponse<DailyStats>>(
      '/stats/daily',
      {
        params: {
          deviceId: params.deviceId,
          date: params.date instanceof Date
            ? params.date.toISOString().split('T')[0]
            : params.date,
        },
      },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取日统计数据失败')
    }

    return response.data.data
  },
}
