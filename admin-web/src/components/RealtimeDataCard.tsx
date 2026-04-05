import { useState } from 'react'
import { Card, Descriptions, Button, Tag, Empty } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { deviceApi } from '../services/device.service'
import type { SensorData } from '../types/device'
import type { Device } from '../types/device'

interface RealtimeDataCardProps {
  device: Device
  data?: SensorData | null
  loading?: boolean
  onRefresh?: () => void
}

function getAcStateText(acState?: number): string {
  switch (acState) {
    case 0:
      return '关闭'
    case 1:
      return '开启'
    case 2:
      return '故障'
    default:
      return '未知'
  }
}

function getAcStateColor(acState?: number): string {
  switch (acState) {
    case 0:
      return 'default'
    case 1:
      return 'success'
    case 2:
      return 'error'
    default:
      return 'default'
  }
}

export default function RealtimeDataCard({ device, data, loading, onRefresh }: RealtimeDataCardProps) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh()
      return
    }
    setRefreshing(true)
    try {
      // 如果没有提供 onRefresh，则自己刷新
      await deviceApi.getRealtimeData(device.id)
      // 这里只是触发刷新，数据由父组件管理
    } finally {
      setRefreshing(false)
    }
  }

  if (!device.online) {
    return (
      <Card title="实时数据" extra={<Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing}>刷新</Button>}>
        <Empty description="设备离线，无法获取实时数据" />
      </Card>
    )
  }

  return (
    <Card title="实时数据" extra={<Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={refreshing || loading}>刷新</Button>} loading={loading}>
      {data ? (
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="温度">
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#ff4d4f' }}>
              {data.temperature?.toFixed(1) ?? '-'} °C
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="湿度">
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
              {data.humidity?.toFixed(1) ?? '-'} %
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="电流">
            {data.current?.toFixed(2) ?? '-'} A
          </Descriptions.Item>
          <Descriptions.Item label="信号强度">
            {data.signalStrength ?? '-'} dBm
          </Descriptions.Item>
          <Descriptions.Item label="空调状态">
            <Tag color={getAcStateColor(data.acState)}>
              {getAcStateText(data.acState)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="空调故障">
            {data.acError ? <Tag color="error">故障码: {data.acError}</Tag> : <Tag color="success">正常</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="温度告警">
            {data.tempAlarm ? <Tag color="error">异常</Tag> : <Tag color="success">正常</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="湿度告警">
            {data.humiAlarm ? <Tag color="error">异常</Tag> : <Tag color="success">正常</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="记录时间" span={2}>
            {data.recordedAt ? new Date(data.recordedAt).toLocaleString('zh-CN') : '-'}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty description="暂无实时数据" />
      )}
    </Card>
  )
}