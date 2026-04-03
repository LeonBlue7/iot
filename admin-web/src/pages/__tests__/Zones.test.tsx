// admin-web/src/pages/__tests__/Zones.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Zones from '../Zones'
import { zoneApi } from '../../services/zone.service'
import { customerApi } from '../../services/customer.service'
import type { Zone, Customer } from '../../types/hierarchy'

vi.mock('../../services/zone.service')
vi.mock('../../services/customer.service')
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return {
    ...actual,
    message: { success: vi.fn(), error: vi.fn() },
  }
})

// Helper to create properly typed mock zone
function createMockZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: 1,
    name: 'Test Zone',
    customerId: 1,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    _count: { groups: 0 },
    ...overrides,
  }
}

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

const renderZones = () => {
  return render(
    <BrowserRouter>
      <Zones />
    </BrowserRouter>
  )
}

describe('Zones', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render zones heading', async () => {
    vi.mocked(zoneApi.getList).mockResolvedValue([])
    vi.mocked(customerApi.getList).mockResolvedValue([])

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('分区管理')).toBeInTheDocument()
    })
  })

  it('should display zones list', async () => {
    const mockZones: Zone[] = [
      createMockZone({ id: 1, name: 'Zone A', _count: { groups: 3 } }),
      createMockZone({ id: 2, name: 'Zone B', _count: { groups: 0 } }),
    ]
    const mockCustomers: Customer[] = [createMockCustomer({ name: 'Customer A' })]
    vi.mocked(zoneApi.getList).mockResolvedValue(mockZones)
    vi.mocked(customerApi.getList).mockResolvedValue(mockCustomers)

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('Zone A')).toBeInTheDocument()
      expect(screen.getByText('Zone B')).toBeInTheDocument()
    })
  })

  it('should show create button', async () => {
    vi.mocked(zoneApi.getList).mockResolvedValue([])
    vi.mocked(customerApi.getList).mockResolvedValue([])

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('新建分区')).toBeInTheDocument()
    })
  })

  it('should open create modal when clicking create button', async () => {
    vi.mocked(zoneApi.getList).mockResolvedValue([])
    vi.mocked(customerApi.getList).mockResolvedValue([createMockCustomer({ name: 'Customer A' })])

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('新建分区')).toBeInTheDocument()
    })

    // Click create button
    fireEvent.click(screen.getByText('新建分区'))

    // Modal should be visible with customer select and zone name input
    await waitFor(() => {
      expect(screen.getByLabelText('分区名称')).toBeInTheDocument()
      expect(screen.getByLabelText('所属客户')).toBeInTheDocument()
    })
  })

  it('should call create API when submitting create form', async () => {
    vi.mocked(zoneApi.getList).mockResolvedValue([])
    vi.mocked(customerApi.getList).mockResolvedValue([createMockCustomer({ name: 'Customer A' })])
    vi.mocked(zoneApi.create).mockResolvedValue(createMockZone({ name: 'New Zone' }))

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('新建分区')).toBeInTheDocument()
    })

    // Click create button
    fireEvent.click(screen.getByText('新建分区'))

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByLabelText('分区名称')).toBeInTheDocument()
    })

    // Fill form
    const nameInput = screen.getByLabelText('分区名称')
    fireEvent.change(nameInput, { target: { value: 'New Zone' } })

    // Submit form (click OK button)
    fireEvent.click(screen.getByText('确定'))

    await waitFor(() => {
      expect(zoneApi.create).toHaveBeenCalledWith({ name: 'New Zone', customerId: 1 })
    })
  })

  it('should open edit modal when clicking edit button', async () => {
    const mockZones: Zone[] = [createMockZone({ name: 'Zone A' })]
    const mockCustomers: Customer[] = [createMockCustomer({ name: 'Customer A' })]
    vi.mocked(zoneApi.getList).mockResolvedValue(mockZones)
    vi.mocked(customerApi.getList).mockResolvedValue(mockCustomers)

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('Zone A')).toBeInTheDocument()
    })

    // Click edit button
    fireEvent.click(screen.getByText('编辑'))

    // Modal should be visible with pre-filled data
    await waitFor(() => {
      expect(screen.getByDisplayValue('Zone A')).toBeInTheDocument()
    })
  })

  it('should call delete API when confirming delete', async () => {
    const mockZones: Zone[] = [createMockZone({ name: 'Zone A' })]
    vi.mocked(zoneApi.getList).mockResolvedValue(mockZones)
    vi.mocked(customerApi.getList).mockResolvedValue([])
    vi.mocked(zoneApi.delete).mockResolvedValue(undefined)

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('Zone A')).toBeInTheDocument()
    })

    // Click delete button
    fireEvent.click(screen.getByText('删除'))

    // Confirm delete in Popconfirm
    await waitFor(() => {
      expect(screen.getByText('确定删除此分区?')).toBeInTheDocument()
    })

    // Click OK in Popconfirm
    fireEvent.click(screen.getByText('确定'))

    await waitFor(() => {
      expect(zoneApi.delete).toHaveBeenCalledWith(1)
    })
  })

  it('should disable delete button for zones with groups', async () => {
    const mockZones: Zone[] = [createMockZone({ name: 'Zone A', _count: { groups: 2 } })]
    vi.mocked(zoneApi.getList).mockResolvedValue(mockZones)
    vi.mocked(customerApi.getList).mockResolvedValue([])

    renderZones()

    await waitFor(() => {
      expect(screen.getByText('Zone A')).toBeInTheDocument()
    })

    // Delete button should be disabled
    const deleteButton = screen.getByText('删除').closest('button')
    expect(deleteButton).toBeDisabled()
  })
})