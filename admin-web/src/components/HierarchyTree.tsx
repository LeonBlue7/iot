// admin-web/src/components/HierarchyTree.tsx
import { useState, useEffect, useCallback } from 'react'
import { Tree, Spin } from 'antd'
import type { TreeProps } from 'antd'
import { FolderOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons'
import { customerApi } from '../services/customer.service'
import { zoneApi } from '../services/zone.service'
import { groupApi } from '../services/group.service'
import type { HierarchyTreeNode, Customer, Zone, DeviceGroup } from '../types/hierarchy'

interface HierarchySelection {
  level: 'customer' | 'zone' | 'group'
  id: number
  parentId?: number
}

interface HierarchyTreeProps {
  onSelect: (selection: HierarchySelection) => void
  initialSelected?: HierarchySelection
}

export function HierarchyTree({ onSelect, initialSelected }: HierarchyTreeProps): JSX.Element {
  const [treeData, setTreeData] = useState<HierarchyTreeNode[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // 将初始选择转换为key
  useEffect(() => {
    if (initialSelected) {
      const key = `${initialSelected.level}-${initialSelected.id}`
      setSelectedKeys([key])
      // 展开父节点
      if (initialSelected.parentId) {
        const parentKey = initialSelected.level === 'group' ? `zone-${initialSelected.parentId}` : `customer-${initialSelected.parentId}`
        setExpandedKeys([parentKey])
      }
    }
  }, [initialSelected])

  // 加载层级数据
  useEffect(() => {
    const loadHierarchy = async (): Promise<void> => {
      try {
        setLoading(true)
        const customers = await customerApi.getList()

        // 构建树形数据，包含嵌套的分区和分组
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

        // 如果没有初始选择，自动展开第一个客户
        if (!initialSelected && treeNodes.length > 0) {
          setExpandedKeys([treeNodes[0].key])
        }
      } catch (error) {
        // 出错时显示空树
        setTreeData([])
      } finally {
        setLoading(false)
      }
    }

    loadHierarchy()
  }, [initialSelected])

  // 处理树节点选择
  const handleSelect: TreeProps['onSelect'] = useCallback(
    (keys: React.Key[], info: { node: unknown }) => {
      if (keys.length > 0 && info.node) {
        const node = info.node as HierarchyTreeNode
        setSelectedKeys(keys as string[])
        onSelect({
          level: node.level,
          id: node.id,
          parentId: node.parentId,
        })
      }
    },
    [onSelect]
  )

  // 处理树节点展开
  const handleExpand: TreeProps['onExpand'] = useCallback(
    (keys: React.Key[]) => {
      setExpandedKeys(keys as string[])
    },
    []
  )

  // 渲染树节点标题，显示设备数量
  const renderTitle = (node: HierarchyTreeNode): string => {
    if (node.level === 'group' && node.deviceCount !== undefined) {
      return `${node.title} (${node.deviceCount})`
    }
    return node.title
  }

  return (
    <Spin spinning={loading}>
      <Tree
        treeData={treeData}
        onSelect={handleSelect}
        onExpand={handleExpand}
        selectedKeys={selectedKeys}
        expandedKeys={expandedKeys}
        showIcon
        titleRender={(node: { title: string }) => renderTitle(node as HierarchyTreeNode)}
      />
    </Spin>
  )
}