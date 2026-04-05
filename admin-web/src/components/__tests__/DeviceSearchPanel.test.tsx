// admin-web/src/components/__tests__/DeviceSearchPanel.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeviceSearchPanel } from '../DeviceSearchPanel'

// Mock Ant Design components
vi.mock('antd', () => {
  const MockInput = ({ placeholder, onChange, value, onKeyDown, style }: any) => (
    <input
      data-testid="search-input"
      placeholder={placeholder}
      value={value || ''}
      style={style}
      onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      onKeyDown={onKeyDown}
    />
  )

  const MockSelect = ({ placeholder, onChange, options, value, style }: any) => (
    <select
      data-testid={`select-${placeholder?.toLowerCase().replace(' ', '-')}`}
      value={value || ''}
      style={style}
      onChange={(e) => onChange?.(e.target.value || undefined)}
    >
      <option value="">All</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )

  const MockButton = ({ children, onClick, type }: any) => (
    <button data-testid={`btn-${type || 'default'}`} onClick={onClick}>
      {children}
    </button>
  )

  const MockSpace = ({ children }: any) => <div data-testid="space">{children}</div>

  return {
    Input: MockInput,
    Select: MockSelect,
    Button: MockButton,
    Space: MockSpace,
  }
})

// Mock icons
vi.mock('@ant-design/icons', () => ({
  SearchOutlined: () => <span data-testid="search-icon">Search</span>,
  ReloadOutlined: () => <span data-testid="reload-icon">Reload</span>,
}))

describe('DeviceSearchPanel', () => {
  const mockOnSearch = vi.fn()
  const mockOnReset = vi.fn()

  const defaultFilters = {
    customers: [{ id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
    zones: [{ id: 1, name: 'Zone 1', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
    groups: [{ id: 1, name: 'Group 1', zoneId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render search input', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      expect(screen.getByTestId('search-input')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('搜索设备...')).toBeInTheDocument()
    })

    it('should render customer select', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      expect(screen.getByTestId('select-选择客户')).toBeInTheDocument()
    })

    it('should render zone select', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      expect(screen.getByTestId('select-选择分区')).toBeInTheDocument()
    })

    it('should render group select', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      expect(screen.getByTestId('select-选择分组')).toBeInTheDocument()
    })

    it('should render search button', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      expect(screen.getByTestId('btn-primary')).toBeInTheDocument()
    })

    it('should render reset button', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      expect(screen.getByTestId('btn-default')).toBeInTheDocument()
    })
  })

  describe('Search functionality', () => {
    it('should call onSearch with keyword when pressing Enter', async () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'AC-001' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(mockOnSearch).toHaveBeenCalledWith({ keyword: 'AC-001' })
    })

    it('should call onSearch when clicking search button', async () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'AC-001' } })
      fireEvent.click(screen.getByTestId('btn-primary'))

      expect(mockOnSearch).toHaveBeenCalledWith({ keyword: 'AC-001' })
    })

    it('should call onSearch with customer filter', async () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      const select = screen.getByTestId('select-选择客户')
      fireEvent.change(select, { target: { value: '1' } })
      fireEvent.click(screen.getByTestId('btn-primary'))

      expect(mockOnSearch).toHaveBeenCalledWith({ customerId: '1' })
    })
  })

  describe('Reset functionality', () => {
    it('should clear all filters when clicking reset', async () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      const input = screen.getByTestId('search-input')
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.click(screen.getByTestId('btn-default'))

      expect(mockOnReset).toHaveBeenCalled()
    })
  })

  describe('Filter options', () => {
    it('should populate customer options from filters', () => {
      const filters = {
        customers: [
          { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
          { id: 2, name: 'Customer B', createdAt: '2024-01-02', updatedAt: '2024-01-02' },
        ],
        zones: [],
        groups: [],
      }

      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={filters} />)

      const select = screen.getByTestId('select-选择客户')
      expect(select.querySelector('option[value="1"]')?.textContent).toBe('Customer A')
      expect(select.querySelector('option[value="2"]')?.textContent).toBe('Customer B')
    })

    it('should handle empty filters', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={{ customers: [], zones: [], groups: [] }} />)

      const select = screen.getByTestId('select-选择客户')
      // The mock Select always returns "All" for empty option
      expect(select.querySelector('option[value=""]')?.textContent).toBe('All')
    })
  })

  describe('Initial values', () => {
    it('should display initial keyword', () => {
      render(
        <DeviceSearchPanel
          onSearch={mockOnSearch}
          onReset={mockOnReset}
          filters={defaultFilters}
          initialParams={{ keyword: 'initial' }}
        />
      )

      expect(screen.getByTestId('search-input')).toHaveValue('initial')
    })
  })

  describe('Edge cases', () => {
    it('should handle search with empty keyword', async () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={defaultFilters} />)

      fireEvent.click(screen.getByTestId('btn-primary'))

      expect(mockOnSearch).toHaveBeenCalledWith({})
    })

    it('should handle null filters', () => {
      render(<DeviceSearchPanel onSearch={mockOnSearch} onReset={mockOnReset} filters={null as any} />)

      expect(screen.getByTestId('search-input')).toBeInTheDocument()
    })
  })
})