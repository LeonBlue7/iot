// admin-web/src/services/group.service.ts
import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'
import type { DeviceGroup, CreateGroupInput, UpdateGroupInput } from '../types/group'

export const groupApi = {
  /**
   * 获取分组列表
   */
  async getList(): Promise<DeviceGroup[]> {
    const response = await axios.get<ApiResponse<DeviceGroup[]>>('/groups')

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取分组列表失败')
    }

    return response.data.data
  },

  /**
   * 获取分组详情
   */
  async getById(id: number): Promise<DeviceGroup> {
    const response = await axios.get<ApiResponse<DeviceGroup>>(`/api/groups/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取分组详情失败')
    }

    return response.data.data
  },

  /**
   * 创建分组
   */
  async create(data: CreateGroupInput): Promise<DeviceGroup> {
    const response = await axios.post<ApiResponse<DeviceGroup>>('/groups', data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '创建分组失败')
    }

    return response.data.data
  },

  /**
   * 更新分组
   */
  async update(id: number, data: UpdateGroupInput): Promise<DeviceGroup> {
    const response = await axios.put<ApiResponse<DeviceGroup>>(`/api/groups/${id}`, data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新分组失败')
    }

    return response.data.data
  },

  /**
   * 删除分组
   */
  async delete(id: number): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`/api/groups/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '删除分组失败')
    }
  },

  /**
   * 设置分组设备
   */
  async setDevices(id: number, deviceIds: string[]): Promise<void> {
    const response = await axios.put<ApiResponse<void>>(`/api/groups/${id}/devices`, { deviceIds })

    if (!response.data.success) {
      throw new Error((response.data as any).error || '设置分组设备失败')
    }
  },
}