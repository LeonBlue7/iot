// admin-web/src/pages/__tests__/Customers.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Customers from '../Customers'
import { customerApi } from '../../services/customer.service'
import type { Customer } from '../../types/hierarchy'

vi.mock('../../services/customer.service')
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn() },
  }
})

// Helper to create properly typed mock customer
function createMockCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1,
    name: 'Test Customer',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    _count: { zones: 0 },
    ...overrides,
  }
}

const renderCustomers = () => {
  return render(
    <BrowserRouter>
      <Customers />
    </BrowserRouter>
  )
}

describe('Customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render customers heading', async () => {
    vi.mocked(customerApi.getList).mockResolvedValue([])

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('客户管理')).toBeInTheDocument()
    })
  })

  it('should display customers list', async () => {
    const mockCustomers: Customer[] = [
      createMockCustomer({ id: 1, name: 'Customer A', _count: { zones: 2 } }),
      createMockCustomer({ id: 2, name: 'Customer B', _count: { zones: 0 } }),
    ]
    vi.mocked(customerApi.getList).mockResolvedValue(mockCustomers)

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument()
      expect(screen.getByText('Customer B')).toBeInTheDocument()
    })
  })

  it('should show create button', async () => {
    vi.mocked(customerApi.getList).mockResolvedValue([])

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('新建客户')).toBeInTheDocument()
    })
  })

  it('should open create modal when clicking create button', async () => {
    vi.mocked(customerApi.getList).mockResolvedValue([])

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('新建客户')).toBeInTheDocument()
    })

    // Click create button
    fireEvent.click(screen.getByText('新建客户'))

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByLabelText('客户名称')).toBeInTheDocument()
    })
  })

  it('should call create API when submitting create form', async () => {
    vi.mocked(customerApi.getList).mockResolvedValue([])
    vi.mocked(customerApi.create).mockResolvedValue(createMockCustomer({ name: 'New Customer' }))

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('新建客户')).toBeInTheDocument()
    })

    // Click create button
    fireEvent.click(screen.getByText('新建客户'))

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByLabelText('客户名称')).toBeInTheDocument()
    })

    // Fill form
    const input = screen.getByLabelText('客户名称')
    fireEvent.change(input, { target: { value: 'New Customer' } })

    // Submit form (click OK button)
    fireEvent.click(screen.getByText('确定'))

    await waitFor(() => {
      expect(customerApi.create).toHaveBeenCalledWith({ name: 'New Customer' })
    })
  })

  it('should open edit modal when clicking edit button', async () => {
    const mockCustomers: Customer[] = [createMockCustomer({ name: 'Customer A' })]
    vi.mocked(customerApi.getList).mockResolvedValue(mockCustomers)

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument()
    })

    // Click edit button
    fireEvent.click(screen.getByText('编辑'))

    // Modal should be visible with pre-filled data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Customer A')).toBeInTheDocument()
    })
  })

  it('should call delete API when confirming delete', async () => {
    const mockCustomers: Customer[] = [createMockCustomer({ name: 'Customer A' })]
    vi.mocked(customerApi.getList).mockResolvedValue(mockCustomers)
    vi.mocked(customerApi.delete).mockResolvedValue(undefined)

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument()
    })

    // Click delete button
    fireEvent.click(screen.getByText('删除'))

    // Confirm delete in Popconfirm
    await waitFor(() => {
      expect(screen.getByText('确定删除此客户?')).toBeInTheDocument()
    })

    // Click OK in Popconfirm
    fireEvent.click(screen.getByText('确定'))

    await waitFor(() => {
      expect(customerApi.delete).toHaveBeenCalledWith(1)
    })
  })

  it('should disable delete button for customers with zones', async () => {
    const mockCustomers: Customer[] = [createMockCustomer({ name: 'Customer A', _count: { zones: 2 } })]
    vi.mocked(customerApi.getList).mockResolvedValue(mockCustomers)

    renderCustomers()

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument()
    })

    // Delete button should be disabled
    const deleteButton = screen.getByText('删除').closest('button')
    expect(deleteButton).toBeDisabled()
  })
})