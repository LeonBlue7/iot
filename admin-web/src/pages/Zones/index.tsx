// admin-web/src/pages/Zones/index.tsx
import { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Space,
  message,
  Popconfirm,
  Select,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { zoneApi } from '../../services/zone.service'
import { customerApi } from '../../services/customer.service'
import type { Zone, Customer, CreateZoneInput, UpdateZoneInput } from '../../types/hierarchy'

export default function Zones() {
  const [loading, setLoading] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadZones()
    loadCustomers()
  }, [])

  async function loadZones() {
    setLoading(true)
    try {
      const data = await zoneApi.getList()
      setZones(data)
    } catch {
      message.error('加载分区列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadCustomers() {
    try {
      const data = await customerApi.getList()
      setCustomers(data)
    } catch {
      // Ignore customer loading error for now
    }
  }

  function handleCreate() {
    setEditingZone(null)
    form.resetFields()
    setModalVisible(true)
  }

  function handleEdit(zone: Zone) {
    setEditingZone(zone)
    form.setFieldsValue({
      name: zone.name,
      customerId: zone.customerId,
    })
    setModalVisible(true)
  }

  async function handleDelete(id: number) {
    try {
      await zoneApi.delete(id)
      message.success('删除成功')
      loadZones()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除失败'
      message.error(errorMessage)
    }
  }

  async function handleSubmit(values: CreateZoneInput | UpdateZoneInput) {
    try {
      if (editingZone) {
        await zoneApi.update(editingZone.id, values)
        message.success('更新成功')
      } else {
        await zoneApi.create(values as CreateZoneInput)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadZones()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (editingZone ? '更新失败' : '创建失败')
      message.error(errorMessage)
    }
  }

  const getCustomerName = (customerId: number): string => {
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || '-'
  }

  const columns: ColumnsType<Zone> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '分区名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '所属客户',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (customerId: number) => getCustomerName(customerId),
    },
    {
      title: '分组数量',
      key: 'groupCount',
      width: 100,
      render: (_, record) => (
        <Tag color={record._count?.groups ? 'blue' : 'default'}>
          {record._count?.groups || 0}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此分区?"
            description={record._count?.groups ? '该分区下有分组，无法删除' : '删除后无法恢复'}
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ disabled: !!record._count?.groups }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!!record._count?.groups}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>分区管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建分区
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={zones}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingZone ? '编辑分区' : '新建分区'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="分区名称"
            rules={[{ required: true, message: '请输入分区名称' }]}
          >
            <Input placeholder="请输入分区名称" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="customerId"
            label="所属客户"
            rules={[{ required: true, message: '请选择所属客户' }]}
          >
            <Select placeholder="请选择客户">
              {customers.map(customer => (
                <Select.Option key={customer.id} value={customer.id}>
                  {customer.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}