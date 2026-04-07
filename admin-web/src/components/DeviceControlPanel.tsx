import { useState } from 'react'
import { Card, Button, Space, Modal, Tag, Spin, message } from 'antd'
import { PoweroffOutlined, ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { deviceApi } from '../services/device.service'
import type { Device } from '../types/device'

interface DeviceControlPanelProps {
  device: Device
  onControl?: () => void
}

export default function DeviceControlPanel({ device, onControl }: DeviceControlPanelProps) {
  const [loading, setLoading] = useState(false)
  const [controlResult, setControlResult] = useState<string | null>(null)

  const handleControl = async (action: 'on' | 'off' | 'reset') => {
    Modal.confirm({
      title: '确认操作',
      icon: <QuestionCircleOutlined />,
      content: `确定要${action === 'on' ? '开启' : action === 'off' ? '关闭' : '重启'}空调吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true)
        setControlResult(null)
        try {
          await deviceApi.controlDevice(device.id, action)
          message.success(`${action === 'on' ? '开启' : action === 'off' ? '关闭' : '重启'}指令已发送`)
          setControlResult(`${action === 'on' ? '开启' : action === 'off' ? '关闭' : '重启'}指令发送成功，等待设备响应...`)
          if (onControl) {
            onControl()
          }
        } catch (error) {
          const message_ = error instanceof Error ? error.message : '控制失败'
          message.error(message_)
          setControlResult(`控制失败: ${message_}`)
        } finally {
          setLoading(false)
        }
      },
    })
  }

  if (!device.online) {
    return (
      <Card title="设备控制">
        <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
          设备离线，无法进行远程控制
        </div>
      </Card>
    )
  }

  return (
    <Card title="设备控制">
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <Button
              type="primary"
              icon={<PoweroffOutlined />}
              onClick={() => handleControl('on')}
              disabled={!device.online}
            >
              开启空调
            </Button>
            <Button
              danger
              icon={<PoweroffOutlined />}
              onClick={() => handleControl('off')}
              disabled={!device.online}
            >
              关闭空调
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => handleControl('reset')}
              disabled={!device.online}
            >
              重启设备
            </Button>
          </Space>

          {controlResult && (
            <Tag color="blue" style={{ marginTop: 8 }}>
              {controlResult}
            </Tag>
          )}

          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            注意：控制指令通过MQTT发送，设备响应可能需要几秒钟。请等待设备状态更新后再进行下一次操作。
          </div>
        </Space>
      </Spin>
    </Card>
  )
}