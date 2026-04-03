// admin-web/src/components/BatchActionBar.tsx
import { Space, Button, Typography } from 'antd'
import {
  PoweroffOutlined,
  ReloadOutlined,
  FolderOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DeleteOutlined,
} from '@ant-design/icons'

interface BatchActionBarProps {
  selectedCount: number
  onBatchControl: (action: 'on' | 'off' | 'reset') => void
  onBatchMove: () => void
  onBatchParams: () => void
  onBatchToggle: (enabled: boolean) => void
  onBatchDelete: () => void
}

export function BatchActionBar({
  selectedCount,
  onBatchControl,
  onBatchMove,
  onBatchParams,
  onBatchToggle,
  onBatchDelete,
}: BatchActionBarProps): JSX.Element {
  // Normalize negative counts to 0
  const normalizedCount = Math.max(0, selectedCount)
  const isDisabled = normalizedCount === 0

  // 确定单数/复数形式（中文不区分）
  const itemText = '项设备'

  return (
    <div data-testid="batch-action-bar" style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 4 }}>
      <Space size="middle">
        <Typography.Text data-testid="selected-count">
          已选中 {normalizedCount} {itemText}
        </Typography.Text>

        <Button
          data-testid="btn-batch-on"
          icon={<PoweroffOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchControl('on')}
        >
          开启
        </Button>

        <Button
          data-testid="btn-batch-off"
          icon={<PoweroffOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchControl('off')}
        >
          关闭
        </Button>

        <Button
          data-testid="btn-batch-reset"
          icon={<ReloadOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchControl('reset')}
        >
          重启
        </Button>

        <Button
          data-testid="btn-batch-move"
          icon={<FolderOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchMove()}
        >
          移动分组
        </Button>

        <Button
          data-testid="btn-batch-params"
          icon={<SettingOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchParams()}
        >
          设置参数
        </Button>

        <Button
          data-testid="btn-batch-enable"
          icon={<CheckCircleOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchToggle(true)}
        >
          启用
        </Button>

        <Button
          data-testid="btn-batch-disable"
          icon={<StopOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchToggle(false)}
        >
          禁用
        </Button>

        <Button
          data-testid="btn-batch-delete"
          icon={<DeleteOutlined />}
          disabled={isDisabled}
          danger
          onClick={() => !isDisabled && onBatchDelete()}
        >
          删除
        </Button>
      </Space>
    </div>
  )
}