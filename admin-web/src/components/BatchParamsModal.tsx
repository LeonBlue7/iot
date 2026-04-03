// admin-web/src/components/BatchParamsModal.tsx
import { useState, useCallback } from 'react'
import { Modal, Form, InputNumber, Input, Checkbox, Collapse, message } from 'antd'
import type { CollapseProps } from 'antd'

interface BatchParamsModalProps {
  visible: boolean
  deviceIds: string[]
  onClose: () => void
  onSubmit: (data: {
    deviceIds: string[]
    params: Record<string, unknown>
    selectedFields: string[]
  }) => Promise<void> | void
}

interface ParamField {
  key: string
  label: string
  type: 'number' | 'string'
  min?: number
  max?: number
}

// 参数分组定义
const PARAM_GROUPS: { name: string; fields: ParamField[] }[] = [
  {
    name: '自动控制',
    fields: [
      { key: 'mode', label: '模式', type: 'number', min: 0, max: 2 },
      { key: 'summerTempOn', label: '夏季开启温度', type: 'number', min: 16, max: 35 },
      { key: 'summerTempSet', label: '夏季设定温度', type: 'number', min: 16, max: 35 },
      { key: 'summerTempOff', label: '夏季关闭温度', type: 'number', min: 16, max: 35 },
      { key: 'winterTempOn', label: '冬季开启温度', type: 'number', min: 16, max: 35 },
      { key: 'winterTempSet', label: '冬季设定温度', type: 'number', min: 16, max: 35 },
      { key: 'winterTempOff', label: '冬季关闭温度', type: 'number', min: 16, max: 35 },
    ],
  },
  {
    name: '时间设置',
    fields: [
      { key: 'winterStart', label: '冬季开始月份', type: 'number', min: 1, max: 12 },
      { key: 'winterEnd', label: '冬季结束月份', type: 'number', min: 1, max: 12 },
      { key: 'acOffInterval', label: '空调关闭间隔', type: 'number', min: 0, max: 1440 },
      { key: 'workTime', label: '工作时间', type: 'string' },
      { key: 'overtime1', label: '加班时间1', type: 'string' },
      { key: 'overtime2', label: '加班时间2', type: 'string' },
      { key: 'overtime3', label: '加班时间3', type: 'string' },
    ],
  },
  {
    name: '空调参数',
    fields: [
      { key: 'acCode', label: '空调代码', type: 'number', min: 0 },
      { key: 'acMode', label: '空调模式', type: 'number', min: 0, max: 4 },
      { key: 'acFanSpeed', label: '风速', type: 'number', min: 0, max: 3 },
      { key: 'acDirection', label: '风向', type: 'number', min: 0, max: 3 },
      { key: 'acLight', label: '空调灯光', type: 'number', min: 0, max: 1 },
      { key: 'minCurrent', label: '最小电流', type: 'number', min: 0 },
    ],
  },
  {
    name: '告警设置',
    fields: [
      { key: 'alarmEnabled', label: '启用告警', type: 'number', min: 0, max: 1 },
      { key: 'tempHighLimit', label: '温度上限', type: 'number', min: -40, max: 80 },
      { key: 'tempLowLimit', label: '温度下限', type: 'number', min: -40, max: 80 },
      { key: 'humiHighLimit', label: '湿度上限', type: 'number', min: 0, max: 100 },
      { key: 'humiLowLimit', label: '湿度下限', type: 'number', min: 0, max: 100 },
      { key: 'uploadInterval', label: '上传间隔', type: 'number', min: 1, max: 1440 },
    ],
  },
]

export function BatchParamsModal({
  visible,
  deviceIds,
  onClose,
  onSubmit,
}: BatchParamsModalProps): JSX.Element | null {
  const [form] = Form.useForm()
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  // 处理字段选择变更
  const handleFieldSelect = useCallback((key: string, checked: boolean) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(key)
      } else {
        newSet.delete(key)
      }
      return newSet
    })
  }, [])

  // 处理表单提交
  const handleSubmit = useCallback(async () => {
    if (selectedFields.size === 0) {
      message.warning('请至少选择一个参数进行更新')
      return
    }

    try {
      setLoading(true)
      const values = await form.validateFields()
      const params: Record<string, unknown> = {}

      // 只包含已选择的字段
      selectedFields.forEach((field) => {
        if (values[field] !== undefined) {
          params[field] = values[field]
        }
      })

      await onSubmit({
        deviceIds,
        params,
        selectedFields: Array.from(selectedFields),
      })

      // 成功后重置表单并关闭弹窗
      form.resetFields()
      setSelectedFields(new Set())
      onClose()
    } catch (error) {
      // 错误由父组件处理
    } finally {
      setLoading(false)
    }
  }, [selectedFields, form, deviceIds, onSubmit, onClose])

  // 处理弹窗关闭
  const handleClose = useCallback(() => {
    form.resetFields()
    setSelectedFields(new Set())
    onClose()
  }, [form, onClose])

  // 构建折叠面板项
  const collapseItems: CollapseProps['items'] = PARAM_GROUPS.map((group) => ({
    key: group.name,
    label: group.name,
    children: (
      <div role="group" aria-label={group.name} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {group.fields.map((field) => (
          <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Checkbox
              checked={selectedFields.has(field.key)}
              onChange={(e) => handleFieldSelect(field.key, e.target.checked)}
              aria-label={field.label}
            >
              {field.label}
            </Checkbox>
            <Form.Item name={field.key} noStyle>
              {field.type === 'number' ? (
                <InputNumber
                  data-testid={`input-${field.key}`}
                  disabled={!selectedFields.has(field.key)}
                  min={field.min}
                  max={field.max}
                  style={{ width: 120 }}
                />
              ) : (
                <Input
                  data-testid={`input-${field.key}`}
                  disabled={!selectedFields.has(field.key)}
                  style={{ width: 120 }}
                />
              )}
            </Form.Item>
          </div>
        ))}
      </div>
    ),
  }))

  // 设备数量显示
  const deviceCount = deviceIds.length

  return (
    <Modal
      open={visible}
      title={`批量设置参数（${deviceCount} 台设备）`}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="确定"
      cancelText="取消"
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Collapse items={collapseItems} defaultActiveKey={PARAM_GROUPS.map((g) => g.name)} />
      </Form>
    </Modal>
  )
}