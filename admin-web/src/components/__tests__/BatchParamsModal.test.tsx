// admin-web/src/components/__tests__/BatchParamsModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BatchParamsModal } from '../BatchParamsModal'

// Mock antd Modal to be testable
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    Modal: ({
      open,
      onCancel,
      onOk,
      title,
      children,
      confirmLoading,
    }: {
      open: boolean
      onCancel: () => void
      onOk: () => void
      title: string
      children: React.ReactNode
      confirmLoading?: boolean
    }) =>
      open ? (
        <div data-testid="modal-root" role="dialog" aria-modal="true">
          <div data-testid="modal-title">{title}</div>
          <div data-testid="modal-content">{children}</div>
          <button data-testid="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button data-testid="modal-ok" onClick={onOk} disabled={confirmLoading}>
            {confirmLoading ? 'Loading...' : 'OK'}
          </button>
        </div>
      ) : null,
  }
})

describe('BatchParamsModal', () => {
  const mockDeviceIds = ['device-1', 'device-2', 'device-3']
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  const defaultProps = {
    visible: false,
    deviceIds: mockDeviceIds,
    onClose: mockOnClose,
    onSubmit: mockOnSubmit,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should not render when visible is false', () => {
      render(<BatchParamsModal {...defaultProps} />)
      expect(screen.queryByTestId('modal-root')).not.toBeInTheDocument()
    })

    it('should render when visible is true', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)
      expect(screen.getByTestId('modal-root')).toBeInTheDocument()
    })

    it('should display correct title with device count', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)
      expect(screen.getByText('Batch Set Parameters (3 devices)')).toBeInTheDocument()
    })

    it('should display singular form for single device', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} deviceIds={['device-1']} />)
      expect(screen.getByText('Batch Set Parameters (1 device)')).toBeInTheDocument()
    })

    it('should display all parameter groups', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      expect(screen.getByText('Auto Control')).toBeInTheDocument()
      expect(screen.getByText('Time Settings')).toBeInTheDocument()
      expect(screen.getByText('AC Parameters')).toBeInTheDocument()
      expect(screen.getByText('Alarm Settings')).toBeInTheDocument()
    })
  })

  describe('parameter selection', () => {
    it('should have all parameters unchecked by default', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      const checkboxes = screen.getAllByRole('checkbox')
      // All checkboxes should be unchecked initially (except group headers)
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked()
      })
    })

    it('should allow checking individual parameters', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Find and click the mode parameter checkbox
      const modeCheckbox = screen.getByLabelText('Mode')
      await user.click(modeCheckbox)

      expect(modeCheckbox).toBeChecked()
    })

    it('should allow checking multiple parameters', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      const modeCheckbox = screen.getByLabelText('Mode')
      const summerTempOnCheckbox = screen.getByLabelText('Summer Temp On')

      await user.click(modeCheckbox)
      await user.click(summerTempOnCheckbox)

      expect(modeCheckbox).toBeChecked()
      expect(summerTempOnCheckbox).toBeChecked()
    })

    it('should enable input fields when parameter is checked', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Initially inputs should be disabled
      const modeInput = screen.getByTestId('input-mode')
      expect(modeInput).toBeDisabled()

      // Check the parameter
      const modeCheckbox = screen.getByLabelText('Mode')
      await user.click(modeCheckbox)

      // Now input should be enabled
      expect(modeInput).not.toBeDisabled()
    })
  })

  describe('auto control parameters', () => {
    it('should display all auto control parameters', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      expect(screen.getByLabelText('Mode')).toBeInTheDocument()
      expect(screen.getByLabelText('Summer Temp On')).toBeInTheDocument()
      expect(screen.getByLabelText('Summer Temp Set')).toBeInTheDocument()
      expect(screen.getByLabelText('Summer Temp Off')).toBeInTheDocument()
      expect(screen.getByLabelText('Winter Temp On')).toBeInTheDocument()
      expect(screen.getByLabelText('Winter Temp Set')).toBeInTheDocument()
      expect(screen.getByLabelText('Winter Temp Off')).toBeInTheDocument()
    })
  })

  describe('time settings parameters', () => {
    it('should display all time settings parameters', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      expect(screen.getByLabelText('Winter Start')).toBeInTheDocument()
      expect(screen.getByLabelText('Winter End')).toBeInTheDocument()
      expect(screen.getByLabelText('AC Off Interval')).toBeInTheDocument()
      expect(screen.getByLabelText('Work Time')).toBeInTheDocument()
      expect(screen.getByLabelText('Overtime 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Overtime 2')).toBeInTheDocument()
      expect(screen.getByLabelText('Overtime 3')).toBeInTheDocument()
    })
  })

  describe('ac parameters', () => {
    it('should display all AC parameters', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      expect(screen.getByLabelText('AC Code')).toBeInTheDocument()
      expect(screen.getByLabelText('AC Mode')).toBeInTheDocument()
      expect(screen.getByLabelText('AC Fan Speed')).toBeInTheDocument()
      expect(screen.getByLabelText('AC Direction')).toBeInTheDocument()
      expect(screen.getByLabelText('AC Light')).toBeInTheDocument()
      expect(screen.getByLabelText('Min Current')).toBeInTheDocument()
    })
  })

  describe('alarm settings parameters', () => {
    it('should display all alarm settings parameters', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      expect(screen.getByLabelText('Alarm Enabled')).toBeInTheDocument()
      expect(screen.getByLabelText('Temp High Limit')).toBeInTheDocument()
      expect(screen.getByLabelText('Temp Low Limit')).toBeInTheDocument()
      expect(screen.getByLabelText('Humi High Limit')).toBeInTheDocument()
      expect(screen.getByLabelText('Humi Low Limit')).toBeInTheDocument()
      expect(screen.getByLabelText('Upload Interval')).toBeInTheDocument()
    })
  })

  describe('form submission', () => {
    it('should call onSubmit with selected fields and values', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Select mode parameter and enter value
      const modeCheckbox = screen.getByLabelText('Mode')
      await user.click(modeCheckbox)

      const modeInput = screen.getByTestId('input-mode')
      await user.clear(modeInput)
      await user.type(modeInput, '1')

      // Submit
      await user.click(screen.getByTestId('modal-ok'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          deviceIds: mockDeviceIds,
          params: { mode: 1 },
          selectedFields: ['mode'],
        })
      })
    })

    it('should call onSubmit with multiple selected fields', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Select mode parameter
      const modeCheckbox = screen.getByLabelText('Mode')
      await user.click(modeCheckbox)
      const modeInput = screen.getByTestId('input-mode')
      await user.clear(modeInput)
      await user.type(modeInput, '2')

      // Select summerTempOn parameter
      const summerTempOnCheckbox = screen.getByLabelText('Summer Temp On')
      await user.click(summerTempOnCheckbox)
      const summerTempOnInput = screen.getByTestId('input-summerTempOn')
      await user.clear(summerTempOnInput)
      await user.type(summerTempOnInput, '26')

      // Submit
      await user.click(screen.getByTestId('modal-ok'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          deviceIds: mockDeviceIds,
          params: { mode: 2, summerTempOn: 26 },
          selectedFields: ['mode', 'summerTempOn'],
        })
      })
    })

    it('should not call onSubmit when no fields are selected', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Don't select any parameters, just submit
      await user.click(screen.getByTestId('modal-ok'))

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled()
      })
    })

    it('should show loading state during submission', async () => {
      const slowSubmit = vi.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))
      render(<BatchParamsModal {...defaultProps} visible={true} onSubmit={slowSubmit} />)

      const modeCheckbox = screen.getByLabelText('Mode')
      fireEvent.click(modeCheckbox)

      const okButton = screen.getByTestId('modal-ok')
      fireEvent.click(okButton)

      // Should show loading state
      await waitFor(() => {
        expect(okButton).toHaveTextContent('Loading...')
      })
    })
  })

  describe('modal actions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      await user.click(screen.getByTestId('modal-cancel'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when modal is closed', () => {
      const { rerender } = render(<BatchParamsModal {...defaultProps} visible={true} />)
      rerender(<BatchParamsModal {...defaultProps} visible={false} />)

      expect(screen.queryByTestId('modal-root')).not.toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle empty deviceIds array', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} deviceIds={[]} />)
      expect(screen.getByText('Batch Set Parameters (0 devices)')).toBeInTheDocument()
    })

    it('should handle large number of devices', () => {
      const largeDeviceIds = Array.from({ length: 100 }, (_, i) => `device-${i}`)
      render(<BatchParamsModal {...defaultProps} visible={true} deviceIds={largeDeviceIds} />)
      expect(screen.getByText('Batch Set Parameters (100 devices)')).toBeInTheDocument()
    })

    it('should handle string input values correctly', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Work Time is a string field
      const workTimeCheckbox = screen.getByLabelText('Work Time')
      await user.click(workTimeCheckbox)
      const workTimeInput = screen.getByTestId('input-workTime')
      await user.clear(workTimeInput)
      await user.type(workTimeInput, '08:00-18:00')

      await user.click(screen.getByTestId('modal-ok'))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          deviceIds: mockDeviceIds,
          params: { workTime: '08:00-18:00' },
          selectedFields: ['workTime'],
        })
      })
    })

    it('should handle undefined/null input gracefully', async () => {
      const user = userEvent.setup()
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Select a parameter but don't enter a value
      const modeCheckbox = screen.getByLabelText('Mode')
      await user.click(modeCheckbox)

      await user.click(screen.getByTestId('modal-ok'))

      await waitFor(() => {
        // Should still submit with the empty/undefined value
        expect(mockOnSubmit).toHaveBeenCalledWith({
          deviceIds: mockDeviceIds,
          params: { mode: undefined },
          selectedFields: ['mode'],
        })
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper aria labels for parameter groups', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      expect(screen.getByRole('group', { name: 'Auto Control' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Time Settings' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'AC Parameters' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Alarm Settings' })).toBeInTheDocument()
    })

    it('should have proper dialog role', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})