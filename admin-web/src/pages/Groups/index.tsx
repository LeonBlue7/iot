// admin-web/src/pages/Groups/index.tsx
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
  InputNumber,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { groupApi } from '../../services/group.service'
import type { DeviceGroup, CreateGroupInput, UpdateGroupInput } from '../../types/group'

export default function Groups() {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<DeviceGroup[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    setLoading(true)
    try {
      const data = await groupApi.getList()
      setGroups(data)
    } catch (error) {
      message.error('加载分组列表失败')
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingGroup(null)
    form.resetFields()
    setModalVisible(true)
  }

  function handleEdit(group: DeviceGroup) {
    setEditingGroup(group)
    form.setFieldsValue({
      name: group.name,
      description: group.description,
      sortOrder: group.sortOrder,
    })
    setModalVisible(true)
  }

  async function handleDelete(id: number) {
    try {
      await groupApi.delete(id)
      message.success('删除成功')
      loadGroups()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '删除失败'
      message.error(errorMessage)
    }
  }

  async function handleSubmit(values: CreateGroupInput | UpdateGroupInput) {
    try {
      if (editingGroup) {
        await groupApi.update(editingGroup.id, values)
        message.success('更新成功')
      } else {
        await groupApi.create(values as CreateGroupInput)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadGroups()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : (editingGroup ? '更新失败' : '创建失败')
      message.error(errorMessage)
    }
  }

  const columns: ColumnsType<DeviceGroup> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '分组名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string | null) => text || '-',
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '设备数量',
      key: 'deviceCount',
      width: 100,
      render: (_, record) => (
        <Tag color={record._count?.devices ? 'blue' : 'default'}>
          {record._count?.devices || 0}
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
            title="确定删除此分组?"
            description={record._count?.devices ? '该分组下有设备，无法删除' : '删除后无法恢复'}
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ disabled: !!record._count?.devices }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={!!record._count?.devices}
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
        <h1 style={{ margin: 0 }}>分组管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新建分组
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={groups}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editingGroup ? '编辑分组' : '新建分组'}
        open={modalVisible}
        onOk={() => form.submit()}
        onCancel={() => setModalVisible(false)}
        destroyOnHidden
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea placeholder="请输入描述" maxLength={500} rows={3} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}