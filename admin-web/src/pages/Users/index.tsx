// admin-web/src/pages/Users/index.tsx
import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Tag,
  Card,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons'
import { userApi } from '../../services/user.service'
import { customerApi } from '../../services/customer.service'
import { useAuth } from '../../hooks/useAuth'
import type { AdminUser, CreateUserData, UpdateUserData } from '../../types/user'
import type { Customer } from '../../types/hierarchy'

export default function Users(): JSX.Element {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form] = Form.useForm()

  // 判断当前用户是否为超级管理员
  const isCurrentUserSuperAdmin = currentUser?.isSuperAdmin === true

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await userApi.getList()
      setUsers(data)
    } catch (error) {
      message.error('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  // 加载客户列表
  const loadCustomers = useCallback(async () => {
    try {
      const data = await customerApi.getList()
      setCustomers(data)
    } catch (error) {
      // 忽略错误
    }
  }, [])

  useEffect(() => {
    loadUsers()
    loadCustomers()
  }, [loadUsers, loadCustomers])

  // 打开创建/编辑弹窗
  const openModal = (user?: AdminUser) => {
    setEditingUser(user || null)
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        name: user.name,
        customerId: user.customerId,
        isSuperAdmin: user.isSuperAdmin,
        enabled: user.enabled,
      })
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  // 关闭弹窗
  const closeModal = () => {
    setModalVisible(false)
    setEditingUser(null)
    form.resetFields()
  }

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingUser) {
        // 更新用户
        const updateData: UpdateUserData = {
          name: values.name,
          email: values.email,
          customerId: values.customerId,
          isSuperAdmin: values.isSuperAdmin,
          enabled: values.enabled,
        }
        if (values.password) {
          updateData.password = values.password
        }
        await userApi.update(editingUser.id, updateData)
        message.success('用户更新成功')
      } else {
        // 创建用户
        const createData: CreateUserData = {
          username: values.username,
          email: values.email,
          password: values.password,
          name: values.name,
          customerId: values.customerId,
          isSuperAdmin: values.isSuperAdmin,
        }
        await userApi.create(createData)
        message.success('用户创建成功')
      }

      closeModal()
      loadUsers()
    } catch (error) {
      message.error(editingUser ? '更新用户失败' : '创建用户失败')
    }
  }

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id)
      message.success('用户已删除')
      loadUsers()
    } catch (error) {
      message.error('删除用户失败')
    }
  }

  // 表格列定义
  const columns: ColumnsType<AdminUser> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name: string | null) => name || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '所属客户',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: { id: number; name: string } | null) =>
        customer ? customer.name : '-',
    },
    {
      title: '类型',
      dataIndex: 'isSuperAdmin',
      key: 'isSuperAdmin',
      width: 100,
      render: (isSuperAdmin: boolean) => (
        <Tag color={isSuperAdmin ? 'red' : 'blue'}>
          {isSuperAdmin ? '超级管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'error'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 160,
      render: (lastLoginAt: string | null) =>
        lastLoginAt ? new Date(lastLoginAt).toLocaleString() : '从未登录',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <UserOutlined />
            用户管理
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新建用户
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 创建/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
            ]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={editingUser ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={editingUser ? '留空则不修改' : '请输入密码'} />
          </Form.Item>

          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item name="customerId" label="所属客户">
            <Select
              placeholder="请选择客户"
              allowClear
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          {/* 只有超级管理员可以看到和修改超级管理员选项 */}
          {isCurrentUserSuperAdmin && (
            <Form.Item name="isSuperAdmin" label="超级管理员" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item name="enabled" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="禁用" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}