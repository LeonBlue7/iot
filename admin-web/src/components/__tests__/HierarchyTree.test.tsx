// admin-web/src/components/__tests__/HierarchyTree.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HierarchyTree } from '../HierarchyTree'
import type { HierarchyTreeNode } from '../../types/hierarchy'

// Helper to recursively render tree nodes in mock
const renderMockTreeNode = (
  node: HierarchyTreeNode,
  onSelect: (keys: string[], info: { node: HierarchyTreeNode }) => void,
  selectedKeys: string[]
): JSX.Element => {
  const isSelected = selectedKeys.includes(node.key)
  const displayTitle = node.level === 'group' && node.deviceCount !== undefined
    ? `${node.title} (${node.deviceCount})`
    : node.level === 'zone' && node.deviceCount !== undefined
    ? `${node.title} (${node.deviceCount})`
    : node.title

  return (
    <div key={node.key} data-testid={`tree-node-${node.key}`} data-level={node.level}>
      <button
        data-testid={`select-${node.key}`}
        onClick={() => onSelect([node.key], { node })}
        data-selected={isSelected}
      >
        {displayTitle}
      </button>
      {node.children?.map((child) => renderMockTreeNode(child, onSelect, selectedKeys))}
    </div>
  )
}

// Mock Ant Design Tree component
vi.mock('antd', () => {
  const MockTree = ({ treeData, onSelect, selectedKeys }: any) => (
    <div data-testid="tree">
      {treeData?.map((node: HierarchyTreeNode) =>
        renderMockTreeNode(node, onSelect, selectedKeys || [])
      )}
    </div>
  )

  return {
    Tree: MockTree,
    Spin: ({ spinning, children }: any) => (
      <div data-testid="spin" data-spinning={String(spinning)}>
        {children}
      </div>
    ),
  }
})

// Mock icons
vi.mock('@ant-design/icons', () => ({
  FolderOutlined: () => <span data-testid="folder-icon" />,
  HomeOutlined: () => <span data-testid="home-icon" />,
  AppstoreOutlined: () => <span data-testid="appstore-icon" />,
}))

const mockCustomerApi = vi.hoisted(() => ({
  getList: vi.fn(),
}))

const mockZoneApi = vi.hoisted(() => ({
  getByCustomerId: vi.fn(),
}))

const mockGroupApi = vi.hoisted(() => ({
  getByZoneId: vi.fn(),
}))

vi.mock('../../services/customer.service', () => ({
  customerApi: mockCustomerApi,
}))

vi.mock('../../services/zone.service', () => ({
  zoneApi: mockZoneApi,
}))

vi.mock('../../services/group.service', () => ({
  groupApi: mockGroupApi,
}))

