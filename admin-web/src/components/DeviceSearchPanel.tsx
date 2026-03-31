// admin-web/src/components/DeviceSearchPanel.tsx
import { useState, useCallback } from 'react'
import { Input, Select, Button, Space } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { DeviceSearchParams, Customer, Zone, DeviceGroup } from '../types/hierarchy'

interface DeviceSearchFilters {
  customers: Customer[]
  zones: Zone[]
  groups: DeviceGroup[]
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
    onReset()
  }, [onReset])

  const customerOptions = (filters?.customers || []).map((c) => ({
    value: c.id,
    label: c.name,
  }))

  const zoneOptions = (filters?.zones || []).map((z) => ({
    value: z.id,
    label: z.name,
  }))

  const groupOptions = (filters?.groups || []).map((g) => ({
    value: g.id,
    label: g.name,
  }))

  return (
    <Space data-testid="space">
      <Input
        data-testid="search-input"
        placeholder="Search devices..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={handleKeyPress}
        onPressEnter={handleSearch}
        style={{ width: 200 }}
      />

      <Select
        data-testid="search-select"
        placeholder="Select Customer"
        value={customerId}
        onChange={(value) => setCustomerId(value as number | undefined)}
        options={customerOptions}
        allowClear
        style={{ width: 150 }}
      />

      <Select
        placeholder="Select Zone"
        value={zoneId}
        onChange={(value) => setZoneId(value as number | undefined)}
        options={zoneOptions}
        allowClear
        style={{ width: 150 }}
      />

      <Select
        placeholder="Select Group"
        value={groupId}
        onChange={(value) => setGroupId(value as number | undefined)}
        options={groupOptions}
        allowClear
        style={{ width: 150 }}
      />

      <Button data-testid="btn-primary" type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
        Search
      </Button>

      <Button data-testid="btn-default" icon={<ReloadOutlined />} onClick={handleReset}>
        Reset
      </Button>
    </Space>
  )
}