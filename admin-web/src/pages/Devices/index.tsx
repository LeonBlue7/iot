import { useEffect, useState } from 'react'
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Modal,
  Drawer,
  Form,
  Input,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  EditOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { deviceApi } from '../../services/device.service'
import type { Device } from '../../types/device'

export default function Devices() {
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editVisible, setEditVisible] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadDevices()
  }, [])

  async function loadDevices() {
    setLoading(true)
    try {
      const result = await deviceApi.getList()
      setDevices(result.data)
    } catch (error) {
      message.error('加载设备列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleControl(id: string, action: 'on' | 'off' | 'reset') {
    try {
      await deviceApi.controlDevice(id, action)
      message.success(`设备${action === 'on' ? '开启' : action === 'off' ? '关闭' : '重启'}成功`)
      loadDevices()
    } catch (error) {
      message.error('控制设备失败')
    }
  }

  async function handleEdit(values: { name?: string }) {
    if (!editingDevice) return
    try {
      await deviceApi.update(editingDevice.id, values)
      message.success('设备信息更新成功')
      setEditVisible(false)
      loadDevices()
    } catch (error) {
      message.error('更新设备信息失败')
    }
  }

  const columns: ColumnsType<Device> = [
    {
      title: '设备 ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
      render: (name?: string) => name || '未命名',
    },
    {
      title: 'SIM 卡号',
      dataIndex: 'simCard',
      key: 'simCard',
      render: (simCard?: string) => simCard || '-',
    },
    {
      title: '状态',
      dataIndex: 'online',
      key: 'online',
      render: (online: boolean) => (
        <Tag icon={online ? <CheckCircleOutlined /> : <CloseCircleOutlined />} color={online ? 'success' : 'default'}>
          {online ? '在线' : '离线'}
        </Tag>
      ),
    },
    {
      title: '最后上线时间',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      render: (lastSeenAt?: string) =>
        lastSeenAt ? new Date(lastSeenAt).toLocaleString('zh-CN') : '从未',
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<PoweroffOutlined />}
            onClick={() => handleControl(record.id, 'on')}
          >
            开启
          </Button>
          <Button
            type="link"
            icon={<CloseCircleOutlined />}
            onClick={() => handleControl(record.id, 'off')}
          >
            关闭
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedDevice(record)
              setDetailVisible(true)
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingDevice(record)
              form.setFieldsValue({ name: record.name })
              setEditVisible(true)
            }}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1>设备管理</h1>
        <Button type="primary" onClick={loadDevices} loading={loading}>
          刷新
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={devices}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 设备详情抽屉 */}
      <Drawer
        title="设备详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedDevice && (
          <div>
            <h3>基本信息</h3>
            <p><strong>设备 ID:</strong> {selectedDevice.id}</p>
            <p><strong>设备名称:</strong> {selectedDevice.name || '未命名'}</p>
            <p><strong>SIM 卡号:</strong> {selectedDevice.simCard || '-'}</p>
            <p><strong>状态:</strong> <Tag color={selectedDevice.online ? 'success' : 'default'}>{selectedDevice.online ? '在线' : '离线'}</Tag></p>
            <p><strong>创建时间:</strong> {new Date(selectedDevice.createdAt).toLocaleString('zh-CN')}</p>
            <p><strong>最后上线时间:</strong> {selectedDevice.lastSeenAt ? new Date(selectedDevice.lastSeenAt).toLocaleString('zh-CN') : '从未'}</p>
          </div>
        )}
      </Drawer>

      {/* 编辑设备对话框 */}
      <Modal
        title="编辑设备信息"
        open={editVisible}
        onOk={() => form.submit()}
        onCancel={() => setEditVisible(false)}
      >
        <Form form={form} onFinish={handleEdit} layout="vertical">
          <Form.Item name="name" label="设备名称">
            <Input placeholder="请输入设备名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
