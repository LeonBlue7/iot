// admin-web/src/components/SidebarHierarchy.tsx
import { useState, useEffect, useCallback } from 'react'
import { Tree, Spin, Divider, Typography, message, Button, Modal, Form, Input, Space } from 'antd'
import type { TreeProps } from 'antd'
import { FolderOutlined, HomeOutlined, AppstoreOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons'
import { customerApi } from '../services/customer.service'
import { zoneApi } from '../services/zone.service'
import { groupApi } from '../services/group.service'
import { useHierarchyStore } from '../store/hierarchyStore'
import type { HierarchyTreeNode, Customer, Zone, DeviceGroup, CreateZoneInput, CreateGroupInput } from '../types/hierarchy'

interface SidebarHierarchyProps {
  collapsed: boolean
  onSelectionChange?: (selection: HierarchyTreeNode | null) => void
}

type CreateModalState = {
  visible: boolean
  level: 'zone' | 'group' | null
  parentId: number | null
  parentName: string | null
}

export function SidebarHierarchy({
  collapsed,
  onSelectionChange,
}: SidebarHierarchyProps): JSX.Element {
  const [treeData, setTreeData] = useState<HierarchyTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedNode, expandedKeys, setSelection, setExpandedKeys } = useHierarchyStore()

  // 创建Modal状态
  const [createModal, setCreateModal] = useState<CreateModalState>({
    visible: false,
    level: null,
    parentId: null,
    parentName: null,
  })
  const [createForm] = Form.useForm()

  // 加载层级数据
  const loadHierarchy = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const customers = await customerApi.getList()

      const treeNodes: HierarchyTreeNode[] = await Promise.all(
        customers.map(async (customer: Customer) => {
          const zones = await zoneApi.getByCustomerId(customer.id)

          const zoneChildren: HierarchyTreeNode[] = await Promise.all(
            zones.map(async (zone: Zone) => {
              const groups = await groupApi.getByZoneId(zone.id)

              const groupChildren: HierarchyTreeNode[] = groups.map((group: DeviceGroup) => ({
                key: `group-${group.id}`,
                title: group.name,
                level: 'group',
                id: group.id,
                parentId: zone.id,
                deviceCount: group._count?.devices || 0,
                icon: <FolderOutlined />,
              }))

              return {
                key: `zone-${zone.id}`,
                title: zone.name,
                level: 'zone',
                id: zone.id,
                parentId: customer.id,
                children: groupChildren,
                deviceCount: groupChildren.reduce((sum, g) => sum + (g.deviceCount || 0), 0),
                icon: <AppstoreOutlined />,
              }
            })
          )

          return {
            key: `customer-${customer.id}`,
            title: customer.name,
            level: 'customer',
            id: customer.id,
            children: zoneChildren,
            deviceCount: zoneChildren.reduce((sum, z) => sum + (z.deviceCount || 0), 0),
            icon: <HomeOutlined />,
          }
        })
      )

      setTreeData(treeNodes)

      // 自动展开第一个客户
      if (treeNodes.length > 0 && expandedKeys.length === 0) {
        setExpandedKeys([treeNodes[0].key])
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载层级结构失败'
      setError(errorMessage)
      message.error(errorMessage)
      setTreeData([])
    } finally {
      setLoading(false)
    }
  }, [expandedKeys.length, setExpandedKeys])

  useEffect(() => {
    loadHierarchy()
  }, [loadHierarchy])

  // 处理树节点选择
  const handleSelect: TreeProps['onSelect'] = useCallback(
    (keys: React.Key[], info: { node: unknown }) => {
      if (keys.length > 0 && info.node) {
        const node = info.node as HierarchyTreeNode
        setSelection({
          level: node.level,
          id: node.id,
          parentId: node.parentId,
        })
        onSelectionChange?.(node)
      }
    },
    [setSelection, onSelectionChange]
  )

  // 处理树节点展开
  const handleExpand: TreeProps['onExpand'] = useCallback(
    (keys: React.Key[]) => {
      setExpandedKeys(keys as string[])
    },
    [setExpandedKeys]
  )

  // 打开创建Modal
  const handleOpenCreate = useCallback((level: 'zone' | 'group', parentId: number, parentName: string) => {
    setCreateModal({
      visible: true,
      level,
      parentId,
      parentName,
    })
    createForm.resetFields()
    if (level === 'zone') {
      createForm.setFieldsValue({ customerId: parentId })
    } else {
      createForm.setFieldsValue({ zoneId: parentId })
    }
  }, [createForm])

  // 处理创建提交
  const handleCreateSubmit = useCallback(async (values: CreateZoneInput | CreateGroupInput) => {
    try {
      if (createModal.level === 'zone') {
        await zoneApi.create(values as CreateZoneInput)
        message.success('分区创建成功')
      } else if (createModal.level === 'group') {
        await groupApi.create(values as CreateGroupInput)
        message.success('分组创建成功')
      }
      setCreateModal({ visible: false, level: null, parentId: null, parentName: null })
      loadHierarchy()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建失败'
      message.error(errorMessage)
    }
  }, [createModal.level, loadHierarchy])

  // 渲染树节点标题（包含创建按钮）
  const renderTitle = (node: HierarchyTreeNode): JSX.Element => {
    const countDisplay = node.deviceCount !== undefined ? ` (${node.deviceCount})` : ''

    // 根据层级添加创建按钮
    if (node.level === 'customer') {
      return (
        <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>{node.title}{countDisplay}</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined style={{ color: '#fff', fontSize: 12 }} />}
            onClick={(e) => {
              e.stopPropagation()
              handleOpenCreate('zone', node.id, node.title)
            }}
            style={{ padding: '0 4px', height: 'auto' }}
            title="创建分区"
          />
        </Space>
      )
    }

    if (node.level === 'zone') {
      return (
        <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
          <span>{node.title}{countDisplay}</span>
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined style={{ color: '#fff', fontSize: 12 }} />}
            onClick={(e) => {
              e.stopPropagation()
              handleOpenCreate('group', node.id, node.title)
            }}
            style={{ padding: '0 4px', height: 'auto' }}
            title="创建分组"
          />
        </Space>
      )
    }

    return <span>{node.title}{countDisplay}</span>
  }

  if (collapsed) {
    return (
      <div style={{ padding: '8px 0', textAlign: 'center' }}>
        <HomeOutlined style={{ fontSize: 16, color: '#fff' }} />
      </div>
    )
  }

  return (
    <div style={{ padding: '0 8px' }}>
      <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.2)' }} />
      <Typography.Text
        style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 12,
          padding: '0 8px',
        }}
      >
        层级结构
      </Typography.Text>
      {error ? (
        <div style={{ padding: '8px', textAlign: 'center' }}>
          <Typography.Text style={{ color: '#ff4d4f', fontSize: 12 }}>
            {error}
          </Typography.Text>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadHierarchy}
            style={{ color: '#fff', display: 'block', marginTop: 4 }}
          >
            重试
          </Button>
        </div>
      ) : (
        <Spin spinning={loading}>
          <Tree
            treeData={treeData}
            onSelect={handleSelect}
            onExpand={handleExpand}
            selectedKeys={selectedNode ? [`${selectedNode.level}-${selectedNode.id}`] : []}
            expandedKeys={expandedKeys}
            showIcon
            titleRender={(node: { title: string }) => renderTitle(node as HierarchyTreeNode)}
            style={{ background: 'transparent', color: '#fff' }}
          />
        </Spin>
      )}

      {/* 创建分区Modal */}
      <Modal
        title={`在 "${createModal.parentName || ''}" 下创建分区`}
        open={createModal.visible && createModal.level === 'zone'}
        onOk={() => createForm.submit()}
        onCancel={() => setCreateModal({ visible: false, level: null, parentId: null, parentName: null })}
        destroyOnClose
      >
        <Form form={createForm} onFinish={handleCreateSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="分区名称"
            rules={[{ required: true, message: '请输入分区名称' }]}
          >
            <Input placeholder="请输入分区名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="customerId" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建分组Modal */}
      <Modal
        title={`在 "${createModal.parentName || ''}" 下创建分组`}
        open={createModal.visible && createModal.level === 'group'}
        onOk={() => createForm.submit()}
        onCancel={() => setCreateModal({ visible: false, level: null, parentId: null, parentName: null })}
        destroyOnClose
      >
        <Form form={createForm} onFinish={handleCreateSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="分组名称"
            rules={[{ required: true, message: '请输入分组名称' }]}
          >
            <Input placeholder="请输入分组名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="zoneId" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}