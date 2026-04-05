// admin-web/src/components/__tests__/BatchParamsModal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BatchParamsModal } from '../BatchParamsModal'

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
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render when visible is true', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should display correct title with device count', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)
      expect(screen.getByText(/批量设置参数.*3/)).toBeInTheDocument()
    })

    it('should display parameter groups in Chinese', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      expect(screen.getByText('自动控制')).toBeInTheDocument()
      expect(screen.getByText('时间设置')).toBeInTheDocument()
      expect(screen.getByText('空调参数')).toBeInTheDocument()
      expect(screen.getByText('告警设置')).toBeInTheDocument()
    })
  })

  describe('modal actions', () => {
    it('should call onClose when cancel button is clicked', async () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)

      // Find cancel button by text
      const cancelButton = screen.getByText('取消')
      fireEvent.click(cancelButton)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty deviceIds array', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} deviceIds={[]} />)
      expect(screen.getByText(/批量设置参数.*0/)).toBeInTheDocument()
    })

    it('should handle large number of devices', () => {
      const largeDeviceIds = Array.from({ length: 100 }, (_, i) => `device-${i}`)
      render(<BatchParamsModal {...defaultProps} visible={true} deviceIds={largeDeviceIds} />)
      expect(screen.getByText(/批量设置参数.*100/)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have proper dialog role', () => {
      render(<BatchParamsModal {...defaultProps} visible={true} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})