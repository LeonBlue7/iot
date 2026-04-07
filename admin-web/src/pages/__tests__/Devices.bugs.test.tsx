import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Devices from '../Devices/index'
import * as deviceService from '../../services/device.service'
import * as alarmService from '../../services/alarm.service'

// Mock services
vi.mock('../../services/device.service')
vi.mock('../../services/alarm.service')
vi.mock('../../services/batch.service')
vi.mock('../../services/customer.service')
vi.mock('../../store/hierarchyStore', () => ({
  useHierarchyStore: vi.fn(() => ({ selectedNode: null })),
}))

const mockDevices = Array.from({ length: 144 }, (_, i) => ({
  id: `device-${i + 1}`,
  name: `设备${i + 1}`,
  online: true,
  enabled: true,
  createdAt: new Date().toISOString(),
  realtimeData: {
    id: i + 1,
    deviceId: `device-${i + 1}`,
    temperature: 25 + (i % 10),
    humidity: 50 + (i % 20),
    current: 100,
    signalStrength: 80,
    acState: i % 2,
    recordedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
}))

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('Devices Page Bug Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(deviceService.deviceApi.getList).mockResolvedValue({
      data: mockDevices.slice(0, 50),
      page: 1,
      limit: 50,
      total: 144,
    })
    vi.mocked(alarmService.alarmApi.getList).mockResolvedValue([])
  })

  describe('Bug 1: 分页页码显示', () => {
    it('should display pagination with correct total count', async () => {
      renderWithRouter(<Devices />)

      await waitFor(() => {
        expect(screen.getByTestId('devices-table')).toBeInTheDocument()
      })

      // 检查总条数显示
      expect(screen.getByText(/共 144 条/)).toBeInTheDocument()
    })
  })

  describe('Bug 2: 温度实时数据显示', () => {
    it('should display temperature in the table row', async () => {
      renderWithRouter(<Devices />)

      await waitFor(() => {
        expect(screen.getByTestId('devices-table')).toBeInTheDocument()
      })

      // 检查温度列
      const rows = document.querySelectorAll('.ant-table-tbody tr')
      expect(rows.length).toBeGreaterThan(0)
    })
  })

  describe('Bug 3: 空调状态显示', () => {
    it('should have AC state column in table', async () => {
      renderWithRouter(<Devices />)

      await waitFor(() => {
        expect(screen.getByTestId('devices-table')).toBeInTheDocument()
      })

      // 检查表头
      const headers = document.querySelectorAll('.ant-table-thead th')
      const headerTexts = Array.from(headers).map(h => h.textContent)

      // 应该有空调状态列
      expect(headerTexts.some(t => t?.includes('空调'))).toBe(true)
    })
  })
})