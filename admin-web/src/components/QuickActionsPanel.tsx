import { Card, Button, Space, message } from 'antd'
import { ReloadOutlined, WarningOutlined, AppstoreOutlined, TeamOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface QuickActionsPanelProps {
  onRefresh?: () => void
  unacknowledgedAlarms?: number
}

export default function QuickActionsPanel({ onRefresh, unacknowledgedAlarms = 0 }: QuickActionsPanelProps) {
  const navigate = useNavigate()

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
      message.success('数据已刷新')
    }
  }

  return (
    <Card title="快捷操作">
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          block
        >
          刷新数据
        </Button>
        <Button
          icon={<WarningOutlined />}
          onClick={() => navigate('/alarms')}
          block
          style={unacknowledgedAlarms > 0 ? { color: '#faad14', borderColor: '#faad14' } : {}}
        >
          告警管理 {unacknowledgedAlarms > 0 && `(${unacknowledgedAlarms})`}
        </Button>
        <Button
          icon={<AppstoreOutlined />}
          onClick={() => navigate('/devices')}
          block
        >
          设备管理
        </Button>
        <Button
          icon={<TeamOutlined />}
          onClick={() => navigate('/customers')}
          block
        >
          层级管理
        </Button>
      </Space>
    </Card>
  )
}