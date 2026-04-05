import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin, message, Breadcrumb, Space, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import { groupApi } from '../../services/group.service'
import { zoneApi } from '../../services/zone.service'
import { customerApi } from '../../services/customer.service'
import { deviceApi } from '../../services/device.service'
import GroupDeviceManager from '../../components/GroupDeviceManager'
import type { Zone, Customer } from '../../types/hierarchy'
import type { DeviceGroup } from '../../types/group'
import type { Device } from '../../types/device'

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [group, setGroup] = useState<DeviceGroup | null>(null)
  const [zone, setZone] = useState<Zone | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    if (id) {
      loadGroup()
    }
  }, [id])

  async function loadGroup() {
    setLoading(true)
    try {
      const groupData = await groupApi.getById(Number(id))
      setGroup(groupData)

      // 加载所属分区
      if (groupData.zoneId) {
        const zoneData = await zoneApi.getById(groupData.zoneId)
        setZone(zoneData)

        // 加载分区所属客户
        if (zoneData.customerId) {
          const customerData = await customerApi.getById(zoneData.customerId)
          setCustomer(customerData)
        }
      }

      // 加载分组设备
      const devicesResult = await deviceApi.getList({ groupId: Number(id) })
      setDevices(devicesResult.data)
    } catch (error: any) {
      message.error(error.message || '加载分组详情失败')
      navigate('/groups')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/groups')
  }

  if (loading || !group) {
    return <Spin tip="加载分组详情..." size="large" style={{ display: 'block', margin: '100px auto' }} />
  }

  const onlineDevices = devices.filter((d) => d.online).length

  return (
    <div style={{ padding: 24 }}>
      {/* 标题栏 */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            ...(customer ? [{ title: customer.name, onClick: () => navigate(`/customers/${customer.id}`) }] : []),
            ...(zone ? [{ title: zone.name, onClick: () => navigate(`/zones/${zone.id}`) }] : []),
            { title: group.name },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <h1 style={{ margin: 0 }}>{group.name}</h1>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={loadGroup} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      {/* 基本信息 */}
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="分组信息">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="分组ID">{group.id}</Descriptions.Item>
              <Descriptions.Item label="分组名称">{group.name}</Descriptions.Item>
              <Descriptions.Item label="所属分区">
                {zone?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所属客户">
                {customer?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(group.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col span={16}>
          <Card title="统计概览">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="设备总数" value={devices.length} />
              </Col>
              <Col span={12}>
                <Statistic title="在线设备" value={onlineDevices} suffix={`/ ${devices.length}`} />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 设备管理 */}
      <div style={{ marginTop: 16 }}>
        <GroupDeviceManager groupId={group.id} groupName={group.name} onUpdate={loadGroup} />
      </div>
    </div>
  )
}