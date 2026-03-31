// admin-web/src/services/batch.service.ts
import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'
import type { Device } from '../types/device'
import type {
  BatchControlInput,
  BatchParamsInput,
  BatchMoveInput,
  BatchToggleInput,
  DeviceSearchParams,
  BatchOperationResult,
} from '../types/hierarchy'

export const batchApi = {
  /**
   * Batch control devices
   */
  async control(input: BatchControlInput): Promise<BatchOperationResult> {
    const response = await axios.post<ApiResponse<BatchOperationResult>>('/batch/control', input)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '批量控制失败')
    }

    return response.data.data
  },

  /**
   * Batch update device params
   */
  async updateParams(input: BatchParamsInput): Promise<BatchOperationResult> {
    const response = await axios.post<ApiResponse<BatchOperationResult>>('/batch/params', input)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '批量参数设置失败')
    }

    return response.data.data
  },

  /**
   * Batch move devices to group
   */
  async moveToGroup(input: BatchMoveInput): Promise<BatchOperationResult> {
    const response = await axios.post<ApiResponse<BatchOperationResult>>('/batch/move', input)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '批量移动失败')
    }

    return response.data.data
  },

  /**
   * Batch toggle devices enabled status
   */
  async toggleEnabled(input: BatchToggleInput): Promise<BatchOperationResult> {
    const response = await axios.post<ApiResponse<BatchOperationResult>>('/batch/toggle', input)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '批量启用/禁用失败')
    }

    return response.data.data
  },

  /**
   * Search devices
   */
  async search(params: DeviceSearchParams): Promise<Device[]> {
    const response = await axios.get<ApiResponse<Device[]>>('/batch/search', { params })

    if (!response.data.success) {
      throw new Error((response.data as any).error || '搜索设备失败')
    }

    return response.data.data
  },
}