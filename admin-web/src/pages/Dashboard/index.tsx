import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Spin, Alert, message } from 'antd'
import {
  MobileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { statsApi } from '../../services/stats.service'
import { alarmApi } from '../../services/alarm.service'
import type { AlarmRecord } from '../../types/alarm'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    totalAlarms: 0,
    unacknowledgedAlarms: 0,
  })
  const [recentAlarms, setRecentAlarms] = useState<AlarmRecord[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [statsData, alarmsData] = await Promise.all([
        statsApi.getOverview(),
        alarmApi.getList({ page: 1, limit: 5 }),
      ])
      setStats(statsData)
      setRecentAlarms(alarmsData || [])
    } catch (error) {
      message.error('加载仪表盘数据失败')
    } finally {
      setLoading(false)
    }
  }

  const alarmColumns = [
    {
      title: '设备 ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
    },
    {
      title: '告警类型',
      dataIndex: 'alarmType',
      key: 'alarmType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          TEMP_HIGH: '温度过高',
          TEMP_LOW: '温度过低',
          HUMI_HIGH: '湿度过高',
          HUMI_LOW: '湿度过低',
        }
        return typeMap[type] || type
      },
    },
    {
      title: '告警值',
      dataIndex: 'alarmValue',
      key: 'alarmValue',
      render: (value: number, record: AlarmRecord) => `${value}${record.alarmType.includes('TEMP') ? '°C' : '%'}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        const statusMap: Record<number, string> = {
          0: '未处理',
          1: '已确认',
          2: '已解决',
        }
        return statusMap[status] || '未知'
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => new Date(createdAt).toLocaleString('zh-CN'),
    },
  ]

  if (loading) {
    return <Spin tip="加载中..." size="large" />
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>仪表盘</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="设备总数"
              value={stats.totalDevices}
              prefix={<MobileOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="在线设备"
              value={stats.onlineDevices}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="离线设备"
              value={stats.offlineDevices}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="未处理告警"
              value={stats.unacknowledgedAlarms}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近告警">
        {recentAlarms.length > 0 ? (
          <Table
            columns={alarmColumns}
            dataSource={recentAlarms}
            rowKey="id"
            pagination={false}
            size="small"
          />
        ) : (
          <Alert message="暂无告警记录" type="success" showIcon />
        )}
      </Card>
    </div>
  )
}
