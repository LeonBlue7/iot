import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { message } from 'antd'
import Devices from '../Devices'
import { deviceApi } from '../../services/device.service'

// Mock device service
vi.mock('../../services/device.service')

// Mock antd message
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>()
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  }
})

describe('Devices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderDevices = () => {
    return render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    )
  }

  it('should render devices heading', async () => {
    vi.mocked(deviceApi.getList).mockResolvedValue({ data: [], page: 1, limit: 50, total: 0 })

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('设备管理')).toBeInTheDocument()
    })
  })

  it('should call deviceApi.getList on mount', async () => {
    vi.mocked(deviceApi.getList).mockResolvedValue({ data: [], page: 1, limit: 50, total: 0 })

    renderDevices()

    await waitFor(() => {
      expect(deviceApi.getList).toHaveBeenCalled()
    })
  })

  it('should render devices table with data', async () => {
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        simCard: '89860123456789012345',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 1 })

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })
    expect(screen.getByText('Test Device')).toBeInTheDocument()
    expect(screen.getByText('在线')).toBeInTheDocument()
  })

  it('should call message.error when loading devices fails', async () => {
    vi.mocked(deviceApi.getList).mockRejectedValue(new Error('API Error'))

    renderDevices()

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载设备列表失败')
    })
  })

  it('should call controlDevice when clicking on button', async () => {
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        simCard: '89860123456789012345',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 1 })
    vi.mocked(deviceApi.controlDevice).mockResolvedValue(undefined)

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })

    const onButton = screen.getByText('开启')
    fireEvent.click(onButton)

    await waitFor(() => {
      expect(deviceApi.controlDevice).toHaveBeenCalledWith('123456789012345', 'on')
    })
  })

  it('should call message.success after controlling device', async () => {
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        simCard: '89860123456789012345',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 1 })
    vi.mocked(deviceApi.controlDevice).mockResolvedValue(undefined)

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })

    const offButton = screen.getByText('关闭')
    fireEvent.click(offButton)

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('设备关闭成功')
    })
  })

  it('should call message.error when control fails', async () => {
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        simCard: '89860123456789012345',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 1 })
    vi.mocked(deviceApi.controlDevice).mockRejectedValue(new Error('Control Error'))

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })

    const onButton = screen.getByText('开启')
    fireEvent.click(onButton)

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('控制设备失败')
    })
  })

  it('should open detail drawer when clicking detail button', async () => {
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        simCard: '89860123456789012345',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 1 })

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })

    const detailButton = screen.getByText('详情')
    fireEvent.click(detailButton)

    await waitFor(() => {
      expect(screen.getByText('设备详情')).toBeInTheDocument()
    })
  })

  it('should show offline status for offline devices', async () => {
    const mockDevices = [
      {
        id: '123456789012345',
        name: undefined,
        simCard: undefined,
        online: false,
        lastSeenAt: undefined,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 1 })

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })
    expect(screen.getByText('离线')).toBeInTheDocument()
  })

  it('should refresh devices when clicking refresh button', async () => {
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        simCard: '89860123456789012345',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(deviceApi.getList).mockResolvedValue({ data: mockDevices, page: 1, limit: 50, total: 1 })

    renderDevices()

    await waitFor(() => {
      expect(screen.getByText('设备管理')).toBeInTheDocument()
    })

    // Click the refresh button (text may have spaces)
    const refreshButtons = screen.getAllByText(/刷.*新/)
    if (refreshButtons.length > 0) {
      fireEvent.click(refreshButtons[0])
    }

    await waitFor(() => {
      expect(deviceApi.getList).toHaveBeenCalledTimes(2)
    })
  })
})
