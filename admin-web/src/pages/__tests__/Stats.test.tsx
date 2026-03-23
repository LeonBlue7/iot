import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Stats from '../Stats'

// Mock recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: () => null,
  Bar: () => null,
}))

describe('Stats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderStats = () => {
    return render(
      <BrowserRouter>
        <Stats />
      </BrowserRouter>
    )
  }

  it('should render stats heading', async () => {
    renderStats()

    await waitFor(() => {
      expect(screen.getByText('统计分析')).toBeInTheDocument()
    })
  })

  it('should render temperature chart', async () => {
    renderStats()

    await waitFor(() => {
      expect(screen.getByText('24 小时温度趋势')).toBeInTheDocument()
    })
  })

  it('should render device online rate card', async () => {
    renderStats()

    await waitFor(() => {
      expect(screen.getByText('设备在线率')).toBeInTheDocument()
    })
  })

  it('should show success message about device online rate', async () => {
    renderStats()

    await waitFor(() => {
      expect(screen.getByText('当前所有设备在线率为 100%，系统运行正常。')).toBeInTheDocument()
    })
  })
})
