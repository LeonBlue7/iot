// admin-web/src/services/__tests__/customer.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { customerApi } from '../customer.service'
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../../types/hierarchy'

const mockAxios = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../../utils/axios', () => ({
  default: mockAxios,
}))

describe('customerApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getList', () => {
    it('should return customer list', async () => {
      const mockCustomers: Customer[] = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01', _count: { zones: 2 } },
        { id: 2, name: 'Customer B', createdAt: '2024-01-02', updatedAt: '2024-01-02', _count: { zones: 0 } },
      ]
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockCustomers } })

      const result = await customerApi.getList()

      expect(mockAxios.get).toHaveBeenCalledWith('/customers')
      expect(result).toEqual(mockCustomers)
    })

    it('should throw error on failed request', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Not found' } })

      await expect(customerApi.getList()).rejects.toThrow('Not found')
    })

    it('should throw default error message when no error provided', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false } })

      await expect(customerApi.getList()).rejects.toThrow('获取客户列表失败')
    })
  })

  describe('getById', () => {
    it('should return customer details with zones', async () => {
      const mockCustomer: Customer = {
        id: 1,
        name: 'Customer A',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        zones: [
          { id: 1, name: 'Zone 1', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        ],
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockCustomer } })

      const result = await customerApi.getById(1)

      expect(mockAxios.get).toHaveBeenCalledWith('/customers/1')
      expect(result).toEqual(mockCustomer)
    })

    it('should throw error when customer not found', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: false, error: 'Customer not found' } })

      await expect(customerApi.getById(999)).rejects.toThrow('Customer not found')
    })
  })

  describe('create', () => {
    it('should create customer successfully', async () => {
      const input: CreateCustomerInput = { name: 'New Customer' }
      const mockCreated: Customer = {
        id: 3,
        name: 'New Customer',
        createdAt: '2024-01-03',
        updatedAt: '2024-01-03',
      }
      mockAxios.post.mockResolvedValue({ data: { success: true, data: mockCreated } })

      const result = await customerApi.create(input)

      expect(mockAxios.post).toHaveBeenCalledWith('/customers', input)
      expect(result).toEqual(mockCreated)
    })

    it('should throw error on create failure', async () => {
      const input: CreateCustomerInput = { name: 'New Customer' }
      mockAxios.post.mockResolvedValue({ data: { success: false, error: 'Name already exists' } })

      await expect(customerApi.create(input)).rejects.toThrow('Name already exists')
    })
  })

  describe('update', () => {
    it('should update customer successfully', async () => {
      const input: UpdateCustomerInput = { name: 'Updated Customer' }
      const mockUpdated: Customer = {
        id: 1,
        name: 'Updated Customer',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-04',
      }
      mockAxios.put.mockResolvedValue({ data: { success: true, data: mockUpdated } })

      const result = await customerApi.update(1, input)

      expect(mockAxios.put).toHaveBeenCalledWith('/customers/1', input)
      expect(result).toEqual(mockUpdated)
    })

    it('should throw error on update failure', async () => {
      mockAxios.put.mockResolvedValue({ data: { success: false, error: 'Update failed' } })

      await expect(customerApi.update(1, { name: 'Test' })).rejects.toThrow('Update failed')
    })
  })

  describe('delete', () => {
    it('should delete customer successfully', async () => {
      mockAxios.delete.mockResolvedValue({ data: { success: true } })

      await customerApi.delete(1)

      expect(mockAxios.delete).toHaveBeenCalledWith('/customers/1')
    })

    it('should throw error when deleting customer with zones', async () => {
      mockAxios.delete.mockResolvedValue({
        data: { success: false, error: 'Cannot delete customer with existing zones' }
      })

      await expect(customerApi.delete(1)).rejects.toThrow('Cannot delete customer with existing zones')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty customer list', async () => {
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [] } })

      const result = await customerApi.getList()

      expect(result).toEqual([])
    })

    it('should handle customer with no zones count', async () => {
      const mockCustomer: Customer = {
        id: 1,
        name: 'Customer A',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }
      mockAxios.get.mockResolvedValue({ data: { success: true, data: mockCustomer } })

      const result = await customerApi.getById(1)

      expect(result._count).toBeUndefined()
    })

    it('should handle network error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      await expect(customerApi.getList()).rejects.toThrow('Network error')
    })
  })
})