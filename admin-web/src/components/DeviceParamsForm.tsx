import { useState, useEffect, useCallback } from 'react'
import { Card, Form, Input, InputNumber, Select, Button, Spin, message, Divider, Collapse } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { deviceApi } from '../services/device.service'
import type { DeviceParams, Device } from '../types/device'

interface DeviceParamsFormProps {
  device: Device
  onUpdate?: () => void
}

const modeOptions = [
  { value: 0, label: '手动模式' },
  { value: 1, label: '自动模式（夏季）' },
  { value: 2, label: '自动模式（冬季）' },
]

const acModeOptions = [
  { value: 0, label: '制冷' },
  { value: 1, label: '制热' },
  { value: 2, label: '送风' },
  { value: 3, label: '除湿' },
  { value: 4, label: '自动' },
]

const fanSpeedOptions = [
  { value: 0, label: '自动' },
  { value: 1, label: '低' },
  { value: 2, label: '中' },
  { value: 3, label: '高' },
]

export default function DeviceParamsForm({ device, onUpdate }: DeviceParamsFormProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [params, setParams] = useState<DeviceParams | null>(null)

  const loadParams = useCallback(async () => {
    setLoading(true)
    try {
      const data = await deviceApi.getParams(device.id)
      setParams(data)
      if (data) {
        form.setFieldsValue(data)
      }
    } catch {
      message.error('加载参数失败')
    } finally {
      setLoading(false)
    }
  }, [device.id, form])

  useEffect(() => {
    loadParams()
  }, [loadParams])

  async function handleSave() {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await deviceApi.updateParams(device.id, values)
      message.success('参数更新成功')
      if (onUpdate) {
        onUpdate()
      }
      loadParams()
    } catch (error) {
      // Check if it's a form validation error
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return
      }
      const message_ = error instanceof Error ? error.message : '参数更新失败'
      message.error(message_)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card title="参数配置">
        <Spin tip="加载参数..." style={{ display: 'block', margin: '50px auto' }} />
      </Card>
    )
  }

  if (!params) {
    return (
      <Card title="参数配置">
        <div style={{ textAlign: 'center', color: '#999' }}>
          设备暂无参数配置
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="参数配置"
      extra={
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
          保存参数
        </Button>
      }
    >
      <Form form={form} layout="vertical" initialValues={params}>
        <Collapse defaultActiveKey={['basic', 'temp', 'ac']} bordered={false}>
          {/* 基本参数 */}
          <Collapse.Panel header="基本参数" key="basic">
            <Form.Item name="mode" label="运行模式">
              <Select options={modeOptions} />
            </Form.Item>
            <Form.Item name="uploadInterval" label="数据上传间隔(分钟)">
              <InputNumber min={1} max={60} />
            </Form.Item>
            <Form.Item name="alarmEnabled" label="告警启用">
              <Select options={[{ value: 0, label: '禁用' }, { value: 1, label: '启用' }]} />
            </Form.Item>
            <Form.Item name="minCurrent" label="最小电流阈值(A)">
              <InputNumber min={0} max={10} precision={2} />
            </Form.Item>
          </Collapse.Panel>

          {/* 温度控制参数 */}
          <Collapse.Panel header="温度控制" key="temp">
            <Divider orientation="left" plain orientationMargin={0}>夏季参数</Divider>
            <Form.Item name="summerTempOn" label="夏季开启温度(°C)">
              <InputNumber min={18} max={35} precision={1} />
            </Form.Item>
            <Form.Item name="summerTempSet" label="夏季设定温度(°C)">
              <InputNumber min={18} max={30} precision={1} />
            </Form.Item>
            <Form.Item name="summerTempOff" label="夏季关闭温度(°C)">
              <InputNumber min={18} max={30} precision={1} />
            </Form.Item>

            <Divider orientation="left" plain orientationMargin={0}>冬季参数</Divider>
            <Form.Item name="winterTempOn" label="冬季开启温度(°C)">
              <InputNumber min={5} max={25} precision={1} />
            </Form.Item>
            <Form.Item name="winterTempSet" label="冬季设定温度(°C)">
              <InputNumber min={15} max={30} precision={1} />
            </Form.Item>
            <Form.Item name="winterTempOff" label="冬季关闭温度(°C)">
              <InputNumber min={15} max={28} precision={1} />
            </Form.Item>
            <Form.Item name="winterStart" label="冬季开始月份">
              <InputNumber min={1} max={12} />
            </Form.Item>
            <Form.Item name="winterEnd" label="冬季结束月份">
              <InputNumber min={1} max={12} />
            </Form.Item>
          </Collapse.Panel>

          {/* 空调控制参数 */}
          <Collapse.Panel header="空调控制" key="ac">
            <Form.Item name="acMode" label="空调模式">
              <Select options={acModeOptions} />
            </Form.Item>
            <Form.Item name="acFanSpeed" label="风速">
              <Select options={fanSpeedOptions} />
            </Form.Item>
            <Form.Item name="acDirection" label="风向">
              <InputNumber min={0} max={5} />
            </Form.Item>
            <Form.Item name="acLight" label="显示屏">
              <Select options={[{ value: 0, label: '关闭' }, { value: 1, label: '开启' }]} />
            </Form.Item>
            <Form.Item name="acOffInterval" label="关机间隔(分钟)">
              <InputNumber min={0} max={120} />
            </Form.Item>
          </Collapse.Panel>

          {/* 告警阈值 */}
          <Collapse.Panel header="告警阈值" key="alarm">
            <Form.Item name="tempHighLimit" label="温度上限(°C)">
              <InputNumber min={20} max={50} precision={1} />
            </Form.Item>
            <Form.Item name="tempLowLimit" label="温度下限(°C)">
              <InputNumber min={0} max={20} precision={1} />
            </Form.Item>
            <Form.Item name="humiHighLimit" label="湿度上限(%)">
              <InputNumber min={50} max={100} />
            </Form.Item>
            <Form.Item name="humiLowLimit" label="湿度下限(%)">
              <InputNumber min={0} max={50} />
            </Form.Item>
          </Collapse.Panel>

          {/* 工作时间 */}
          <Collapse.Panel header="工作时间" key="worktime">
            <Form.Item name="workTime" label="工作时间" extra="格式: 08:00-18:00">
              <Input placeholder="如: 08:00-18:00" />
            </Form.Item>
            <Form.Item name="overtime1" label="加班时段1" extra="格式: 18:00-20:00">
              <Input placeholder="如: 18:00-20:00" />
            </Form.Item>
            <Form.Item name="overtime2" label="加班时段2" extra="格式: 20:00-22:00">
              <Input placeholder="如: 20:00-22:00" />
            </Form.Item>
            <Form.Item name="overtime3" label="加班时段3" extra="格式: 22:00-24:00">
              <Input placeholder="如: 22:00-24:00" />
            </Form.Item>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Card>
  )
}