// admin-web/src/services/group.service.ts
import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'
import type { DeviceGroup, CreateGroupInput, UpdateGroupInput } from '../types/group'

export const groupApi = {
  /**
   * Get group list
   */
  async getList(): Promise<DeviceGroup[]> {
    const response = await axios.get<ApiResponse<DeviceGroup[]>>('/groups')

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取分组列表失败')
    }

    return response.data.data
  },

  /**
   * Get groups by zone ID
   */
  async getByZoneId(zoneId: number): Promise<DeviceGroup[]> {
    const response = await axios.get<ApiResponse<DeviceGroup[]>>(`/groups/zone/${zoneId}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取分区分组失败')
    }

    return response.data.data
  },

  /**
   * Get group by ID
   */
  async getById(id: number): Promise<DeviceGroup> {
    const response = await axios.get<ApiResponse<DeviceGroup>>(`/groups/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取分组详情失败')
    }

    return response.data.data
  },

  /**
   * Create group
   */
  async create(data: CreateGroupInput): Promise<DeviceGroup> {
    const response = await axios.post<ApiResponse<DeviceGroup>>('/groups', data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '创建分组失败')
    }

    return response.data.data
  },

  /**
   * Update group
   */
  async update(id: number, data: UpdateGroupInput): Promise<DeviceGroup> {
    const response = await axios.put<ApiResponse<DeviceGroup>>(`/groups/${id}`, data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新分组失败')
    }

    return response.data.data
  },

  /**
   * Delete group
   */
  async delete(id: number): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`/groups/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '删除分组失败')
    }
  },

  /**
   * Set group devices
   */
  async setDevices(id: number, deviceIds: string[]): Promise<void> {
    const response = await axios.put<ApiResponse<void>>(`/groups/${id}/devices`, { deviceIds })

    if (!response.data.success) {
      throw new Error((response.data as any).error || '设置分组设备失败')
    }
  },
}