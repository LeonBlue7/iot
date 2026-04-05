import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin, message, Breadcrumb, Space, Table, Tag, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { customerApi } from '../../services/customer.service'
import { zoneApi } from '../../services/zone.service'
import { groupApi } from '../../services/group.service'
import { deviceApi } from '../../services/device.service'
import type { Customer, Zone } from '../../types/hierarchy'
import type { DeviceGroup } from '../../types/group'
import type { Device } from '../../types/device'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [zones, setZones] = useState<Zone[]>([])
  const [groups, setGroups] = useState<DeviceGroup[]>([])
  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    if (id) {
      loadCustomer()
    }
  }, [id])

  async function loadCustomer() {
    setLoading(true)
    try {
      const customerData = await customerApi.getById(Number(id))
      setCustomer(customerData)

      // 加载下属分区
      const zonesData = await zoneApi.getByCustomerId(Number(id))
      setZones(zonesData)

      // 并行加载所有分区下的分组
      const zoneGroupsResults = await Promise.all(
        zonesData.map((zone) => groupApi.getByZoneId(zone.id))
      )
      const allGroups = zoneGroupsResults.flat()
      setGroups(allGroups)

      // 并行加载所有分组下的设备
      const groupDevicesResults = await Promise.all(
        allGroups.map((group) => deviceApi.getList({ groupId: group.id }))
      )
      const allDevices = groupDevicesResults.flatMap((result) => result.data)
      setDevices(allDevices)
    } catch (error: any) {
      message.error(error.message || '加载客户详情失败')
      navigate('/customers')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/customers')
  }

  const handleViewZone = (zoneId: number) => {
    navigate(`/zones/${zoneId}`)
  }

  const handleViewGroup = (groupId: number) => {
    navigate(`/groups/${groupId}`)
  }

  const handleViewDevice = (deviceId: string) => {
    navigate(`/devices/${deviceId}`)
  }

  if (loading || !customer) {
    return <Spin tip="加载客户详情..." size="large" style={{ display: 'block', margin: '100px auto' }} />
  }

  const onlineDevices = devices.filter((d) => d.online).length

  return (
    <div style={{ padding: 24 }}>
      {/* 标题栏 */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: '客户管理', onClick: handleBack },
            { title: customer.name },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <h1 style={{ margin: 0 }}>{customer.name}</h1>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadCustomer} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="客户信息">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="客户ID">{customer.id}</Descriptions.Item>
              <Descriptions.Item label="客户名称">{customer.name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(customer.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="统计概览">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic title="分区数量" value={zones.length} />
              </Col>
              <Col span={6}>
                <Statistic title="分组数量" value={groups.length} />
              </Col>
              <Col span={6}>
                <Statistic title="设备总数" value={devices.length} />
              </Col>
              <Col span={6}>
                <Statistic title="在线设备" value={onlineDevices} suffix={`/ ${devices.length}`} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 分区列表 */}
      <Card title="分区列表" style={{ marginTop: 16 }}>
        <Table
          dataSource={zones}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '分区ID', dataIndex: 'id', key: 'id', width: 80 },
            { title: '分区名称', dataIndex: 'name', key: 'name' },
            {
              title: '分组数量',
              key: 'groupCount',
              render: (_, record) => groups.filter((g) => g.zoneId === record.id).length,
            },
            {
              title: '设备数量',
              key: 'deviceCount',
              render: (_, record) => {
                const zoneGroups = groups.filter((g) => g.zoneId === record.id)
                return devices.filter((d) => zoneGroups.some((g) => g.id === d.groupId)).length
              },
            },
            {
              title: '操作',
              key: 'action',
              width: 100,
              render: (_, record) => (
                <Button type="link" size="small" onClick={() => handleViewZone(record.id)}>
                  查看
                </Button>
              ),
            },
          ]}
        />
      </Card>

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
              title: '所属分区',
              dataIndex: 'zoneId',
              key: 'zoneId',
              render: (zoneId: number) => zones.find((z) => z.id === zoneId)?.name || '-',
            },
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