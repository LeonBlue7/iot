import { Modal, Descriptions, Tag, Button, Space } from 'antd'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { AlarmRecord } from '../types/alarm'

interface AlarmDetailModalProps {
  visible: boolean
  alarm: AlarmRecord | null
  onClose: () => void
  onAcknowledge?: (id: number) => void
  onResolve?: (id: number) => void
}

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '未处理', color: 'red' },
  1: { text: '已确认', color: 'blue' },
  2: { text: '已解决', color: 'green' },
}

const typeMap: Record<string, string> = {
  TEMP_HIGH: '温度过高',
  TEMP_LOW: '温度过低',
  HUMI_HIGH: '湿度过高',
  HUMI_LOW: '湿度过低',
}

export default function AlarmDetailModal({
  visible,
  alarm,
  onClose,
  onAcknowledge,
  onResolve,
}: AlarmDetailModalProps) {
  if (!alarm) return null

  const statusInfo = statusMap[alarm.status] || { text: '未知', color: 'default' }

  const handleAcknowledge = () => {
    if (onAcknowledge) {
      onAcknowledge(alarm.id)
    }
  }

  const handleResolve = () => {
    if (onResolve) {
      onResolve(alarm.id)
    }
  }

  return (
    <Modal
      title="告警详情"
      open={visible}
      onCancel={onClose}
      footer={
        <Space>
          {alarm.status === 0 && onAcknowledge && (
            <Button type="primary" onClick={handleAcknowledge}>
              确认告警
            </Button>
          )}
          {alarm.status === 1 && onResolve && (
            <Button type="primary" onClick={handleResolve}>
              解决告警
            </Button>
          )}
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
      width={600}
    >
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="告警ID">{alarm.id}</Descriptions.Item>
        <Descriptions.Item label="状态">
          <Tag color={statusInfo.color} icon={alarm.status === 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}>
            {statusInfo.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="设备ID">{alarm.deviceId}</Descriptions.Item>
        <Descriptions.Item label="告警类型">
          <Tag color="orange">{typeMap[alarm.alarmType] || alarm.alarmType}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="告警值">
          {alarm.alarmValue}{alarm.alarmType.includes('TEMP') ? '°C' : '%'}
        </Descriptions.Item>
        <Descriptions.Item label="阈值">
          {alarm.threshold}{alarm.alarmType.includes('TEMP') ? '°C' : '%'}
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {new Date(alarm.createdAt).toLocaleString('zh-CN')}
        </Descriptions.Item>
        <Descriptions.Item label="处理时间">
          {alarm.acknowledgedAt ? new Date(alarm.acknowledgedAt).toLocaleString('zh-CN') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="处理人" span={2}>
          {alarm.acknowledgedBy || '-'}
        </Descriptions.Item>
      </Descriptions>
    </Modal>
  )
}