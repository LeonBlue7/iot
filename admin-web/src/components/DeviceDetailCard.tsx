import { Card, Descriptions, Tag } from 'antd'
import type { Device } from '../types/device'

interface DeviceDetailCardProps {
  device: Device
  loading?: boolean
}

export default function DeviceDetailCard({ device, loading }: DeviceDetailCardProps) {
  return (
    <Card title="设备信息" loading={loading}>
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="设备ID">{device.id}</Descriptions.Item>
        <Descriptions.Item label="设备名称">{device.name || '未命名'}</Descriptions.Item>
        <Descriptions.Item label="SIM卡号">{device.simCard || '-'}</Descriptions.Item>
        <Descriptions.Item label="产品ID">{device.productId || '-'}</Descriptions.Item>
        <Descriptions.Item label="在线状态">
          <Tag color={device.online ? 'success' : 'default'}>
            {device.online ? '在线' : '离线'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="启用状态">
          <Tag color={device.enabled ? 'success' : 'warning'}>
            {device.enabled ? '已启用' : '已禁用'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="最后在线时间">
          {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString('zh-CN') : '从未上线'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {new Date(device.createdAt).toLocaleString('zh-CN')}
        </Descriptions.Item>
        <Descriptions.Item label="所属分组" span={2}>
          {device.groupId || '未分配分组'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}