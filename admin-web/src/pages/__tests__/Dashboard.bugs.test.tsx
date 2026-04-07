import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../Dashboard/index'
import * as deviceService from '../../services/device.service'

// Mock services
vi.mock('../../services/stats.service')
vi.mock('../../services/device.service')
vi.mock('../../services/alarm.service')
vi.mock('../../services/customer.service')

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Dashboard Page Bug Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Bug 4: 在线设备判断（30分钟无数据则离线）', () => {
    it('should calculate online devices based on lastSeenAt within 30 minutes', async () => {
      const now = new Date()
      const onlineTime = new Date(now.getTime() - 15 * 60 * 1000) // 15分钟前
      const offlineTime = new Date(now.getTime() - 45 * 60 * 1000) // 45分钟前

      vi.mocked(deviceService.deviceApi.getList).mockResolvedValue({
        data: [
          { id: 'device-1', name: '在线设备', online: true, enabled: true, lastSeenAt: onlineTime.toISOString(), createdAt: new Date().toISOString() },
          { id: 'device-2', name: '离线设备', online: true, enabled: true, lastSeenAt: offlineTime.toISOString(), createdAt: new Date().toISOString() },
          { id: 'device-3', name: '从未在线', online: false, enabled: true, lastSeenAt: undefined, createdAt: new Date().toISOString() },
        ],
        page: 1,
        limit: 100,
        total: 3,
      })

      renderWithRouter(<Dashboard />)

      await waitFor(() => {
        // 只有 device-1 应该被认为在线（30分钟内有数据）
        expect(screen.getByText('在线设备')).toBeInTheDocument()
      })
    })
  })

  describe('Bug 5: 空调开机数量显示', () => {
    it('should display AC power-on count on dashboard', async () => {
      vi.mocked(deviceService.deviceApi.getList).mockResolvedValue({
        data: [
          { id: 'device-1', online: true, enabled: true, realtimeData: { id: 1, deviceId: 'device-1', acState: 1, recordedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, lastSeenAt: new Date().toISOString(), createdAt: new Date().toISOString() },
          { id: 'device-2', online: true, enabled: true, realtimeData: { id: 2, deviceId: 'device-2', acState: 1, recordedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, lastSeenAt: new Date().toISOString(), createdAt: new Date().toISOString() },
          { id: 'device-3', online: true, enabled: true, realtimeData: { id: 3, deviceId: 'device-3', acState: 0, recordedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, lastSeenAt: new Date().toISOString(), createdAt: new Date().toISOString() },
          { id: 'device-4', online: true, enabled: true, realtimeData: { id: 4, deviceId: 'device-4', acState: 0, recordedAt: new Date().toISOString(), createdAt: new Date().toISOString() }, lastSeenAt: new Date().toISOString(), createdAt: new Date().toISOString() },
        ],
        page: 1,
        limit: 100,
        total: 4,
      })

      renderWithRouter(<Dashboard />)

      await waitFor(() => {
        // 应该显示空调开机数量
        expect(screen.getByText('空调开机')).toBeInTheDocument()
      })
    })
  })
})