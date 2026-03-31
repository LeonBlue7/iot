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

  // Determine singular/plural form
  const itemText = normalizedCount === 1 ? 'item' : 'items'

  return (
    <div data-testid="batch-action-bar" style={{ padding: '12px 16px', background: '#fafafa', borderRadius: 4 }}>
      <Space size="middle">
        <Typography.Text data-testid="selected-count">
          {normalizedCount} {itemText} selected
        </Typography.Text>

        <Button
          data-testid="btn-batch-on"
          icon={<PoweroffOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchControl('on')}
        >
          Turn On
        </Button>

        <Button
          data-testid="btn-batch-off"
          icon={<PoweroffOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchControl('off')}
        >
          Turn Off
        </Button>

        <Button
          data-testid="btn-batch-reset"
          icon={<ReloadOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchControl('reset')}
        >
          Reset
        </Button>

        <Button
          data-testid="btn-batch-move"
          icon={<FolderOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchMove()}
        >
          Move to Group
        </Button>

        <Button
          data-testid="btn-batch-params"
          icon={<SettingOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchParams()}
        >
          Set Params
        </Button>

        <Button
          data-testid="btn-batch-enable"
          icon={<CheckCircleOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchToggle(true)}
        >
          Enable
        </Button>

        <Button
          data-testid="btn-batch-disable"
          icon={<StopOutlined />}
          disabled={isDisabled}
          onClick={() => !isDisabled && onBatchToggle(false)}
        >
          Disable
        </Button>

        <Button
          data-testid="btn-batch-delete"
          icon={<DeleteOutlined />}
          disabled={isDisabled}
          danger
          onClick={() => !isDisabled && onBatchDelete()}
        >
          Delete
        </Button>
      </Space>
    </div>
  )
}