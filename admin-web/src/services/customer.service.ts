// admin-web/src/services/customer.service.ts
import axios from '../utils/axios'
import type { ApiResponse } from '../types/api'
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../types/hierarchy'

export const customerApi = {
  /**
   * Get customer list
   */
  async getList(): Promise<Customer[]> {
    const response = await axios.get<ApiResponse<Customer[]>>('/customers')

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取客户列表失败')
    }

    return response.data.data
  },

  /**
   * Get customer by ID
   */
  async getById(id: number): Promise<Customer> {
    const response = await axios.get<ApiResponse<Customer>>(`/customers/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '获取客户详情失败')
    }

    return response.data.data
  },

  /**
   * Create customer
   */
  async create(data: CreateCustomerInput): Promise<Customer> {
    const response = await axios.post<ApiResponse<Customer>>('/customers', data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '创建客户失败')
    }

    return response.data.data
  },

  /**
   * Update customer
   */
  async update(id: number, data: UpdateCustomerInput): Promise<Customer> {
    const response = await axios.put<ApiResponse<Customer>>(`/customers/${id}`, data)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '更新客户失败')
    }

    return response.data.data
  },

  /**
   * Delete customer
   */
  async delete(id: number): Promise<void> {
    const response = await axios.delete<ApiResponse<void>>(`/customers/${id}`)

    if (!response.data.success) {
      throw new Error((response.data as any).error || '删除客户失败')
    }
  },
}