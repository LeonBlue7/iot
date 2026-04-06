// admin-web/src/pages/Devices/index.tsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Breadcrumb, Tag, Button, Modal, Select, message, Space } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'
import { HomeOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { DeviceSearchPanel } from '../../components/DeviceSearchPanel'
import { BatchActionBar } from '../../components/BatchActionBar'
import { BatchParamsModal } from '../../components/BatchParamsModal'
import { deviceApi } from '../../services/device.service'
import { alarmApi } from '../../services/alarm.service'
import { batchApi } from '../../services/batch.service'
import { customerApi } from '../../services/customer.service'
import { groupApi } from '../../services/group.service'
import { useHierarchyStore } from '../../store/hierarchyStore'
import type { Device, SensorData } from '../../types/device'
import type { DeviceSearchParams, Customer, Zone, DeviceGroup } from '../../types/hierarchy'

// 扩展Device类型以包含实时数据和告警状态
interface DeviceWithExtras extends Device {
  realtimeData?: SensorData | null
  hasAlarm?: boolean
}

export default function Devices(): JSX.Element {
  const navigate = useNavigate()
  // 从store获取层级选择状态
  const selectedNode = useHierarchyStore((state) => state.selectedNode)

  // 设备状态
  const [devices, setDevices] = useState<DeviceWithExtras[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])

  // 批量参数设置弹窗状态
  const [paramsModalVisible, setParamsModalVisible] = useState(false)

  // 批量移动弹窗状态
  const [moveModalVisible, setMoveModalVisible] = useState(false)
  const [targetGroupId, setTargetGroupId] = useState<number | undefined>()
  const [availableGroups, setAvailableGroups] = useState<DeviceGroup[]>([])

  // 搜索筛选器状态
  const [searchFilters, setSearchFilters] = useState<{
    customers: Customer[]
    zones: Zone[]
    groups: DeviceGroup[]
  }>({ customers: [], zones: [], groups: [] })

  // 当前搜索参数
  const [searchParams, setSearchParams] = useState<DeviceSearchParams | null>(null)

  // 分页配置
  const [pagination, setPagination] = useState({ page: 1, pageSize: 50 })
  const [totalDevices, setTotalDevices] = useState(0)

  // 加载搜索筛选器
  useEffect(() => {
    const loadFilters = async (): Promise<void> => {
      try {
        const customers = await customerApi.getList()
        setSearchFilters((prev) => ({ ...prev, customers }))
      } catch (error) {
        // 忽略筛选器加载错误
      }
    }
    loadFilters()
  }, [])

  // 加载告警状态（用于高亮显示有告警的设备）
  const loadAlarmStatus = useCallback(async (deviceList: Device[]): Promise<Set<string>> => {
    try {
      const alarms = await alarmApi.getList({ status: 0, limit: 1000 })
      return new Set(alarms.map((a) => a.deviceId))
    } catch (error) {
      console.error('Failed to load alarm status:', error)
      return new Set()
    }
  }, [])

  // 根据层级选择和搜索参数加载设备
  const loadDevices = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)

      // 构建搜索参数
      const params: DeviceSearchParams = {}

      // 从store获取层级筛选
      if (selectedNode) {
        if (selectedNode.level === 'customer') {
          params.customerId = selectedNode.id
        } else if (selectedNode.level === 'zone') {
          params.zoneId = selectedNode.id
        } else if (selectedNode.level === 'group') {
          params.groupId = selectedNode.id
        }
      }

      // 合并手动搜索参数
      if (searchParams?.keyword) {
        params.keyword = searchParams.keyword
      }

      let deviceList: DeviceWithExtras[]
      let total = 0

      if (Object.keys(params).length > 0) {
        // 搜索模式：使用batch API
        const searchResults = await batchApi.search(params)
        // 搜索结果需要单独获取实时数据
        const alarmDeviceIds = await loadAlarmStatus(searchResults)
        deviceList = searchResults.map((d) => ({
          ...d,
          realtimeData: (d as any).realtimeData || null,
          hasAlarm: alarmDeviceIds.has(d.id),
        }))
        total = searchResults.length
      } else {
        // 列表模式：后端直接返回实时数据
        const result = await deviceApi.getList({
          page: pagination.page,
          limit: pagination.pageSize,
          includeRealtime: true,
        })
        const alarmDeviceIds = await loadAlarmStatus(result.data)
        deviceList = result.data.map((d: any) => ({
          ...d,
          realtimeData: d.realtimeData || null,
          hasAlarm: alarmDeviceIds.has(d.id),
        }))
        total = result.total
      }

      setDevices(deviceList)
      setTotalDevices(total)
    } catch (error) {
      message.error('加载设备列表失败')
      setDevices([])
    } finally {
      setLoading(false)
    }
  }, [selectedNode, searchParams, pagination.page, pagination.pageSize, loadAlarmStatus])

  // 组件挂载和层级/搜索变化时加载设备
  useEffect(() => {
    loadDevices()
    // 层级变化时清除选择
    setSelectedRowKeys([])
  }, [loadDevices])

  // 处理搜索
  const handleSearch = useCallback((params: DeviceSearchParams) => {
    setSearchParams(params)
  }, [])

  // 处理搜索重置
  const handleSearchReset = useCallback(() => {
    setSearchParams(null)
  }, [])

  // 处理批量控制
  const handleBatchControl = useCallback(async (action: 'on' | 'off' | 'reset') => {
    if (selectedRowKeys.length === 0) return

    try {
      const result = await batchApi.control({
        deviceIds: selectedRowKeys,
        action,
      })

      if (result.success) {
        message.success(`批量操作完成：成功 ${result.successCount} 台，失败 ${result.failCount} 台`)
        loadDevices()
      }
    } catch (error) {
      message.error('批量控制失败')
    }
  }, [selectedRowKeys, loadDevices])

  // 处理批量移动
  const handleBatchMove = useCallback(async () => {
    if (selectedRowKeys.length === 0) return

    // 加载所有分组供选择
    try {
      const groups = await groupApi.getList()
      setAvailableGroups(groups)
      setMoveModalVisible(true)
    } catch (error) {
      message.error('加载分组列表失败')
    }
  }, [selectedRowKeys])

  // 处理批量移动提交
  const handleBatchMoveSubmit = useCallback(async () => {
    if (!targetGroupId) {
      message.warning('请选择目标分组')
      return
    }

    try {
      const result = await batchApi.moveToGroup({
        deviceIds: selectedRowKeys,
        targetGroupId,
      })

      if (result.success) {
        message.success(`成功移动 ${result.successCount} 台设备`)
        setMoveModalVisible(false)
        setTargetGroupId(undefined)
        setSelectedRowKeys([])
        loadDevices()
      }
    } catch (error) {
      message.error('批量移动失败')
    }
  }, [selectedRowKeys, targetGroupId, loadDevices])

  // 处理批量参数设置
  const handleBatchParams = useCallback(() => {
    if (selectedRowKeys.length === 0) return
    setParamsModalVisible(true)
  }, [selectedRowKeys])

  // 处理批量参数提交
  const handleBatchParamsSubmit = useCallback(async (data: {
    deviceIds: string[]
    params: Record<string, unknown>
    selectedFields: string[]
  }) => {
    try {
      const result = await batchApi.updateParams(data)

      if (result.success) {
        message.success(`成功更新 ${result.successCount} 台设备的参数`)
        setParamsModalVisible(false)
        loadDevices()
      }
    } catch (error) {
      message.error('批量参数更新失败')
    }
  }, [loadDevices])

  // 处理批量启用/禁用
  const handleBatchToggle = useCallback(async (enabled: boolean) => {
    if (selectedRowKeys.length === 0) return

    try {
      const result = await batchApi.toggleEnabled({
        deviceIds: selectedRowKeys,
        enabled,
      })

      if (result.success) {
        message.success(`成功${enabled ? '启用' : '禁用'} ${result.successCount} 台设备`)
        loadDevices()
      }
    } catch (error) {
      message.error('批量操作失败')
    }
  }, [selectedRowKeys, loadDevices])

  // 处理批量删除
  const handleBatchDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) return

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 台设备吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        // 注意：批量删除API尚未实现
        message.warning('批量删除功能暂未实现')
      },
    })
  }, [selectedRowKeys])

  // 渲染层级路径面包屑
  const renderHierarchyPath = (): JSX.Element => {
    const items: { title: JSX.Element | string; key: string }[] = [
      { title: <><HomeOutlined /> <span>全部设备</span></>, key: 'all' },
    ]

    if (selectedNode) {
      if (selectedNode.level === 'customer') {
        items.push({ title: '客户', key: 'customer' })
      } else if (selectedNode.level === 'zone') {
        items.push({ title: '分区', key: 'zone' })
      } else if (selectedNode.level === 'group') {
        items.push({ title: '分组', key: 'group' })
      }
    }

    return (
      <Breadcrumb data-testid="hierarchy-path" items={items} />
    )
  }

  // 单设备控制
  const handleSingleControl = useCallback(async (deviceId: string, action: 'on' | 'off' | 'reset') => {
    try {
      await deviceApi.controlDevice(deviceId, action)
      const actionText = action === 'on' ? '开启' : action === 'off' ? '关闭' : '重启'
      message.success(`${actionText}指令已发送`)
      loadDevices()
    } catch (error: any) {
      message.error(error.message || '控制失败')
    }
  }, [loadDevices])

  // 查看设备详情
  const handleViewDetail = useCallback((deviceId: string) => {
    navigate(`/devices/${deviceId}`)
  }, [navigate])

  // 表格列定义
  const columns: ColumnsType<DeviceWithExtras> = useMemo(() => [
    {
      title: '设备ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (id: string) => (
        <a onClick={() => handleViewDetail(id)} style={{ color: '#1890ff' }}>
          {id}
        </a>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name?: string) => name || '未命名',
    },
    {
      title: '温度',
      key: 'temperature',
      width: 80,
      render: (_, record) => {
        const temp = record.realtimeData?.temperature
        if (temp !== undefined && temp !== null) {
          return (
            <span style={{ fontWeight: 'bold', color: record.hasAlarm ? '#ff4d4f' : undefined }}>
              {typeof temp === 'number' ? temp.toFixed(1) : temp}
            </span>
          )
        }
        return <span style={{ color: '#999' }}>-</span>
      },
    },
    {
      title: '状态',
      dataIndex: 'online',
      key: 'online',
      render: (online: boolean) => (
        <Tag color={online ? 'success' : 'default'}>
          {online ? '在线' : '离线'}
        </Tag>
      ),
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'warning'}>
          {enabled ? '已启用' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            详情
          </Button>
          <Button
            type="primary"
            size="small"
            disabled={!record.online}
            title={!record.online ? '设备离线，无法操作' : undefined}
            onClick={() => handleSingleControl(record.id, 'on')}
          >
            开启
          </Button>
          <Button
            size="small"
            disabled={!record.online}
            title={!record.online ? '设备离线，无法操作' : undefined}
            onClick={() => handleSingleControl(record.id, 'off')}
          >
            关闭
          </Button>
          <Button
            size="small"
            disabled={!record.online}
            title={!record.online ? '设备离线，无法操作' : undefined}
            onClick={() => handleSingleControl(record.id, 'reset')}
          >
            重启
          </Button>
        </Space>
      ),
    },
  ], [handleViewDetail, handleSingleControl])

  // 表格行选择配置
  const rowSelection: TableProps<DeviceWithExtras>['rowSelection'] = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[])
    },
  }

  // 表格行样式 - 告警高亮
  const getRowClassName = useCallback((record: DeviceWithExtras): string => {
    if (record.hasAlarm) {
      return 'alarm-row'
    }
    return ''
  }, [])

  return (
    <div data-testid="devices-page" style={{ padding: 24 }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>设备管理</h1>
          {renderHierarchyPath()}
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadDevices} loading={loading}>
          刷新
        </Button>
      </div>

      {/* 搜索面板 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <DeviceSearchPanel
          onSearch={handleSearch}
          onReset={handleSearchReset}
          filters={searchFilters}
        />
      </Card>

      {/* 批量操作栏 */}
      <BatchActionBar
        selectedCount={selectedRowKeys.length}
        onBatchControl={handleBatchControl}
        onBatchMove={handleBatchMove}
        onBatchParams={handleBatchParams}
        onBatchToggle={handleBatchToggle}
        onBatchDelete={handleBatchDelete}
      />

      {/* 设备表格 */}
      <Card style={{ marginTop: 16 }}>
        <Table
          data-testid="devices-table"
          columns={columns}
          dataSource={devices}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          rowClassName={getRowClassName}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: totalDevices,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, newPageSize) => {
              setPagination({ page, pageSize: newPageSize })
            },
          }}
        />
        {/* 告警行样式 */}
        <style>{`
          .alarm-row {
            background-color: #fff1f0 !important;
          }
          .alarm-row:hover td {
            background-color: #ffe7e6 !important;
          }
        `}</style>
      </Card>

      {/* 批量参数设置弹窗 */}
      <BatchParamsModal
        visible={paramsModalVisible}
        deviceIds={selectedRowKeys}
        onClose={() => setParamsModalVisible(false)}
        onSubmit={handleBatchParamsSubmit}
      />

      {/* 批量移动弹窗 */}
      <Modal
        title="移动设备到分组"
        open={moveModalVisible}
        onCancel={() => setMoveModalVisible(false)}
        onOk={handleBatchMoveSubmit}
        okText="确定"
        cancelText="取消"
      >
        <Select
          style={{ width: '100%' }}
          placeholder="请选择目标分组"
          value={targetGroupId}
          onChange={(value) => setTargetGroupId(value)}
          options={availableGroups.map((g) => ({ value: g.id, label: g.name }))}
        />
      </Modal>
    </div>
  )
}