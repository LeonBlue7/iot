// admin-web/src/services/zone.service.ts
import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'
import type { Zone, CreateZoneInput, UpdateZoneInput } from '../types/hierarchy'

export const zoneApi = {
  /**
   * Get zone list
   */
  async getList(): Promise<Zone[]> {
    const response = await axios.get<ApiResponse<Zone[]>>('/zones')

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取分区列表失败')
    }

    return response.data.data
  },

  /**
   * Get zone by ID
   */
  async getById(id: number): Promise<Zone> {
    const response = await axios.get<ApiResponse<Zone>>(`/zones/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取分区详情失败')
    }

    return response.data.data
  },

  /**
   * Get zones by customer ID
   */
  async getByCustomerId(customerId: number): Promise<Zone[]> {
    const response = await axios.get<ApiResponse<Zone[]>>(`/zones/customer/${customerId}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取客户分区失败')
    }

    return response.data.data
  },

  /**
   * Create zone
   */
  async create(data: CreateZoneInput): Promise<Zone> {
    const response = await axios.post<ApiResponse<Zone>>('/zones', data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '创建分区失败')
    }

    return response.data.data
  },

  /**
   * Update zone
   */
  async update(id: number, data: UpdateZoneInput): Promise<Zone> {
    const response = await axios.put<ApiResponse<Zone>>(`/zones/${id}`, data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新分区失败')
    }

    return response.data.data
  },

  /**
   * Delete zone
   */
  async delete(id: number): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`/zones/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '删除分区失败')
    }
  },
}