// admin-web/src/pages/__tests__/DevicesNew.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { message } from 'antd'
import DevicesNew from '../DevicesNew'
import { deviceApi } from '../../services/device.service'
import { batchApi } from '../../services/batch.service'
import { zoneApi } from '../../services/zone.service'
import { groupApi } from '../../services/group.service'

// Mock window.getComputedStyle for jsdom
const originalGetComputedStyle = window.getComputedStyle
window.getComputedStyle = vi.fn((elt, pseudoElt) => {
  return originalGetComputedStyle(elt, pseudoElt) as CSSStyleDeclaration
})

// Mock all services
vi.mock('../../services/device.service')
vi.mock('../../services/batch.service')
vi.mock('../../services/customer.service')
vi.mock('../../services/zone.service')
vi.mock('../../services/group.service')

// Setup mock implementations for zone and group APIs
vi.mocked(zoneApi.getByCustomerId).mockResolvedValue([])
vi.mocked(groupApi.getByZoneId).mockResolvedValue([])
vi.mocked(groupApi.getList).mockResolvedValue([])

// Mock antd message
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  }
})

// Mock HierarchyTree component
vi.mock('../../components/HierarchyTree', () => ({
  HierarchyTree: ({ onSelect }: { onSelect: (selection: any) => void }) => (
    <div data-testid="hierarchy-tree">
      <button
        data-testid="select-customer"
        onClick={() => onSelect({ level: 'customer', id: 1 })}
      >
        Select Customer
      </button>
      <button
        data-testid="select-zone"
        onClick={() => onSelect({ level: 'zone', id: 2, parentId: 1 })}
      >
        Select Zone
      </button>
      <button
        data-testid="select-group"
        onClick={() => onSelect({ level: 'group', id: 3, parentId: 2 })}
      >
        Select Group
      </button>
    </div>
  ),
}))

// Mock DeviceSearchPanel component
vi.mock('../../components/DeviceSearchPanel', () => ({
  DeviceSearchPanel: ({ onSearch, onReset }: { onSearch: (params: any) => void; onReset: () => void }) => (
    <div data-testid="device-search-panel">
      <button data-testid="btn-search" onClick={() => onSearch({ keyword: 'test' })}>
        Search
      </button>
      <button data-testid="btn-reset" onClick={onReset}>
        Reset
      </button>
    </div>
  ),
}))

// Mock BatchActionBar component
vi.mock('../../components/BatchActionBar', () => ({
  BatchActionBar: ({ selectedCount, onBatchControl, onBatchMove, onBatchParams, onBatchToggle, onBatchDelete }: any) => (
    <div data-testid="batch-action-bar">
      <span data-testid="selected-count">{selectedCount} items selected</span>
      <button data-testid="btn-batch-on" onClick={() => onBatchControl('on')}>
        Turn On
      </button>
      <button data-testid="btn-batch-off" onClick={() => onBatchControl('off')}>
        Turn Off
      </button>
      <button data-testid="btn-batch-move" onClick={onBatchMove}>
        Move
      </button>
      <button data-testid="btn-batch-params" onClick={onBatchParams}>
        Params
      </button>
      <button data-testid="btn-batch-enable" onClick={() => onBatchToggle(true)}>
        Enable
      </button>
      <button data-testid="btn-batch-disable" onClick={() => onBatchToggle(false)}>
        Disable
      </button>
      <button data-testid="btn-batch-delete" onClick={onBatchDelete}>
        Delete
      </button>
    </div>
  ),
}))

// Mock BatchParamsModal component
vi.mock('../../components/BatchParamsModal', () => ({
  BatchParamsModal: ({ visible, deviceIds, onClose, onSubmit }: any) =>
    visible ? (
      <div data-testid="batch-params-modal">
        <span data-testid="device-count">{deviceIds.length} devices</span>
        <button data-testid="btn-close-modal" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="btn-submit-modal"
          onClick={() => onSubmit({ deviceIds, params: { mode: 1 }, selectedFields: ['mode'] })}
        >
          Submit
        </button>
      </div>
    ) : null,
}))

const mockDevices = [
  {
    id: 'device-1',
    name: 'Device 1',
    simCard: 'sim-1',
    online: true,
    enabled: true,
    lastSeenAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    groupId: 3,
  },
  {
    id: 'device-2',
    name: 'Device 2',
    simCard: 'sim-2',
    online: false,
    enabled: true,
    lastSeenAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    groupId: 3,
  },
  {
    id: 'device-3',
    name: 'Device 3',
    simCard: 'sim-3',
    online: true,
    enabled: false,
    lastSeenAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    groupId: 3,
  },
]

