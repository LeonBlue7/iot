import { useEffect, useState } from 'react'
import { Table, Card, Tag, Button, message, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { alarmApi } from '../../services/alarm.service'
import type { AlarmRecord } from '../../types/alarm'

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

export default function Alarms() {
  const [loading, setLoading] = useState(false)
  const [alarms, setAlarms] = useState<AlarmRecord[]>([])

  useEffect(() => {
    loadAlarms()
  }, [])

  async function loadAlarms() {
    setLoading(true)
    try {
      const data = await alarmApi.getList()
      setAlarms(data)
    } catch (error) {
      message.error('加载告警列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleAcknowledge(record: AlarmRecord) {
    Modal.confirm({
      title: '确认告警',
      content: `确定要确认告警吗？`,
      onOk: async () => {
        try {
          await alarmApi.acknowledge(record.id)
          message.success('告警已确认')
          loadAlarms()
        } catch (error) {
          message.error('确认告警失败')
        }
      },
    })
  }

  const columns: ColumnsType<AlarmRecord> = [
    {
      title: '告警 ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '设备 ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
    },
    {
      title: '告警类型',
      dataIndex: 'alarmType',
      key: 'alarmType',
      render: (type: string) => (
        <Tag color="orange">{typeMap[type] || type}</Tag>
      ),
    },
    {
      title: '告警值',
      dataIndex: 'alarmValue',
      key: 'alarmValue',
      render: (value: number, record: AlarmRecord) => {
        const unit = record.alarmType.includes('TEMP') ? '°C' : '%'
        return `${value}${unit}`
      },
    },
    {
      title: '阈值',
      dataIndex: 'threshold',
      key: 'threshold',
      render: (threshold: number, record: AlarmRecord) => {
        const unit = record.alarmType.includes('TEMP') ? '°C' : '%'
        return `${threshold}${unit}`
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => {
        const { text, color } = statusMap[status] || { text: '未知', color: 'default' }
        return <Tag color={color} icon={status === 0 ? <ExclamationCircleOutlined /> : <CheckCircleOutlined />}>{text}</Tag>
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => new Date(createdAt).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: AlarmRecord) => {
        if (record.status !== 0) return null
        return (
          <Button
            type="link"
            size="small"
            onClick={() => handleAcknowledge(record)}
          >
            确认
          </Button>
        )
      },
    },
  ]

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>告警管理</h1>

      <Card>
        <Table
          columns={columns}
          dataSource={alarms}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
