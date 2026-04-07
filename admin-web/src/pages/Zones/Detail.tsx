import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin, message, Breadcrumb, Space, Table, Tag, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { zoneApi } from '../../services/zone.service'
import { customerApi } from '../../services/customer.service'
import { groupApi } from '../../services/group.service'
import { deviceApi } from '../../services/device.service'
import type { Zone, Customer } from '../../types/hierarchy'
import type { DeviceGroup } from '../../types/group'
import type { Device } from '../../types/device'

export default function ZoneDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [zone, setZone] = useState<Zone | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [groups, setGroups] = useState<DeviceGroup[]>([])
  const [devices, setDevices] = useState<Device[]>([])

  const loadZone = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const zoneData = await zoneApi.getById(Number(id))
      setZone(zoneData)

      // 加载所属客户
      if (zoneData.customerId) {
        const customerData = await customerApi.getById(zoneData.customerId)
        setCustomer(customerData)
      }

      // 加载下属分组
      const groupsData = await groupApi.getByZoneId(Number(id))
      setGroups(groupsData)

      // 并行加载所有分组下的设备
      const groupDevicesResults = await Promise.all(
        groupsData.map((group) => deviceApi.getList({ groupId: group.id }))
      )
      const allDevices = groupDevicesResults.flatMap((result) => result.data)
      setDevices(allDevices)
    } catch (error) {
      const message_ = error instanceof Error ? error.message : '加载分区详情失败'
      message.error(message_)
      navigate('/zones')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => {
    loadZone()
  }, [loadZone])

  const handleBack = () => {
    navigate('/zones')
  }

  const handleViewGroup = (groupId: number) => {
    navigate(`/groups/${groupId}`)
  }

  const handleViewDevice = (deviceId: string) => {
    navigate(`/devices/${deviceId}`)
  }

  if (loading || !zone) {
    return <Spin tip="加载分区详情..." size="large" style={{ display: 'block', margin: '100px auto' }} />
  }

  const onlineDevices = devices.filter((d) => d.online).length

  return (
    <div style={{ padding: 24 }}>
      {/* 标题栏 */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: '分区管理', onClick: handleBack },
            { title: zone.name },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <h1 style={{ margin: 0 }}>{zone.name}</h1>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadZone} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="分区信息">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="分区ID">{zone.id}</Descriptions.Item>
              <Descriptions.Item label="分区名称">{zone.name}</Descriptions.Item>
              <Descriptions.Item label="所属客户">
                {customer?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(zone.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="统计概览">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="分组数量" value={groups.length} />
              </Col>
              <Col span={8}>
                <Statistic title="设备总数" value={devices.length} />
              </Col>
              <Col span={8}>
                <Statistic title="在线设备" value={onlineDevices} suffix={`/ ${devices.length}`} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 分组列表 */}
      <Card title="分组列表" style={{ marginTop: 16 }}>
        <Table
          dataSource={groups}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '分组ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: '分组名称', dataIndex: 'name', key: 'name' },
            {
              title: '设备数量',
              key: 'deviceCount',
              render: (_, record) => devices.filter((d) => d.groupId === record.id).length,
            },
            {
              title: '操作',
              key: 'action',
              width: 100,
              render: (_, record) => (
                <Button type="link" size="small" onClick={() => handleViewGroup(record.id)}>
                  查看
                </Button>
              ),
            },
          ]}
        />
      </Card>

      {/* 设备列表 */}
      <Card title="设备列表" style={{ marginTop: 16 }}>
        <Table
          dataSource={devices}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '设备ID', dataIndex: 'id', key: 'id', width: 180 },
            { title: '名称', dataIndex: 'name', key: 'name', render: (name?: string) => name || '未命名' },
            {
              title: '所属分组',
              dataIndex: 'groupId',
              key: 'groupId',
              render: (groupId?: number) => groups.find((g) => g.id === groupId)?.name || '-',
            },
            {
              title: '状态',
              dataIndex: 'online',
              key: 'online',
              render: (online: boolean) => (
                <Tag color={online ? 'success' : 'default'}>{online ? '在线' : '离线'}</Tag>
              ),
            },
            {
              title: '操作',
              key: 'action',
              width: 100,
              render: (_, record) => (
                <Button type="link" size="small" onClick={() => handleViewDevice(record.id)}>
                  详情
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}