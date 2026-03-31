// admin-web/src/pages/DevicesNew/index.tsx
import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Table, Breadcrumb, Tag, Button, Modal, Select, message } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { HomeOutlined, ReloadOutlined } from '@ant-design/icons'
import { HierarchyTree } from '../../components/HierarchyTree'
import { DeviceSearchPanel } from '../../components/DeviceSearchPanel'
import { BatchActionBar } from '../../components/BatchActionBar'
import { BatchParamsModal } from '../../components/BatchParamsModal'
import { deviceApi } from '../../services/device.service'
import { batchApi } from '../../services/batch.service'
import { customerApi } from '../../services/customer.service'
import { zoneApi } from '../../services/zone.service'
import { groupApi } from '../../services/group.service'
import type { Device } from '../../types/device'
import type { HierarchySelection, DeviceSearchParams, Customer, Zone, DeviceGroup } from '../../types/hierarchy'

interface HierarchyPath {
  level: 'all' | 'customer' | 'zone' | 'group'
  id?: number
  name?: string
  parentId?: number
}

export default function DevicesNew(): JSX.Element {
  // State for hierarchy selection
  const [hierarchyPath, setHierarchyPath] = useState<HierarchyPath>({ level: 'all' })

  // State for devices
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  // State for batch params modal
  const [paramsModalVisible, setParamsModalVisible] = useState(false)

  // State for batch move modal
  const [moveModalVisible, setMoveModalVisible] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState<number | undefined>()
  const [availableGroups, setAvailableGroups] = useState<DeviceGroup[]>([])

  // State for search filters
  const [searchFilters, setSearchFilters] = useState<{
    customers: Customer[]
    zones: Zone[]
    groups: DeviceGroup[]
  }>({ customers: [], zones: [], groups: [] })

  // State for current search params
  const [searchParams, setSearchParams] = useState<DeviceSearchParams | null>(null)

  // Load search filters
  useEffect(() => {
    const loadFilters = async (): Promise<void> => {
      try {
        const customers = await customerApi.getList()
        setSearchFilters((prev) => ({ ...prev, customers }))
      } catch (error) {
        // Ignore filter loading errors
      }
    }
    loadFilters()
  }, [])

  // Load devices based on hierarchy path and search params
  const loadDevices = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      if (searchParams) {
        // Use batch search when search params are provided
        const result = await batchApi.search(searchParams)
        setDevices(result)
      } else {
        // Use regular device list
        const result = await deviceApi.getList()
        setDevices(result.data)
      }
    } catch (error) {
      message.error('Failed to load devices')
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  // Load devices on mount and when path/search changes
  useEffect(() => {
    loadDevices()
    // Clear selection when path changes
    setSelectedRowKeys([])
  }, [loadDevices, hierarchyPath])

  // Handle hierarchy tree selection
  const handleHierarchySelect = useCallback((selection: HierarchySelection) => {
    setHierarchyPath({
      level: selection.level,
      id: selection.id,
      parentId: selection.parentId,
    })

    // Update search params based on hierarchy
    const newParams: DeviceSearchParams = {}
    if (selection.level === 'customer') {
      newParams.customerId = selection.id
    } else if (selection.level === 'zone') {
      newParams.zoneId = selection.id
    } else if (selection.level === 'group') {
      newParams.groupId = selection.id
    }
    setSearchParams(newParams)

    // Load zones/groups based on selection
    if (selection.level === 'customer') {
      zoneApi.getByCustomerId(selection.id).then((zones) => {
        setSearchFilters((prev) => ({ ...prev, zones }))
      })
    } else if (selection.level === 'zone') {
      groupApi.getByZoneId(selection.id).then((groups) => {
        setSearchFilters((prev) => ({ ...prev, groups }))
      })
    }
  }, [])

  // Handle search
  const handleSearch = useCallback((params: DeviceSearchParams) => {
    setSearchParams(params)
  }, [])

  // Handle search reset
  const handleSearchReset = useCallback(() => {
    setSearchParams(null)
    setHierarchyPath({ level: 'all' })
  }, [])

  // Handle batch control
  const handleBatchControl = useCallback(async (action: 'on' | 'off' | 'reset') => {
    if (selectedRowKeys.length === 0) return

    try {
      const result = await batchApi.control({
        deviceIds: selectedRowKeys,
        action,
      })

      if (result.success) {
        message.success(`Batch operation completed: ${result.successCount} succeeded, ${result.failCount} failed`)
        loadDevices()
      }
    } catch (error) {
      message.error('Batch control failed')
    }
  }, [selectedRowKeys, loadDevices])

  // Handle batch move
  const handleBatchMove = useCallback(async () => {
    if (selectedRowKeys.length === 0) return

    // Load all groups for selection
    try {
      const groups = await groupApi.getList()
      setAvailableGroups(groups)
      setMoveModalVisible(true)
    } catch (error) {
      message.error('Failed to load groups')
    }
  }, [selectedRowKeys])

  // Handle batch move submit
  const handleBatchMoveSubmit = useCallback(async () => {
    if (!targetGroupId) {
      message.warning('Please select a target group')
      return
    }

    try {
      const result = await batchApi.moveToGroup({
        deviceIds: selectedRowKeys,
        targetGroupId,
      })

      if (result.success) {
        message.success(`Moved ${result.successCount} devices successfully`)
        setMoveModalVisible(false)
        setTargetGroupId(undefined)
        setSelectedRowKeys([])
        loadDevices()
      }
    } catch (error) {
      message.error('Batch move failed')
    }
  }, [selectedRowKeys, targetGroupId, loadDevices])

  // Handle batch params
  const handleBatchParams = useCallback(() => {
    if (selectedRowKeys.length === 0) return
    setParamsModalVisible(true)
  }, [selectedRowKeys])

  // Handle batch params submit
  const handleBatchParamsSubmit = useCallback(async (data: {
    deviceIds: string[]
    params: Record<string, unknown>
    selectedFields: string[]
  }) => {
    try {
      const result = await batchApi.updateParams(data)

      if (result.success) {
        message.success(`Updated parameters for ${result.successCount} devices`)
        setParamsModalVisible(false)
        loadDevices()
      }
    } catch (error) {
      message.error('Batch parameter update failed')
    }
  }, [loadDevices])

  // Handle batch toggle
  const handleBatchToggle = useCallback(async (enabled: boolean) => {
    if (selectedRowKeys.length === 0) return

    try {
      const result = await batchApi.toggleEnabled({
        deviceIds: selectedRowKeys,
        enabled,
      })

      if (result.success) {
        message.success(`${enabled ? 'Enabled' : 'Disabled'} ${result.successCount} devices`)
        loadDevices()
      }
    } catch (error) {
      message.error('Batch toggle failed')
    }
  }, [selectedRowKeys, loadDevices])

  // Handle batch delete
  const handleBatchDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) return

    Modal.confirm({
      title: 'Confirm Delete',
      content: `Are you sure you want to delete ${selectedRowKeys.length} devices?`,
      onOk: async () => {
        // Note: batch delete API not implemented yet
        message.warning('Batch delete functionality is not yet implemented')
      },
    })
  }, [selectedRowKeys])

  // Render hierarchy path breadcrumb
  const renderHierarchyPath = (): JSX.Element => {
    const items: { title: JSX.Element | string; key: string }[] = [
      { title: <><HomeOutlined /> <span>All Devices</span></>, key: 'all' },
    ]

    if (hierarchyPath.level !== 'all' && hierarchyPath.id) {
      if (hierarchyPath.level === 'customer') {
        items.push({ title: 'Customer:', key: 'customer' })
      } else if (hierarchyPath.level === 'zone') {
        items.push({ title: 'Zone:', key: 'zone' })
      } else if (hierarchyPath.level === 'group') {
        items.push({ title: 'Group:', key: 'group' })
      }
    }

    return (
      <Breadcrumb data-testid="hierarchy-path" items={items} />
    )
  }

  // Table columns
  const columns: ColumnsType<Device> = [
    {
      title: 'Device ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name?: string) => name || 'Unnamed',
    },
    {
      title: 'SIM Card',
      dataIndex: 'simCard',
      key: 'simCard',
      render: (simCard?: string) => simCard || '-',
    },
    {
      title: 'Status',
      dataIndex: 'online',
      key: 'online',
      render: (online: boolean) => (
        <Tag color={online ? 'success' : 'default'}>
          {online ? 'Online' : 'Offline'}
        </Tag>
      ),
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'warning'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Tag>
      ),
    },
    {
      title: 'Last Seen',
      dataIndex: 'lastSeenAt',
      key: 'lastSeenAt',
      render: (lastSeenAt?: string) =>
        lastSeenAt ? new Date(lastSeenAt).toLocaleString() : 'Never',
    },
  ]

  // Table row selection config
  const rowSelection: TableProps<Device>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[])
    },
  }

  return (
    <div data-testid="devices-page" style={{ padding: 24 }}>
      <Row gutter={16}>
        {/* Left sidebar - Hierarchy Tree */}
        <Col span={4}>
          <Card title="Hierarchy" size="small">
            <HierarchyTree onSelect={handleHierarchySelect} />
          </Card>
        </Col>

        {/* Main content */}
        <Col span={20}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h1 style={{ margin: 0 }}>Device Management</h1>
              {renderHierarchyPath()}
            </div>
            <Button icon={<ReloadOutlined />} onClick={loadDevices} loading={loading}>
              Refresh
            </Button>
          </div>

          {/* Search Panel */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <DeviceSearchPanel
              onSearch={handleSearch}
              onReset={handleSearchReset}
              filters={searchFilters}
            />
          </Card>

          {/* Batch Action Bar */}
          <BatchActionBar
            selectedCount={selectedRowKeys.length}
            onBatchControl={handleBatchControl}
            onBatchMove={handleBatchMove}
            onBatchParams={handleBatchParams}
            onBatchToggle={handleBatchToggle}
            onBatchDelete={handleBatchDelete}
          />

          {/* Devices Table */}
          <Card style={{ marginTop: 16 }}>
            <Table
              data-testid="devices-table"
              columns={columns}
              dataSource={devices}
              rowKey="id"
              loading={loading}
              rowSelection={rowSelection}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Batch Params Modal */}
      <BatchParamsModal
        visible={paramsModalVisible}
        deviceIds={selectedRowKeys}
        onClose={() => setParamsModalVisible(false)}
        onSubmit={handleBatchParamsSubmit}
      />

      {/* Batch Move Modal */}
      <Modal
        title="Move Devices to Group"
        open={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        onOk={handleBatchMoveSubmit}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Select target group"
          value={targetGroupId}
          onChange={(value) => setTargetGroupId(value)}
          options={availableGroups.map((g) => ({ value: g.id, label: g.name }))}
        />
      </Modal>
    </div>
  )
}