describe('HierarchyTree', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading state', () => {
    it('should show loading spinner while fetching data', async () => {
      mockCustomerApi.getList.mockImplementation(() => new Promise(() => {}))

      render(<HierarchyTree onSelect={mockOnSelect} />)

      expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'true')
    })
  })

  describe('Tree rendering', () => {
    it('should render customer nodes', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01', _count: { zones: 2 } },
        { id: 2, name: 'Customer B', createdAt: '2024-01-02', updatedAt: '2024-01-02', _count: { zones: 1 } },
      ]
      mockCustomerApi.getList.mockResolvedValue(mockCustomers)
      mockZoneApi.getByCustomerId.mockResolvedValue([])
      mockGroupApi.getByZoneId.mockResolvedValue([])

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      expect(screen.getByText('Customer A')).toBeInTheDocument()
      expect(screen.getByText('Customer B')).toBeInTheDocument()
    })

    it('should render zones under customer', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      const mockZones = [
        { id: 1, name: 'Zone 1', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
        { id: 2, name: 'Zone 2', customerId: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02' },
      ]
      mockCustomerApi.getList.mockResolvedValue(mockCustomers)
      mockZoneApi.getByCustomerId.mockResolvedValue(mockZones)
      mockGroupApi.getByZoneId.mockResolvedValue([])

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      // Check zones are rendered
      expect(screen.getByTestId('tree-node-zone-1')).toBeInTheDocument()
      expect(screen.getByTestId('tree-node-zone-2')).toBeInTheDocument()
    })

    it('should render groups under zone', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      const mockZones = [
        { id: 1, name: 'Zone 1', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      const mockGroups = [
        { id: 1, name: 'Group 1', zoneId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01', _count: { devices: 5 } },
        { id: 2, name: 'Group 2', zoneId: 1, createdAt: '2024-01-02', updatedAt: '2024-01-02', _count: { devices: 3 } },
      ]
      mockCustomerApi.getList.mockResolvedValue(mockCustomers)
      mockZoneApi.getByCustomerId.mockResolvedValue(mockZones)
      mockGroupApi.getByZoneId.mockResolvedValue(mockGroups)

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      // Check groups are rendered
      expect(screen.getByTestId('tree-node-group-1')).toBeInTheDocument()
      expect(screen.getByTestId('tree-node-group-2')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should call onSelect when customer is selected', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      mockCustomerApi.getList.mockResolvedValue(mockCustomers)
      mockZoneApi.getByCustomerId.mockResolvedValue([])
      mockGroupApi.getByZoneId.mockResolvedValue([])

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      fireEvent.click(screen.getByTestId('select-customer-1'))

      expect(mockOnSelect).toHaveBeenCalledWith({
        level: 'customer',
        id: 1,
        parentId: undefined,
      })
    })

    it('should call onSelect when zone is selected', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      const mockZones = [
        { id: 1, name: 'Zone 1', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      mockCustomerApi.getList.mockResolvedValue(mockCustomers)
      mockZoneApi.getByCustomerId.mockResolvedValue(mockZones)
      mockGroupApi.getByZoneId.mockResolvedValue([])

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      fireEvent.click(screen.getByTestId('select-zone-1'))

      expect(mockOnSelect).toHaveBeenCalledWith({
        level: 'zone',
        id: 1,
        parentId: 1,
      })
    })

    it('should call onSelect when group is selected', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      const mockZones = [
        { id: 1, name: 'Zone 1', customerId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      const mockGroups = [
        { id: 1, name: 'Group 1', zoneId: 1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      mockCustomerApi.getList.mockResolvedValue(mockCustomers)
      mockZoneApi.getByCustomerId.mockResolvedValue(mockZones)
      mockGroupApi.getByZoneId.mockResolvedValue(mockGroups)

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      fireEvent.click(screen.getByTestId('select-group-1'))

      expect(mockOnSelect).toHaveBeenCalledWith({
        level: 'group',
        id: 1,
        parentId: 1,
      })
    })
  })

  describe('Error handling', () => {
    it('should show empty tree on API error', async () => {
      mockCustomerApi.getList.mockRejectedValue(new Error('Network error'))

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      expect(screen.getByTestId('tree')).toBeInTheDocument()
      expect(screen.queryByTestId('tree-node-customer-1')).not.toBeInTheDocument()
    })
  })

  describe('Empty data', () => {
    it('should render empty tree when no customers', async () => {
      mockCustomerApi.getList.mockResolvedValue([])
      mockZoneApi.getByCustomerId.mockResolvedValue([])
      mockGroupApi.getByZoneId.mockResolvedValue([])

      render(<HierarchyTree onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      expect(screen.getByTestId('tree')).toBeInTheDocument()
      expect(screen.queryByTestId('tree-node-customer-1')).not.toBeInTheDocument()
    })
  })

  describe('Initial selection', () => {
    it('should highlight initially selected node', async () => {
      const mockCustomers = [
        { id: 1, name: 'Customer A', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ]
      mockCustomerApi.getList.mockResolvedValue(mockCustomers)
      mockZoneApi.getByCustomerId.mockResolvedValue([])
      mockGroupApi.getByZoneId.mockResolvedValue([])

      render(<HierarchyTree onSelect={mockOnSelect} initialSelected={{ level: 'customer', id: 1 }} />)

      await waitFor(() => {
        expect(screen.getByTestId('spin')).toHaveAttribute('data-spinning', 'false')
      })

      expect(screen.getByTestId('select-customer-1')).toHaveAttribute('data-selected', 'true')
    })
  })
})