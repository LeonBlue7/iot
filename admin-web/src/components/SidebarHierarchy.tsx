// admin-web/src/components/SidebarHierarchy.tsx
import { useState, useEffect, useCallback } from 'react'
import { Tree, Spin, Divider, Typography, message, Button } from 'antd'
import type { TreeProps } from 'antd'
import { FolderOutlined, HomeOutlined, AppstoreOutlined, ReloadOutlined } from '@ant-design/icons'
import { customerApi } from '../services/customer.service'
import { zoneApi } from '../services/zone.service'
import { groupApi } from '../services/group.service'
import { useHierarchyStore } from '../store/hierarchyStore'
import type { HierarchyTreeNode, Customer, Zone, DeviceGroup } from '../types/hierarchy'

interface SidebarHierarchyProps {
  collapsed: boolean
  onSelectionChange?: (selection: HierarchyTreeNode | null) => void
}

export function SidebarHierarchy({
  collapsed,
  onSelectionChange,
}: SidebarHierarchyProps): JSX.Element {
  const [treeData, setTreeData] = useState<HierarchyTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedNode, expandedKeys, setSelection, setExpandedKeys } = useHierarchyStore()

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

  // 渲染树节点标题
  const renderTitle = (node: HierarchyTreeNode): string => {
    if (node.level === 'group' && node.deviceCount !== undefined) {
      return `${node.title} (${node.deviceCount})`
    }
    return node.title
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
    </div>
  )
}