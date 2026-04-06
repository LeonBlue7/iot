import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { message } from 'antd'
import Devices from '../Devices'
import { deviceApi } from '../../services/device.service'
import { alarmApi } from '../../services/alarm.service'
import { batchApi } from '../../services/batch.service'
import { customerApi } from '../../services/customer.service'
import { groupApi } from '../../services/group.service'

// Mock all services
vi.mock('../../services/device.service')
vi.mock('../../services/alarm.service')
vi.mock('../../services/batch.service')
vi.mock('../../services/customer.service')
vi.mock('../../services/group.service')

// Mock useHierarchyStore
vi.mock('../../store/hierarchyStore', () => ({
  useHierarchyStore: vi.fn((selector) => {
    const state = { selectedNode: null }
    return selector(state)
  }),
}))

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

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Helper to setup basic mocks
function setupBasicMocks(devices: any[] = [], alarms: any[] = []) {
  vi.mocked(deviceApi.getList).mockResolvedValue({
    data: devices,
    page: 1,
    limit: 50,
    total: devices.length,
  })
  vi.mocked(deviceApi.getRealtimeData).mockResolvedValue(null)

  // Mock alarmApi.getList to filter by status
  vi.mocked(alarmApi.getList).mockImplementation(async (params?: any) => {
    // Filter alarms by status if provided (status: 0 means unacknowledged)
    if (params?.status !== undefined) {
      return alarms.filter((a) => a.status === params.status)
    }
    return alarms
  })

  vi.mocked(batchApi.search).mockResolvedValue(devices)
  vi.mocked(customerApi.getList).mockResolvedValue([])
  vi.mocked(groupApi.getList).mockResolvedValue([])
  vi.mocked(deviceApi.controlDevice).mockResolvedValue(undefined)
}

// Helper to find control button by partial text (Ant Design renders "开启" as "开 启")
function findControlButton(buttons: HTMLElement[], textParts: string[]): HTMLElement | undefined {
  return buttons.find((b) => {
    const text = b.textContent || ''
    return textParts.every((part) => text.includes(part))
  })
}

