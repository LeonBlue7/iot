import { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Spin, Alert, message, Button } from 'antd'
import {
  MobileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import { statsApi } from '../../services/stats.service'
import { alarmApi } from '../../services/alarm.service'
import { customerApi } from '../../services/customer.service'
import { deviceApi } from '../../services/device.service'
import QuickActionsPanel from '../../components/QuickActionsPanel'
import type { AlarmRecord } from '../../types/alarm'
import type { Customer } from '../../types/hierarchy'
import type { Device } from '../../types/device'

// 30分钟无数据更新则判断为离线
const OFFLINE_THRESHOLD_MS = 30 * 60 * 1000

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    totalAlarms: 0,
    unacknowledgedAlarms: 0,
    acPowerOnCount: 0, // 空调开机数量
  })
  const [recentAlarms, setRecentAlarms] = useState<AlarmRecord[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      // 先获取统计数据和告警数据
      const [statsData, alarmsData, customersData] = await Promise.all([
        statsApi.getOverview(),
        alarmApi.getList({ page: 1, limit: 5 }),
        customerApi.getList(),
      ])

      // 获取所有设备数据（分页请求，limit最大100）
      const allDevices: Device[] = [];
      const firstPageData = await deviceApi.getList({ page: 1, limit: 100, includeRealtime: true });
      allDevices.push(...(firstPageData.data || []));

      // 如果有更多页，继续获取
      if (firstPageData.total > 100) {
        const remainingPages = Math.ceil((firstPageData.total - 100) / 100);
        for (let p = 2; p <= remainingPages + 1; p++) {
          const pageData = await deviceApi.getList({ page: p, limit: 100, includeRealtime: true });
          allDevices.push(...(pageData.data || []));
        }
      }

      // 根据 lastSeenAt 计算真实在线设备数量（30分钟内有数据）
      const now = Date.now()
      const devices = allDevices

      const trulyOnlineDevices = devices.filter((d: Device) => {
        if (!d.lastSeenAt) return false
        const lastSeen = new Date(d.lastSeenAt).getTime()
        return (now - lastSeen) < OFFLINE_THRESHOLD_MS
      })

      // 计算空调开机数量（在线且 acState === 1）
      const acPowerOnCount = trulyOnlineDevices.filter((d: Device) => {
        return d.realtimeData?.acState === 1
      }).length

      setStats({
        totalDevices: devices.length,
        onlineDevices: trulyOnlineDevices.length,
        offlineDevices: devices.length - trulyOnlineDevices.length,
        totalAlarms: statsData.totalAlarms,
        unacknowledgedAlarms: statsData.unacknowledgedAlarms,
        acPowerOnCount,
      })
      setRecentAlarms(alarmsData || [])
      setCustomers(customersData || [])
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

  const onlineRate = stats.totalDevices > 0
    ? ((stats.onlineDevices / stats.totalDevices) * 100).toFixed(1)
    : '0'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>仪表盘</h1>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        {/* 统计卡片 */}
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
              suffix={<span style={{ fontSize: 14, color: '#999' }}>/ {stats.totalDevices}</span>}
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
              title="空调开机"
              value={stats.acPowerOnCount}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={<span style={{ fontSize: 14, color: '#999' }}>台</span>}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 系统状态 */}
        <Col xs={24} lg={12}>
          <Card title="系统状态">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic
                  title="在线率"
                  value={onlineRate}
                  suffix="%"
                  valueStyle={{ color: Number(onlineRate) >= 80 ? '#52c41a' : '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="客户数量"
                  value={customers.length}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="告警总数"
                  value={stats.totalAlarms}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="未处理告警"
                  value={stats.unacknowledgedAlarms}
                  valueStyle={{ color: stats.unacknowledgedAlarms > 0 ? '#faad14' : '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 快捷操作 */}
        <Col xs={24} lg={12}>
          <QuickActionsPanel
            onRefresh={loadData}
            unacknowledgedAlarms={stats.unacknowledgedAlarms}
          />
        </Col>
      </Row>

      {/* 最近告警 */}
      <Card title="最近告警" style={{ marginTop: 16 }}>
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