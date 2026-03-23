import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { message, Modal } from 'antd'
import Alarms from '../Alarms'
import { alarmApi } from '../../services/alarm.service'

vi.mock('../../services/alarm.service')
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
    Modal: {
      confirm: vi.fn(),
    },
  }
})

describe('Alarms', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderAlarms = () => {
    return render(
      <BrowserRouter>
        <Alarms />
      </BrowserRouter>
    )
  }

  it('should render alarms heading', async () => {
    vi.mocked(alarmApi.getList).mockResolvedValue([])

    renderAlarms()

    await waitFor(() => {
      expect(screen.getByText('告警管理')).toBeInTheDocument()
    })
  })

  it('should call alarmApi.getList on mount', async () => {
    vi.mocked(alarmApi.getList).mockResolvedValue([])

    renderAlarms()

    await waitFor(() => {
      expect(alarmApi.getList).toHaveBeenCalled()
    })
  })

  it('should render alarms table with data', async () => {
    const mockAlarms = [
      {
        id: 1,
        deviceId: '123456789012345',
        alarmType: 'TEMP_HIGH',
        alarmValue: 35,
        threshold: 30,
        status: 0,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(alarmApi.getList).mockResolvedValue(mockAlarms)

    renderAlarms()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })
    expect(screen.getByText('温度过高')).toBeInTheDocument()
  })

  it('should show error message when loading alarms fails', async () => {
    vi.mocked(alarmApi.getList).mockRejectedValue(new Error('API Error'))

    renderAlarms()

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载告警列表失败')
    })
  })

  it('should show confirmation modal when clicking acknowledge button', async () => {
    const mockAlarms = [
      {
        id: 1,
        deviceId: '123456789012345',
        alarmType: 'TEMP_HIGH',
        alarmValue: 35,
        threshold: 30,
        status: 0,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(alarmApi.getList).mockResolvedValue(mockAlarms)
    vi.mocked(Modal.confirm).mockImplementation(({ onOk }) => {
      onOk?.()
      return {} as ReturnType<typeof Modal.confirm>
    })
    vi.mocked(alarmApi.acknowledge).mockResolvedValue(undefined)

    renderAlarms()

    await waitFor(() => {
      const acknowledgeButton = screen.getByText('确认')
      fireEvent.click(acknowledgeButton)
    })

    await waitFor(() => {
      expect(Modal.confirm).toHaveBeenCalled()
    })
  })

  it('should call alarmApi.acknowledge and show success message', async () => {
    const mockAlarms = [
      {
        id: 1,
        deviceId: '123456789012345',
        alarmType: 'TEMP_HIGH',
        alarmValue: 35,
        threshold: 30,
        status: 0,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(alarmApi.getList).mockResolvedValue(mockAlarms)
    vi.mocked(Modal.confirm).mockImplementation(({ onOk }) => {
      onOk?.()
      return {} as ReturnType<typeof Modal.confirm>
    })
    vi.mocked(alarmApi.acknowledge).mockResolvedValue(undefined)

    renderAlarms()

    await waitFor(() => {
      const acknowledgeButton = screen.getByText('确认')
      fireEvent.click(acknowledgeButton)
    })

    await waitFor(() => {
      expect(alarmApi.acknowledge).toHaveBeenCalledWith(1)
      expect(message.success).toHaveBeenCalledWith('告警已确认')
    })
  })

  it('should show error message when acknowledge fails', async () => {
    const mockAlarms = [
      {
        id: 1,
        deviceId: '123456789012345',
        alarmType: 'TEMP_HIGH',
        alarmValue: 35,
        threshold: 30,
        status: 0,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(alarmApi.getList).mockResolvedValue(mockAlarms)
    vi.mocked(Modal.confirm).mockImplementation(({ onOk }) => {
      onOk?.()
      return {} as ReturnType<typeof Modal.confirm>
    })
    vi.mocked(alarmApi.acknowledge).mockRejectedValue(new Error('API Error'))

    renderAlarms()

    await waitFor(() => {
      const acknowledgeButton = screen.getByText('确认')
      fireEvent.click(acknowledgeButton)
    })

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('确认告警失败')
    })
  })

  it('should not show acknowledge button for acknowledged alarms', async () => {
    const mockAlarms = [
      {
        id: 1,
        deviceId: '123456789012345',
        alarmType: 'TEMP_HIGH',
        alarmValue: 35,
        threshold: 30,
        status: 1,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(alarmApi.getList).mockResolvedValue(mockAlarms)

    renderAlarms()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })
    expect(screen.queryByText('确认')).not.toBeInTheDocument()
  })

  it('should display status correctly for different alarm states', async () => {
    const mockAlarms = [
      {
        id: 1,
        deviceId: '123456789012345',
        alarmType: 'TEMP_HIGH',
        alarmValue: 35,
        threshold: 30,
        status: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        deviceId: '123456789012345',
        alarmType: 'HUMI_LOW',
        alarmValue: 30,
        threshold: 40,
        status: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 3,
        deviceId: '123456789012345',
        alarmType: 'TEMP_LOW',
        alarmValue: 15,
        threshold: 20,
        status: 2,
        createdAt: new Date().toISOString(),
      },
    ]

    vi.mocked(alarmApi.getList).mockResolvedValue(mockAlarms)

    renderAlarms()

    await waitFor(() => {
      expect(screen.getByText('未处理')).toBeInTheDocument()
      expect(screen.getByText('已确认')).toBeInTheDocument()
    })
  })
})
