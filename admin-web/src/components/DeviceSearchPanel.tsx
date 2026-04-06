// admin-web/src/components/DeviceSearchPanel.tsx
import { useState, useCallback, useEffect } from 'react'
import { Input, Select, Button, Space } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { zoneApi } from '../services/zone.service'
import { groupApi } from '../services/group.service'
import type { DeviceSearchParams, Customer, Zone, DeviceGroup } from '../types/hierarchy'

interface DeviceSearchFilters {
  customers: Customer[]
  zones?: Zone[]
  groups?: DeviceGroup[]
}

interface DeviceSearchPanelProps {
  onSearch: (params: DeviceSearchParams) => void
  onReset: () => void
  filters: DeviceSearchFilters | null
  initialParams?: DeviceSearchParams
}

export function DeviceSearchPanel({
  onSearch,
  onReset,
  filters,
  initialParams,
}: DeviceSearchPanelProps): JSX.Element {
  const [keyword, setKeyword] = useState(initialParams?.keyword || '')
  const [customerId, setCustomerId] = useState<number | undefined>(initialParams?.customerId)
  const [zoneId, setZoneId] = useState<number | undefined>(initialParams?.zoneId)
  const [groupId, setGroupId] = useState<number | undefined>(initialParams?.groupId)

  // 动态加载的分区和分组
  const [zones, setZones] = useState<Zone[]>(filters?.zones || [])
  const [groups, setGroups] = useState<DeviceGroup[]>(filters?.groups || [])
  const [loadingZones, setLoadingZones] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  // 当选择客户时，动态加载该客户的分区
  useEffect(() => {
    const loadZones = async () => {
      if (customerId) {
        setLoadingZones(true)
        try {
          const zonesData = await zoneApi.getByCustomerId(customerId)
          setZones(zonesData)
        } catch (error) {
          setZones([])
        } finally {
          setLoadingZones(false)
        }
      } else {
        setZones([])
      }
      // 清空分区和分组选择
      setZoneId(undefined)
      setGroupId(undefined)
      setGroups([])
    }
    loadZones()
  }, [customerId])

  // 当选择分区时，动态加载该分区的分组
  useEffect(() => {
    const loadGroups = async () => {
      if (zoneId) {
        setLoadingGroups(true)
        try {
          const groupsData = await groupApi.getByZoneId(zoneId)
          setGroups(groupsData)
        } catch (error) {
          setGroups([])
        } finally {
          setLoadingGroups(false)
        }
      } else {
        setGroups([])
      }
      // 清空分组选择
      setGroupId(undefined)
    }
    loadGroups()
  }, [zoneId])

  const handleSearch = useCallback(() => {
    const params: DeviceSearchParams = {}
    if (keyword) params.keyword = keyword
    if (customerId) params.customerId = customerId
    if (zoneId) params.zoneId = zoneId
    if (groupId) params.groupId = groupId
    onSearch(params)
  }, [keyword, customerId, zoneId, groupId, onSearch])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
    },
    [handleSearch]
  )

  const handleReset = useCallback(() => {
    setKeyword('')
    setCustomerId(undefined)
    setZoneId(undefined)
    setGroupId(undefined)
    setZones([])
    setGroups([])
    onReset()
  }, [onReset])

  const handleCustomerChange = useCallback((value: number | undefined) => {
    setCustomerId(value)
  }, [])

  const handleZoneChange = useCallback((value: number | undefined) => {
    setZoneId(value)
  }, [])

  const customerOptions = (filters?.customers || []).map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const zoneOptions = zones.map((z) => ({
    value: z.id,
    label: z.name,
  }))

  const groupOptions = groups.map((g) => ({
    value: g.id,
    label: g.name,
  }))

  return (
    <Space data-testid="space">
      <Input
        data-testid="search-input"
        placeholder="搜索设备..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyPress}
        onPressEnter={handleSearch}
        style={{ width: 200 }}
      />

      <Select
        data-testid="search-select"
        placeholder="选择客户"
        value={customerId}
        onChange={handleCustomerChange}
        options={customerOptions}
        allowClear
        style={{ width: 150 }}
      />

      <Select
        placeholder="选择分区"
        value={zoneId}
        onChange={handleZoneChange}
        options={zoneOptions}
        allowClear
        loading={loadingZones}
        disabled={!customerId}
        style={{ width: 150 }}
      />

      <Select
        placeholder="选择分组"
        value={groupId}
        onChange={(value) => setGroupId(value as number | undefined)}
        options={groupOptions}
        allowClear
        loading={loadingGroups}
        disabled={!zoneId}
        style={{ width: 150 }}
      />

      <Button data-testid="btn-primary" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
        搜索
      </Button>

      <Button data-testid="btn-default" icon={<ReloadOutlined />} onClick={handleReset}>
        重置
      </Button>
    </Space>
  )
}