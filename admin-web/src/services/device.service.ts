import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'
import type { Device, DeviceParams, SensorData, ControlAction } from '../types/device'

export interface DeviceListParams {
  page?: number
  limit?: number
  online?: boolean
}

export interface DeviceListResponse {
  data: Device[]
  page: number
  limit: number
  total: number
}

export const deviceApi = {
  /**
   * 获取设备列表
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
   * 获取设备详情
   */
  async getById(id: string): Promise<Device> {
    const response = await axios.get<ApiResponse<Device>>(
      `/api/devices/${id}`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取设备详情失败')
    }

    return response.data.data
  },

  /**
   * 获取实时数据
   */
  async getRealtimeData(id: string): Promise<SensorData | null> {
    const response = await axios.get<ApiResponse<SensorData | null>>(
      `/api/devices/${id}/realtime`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取实时数据失败')
    }

    return response.data.data
  },

  /**
   * 获取历史数据
   */
  async getHistoryData(
    id: string,
    params?: { startTime?: string; endTime?: string; limit?: number },
  ): Promise<SensorData[]> {
    const response = await axios.get<ApiResponse<SensorData[]>>(
      `/api/devices/${id}/history`,
      { params },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取历史数据失败')
    }

    return response.data.data
  },

  /**
   * 控制设备
   */
  async controlDevice(id: string, action: ControlAction): Promise<void> {
    const response = await axios.post<ApiResponse<void>>(
      `/api/devices/${id}/control`,
      { action },
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '控制设备失败')
    }
  },

  /**
   * 获取设备参数
   */
  async getParams(id: string): Promise<DeviceParams | null> {
    const response = await axios.get<ApiResponse<DeviceParams | null>>(
      `/api/devices/${id}/params`,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取设备参数失败')
    }

    return response.data.data
  },

  /**
   * 更新设备参数
   */
  async updateParams(
    id: string,
    params: Partial<DeviceParams>,
  ): Promise<DeviceParams> {
    const response = await axios.put<ApiResponse<DeviceParams>>(
      `/api/devices/${id}/params`,
      params,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新设备参数失败')
    }

    return response.data.data
  },

  /**
   * 更新设备信息
   */
  async update(
    id: string,
    data: { name?: string; productId?: string },
  ): Promise<Device> {
    const response = await axios.put<ApiResponse<Device>>(
      `/api/devices/${id}`,
      data,
    )

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新设备信息失败')
    }

    return response.data.data
  },
}
