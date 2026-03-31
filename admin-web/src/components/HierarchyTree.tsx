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

  // Convert initial selection to key
  useEffect(() => {
    if (initialSelected) {
      const key = `${initialSelected.level}-${initialSelected.id}`
      setSelectedKeys([key])
      // Expand parent nodes
      if (initialSelected.parentId) {
        const parentKey = initialSelected.level === 'group' ? `zone-${initialSelected.parentId}` : `customer-${initialSelected.parentId}`
        setExpandedKeys([parentKey])
      }
    }
  }, [initialSelected])

  // Load hierarchy data
  useEffect(() => {
    const loadHierarchy = async (): Promise<void> => {
      try {
        setLoading(true)
        const customers = await customerApi.getList()

        // Build tree data with nested zones and groups
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
                }))

                return {
                  key: `zone-${zone.id}`,
                  title: zone.name,
                  level: 'zone',
                  id: zone.id,
                  parentId: customer.id,
                  children: groupChildren,
                  deviceCount: groupChildren.reduce((sum, g) => sum + (g.deviceCount || 0), 0),
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
            }
          })
        )

        setTreeData(treeNodes)

        // Auto-expand first customer if no initial selection
        if (!initialSelected && treeNodes.length > 0) {
          setExpandedKeys([treeNodes[0].key])
        }
      } catch (error) {
        // On error, show empty tree
        setTreeData([])
      } finally {
        setLoading(false)
      }
    }

    loadHierarchy()
  }, [initialSelected])

  // Handle tree selection
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

  // Handle tree expand
  const handleExpand: TreeProps['onExpand'] = useCallback(
    (keys: React.Key[]) => {
      setExpandedKeys(keys as string[])
    },
    []
  )

  // Get icon based on level
  const getNodeIcon = (level: string): JSX.Element => {
    switch (level) {
      case 'customer':
        return <HomeOutlined />
      case 'zone':
        return <AppstoreOutlined />
      case 'group':
        return <FolderOutlined />
      default:
        return <FolderOutlined />
    }
  }

  // Render tree node title with device count
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
        icon={(node: { level: string }) => getNodeIcon(node.level)}
      />
    </Spin>
  )
}