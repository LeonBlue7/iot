// admin-web/src/components/__tests__/BatchActionBar.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchActionBar } from '../BatchActionBar'

describe('BatchActionBar', () => {
  const mockProps = {
    selectedCount: 0,
    onBatchControl: vi.fn(),
    onBatchMove: vi.fn(),
    onBatchParams: vi.fn(),
    onBatchToggle: vi.fn(),
    onBatchDelete: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(<BatchActionBar {...mockProps} />)
      expect(screen.getByTestId('batch-action-bar')).toBeInTheDocument()
    })

    it('should display selected count when items are selected', () => {
      render(<BatchActionBar {...mockProps} selectedCount={5} />)
      expect(screen.getByText(/已选中.*5.*项设备/)).toBeInTheDocument()
    })

    it('should display singular form when one item is selected', () => {
      render(<BatchActionBar {...mockProps} selectedCount={1} />)
      expect(screen.getByText(/已选中.*1.*项设备/)).toBeInTheDocument()
    })

    it('should display plural form when zero items are selected', () => {
      render(<BatchActionBar {...mockProps} selectedCount={0} />)
      expect(screen.getByText(/已选中.*0.*项设备/)).toBeInTheDocument()
    })

    it('should render all action buttons', () => {
      render(<BatchActionBar {...mockProps} selectedCount={1} />)

      expect(screen.getByTestId('btn-batch-on')).toBeInTheDocument()
      expect(screen.getByTestId('btn-batch-off')).toBeInTheDocument()
      expect(screen.getByTestId('btn-batch-reset')).toBeInTheDocument()
      expect(screen.getByTestId('btn-batch-move')).toBeInTheDocument()
      expect(screen.getByTestId('btn-batch-params')).toBeInTheDocument()
      expect(screen.getByTestId('btn-batch-enable')).toBeInTheDocument()
      expect(screen.getByTestId('btn-batch-disable')).toBeInTheDocument()
      expect(screen.getByTestId('btn-batch-delete')).toBeInTheDocument()
    })

    it('should disable all buttons when selectedCount is 0', () => {
      render(<BatchActionBar {...mockProps} selectedCount={0} />)

      expect(screen.getByTestId('btn-batch-on')).toBeDisabled()
      expect(screen.getByTestId('btn-batch-off')).toBeDisabled()
      expect(screen.getByTestId('btn-batch-reset')).toBeDisabled()
      expect(screen.getByTestId('btn-batch-move')).toBeDisabled()
      expect(screen.getByTestId('btn-batch-params')).toBeDisabled()
      expect(screen.getByTestId('btn-batch-enable')).toBeDisabled()
      expect(screen.getByTestId('btn-batch-disable')).toBeDisabled()
      expect(screen.getByTestId('btn-batch-delete')).toBeDisabled()
    })

    it('should enable all buttons when selectedCount is greater than 0', () => {
      render(<BatchActionBar {...mockProps} selectedCount={3} />)

      expect(screen.getByTestId('btn-batch-on')).not.toBeDisabled()
      expect(screen.getByTestId('btn-batch-off')).not.toBeDisabled()
      expect(screen.getByTestId('btn-batch-reset')).not.toBeDisabled()
      expect(screen.getByTestId('btn-batch-move')).not.toBeDisabled()
      expect(screen.getByTestId('btn-batch-params')).not.toBeDisabled()
      expect(screen.getByTestId('btn-batch-enable')).not.toBeDisabled()
      expect(screen.getByTestId('btn-batch-disable')).not.toBeDisabled()
      expect(screen.getByTestId('btn-batch-delete')).not.toBeDisabled()
    })
  })

  describe('batch control actions', () => {
    it('should call onBatchControl with "on" when turn on button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-on'))
      expect(mockProps.onBatchControl).toHaveBeenCalledWith('on')
    })

    it('should call onBatchControl with "off" when turn off button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-off'))
      expect(mockProps.onBatchControl).toHaveBeenCalledWith('off')
    })

    it('should call onBatchControl with "reset" when reset button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-reset'))
      expect(mockProps.onBatchControl).toHaveBeenCalledWith('reset')
    })

    it('should not call onBatchControl when disabled button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={0} />)

      fireEvent.click(screen.getByTestId('btn-batch-on'))
      expect(mockProps.onBatchControl).not.toHaveBeenCalled()
    })
  })

  describe('batch move action', () => {
    it('should call onBatchMove when move button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-move'))
      expect(mockProps.onBatchMove).toHaveBeenCalled()
    })

    it('should not call onBatchMove when disabled button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={0} />)

      fireEvent.click(screen.getByTestId('btn-batch-move'))
      expect(mockProps.onBatchMove).not.toHaveBeenCalled()
    })
  })

  describe('batch params action', () => {
    it('should call onBatchParams when params button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-params'))
      expect(mockProps.onBatchParams).toHaveBeenCalled()
    })

    it('should not call onBatchParams when disabled button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={0} />)

      fireEvent.click(screen.getByTestId('btn-batch-params'))
      expect(mockProps.onBatchParams).not.toHaveBeenCalled()
    })
  })

  describe('batch toggle actions', () => {
    it('should call onBatchToggle with true when enable button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-enable'))
      expect(mockProps.onBatchToggle).toHaveBeenCalledWith(true)
    })

    it('should call onBatchToggle with false when disable button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-disable'))
      expect(mockProps.onBatchToggle).toHaveBeenCalledWith(false)
    })

    it('should not call onBatchToggle when disabled button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={0} />)

      fireEvent.click(screen.getByTestId('btn-batch-enable'))
      expect(mockProps.onBatchToggle).not.toHaveBeenCalled()
    })
  })

  describe('batch delete action', () => {
    it('should call onBatchDelete when delete button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={2} />)

      fireEvent.click(screen.getByTestId('btn-batch-delete'))
      expect(mockProps.onBatchDelete).toHaveBeenCalled()
    })

    it('should not call onBatchDelete when disabled button is clicked', () => {
      render(<BatchActionBar {...mockProps} selectedCount={0} />)

      fireEvent.click(screen.getByTestId('btn-batch-delete'))
      expect(mockProps.onBatchDelete).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle large selected counts', () => {
      render(<BatchActionBar {...mockProps} selectedCount={1000} />)
      expect(screen.getByText(/已选中.*1000.*项设备/)).toBeInTheDocument()
    })

    it('should handle negative selected count gracefully', () => {
      // Negative counts should be treated as 0
      render(<BatchActionBar {...mockProps} selectedCount={-1} />)
      expect(screen.getByText(/已选中.*0.*项设备/)).toBeInTheDocument()
    })

    it('should have danger styling on delete button', () => {
      render(<BatchActionBar {...mockProps} selectedCount={1} />)
      const deleteButton = screen.getByTestId('btn-batch-delete')
      expect(deleteButton).toHaveClass('ant-btn-dangerous')
    })
  })
})