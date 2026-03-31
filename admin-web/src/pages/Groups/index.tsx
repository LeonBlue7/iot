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
  Select,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { groupApi } from '../../services/group.service'
import { zoneApi } from '../../services/zone.service'
import type { DeviceGroup, CreateGroupInput, UpdateGroupInput, Zone } from '../../types/group'

export default function Groups() {
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<DeviceGroup[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadGroups()
    loadZones()
  }, [])

  async function loadGroups() {
    setLoading(true)
    try {
      const data = await groupApi.getList()
      setGroups(data)
    } catch {
      message.error('加载分组列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function loadZones() {
    try {
      const data = await zoneApi.getList()
      setZones(data)
    } catch {
      // Ignore zone loading error for now
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
      zoneId: group.zoneId,
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

  const getZoneName = (zoneId: number): string => {
    const zone = zones.find(z => z.id === zoneId)
    return zone?.name || '-'
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
      title: '所属分区',
      dataIndex: 'zoneId',
      key: 'zoneId',
      render: (zoneId: number) => getZoneName(zoneId),
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
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="zoneId"
            label="所属分区"
            rules={[{ required: true, message: '请选择所属分区' }]}
          >
            <Select placeholder="请选择分区">
              {zones.map(zone => (
                <Select.Option key={zone.id} value={zone.id}>
                  {zone.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}