import { useEffect, useState } from 'react'
import { Card, Row, Col, Spin, Alert, message } from 'antd'
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

export default function Stats() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStatsData()
  }, [])

  async function loadStatsData() {
    setLoading(true)
    try {
      // 这里可以添加获取统计数据的逻辑
      // 暂时使用模拟数据
    } catch (error) {
      message.error('加载统计数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 模拟图表数据
  const chartData = [
    { name: '00:00', temperature: 24, humidity: 55 },
    { name: '04:00', temperature: 23, humidity: 58 },
    { name: '08:00', temperature: 25, humidity: 52 },
    { name: '12:00', temperature: 28, humidity: 48 },
    { name: '16:00', temperature: 27, humidity: 50 },
    { name: '20:00', temperature: 26, humidity: 53 },
  ]

  if (loading) {
    return <Spin tip="加载中..." size="large" />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>统计分析</h1>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="24 小时温度趋势">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="temperature" stroke="#ff4d4f" name="温度 (°C)" />
                <Line type="monotone" dataKey="humidity" stroke="#1890ff" name="湿度 (%)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="设备在线率">
            <Alert
              message="设备在线率统计"
              description="当前所有设备在线率为 100%，系统运行正常。"
              type="success"
              showIcon
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
