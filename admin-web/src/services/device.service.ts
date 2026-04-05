import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'
import type { Device, DeviceParams, SensorData, ControlAction } from '../types/device'

export interface DeviceListParams {
  page?: number
  limit?: number
  online?: boolean
  groupId?: number
  customerId?: number
  zoneId?: number
}

export interface DeviceListResponse {
  data: Device[]
  page: number
  limit: number
  total: number
}

export const deviceApi = {
  /**
   * Get device list
   */
  async getList(params?: DeviceListParams): Promise<DeviceListResponse> {
    const response = await axios.get<ApiResponse<Device[]>>(
      '/devices',
      { params },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取设备列表失败')
    }

    return {
      data: response.data.data,
      page: 1,
      limit: 50,
      total: response.data.data.length,
    }
  },

  /**
   * Get device by ID
   */
  async getById(id: string): Promise<Device> {
    const response = await axios.get<ApiResponse<Device>>(
      `/devices/${id}`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取设备详情失败')
    }

    return response.data.data
  },

  /**
   * Get realtime data
   */
  async getRealtimeData(id: string): Promise<SensorData | null> {
    const response = await axios.get<ApiResponse<SensorData | null>>(
      `/devices/${id}/realtime`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取实时数据失败')
    }

    return response.data.data
  },

  /**
   * Get history data
   */
  async getHistoryData(
    id: string,
    params?: { startTime?: string; endTime?: string; limit?: number },
  ): Promise<SensorData[]> {
    const response = await axios.get<ApiResponse<SensorData[]>>(
      `/devices/${id}/history`,
      { params },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取历史数据失败')
    }

    return response.data.data
  },

  /**
   * Control device
   */
  async controlDevice(id: string, action: ControlAction): Promise<void> {
    const response = await axios.post<ApiResponse<void>>(
      `/devices/${id}/control`,
      { action },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '控制设备失败')
    }
  },

  /**
   * Get device params
   */
  async getParams(id: string): Promise<DeviceParams | null> {
    const response = await axios.get<ApiResponse<DeviceParams | null>>(
      `/devices/${id}/params`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取设备参数失败')
    }

    return response.data.data
  },

  /**
   * Update device params
   */
  async updateParams(
    id: string,
    params: Partial<DeviceParams>,
  ): Promise<DeviceParams> {
    const response = await axios.put<ApiResponse<DeviceParams>>(
      `/devices/${id}/params`,
      params,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新设备参数失败')
    }

    return response.data.data
  },

  /**
   * Update device info
   */
  async update(
    id: string,
    data: { name?: string; productId?: string },
  ): Promise<Device> {
    const response = await axios.put<ApiResponse<Device>>(
      `/devices/${id}`,
      data,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新设备信息失败')
    }

    return response.data.data
  },
}