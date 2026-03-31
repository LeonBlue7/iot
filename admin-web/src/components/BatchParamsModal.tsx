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

// Parameter groups definition
const PARAM_GROUPS: { name: string; fields: ParamField[] }[] = [
  {
    name: 'Auto Control',
    fields: [
      { key: 'mode', label: 'Mode', type: 'number', min: 0, max: 2 },
      { key: 'summerTempOn', label: 'Summer Temp On', type: 'number', min: 16, max: 35 },
      { key: 'summerTempSet', label: 'Summer Temp Set', type: 'number', min: 16, max: 35 },
      { key: 'summerTempOff', label: 'Summer Temp Off', type: 'number', min: 16, max: 35 },
      { key: 'winterTempOn', label: 'Winter Temp On', type: 'number', min: 16, max: 35 },
      { key: 'winterTempSet', label: 'Winter Temp Set', type: 'number', min: 16, max: 35 },
      { key: 'winterTempOff', label: 'Winter Temp Off', type: 'number', min: 16, max: 35 },
    ],
  },
  {
    name: 'Time Settings',
    fields: [
      { key: 'winterStart', label: 'Winter Start', type: 'number', min: 1, max: 12 },
      { key: 'winterEnd', label: 'Winter End', type: 'number', min: 1, max: 12 },
      { key: 'acOffInterval', label: 'AC Off Interval', type: 'number', min: 0, max: 1440 },
      { key: 'workTime', label: 'Work Time', type: 'string' },
      { key: 'overtime1', label: 'Overtime 1', type: 'string' },
      { key: 'overtime2', label: 'Overtime 2', type: 'string' },
      { key: 'overtime3', label: 'Overtime 3', type: 'string' },
    ],
  },
  {
    name: 'AC Parameters',
    fields: [
      { key: 'acCode', label: 'AC Code', type: 'number', min: 0 },
      { key: 'acMode', label: 'AC Mode', type: 'number', min: 0, max: 4 },
      { key: 'acFanSpeed', label: 'AC Fan Speed', type: 'number', min: 0, max: 3 },
      { key: 'acDirection', label: 'AC Direction', type: 'number', min: 0, max: 3 },
      { key: 'acLight', label: 'AC Light', type: 'number', min: 0, max: 1 },
      { key: 'minCurrent', label: 'Min Current', type: 'number', min: 0 },
    ],
  },
  {
    name: 'Alarm Settings',
    fields: [
      { key: 'alarmEnabled', label: 'Alarm Enabled', type: 'number', min: 0, max: 1 },
      { key: 'tempHighLimit', label: 'Temp High Limit', type: 'number', min: -40, max: 80 },
      { key: 'tempLowLimit', label: 'Temp Low Limit', type: 'number', min: -40, max: 80 },
      { key: 'humiHighLimit', label: 'Humi High Limit', type: 'number', min: 0, max: 100 },
      { key: 'humiLowLimit', label: 'Humi Low Limit', type: 'number', min: 0, max: 100 },
      { key: 'uploadInterval', label: 'Upload Interval', type: 'number', min: 1, max: 1440 },
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

  // Handle field selection change
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

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (selectedFields.size === 0) {
      message.warning('Please select at least one parameter to update')
      return
    }

    try {
      setLoading(true)
      const values = await form.validateFields()
      const params: Record<string, unknown> = {}

      // Only include selected fields in params
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

      // Reset form and close modal on success
      form.resetFields()
      setSelectedFields(new Set())
      onClose()
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false)
    }
  }, [selectedFields, form, deviceIds, onSubmit, onClose])

  // Handle modal close
  const handleClose = useCallback(() => {
    form.resetFields()
    setSelectedFields(new Set())
    onClose()
  }, [form, onClose])

  // Build collapse items
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

  // Count display
  const deviceCount = deviceIds.length
  const deviceText = deviceCount === 1 ? 'device' : 'devices'

  return (
    <Modal
      open={visible}
      title={`Batch Set Parameters (${deviceCount} ${deviceText})`}
      onCancel={handleClose}
      onOk={handleSubmit}
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