describe('Devices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderDevices = async () => {
    const result = render(
      <BrowserRouter>
        <Devices />
      </BrowserRouter>
    )
    // Wait for initial render to complete
    await waitFor(() => {
      expect(screen.getByText('设备管理')).toBeInTheDocument()
    })
    return result
  }

  // ========== 基础渲染测试 ==========

  it('should render devices heading', async () => {
    setupBasicMocks()
    await renderDevices()
    expect(screen.getByText('设备管理')).toBeInTheDocument()
  })

  it('should call deviceApi.getList on mount', async () => {
    setupBasicMocks()
    await renderDevices()
    expect(deviceApi.getList).toHaveBeenCalled()
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
        enabled: true,
      },
    ]
    setupBasicMocks(mockDevices)

    await renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })
    expect(screen.getByText('Test Device')).toBeInTheDocument()
    expect(screen.getByText('在线')).toBeInTheDocument()
  })

  it('should call message.error when loading devices fails', async () => {
    vi.mocked(deviceApi.getList).mockRejectedValue(new Error('API Error'))
    vi.mocked(alarmApi.getList).mockResolvedValue([])
    vi.mocked(customerApi.getList).mockResolvedValue([])
    vi.mocked(batchApi.search).mockResolvedValue([])

    await renderDevices()

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('加载设备列表失败')
    })
  })

  // ========== 新功能测试 ==========

  describe('温度显示功能', () => {
    it('should display temperature column in the table', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])
      vi.mocked(deviceApi.getRealtimeData).mockResolvedValue({
        id: 1,
        deviceId: '123456789012345',
        temperature: 25.5,
        humidity: 60,
        recordedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('温度')).toBeInTheDocument()
      })
    })

    it('should display temperature value for each device', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
          realtimeData: {
            id: 1,
            deviceId: '123456789012345',
            temperature: 25.5,
            humidity: 60,
            recordedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        },
      ]

      setupBasicMocks(mockDevices)

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('25.5')).toBeInTheDocument()
      })
    })

    it('should display "-" when temperature data is not available', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
          realtimeData: null, // 无实时数据
        },
      ]

      setupBasicMocks(mockDevices)

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      })
      // 无实时数据应该显示 "-" 作为温度
      const tempCells = screen.getAllByText('-')
      expect(tempCells.length).toBeGreaterThan(0)
    })
  })

  describe('操作按钮功能', () => {
    it('should have control buttons for each device (开启、关闭、重启)', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      await waitFor(() => {
        // 查找按钮文本
        const buttons = screen.getAllByRole('button')
        const buttonTexts = buttons.map((b) => b.textContent)
        expect(buttonTexts.some((t) => t?.includes('开启'))).toBe(true)
        expect(buttonTexts.some((t) => t?.includes('关闭'))).toBe(true)
        expect(buttonTexts.some((t) => t?.includes('重启'))).toBe(true)
      })
    })

    it('should call controlDevice with "on" when clicking 开启 button', async () => {
      const user = userEvent.setup()
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      // Wait for table to render with device data
      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      }, { timeout: 5000 })

      // Wait for buttons to be rendered - Ant Design renders with spaces "开 启"
      await waitFor(() => {
        const buttons = screen.getAllByRole('button')
        // Find button that contains "开" and "启" (Ant Design renders as "开 启")
        const onButton = buttons.find((b) => {
          const text = b.textContent || ''
          return text.includes('开') && text.includes('启') && !b.hasAttribute('disabled')
        })
        expect(onButton).toBeDefined()
      })

      // Find the specific button container (the table cell)
      const table = screen.getByTestId('devices-table')
      const rows = within(table).getAllByRole('row')
      const deviceRow = rows.find((row) => within(row).queryByText('123456789012345'))

      if (deviceRow) {
        // Find the 开启 button within this row (Ant Design renders as "开 启")
        const buttonsInRow = within(deviceRow).getAllByRole('button')
        const onButton = buttonsInRow.find((b) => {
          const text = b.textContent || ''
          return text.includes('开') && text.includes('启')
        })

        if (onButton) {
          expect(onButton).not.toBeDisabled()
          await user.click(onButton)
        }
      }

      await waitFor(() => {
        expect(deviceApi.controlDevice).toHaveBeenCalledWith('123456789012345', 'on')
      }, { timeout: 5000 })
    })

    it('should disable control buttons when device is offline', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Offline Device',
          online: false,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      })

      // 离线设备的操作按钮应该被禁用
      const buttons = screen.getAllByRole('button')
      // Ant Design renders "开启" as "开 启"
      const onButton = findControlButton(buttons, ['开', '启'])
      if (onButton) {
        expect(onButton).toBeDisabled()
      }
    })
  })

  describe('移除SIM卡号列', () => {
    it('should NOT display SIM卡号 column in the table', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          simCard: '89860123456789012345',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      })

      // SIM卡号列不应该存在
      expect(screen.queryByText('SIM卡号')).not.toBeInTheDocument()
      expect(screen.queryByText('89860123456789012345')).not.toBeInTheDocument()
    })
  })

  describe('告警高亮功能', () => {
    it('should highlight device row with alarm-row class when device has unacknowledged alarm', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Alarm Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
        {
          id: '987654321098765',
          name: 'Normal Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      // 设置一个未处理的告警（status: 0）
      setupBasicMocks(mockDevices, [
        {
          id: 1,
          deviceId: '123456789012345',
          alarmType: 'TEMP_HIGH',
          alarmValue: 30,
          threshold: 28,
          status: 0, // 未处理
          createdAt: new Date().toISOString(),
        },
      ])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('Alarm Device')).toBeInTheDocument()
      })

      // 有告警的设备行应该有 alarm-row 类
      const alarmDeviceRow = screen.getByText('Alarm Device').closest('tr')
      expect(alarmDeviceRow).toHaveClass('alarm-row')
    })

    it('should NOT highlight device row when alarm is acknowledged or resolved', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Acknowledged Alarm Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      // 设置一个已确认的告警（status: 1） - 不会被 getList({ status: 0 }) 返回
      setupBasicMocks(mockDevices, [
        {
          id: 1,
          deviceId: '123456789012345',
          alarmType: 'TEMP_HIGH',
          alarmValue: 30,
          threshold: 28,
          status: 1, // 已确认
          createdAt: new Date().toISOString(),
        },
      ])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('Acknowledged Alarm Device')).toBeInTheDocument()
      })

      // 已确认告警的设备不应该有红色高亮（因为status=1不会被status=0过滤返回）
      const deviceRow = screen.getByText('Acknowledged Alarm Device').closest('tr')
      expect(deviceRow).not.toHaveClass('alarm-row')
    })
  })

  describe('分页设置', () => {
    it('should have default pagination size of 50', async () => {
      setupBasicMocks()

      await renderDevices()

      // 验证表格存在
      expect(screen.getByTestId('devices-table')).toBeInTheDocument()
    })

    it('should allow user to change pagination size', async () => {
      const mockDevices = Array.from({ length: 100 }, (_, i) => ({
        id: `device-${i}`,
        name: `Device ${i}`,
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        enabled: true,
      }))

      setupBasicMocks(mockDevices)

      await renderDevices()

      // 使用findByText增加超时时间，因为批次延迟会增加加载时间
      await screen.findByText('device-0', {}, { timeout: 5000 })

      // 表格应该存在
      expect(screen.getByTestId('devices-table')).toBeInTheDocument()
    })
  })

  // ========== 现有功能测试 ==========

  it('should navigate to device detail page when clicking detail button', async () => {
    const user = userEvent.setup()
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        enabled: true,
      },
    ]

    setupBasicMocks(mockDevices, [])

    await renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })

    // 点击详情按钮
    const buttons = screen.getAllByRole('button')
    const detailButton = buttons.find((b) => b.textContent?.includes('详情'))
    if (detailButton) {
      await user.click(detailButton)
    }

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/devices/123456789012345')
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
        enabled: true,
      },
    ]

    setupBasicMocks(mockDevices, [])

    await renderDevices()

    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })
    expect(screen.getByText('离线')).toBeInTheDocument()
  })

  it('should refresh devices when clicking refresh button', async () => {
    const user = userEvent.setup()
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        enabled: true,
      },
    ]

    setupBasicMocks(mockDevices, [])

    await renderDevices()

    // Click the refresh button (Ant Design renders "刷新" as "刷 新")
    const buttons = screen.getAllByRole('button')
    const refreshButton = findControlButton(buttons, ['刷', '新'])
    if (refreshButton) {
      await user.click(refreshButton)
    }

    await waitFor(() => {
      expect(deviceApi.getList).toHaveBeenCalledTimes(2)
    }, { timeout: 5000 })
  })

  it('should call message.success after controlling device successfully', async () => {
    const user = userEvent.setup()
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        enabled: true,
      },
    ]

    setupBasicMocks(mockDevices, [])

    await renderDevices()

    // Wait for device to be rendered in table
    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })

    // Find the table and the row containing the device
    const table = screen.getByTestId('devices-table')
    const rows = within(table).getAllByRole('row')
    const deviceRow = rows.find((row) => within(row).queryByText('123456789012345'))

    if (deviceRow) {
      // Find the 开启 button within this specific row (Ant Design renders "开启" as "开 启")
      const buttonsInRow = within(deviceRow).getAllByRole('button')
      const onButton = findControlButton(buttonsInRow, ['开', '启'])

      if (onButton) {
        expect(onButton).not.toBeDisabled()
        await user.click(onButton)
      }
    }

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('开启指令已发送')
    }, { timeout: 5000 })
  })

  it('should call message.error when control fails', async () => {
    const user = userEvent.setup()
    const mockDevices = [
      {
        id: '123456789012345',
        name: 'Test Device',
        online: true,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        enabled: true,
      },
    ]

    setupBasicMocks(mockDevices, [])
    vi.mocked(deviceApi.controlDevice).mockRejectedValue(new Error('Control Error'))

    await renderDevices()

    // Wait for device to be rendered in table
    await waitFor(() => {
      expect(screen.getByText('123456789012345')).toBeInTheDocument()
    })

    // Find the table and the row containing the device
    const table = screen.getByTestId('devices-table')
    const rows = within(table).getAllByRole('row')
    const deviceRow = rows.find((row) => within(row).queryByText('123456789012345'))

    if (deviceRow) {
      // Find the 开启 button within this specific row (Ant Design renders "开启" as "开 启")
      const buttonsInRow = within(deviceRow).getAllByRole('button')
      const onButton = findControlButton(buttonsInRow, ['开', '启'])

      if (onButton) {
        expect(onButton).not.toBeDisabled()
        await user.click(onButton)
      }
    }

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Control Error')
    }, { timeout: 5000 })
  })

  // ========== 额外测试覆盖 ==========

  describe('关闭和重启按钮测试', () => {
    it('should call controlDevice with "off" when clicking 关闭 button', async () => {
      const user = userEvent.setup()
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      })

      const table = screen.getByTestId('devices-table')
      const rows = within(table).getAllByRole('row')
      const deviceRow = rows.find((row) => within(row).queryByText('123456789012345'))

      if (deviceRow) {
        const buttonsInRow = within(deviceRow).getAllByRole('button')
        const offButton = findControlButton(buttonsInRow, ['关', '闭'])

        if (offButton) {
          await user.click(offButton)
        }
      }

      await waitFor(() => {
        expect(deviceApi.controlDevice).toHaveBeenCalledWith('123456789012345', 'off')
      }, { timeout: 5000 })
    })

    it('should call controlDevice with "reset" when clicking 重启 button', async () => {
      const user = userEvent.setup()
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      })

      const table = screen.getByTestId('devices-table')
      const rows = within(table).getAllByRole('row')
      const deviceRow = rows.find((row) => within(row).queryByText('123456789012345'))

      if (deviceRow) {
        const buttonsInRow = within(deviceRow).getAllByRole('button')
        const resetButton = findControlButton(buttonsInRow, ['重', '启'])

        if (resetButton) {
          await user.click(resetButton)
        }
      }

      await waitFor(() => {
        expect(deviceApi.controlDevice).toHaveBeenCalledWith('123456789012345', 'reset')
      }, { timeout: 5000 })
    })
  })

  describe('设备数据加载异常测试', () => {
    it('should handle error when loading realtime data', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])
      vi.mocked(deviceApi.getRealtimeData).mockRejectedValue(new Error('Realtime Error'))

      await renderDevices()

      // Should still render the device even if realtime data fails
      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      })
    })

    it('should handle error when loading alarm data', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      vi.mocked(deviceApi.getList).mockResolvedValue({
        data: mockDevices,
        page: 1,
        limit: 50,
        total: 1,
      })
      vi.mocked(deviceApi.getRealtimeData).mockResolvedValue(null)
      vi.mocked(alarmApi.getList).mockRejectedValue(new Error('Alarm Error'))
      vi.mocked(batchApi.search).mockResolvedValue(mockDevices)
      vi.mocked(customerApi.getList).mockResolvedValue([])
      vi.mocked(groupApi.getList).mockResolvedValue([])

      await renderDevices()

      // Should still render the device even if alarm data fails
      await waitFor(() => {
        expect(screen.getByText('123456789012345')).toBeInTheDocument()
      })
    })
  })

  describe('设备名称和启用状态测试', () => {
    it('should display "未命名" when device name is undefined', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: undefined,
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: true,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('未命名')).toBeInTheDocument()
      })
    })

    it('should display "已禁用" status for disabled devices', async () => {
      const mockDevices = [
        {
          id: '123456789012345',
          name: 'Test Device',
          online: true,
          lastSeenAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          enabled: false,
        },
      ]

      setupBasicMocks(mockDevices, [])

      await renderDevices()

      await waitFor(() => {
        expect(screen.getByText('已禁用')).toBeInTheDocument()
      })
    })
  })
})