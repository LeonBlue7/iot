import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { TrendDataPoint, TrendMetric } from '../services/stats.service'

interface TrendChartProps {
  data: TrendDataPoint[]
  metric: TrendMetric
  title?: string
  height?: number
  showLegend?: boolean
}

const metricConfig: Record<TrendMetric, { label: string; color: string; unit: string }> = {
  temperature: { label: '温度', color: '#ff4d4f', unit: '°C' },
  humidity: { label: '湿度', color: '#1890ff', unit: '%' },
  current: { label: '电流', color: '#52c41a', unit: 'A' },
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function TrendChart({
  data,
  metric,
  title,
  height = 300,
  showLegend = true,
}: TrendChartProps) {
  const config = metricConfig[metric]

  const chartData = useMemo(() => {
    return data
      .filter((point) => point.value !== null)
      .map((point) => ({
        time: formatTime(point.time),
        value: point.value,
        fullTime: point.time,
      }))
  }, [data])

  if (chartData.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
        }}
      >
        暂无数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ fontSize: 12 }}
          formatter={(value: number) => [`${value} ${config.unit}`, config.label]}
          labelFormatter={(label: string, payload: any[]) => {
            if (payload?.[0]?.payload?.fullTime) {
              return new Date(payload[0].payload.fullTime).toLocaleString('zh-CN')
            }
            return label
          }}
        />
        {showLegend && <Legend />}
        <Line
          type="monotone"
          dataKey="value"
          stroke={config.color}
          name={title || `${config.label} (${config.unit})`}
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}