import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Row, Col, Button, Spin, message, Breadcrumb, Space } from 'antd'
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons'
import DeviceDetailCard from '../../components/DeviceDetailCard'
import RealtimeDataCard from '../../components/RealtimeDataCard'
import HistoryChart from '../../components/HistoryChart'
import DeviceParamsForm from '../../components/DeviceParamsForm'
import DeviceControlPanel from '../../components/DeviceControlPanel'
import { deviceApi } from '../../services/device.service'
import type { Device, SensorData } from '../../types/device'

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState<Device | null>(null)
  const [realtimeData, setRealtimeData] = useState<SensorData | null>(null)
  const [realtimeLoading, setRealtimeLoading] = useState(false)

  const loadDevice = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const data = await deviceApi.getById(id)
      setDevice(data)
    } catch (error) {
      const message_ = error instanceof Error ? error.message : '加载设备详情失败'
      message.error(message_)
      navigate('/devices')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  const loadRealtimeData = useCallback(async () => {
    if (!id) return
    setRealtimeLoading(true)
    try {
      const data = await deviceApi.getRealtimeData(id)
      setRealtimeData(data)
    } catch (error) {
      // 实时数据加载失败不提示错误，可能设备离线
      setRealtimeData(null)
    } finally {
      setRealtimeLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      loadDevice()
      loadRealtimeData()
    }
  }, [id, loadDevice, loadRealtimeData])

  const handleRefresh = useCallback(() => {
    loadDevice()
    loadRealtimeData()
  }, [loadDevice, loadRealtimeData])

  const handleBack = () => {
    // 优先使用浏览器历史返回，保留列表页的分页参数
    // 如果没有历史记录，则导航到设备列表
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/devices')
    }
  }

  if (loading || !device) {
    return <Spin tip="加载设备详情..." size="large" style={{ display: 'block', margin: '100px auto' }} />
  }

  return (
    <div style={{ padding: 24 }}>
      {/* 标题栏 */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb
          items={[
            { title: '设备管理', onClick: handleBack },
            { title: device.name || device.id },
          ]}
          style={{ marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <h1 style={{ margin: 0 }}>{device.name || device.id}</h1>
          </Space>
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      {/* 设备信息 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <DeviceDetailCard device={device} />
        </Col>
      </Row>

      {/* 实时数据和控制 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={18}>
          <RealtimeDataCard
            device={device}
            data={realtimeData}
            loading={realtimeLoading}
            onRefresh={loadRealtimeData}
          />
        </Col>
        <Col span={6}>
          <DeviceControlPanel device={device} onControl={loadRealtimeData} />
        </Col>
      </Row>

      {/* 历史数据图表 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <HistoryChart device={device} height={300} />
        </Col>
      </Row>

      {/* 参数配置 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <DeviceParamsForm device={device} onUpdate={loadRealtimeData} />
        </Col>
      </Row>
    </div>
  )
}