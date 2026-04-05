import { useEffect, useState, useCallback } from 'react'
import { Card, Row, Col, Spin, Alert, message, Select, DatePicker, Space, Statistic, Empty } from 'antd'
import dayjs from 'dayjs'
import TrendChart from '../../components/TrendChart'
import { statsApi, type TrendMetric, type DailyStats, type TrendDataPoint } from '../../services/stats.service'
import { deviceApi } from '../../services/device.service'
import type { Device } from '../../types/device'

const { RangePicker } = DatePicker

const metricOptions: { value: TrendMetric; label: string }[] = [
  { value: 'temperature', label: '温度' },
  { value: 'humidity', label: '湿度' },
  { value: 'current', label: '电流' },
]

const presetTimeRanges: { label: string; getValue: () => [dayjs.Dayjs, dayjs.Dayjs] }[] = [
  { label: '最近1小时', getValue: () => [dayjs().subtract(1, 'hour'), dayjs()] },
  { label: '最近6小时', getValue: () => [dayjs().subtract(6, 'hour'), dayjs()] },
  { label: '最近24小时', getValue: () => [dayjs().subtract(24, 'hour'), dayjs()] },
  { label: '最近7天', getValue: () => [dayjs().subtract(7, 'day'), dayjs()] },
]

export default function Stats() {
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<TrendMetric>('temperature')
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(24, 'hour'),
    dayjs(),
  ])
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 加载设备列表
  useEffect(() => {
    loadDevices()
  }, [])

  async function loadDevices() {
    try {
      const result = await deviceApi.getList()
      setDevices(result.data)
      if (result.data.length > 0) {
        setSelectedDeviceId(result.data[0].id)
      }
    } catch (err) {
      message.error('加载设备列表失败')
    }
  }

  // 当设备、指标或时间范围变化时加载趋势数据
  const loadTrendData = useCallback(async () => {
    if (!selectedDeviceId) return

    setLoading(true)
    setError(null)
    try {
      const data = await statsApi.getTrendData({
        deviceId: selectedDeviceId,
        metric: selectedMetric,
        startTime: timeRange[0].toISOString(),
        endTime: timeRange[1].toISOString(),
      })
      setTrendData(data)

      // 同时加载当日统计数据
      const today = dayjs().format('YYYY-MM-DD')
      const daily = await statsApi.getDailyStats({
        deviceId: selectedDeviceId,
        date: today,
      })
      setDailyStats(daily)
    } catch (err: any) {
      setError(err.message || '加载统计数据失败')
      setTrendData([])
      setDailyStats(null)
    } finally {
      setLoading(false)
    }
  }, [selectedDeviceId, selectedMetric, timeRange])

  useEffect(() => {
    if (selectedDeviceId) {
      loadTrendData()
    }
  }, [loadTrendData])

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId)
  }

  const handleMetricChange = (metric: TrendMetric) => {
    setSelectedMetric(metric)
  }

  const handleTimeRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setTimeRange([dates[0], dates[1]])
    }
  }

  const handlePresetRange = (preset: typeof presetTimeRanges[0]) => {
    setTimeRange(preset.getValue())
  }

  if (devices.length === 0) {
    return (
      <div>
        <h1 style={{ marginBottom: 24 }}>统计分析</h1>
        <Empty description="暂无设备数据，请先添加设备" />
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>统计分析</h1>

      {/* 筛选控制栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <span>设备：</span>
          <Select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            style={{ width: 200 }}
            options={devices.map((d) => ({ value: d.id, label: d.name || d.id }))}
          />
          <span>指标：</span>
          <Select
            value={selectedMetric}
            onChange={handleMetricChange}
            style={{ width: 120 }}
            options={metricOptions}
          />
          <span>时间范围：</span>
          <RangePicker
            showTime
            value={timeRange}
            onChange={handleTimeRangeChange}
            format="YYYY-MM-DD HH:mm"
          />
          {presetTimeRanges.map((preset) => (
            <a key={preset.label} onClick={() => handlePresetRange(preset)}>
              {preset.label}
            </a>
          ))}
        </Space>
      </Card>

      {error && (
        <Alert
          message="加载失败"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <Spin tip="加载中..." size="large" style={{ display: 'block', margin: '100px auto' }} />
      ) : (
        <Row gutter={[16, 16]}>
          {/* 趋势图表 */}
          <Col span={24}>
            <Card title={`${selectedMetric === 'temperature' ? '温度' : selectedMetric === 'humidity' ? '湿度' : '电流'}趋势`}>
              <TrendChart data={trendData} metric={selectedMetric} height={350} />
            </Card>
          </Col>

          {/* 日统计数据 */}
          <Col span={24}>
            <Card title="今日统计">
              {dailyStats ? (
                <Row gutter={16}>
                  <Col span={4}>
                    <Statistic
                      title="平均温度"
                      value={dailyStats.avgTemperature ?? '-'}
                      suffix="°C"
                      precision={1}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="平均湿度"
                      value={dailyStats.avgHumidity ?? '-'}
                      suffix="%"
                      precision={1}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="最高温度"
                      value={dailyStats.maxTemperature ?? '-'}
                      suffix="°C"
                      precision={1}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="最低温度"
                      value={dailyStats.minTemperature ?? '-'}
                      suffix="°C"
                      precision={1}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="今日告警"
                      value={dailyStats.alarmCount}
                      suffix="次"
                    />
                  </Col>
                </Row>
              ) : (
                <Empty description="暂无今日统计数据" />
              )}
            </Card>
          </Col>

          {/* 多指标对比图表 */}
          <Col span={24}>
            <Card title="多指标对比（需选择不同指标查看）">
              <Alert
                message="提示"
                description="切换上方指标选择器可查看不同指标的趋势曲线。如需多指标同时展示，请联系开发人员。"
                type="info"
                showIcon
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}