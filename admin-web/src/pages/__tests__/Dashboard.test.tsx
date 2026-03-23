import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'
import { statsApi } from '../../services/stats.service'
import { alarmApi } from '../../services/alarm.service'

vi.mock('../../services/stats.service')
vi.mock('../../services/alarm.service')

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )
  }

  it('should render dashboard heading', async () => {
    vi.mocked(statsApi.getOverview).mockResolvedValue({
      totalDevices: 5,
      onlineDevices: 3,
      offlineDevices: 2,
      totalAlarms: 10,
      unacknowledgedAlarms: 2,
    })
    vi.mocked(alarmApi.getList).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('仪表盘')).toBeInTheDocument()
    })
  })

  it('should render device statistics', async () => {
    const mockStats = {
      totalDevices: 5,
      onlineDevices: 3,
      offlineDevices: 2,
      totalAlarms: 10,
      unacknowledgedAlarms: 2,
    }

    vi.mocked(statsApi.getOverview).mockResolvedValue(mockStats)
    vi.mocked(alarmApi.getList).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('设备总数')).toBeInTheDocument()
      expect(screen.getByText('在线设备')).toBeInTheDocument()
      expect(screen.getByText('离线设备')).toBeInTheDocument()
      expect(screen.getByText('未处理告警')).toBeInTheDocument()
    })

    // Use getAllByText since values may appear multiple times
    const allFives = screen.getAllByText('5')
    const allThrees = screen.getAllByText('3')
    const allTwos = screen.getAllByText('2')

    expect(allFives.length).toBeGreaterThan(0)
    expect(allThrees.length).toBeGreaterThan(0)
    expect(allTwos.length).toBeGreaterThan(0)
  })

  it('should call stats API on mount', async () => {
    vi.mocked(statsApi.getOverview).mockResolvedValue({
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      totalAlarms: 0,
      unacknowledgedAlarms: 0,
    })
    vi.mocked(alarmApi.getList).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(statsApi.getOverview).toHaveBeenCalled()
    })
  })

  it('should call alarms API on mount', async () => {
    vi.mocked(statsApi.getOverview).mockResolvedValue({
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      totalAlarms: 0,
      unacknowledgedAlarms: 0,
    })
    vi.mocked(alarmApi.getList).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(alarmApi.getList).toHaveBeenCalledWith({ page: 1, limit: 5 })
    })
  })

  it('should render recent alarms table when alarms exist', async () => {
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

    vi.mocked(statsApi.getOverview).mockResolvedValue({
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      totalAlarms: 0,
      unacknowledgedAlarms: 0,
    })
    vi.mocked(alarmApi.getList).mockResolvedValue(mockAlarms)

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('最近告警')).toBeInTheDocument()
    })
  })

  it('should show success message when no alarms', async () => {
    vi.mocked(statsApi.getOverview).mockResolvedValue({
      totalDevices: 0,
      onlineDevices: 0,
      offlineDevices: 0,
      totalAlarms: 0,
      unacknowledgedAlarms: 0,
    })
    vi.mocked(alarmApi.getList).mockResolvedValue([])

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('暂无告警记录')).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(statsApi.getOverview).mockRejectedValue(new Error('API Error'))
    vi.mocked(alarmApi.getList).mockRejectedValue(new Error('API Error'))

    expect(() => {
      renderDashboard()
    }).not.toThrow()
  })
})
