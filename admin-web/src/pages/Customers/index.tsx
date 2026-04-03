// admin-web/src/pages/Customers/index.tsx
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
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { customerApi } from '../../services/customer.service'
import type { Customer, CreateCustomerInput, UpdateCustomerInput } from '../../types/hierarchy'

export default function Customers() {
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    try {
      const data = await customerApi.getList()
      setCustomers(data)
    } catch {
      message.error('加载客户列表失败')
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingCustomer(null)
    form.resetFields()
    setModalVisible(true)
  }

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer)
    form.setFieldsValue({
      name: customer.name,
    })
    setModalVisible(true)
  }

  async function handleDelete(id: number) {
    try {
      await customerApi.delete(id)
      message.success('删除成功')
      loadCustomers()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除失败'
      message.error(errorMessage)
    }
  }

  async function handleSubmit(values: CreateCustomerInput | UpdateCustomerInput) {
    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, values)
        message.success('更新成功')
      } else {
        await customerApi.create(values as CreateCustomerInput)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadCustomers()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (editingCustomer ? '更新失败' : '创建失败')
      message.error(errorMessage)
    }
  }

  const columns: ColumnsType<Customer> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分区数量',
      key: 'zoneCount',
      width: 100,
      render: (_, record) => (
        <Tag color={record._count?.zones ? 'blue' : 'default'}>
          {record._count?.zones || 0}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
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
            title="确定删除此客户?"
            description={record._count?.zones ? '该客户下有分区，无法删除' : '删除后无法恢复'}
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ disabled: !!record._count?.zones }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!!record._count?.zones}
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
        <h1 style={{ margin: 0 }}>客户管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建客户
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingCustomer ? '编辑客户' : '新建客户'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" maxLength={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}