describe('DevicesNew', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 3 })
    vi.mocked(batchApi.search).mockResolvedValue(mockDevices)
    vi.mocked(batchApi.control).mockResolvedValue({ success: true, successCount: 2, failCount: 0 })
    vi.mocked(batchApi.updateParams).mockResolvedValue({ success: true, successCount: 2, failCount: 0 })
    vi.mocked(batchApi.moveToGroup).mockResolvedValue({ success: true, successCount: 2, failCount: 0 })
    vi.mocked(batchApi.toggleEnabled).mockResolvedValue({ success: true, successCount: 2, failCount: 0 })
  })

  const renderDevicesNew = () => {
    return render(
      <BrowserRouter>
        <DevicesNew />
      </BrowserRouter>
    )
  }

  describe('layout rendering', () => {
    it('should render the page with correct layout', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('devices-page')).toBeInTheDocument()
      })

      expect(screen.getByTestId('hierarchy-tree')).toBeInTheDocument()
      expect(screen.getByTestId('device-search-panel')).toBeInTheDocument()
      expect(screen.getByTestId('batch-action-bar')).toBeInTheDocument()
      expect(screen.getByTestId('devices-table')).toBeInTheDocument()
    })

    it('should display page title', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('Device Management')).toBeInTheDocument()
      })
    })

    it('should display hierarchy path breadcrumb', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('hierarchy-path')).toBeInTheDocument()
      })
    })
  })

  describe('hierarchy navigation', () => {
    it('should display "All Devices" as default path', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('All Devices')).toBeInTheDocument()
      })
    })

    it('should update path when customer is selected', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('select-customer')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('select-customer'))

      await waitFor(() => {
        expect(screen.getByText('Customer:')).toBeInTheDocument()
      })
    })

    it('should update path when zone is selected', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('select-zone')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('select-zone'))

      await waitFor(() => {
        expect(screen.getByText('Zone:')).toBeInTheDocument()
      })
    })

    it('should update path when group is selected', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('select-group')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('select-group'))

      await waitFor(() => {
        expect(screen.getByText('Group:')).toBeInTheDocument()
      })
    })
  })

  describe('device table', () => {
    it('should render devices table with data', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      expect(screen.getByText('Device 1')).toBeInTheDocument()
      // Use getAllByText since 'Online' appears multiple times
      expect(screen.getAllByText('Online').length).toBeGreaterThan(0)
    })

    it('should show offline status for offline devices', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-2')).toBeInTheDocument()
      })

      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    it('should show enabled/disabled status', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-3')).toBeInTheDocument()
      })

      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })

    it('should support row selection', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Click checkbox for first row
      const checkboxes = screen.getAllByRole('checkbox')
      // First checkbox is usually "select all", second is first row
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1])
      }

      await waitFor(() => {
        expect(screen.getByTestId('selected-count')).toHaveTextContent('1')
      })
    })

    it('should support multi-row selection', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select multiple rows
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 2) {
        await user.click(checkboxes[1])
        await user.click(checkboxes[2])
      }

      await waitFor(() => {
        expect(screen.getByTestId('selected-count')).toHaveTextContent('2')
      })
    })

    it('should clear selection when path changes', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select a device
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1])
      }

      await waitFor(() => {
        expect(screen.getByTestId('selected-count')).toHaveTextContent('1')
      })

      // Change hierarchy selection
      fireEvent.click(screen.getByTestId('select-group'))

      await waitFor(() => {
        expect(screen.getByTestId('selected-count')).toHaveTextContent('0')
      })
    })
  })

  describe('batch operations', () => {
    it('should call batchApi.control when batch turn on is clicked', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 2) {
        await user.click(checkboxes[1])
        await user.click(checkboxes[2])
      }

      await waitFor(() => {
        expect(screen.getByTestId('selected-count')).toHaveTextContent('2')
      })

      // Batch turn on
      fireEvent.click(screen.getByTestId('btn-batch-on'))

      await waitFor(() => {
        expect(batchApi.control).toHaveBeenCalledWith({
          deviceIds: ['device-1', 'device-2'],
          action: 'on',
        })
      })
    })

    it('should call batchApi.control when batch turn off is clicked', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 2) {
        await user.click(checkboxes[1])
        await user.click(checkboxes[2])
      }

      // Batch turn off
      fireEvent.click(screen.getByTestId('btn-batch-off'))

      await waitFor(() => {
        expect(batchApi.control).toHaveBeenCalledWith({
          deviceIds: ['device-1', 'device-2'],
          action: 'off',
        })
      })
    })

    it('should call batchApi.toggleEnabled when batch enable is clicked', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 2) {
        await user.click(checkboxes[1])
        await user.click(checkboxes[2])
      }

      // Batch enable
      fireEvent.click(screen.getByTestId('btn-batch-enable'))

      await waitFor(() => {
        expect(batchApi.toggleEnabled).toHaveBeenCalledWith({
          deviceIds: ['device-1', 'device-2'],
          enabled: true,
        })
      })
    })

    it('should call batchApi.toggleEnabled when batch disable is clicked', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 2) {
        await user.click(checkboxes[1])
        await user.click(checkboxes[2])
      }

      // Batch disable
      fireEvent.click(screen.getByTestId('btn-batch-disable'))

      await waitFor(() => {
        expect(batchApi.toggleEnabled).toHaveBeenCalledWith({
          deviceIds: ['device-1', 'device-2'],
          enabled: false,
        })
      })
    })

    it('should show success message after batch operation', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 2) {
        await user.click(checkboxes[1])
        await user.click(checkboxes[2])
      }

      // Batch turn on
      fireEvent.click(screen.getByTestId('btn-batch-on'))

      await waitFor(() => {
        expect(message.success).toHaveBeenCalled()
      })
    })

    it('should show error message when batch operation fails', async () => {
      vi.mocked(batchApi.control).mockRejectedValue(new Error('Batch error'))
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 2) {
        await user.click(checkboxes[1])
        await user.click(checkboxes[2])
      }

      // Batch turn on
      fireEvent.click(screen.getByTestId('btn-batch-on'))

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled()
      })
    })
  })

  describe('batch params modal', () => {
    it('should open BatchParamsModal when params button is clicked', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1])
      }

      // Click params button
      fireEvent.click(screen.getByTestId('btn-batch-params'))

      await waitFor(() => {
        expect(screen.getByTestId('batch-params-modal')).toBeInTheDocument()
      })
    })

    it('should close BatchParamsModal when close button is clicked', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices and open modal
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1])
      }

      fireEvent.click(screen.getByTestId('btn-batch-params'))

      await waitFor(() => {
        expect(screen.getByTestId('batch-params-modal')).toBeInTheDocument()
      })

      // Close modal
      fireEvent.click(screen.getByTestId('btn-close-modal'))

      await waitFor(() => {
        expect(screen.queryByTestId('batch-params-modal')).not.toBeInTheDocument()
      })
    })

    it('should call batchApi.updateParams when modal is submitted', async () => {
      const user = userEvent.setup()
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByText('device-1')).toBeInTheDocument()
      })

      // Select devices and open modal
      const checkboxes = screen.getAllByRole('checkbox')
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1])
      }

      fireEvent.click(screen.getByTestId('btn-batch-params'))

      await waitFor(() => {
        expect(screen.getByTestId('batch-params-modal')).toBeInTheDocument()
      })

      // Submit modal
      fireEvent.click(screen.getByTestId('btn-submit-modal'))

      await waitFor(() => {
        expect(batchApi.updateParams).toHaveBeenCalled()
      })
    })
  })

  describe('search functionality', () => {
    it('should call batchApi.search when search is triggered', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('btn-search')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('btn-search'))

      await waitFor(() => {
        expect(batchApi.search).toHaveBeenCalledWith({ keyword: 'test' })
      })
    })

    it('should reset search when reset button is clicked', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('btn-reset')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByTestId('btn-reset'))

      await waitFor(() => {
        expect(deviceApi.getList).toHaveBeenCalled()
      })
    })
  })

  describe('error handling', () => {
    it('should show error message when loading devices fails', async () => {
      vi.mocked(deviceApi.getList).mockRejectedValue(new Error('Load error'))
      renderDevicesNew()

      await waitFor(() => {
        expect(message.error).toHaveBeenCalled()
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty device list', async () => {
      vi.mocked(deviceApi.getList).mockResolvedValue({ data: [], page: 1, limit: 50, total: 0 })
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('devices-table')).toBeInTheDocument()
      })
    })

    it('should handle zero selection correctly', async () => {
      renderDevicesNew()

      await waitFor(() => {
        expect(screen.getByTestId('selected-count')).toHaveTextContent('0')
      })
    })
  })
})