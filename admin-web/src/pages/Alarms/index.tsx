import { useEffect, useState, useCallback } from 'react'
import { Table, Card, Tag, Button, message, Modal, Space, Select, Row, Col } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { alarmApi } from '../../services/alarm.service'
import AlarmDetailModal from '../../components/AlarmDetailModal'
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

const statusFilterOptions = [
  { value: 0, label: '未处理' },
  { value: 1, label: '已确认' },
  { value: 2, label: '已解决' },
]

export default function Alarms() {
  const [loading, setLoading] = useState(false)
  const [alarms, setAlarms] = useState<AlarmRecord[]>([])
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [statusFilter, setStatusFilter] = useState<number | undefined>()
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmRecord | null>(null)

  useEffect(() => {
    loadAlarms()
  }, [statusFilter])

  async function loadAlarms() {
    setLoading(true)
    setSelectedRowKeys([])
    try {
      const data = await alarmApi.getList({ status: statusFilter })
      setAlarms(data)
    } catch (error) {
      message.error('加载告警列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAcknowledge = useCallback(async (id: number) => {
    try {
      await alarmApi.acknowledge(id)
      message.success('告警已确认')
      setDetailVisible(false)
      loadAlarms()
    } catch (error) {
      message.error('确认告警失败')
    }
  }, [])

  const handleResolve = useCallback(async (id: number) => {
    try {
      await alarmApi.resolve(id)
      message.success('告警已解决')
      setDetailVisible(false)
      loadAlarms()
    } catch (error) {
      message.error('解决告警失败')
    }
  }, [])

  const handleBatchAcknowledge = useCallback(async () => {
    if (selectedRowKeys.length === 0) return

    Modal.confirm({
      title: '批量确认',
      content: `确定要确认选中的 ${selectedRowKeys.length} 个告警吗？`,
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((id) => alarmApi.acknowledge(id)))
          message.success('批量确认成功')
          loadAlarms()
        } catch (error) {
          message.error('批量确认失败')
        }
      },
    })
  }, [selectedRowKeys])

  const handleBatchResolve = useCallback(async () => {
    if (selectedRowKeys.length === 0) return

    Modal.confirm({
      title: '批量解决',
      content: `确定要解决选中的 ${selectedRowKeys.length} 个告警吗？`,
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((id) => alarmApi.resolve(id)))
          message.success('批量解决成功')
          loadAlarms()
        } catch (error) {
          message.error('批量解决失败')
        }
      },
    })
  }, [selectedRowKeys])

  const handleViewDetail = useCallback((alarm: AlarmRecord) => {
    setSelectedAlarm(alarm)
    setDetailVisible(true)
  }, [])

  const columns: ColumnsType<AlarmRecord> = [
    {
      title: '告警ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '设备ID',
      dataIndex: 'deviceId',
      key: 'deviceId',
      width: 180,
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
      width: 180,
      render: (_: unknown, record: AlarmRecord) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 0 && (
            <Button
              type="link"
              size="small"
              onClick={() => handleAcknowledge(record.id)}
            >
              确认
            </Button>
          )}
          {record.status === 1 && (
            <Button
              type="link"
              size="small"
              onClick={() => handleResolve(record.id)}
            >
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const rowSelection: TableProps<AlarmRecord>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as number[])
    },
    getCheckboxProps: (record: AlarmRecord) => ({
      disabled: record.status === 2, // 已解决的告警不可选择
    }),
  }

  // 计算可批量操作的告警数量
  const unacknowledgedCount = selectedRowKeys.filter((id) => {
    const alarm = alarms.find((a) => a.id === id)
    return alarm && alarm.status === 0
  }).length

  const acknowledgedCount = selectedRowKeys.filter((id) => {
    const alarm = alarms.find((a) => a.id === id)
    return alarm && alarm.status === 1
  }).length

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>告警管理</h1>

      {/* 筛选栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span>状态筛选：</span>
          </Col>
          <Col>
            <Select
              allowClear
              placeholder="全部状态"
              style={{ width: 120 }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              options={statusFilterOptions}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={loadAlarms} loading={loading}>
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 批量操作栏 */}
      {selectedRowKeys.length > 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 个告警</span>
            {unacknowledgedCount > 0 && (
              <Button type="primary" onClick={handleBatchAcknowledge}>
                批量确认 ({unacknowledgedCount})
              </Button>
            )}
            {acknowledgedCount > 0 && (
              <Button onClick={handleBatchResolve}>
                批量解决 ({acknowledgedCount})
              </Button>
            )}
            <Button onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </Space>
        </Card>
      )}

      {/* 告警表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={alarms}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 告警详情弹窗 */}
      <AlarmDetailModal
        visible={detailVisible}
        alarm={selectedAlarm}
        onClose={() => setDetailVisible(false)}
        onAcknowledge={handleAcknowledge}
        onResolve={handleResolve}
      />
    </div>
  )
}