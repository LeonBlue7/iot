import { useState, useEffect, useCallback } from 'react'
import { Card, Radio, DatePicker, Spin, Empty, Space } from 'antd'
import dayjs from 'dayjs'
import TrendChart from './TrendChart'
import { deviceApi } from '../services/device.service'
import type { SensorData, Device } from '../types/device'

interface HistoryChartProps {
  device: Device
  height?: number
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | 'custom'
type Metric = 'temperature' | 'humidity' | 'current'

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '1h', label: '1小时' },
  { value: '6h', label: '6小时' },
  { value: '24h', label: '24小时' },
  { value: '7d', label: '7天' },
  { value: 'custom', label: '自定义' },
]

const metricOptions: { value: Metric; label: string }[] = [
  { value: 'temperature', label: '温度' },
  { value: 'humidity', label: '湿度' },
  { value: 'current', label: '电流' },
]

export default function HistoryChart({ device, height = 350 }: HistoryChartProps) {
  const [loading, setLoading] = useState(false)
  const [historyData, setHistoryData] = useState<SensorData[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [customRange, setCustomRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(24, 'hour'), dayjs()])
  const [metric, setMetric] = useState<Metric>('temperature')

  const loadHistoryData = useCallback(async () => {
    setLoading(true)
    try {
      let startTime: string
      let endTime: string

      if (timeRange === 'custom') {
        startTime = customRange[0].toISOString()
        endTime = customRange[1].toISOString()
      } else {
        const now = dayjs()
        endTime = now.toISOString()
        switch (timeRange) {
          case '1h':
            startTime = now.subtract(1, 'hour').toISOString()
            break
          case '6h':
            startTime = now.subtract(6, 'hour').toISOString()
            break
          case '24h':
            startTime = now.subtract(24, 'hour').toISOString()
            break
          case '7d':
            startTime = now.subtract(7, 'day').toISOString()
            break
          default:
            startTime = now.subtract(24, 'hour').toISOString()
        }
      }

      const data = await deviceApi.getHistoryData(device.id, {
        startTime,
        endTime,
        limit: 1000,
      })
      setHistoryData(data)
    } catch (error) {
      setHistoryData([])
    } finally {
      setLoading(false)
    }
  }, [device.id, timeRange, customRange])

  useEffect(() => {
    loadHistoryData()
  }, [loadHistoryData])

  const handleTimeRangeChange = (value: TimeRange) => {
    setTimeRange(value)
  }

  const handleCustomRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setCustomRange([dates[0], dates[1]])
    }
  }

  const handleMetricChange = (value: Metric) => {
    setMetric(value)
  }

  // 将历史数据转换为趋势数据格式
  const trendData = historyData.map((item) => ({
    time: item.recordedAt,
    value: metric === 'temperature'
      ? item.temperature ?? null
      : metric === 'humidity'
        ? item.humidity ?? null
        : item.current ?? null,
  }))

  return (
    <Card title="历史数据">
      <Space style={{ marginBottom: 16 }} wrap>
        <Radio.Group
          options={metricOptions}
          value={metric}
          onChange={(e) => handleMetricChange(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        />
        <Radio.Group
          options={timeRangeOptions.filter((opt) => opt.value !== 'custom')}
          value={timeRange !== 'custom' ? timeRange : undefined}
          onChange={(e) => handleTimeRangeChange(e.target.value)}
          optionType="button"
          buttonStyle="solid"
        />
        {timeRange === 'custom' && (
          <DatePicker.RangePicker
            showTime
            value={customRange}
            onChange={handleCustomRangeChange}
            format="YYYY-MM-DD HH:mm"
          />
        )}
      </Space>

      {loading ? (
        <Spin tip="加载中..." style={{ display: 'block', margin: '50px auto' }} />
      ) : trendData.length > 0 ? (
        <TrendChart data={trendData} metric={metric} height={height} />
      ) : (
        <Empty description="暂无历史数据" />
      )}
    </Card>
  )
}