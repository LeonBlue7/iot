// admin-web/src/services/user.service.ts
import api from '../utils/axios'
import type { AdminUser, UserCustomer, CreateUserData, UpdateUserData, UserListParams } from '../types/user'

export const userApi = {
  /**
   * 获取用户列表
   */
  async getList(params?: UserListParams): Promise<AdminUser[]> {
    const response = await api.get('/admin/users', { params })
    return response.data.data
  },

  /**
   * 获取单个用户
   */
  async getById(id: number): Promise<AdminUser> {
    const response = await api.get(`/admin/users/${id}`)
    return response.data.data
  },

  /**
   * 创建用户
   */
  async create(data: CreateUserData): Promise<AdminUser> {
    const response = await api.post('/admin/users', data)
    return response.data.data
  },

  /**
   * 更新用户
   */
  async update(id: number, data: UpdateUserData): Promise<AdminUser> {
    const response = await api.put(`/admin/users/${id}`, data)
    return response.data.data
  },

  /**
   * 删除用户
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/admin/users/${id}`)
  },

  /**
   * 获取用户的客户列表
   */
  async getCustomers(userId: number): Promise<UserCustomer[]> {
    const response = await api.get(`/admin/users/${userId}/customers`)
    return response.data.data
  },

  /**
   * 分配客户给用户
   */
  async assignCustomer(userId: number, customerId: number, role: string): Promise<void> {
    await api.post(`/admin/users/${userId}/customers`, { customerId, role })
  },

  /**
   * 移除用户的客户分配
   */
  async removeCustomer(userId: number, customerId: number): Promise<void> {
    await api.delete(`/admin/users/${userId}/customers/${customerId}`)
  },
}