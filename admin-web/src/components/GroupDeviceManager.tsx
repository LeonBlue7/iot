import { useState, useEffect, useCallback } from 'react'
import { Card, Table, Button, Tag, Transfer, message, Modal, Spin } from 'antd'
import type { TransferProps } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { groupApi } from '../services/group.service'
import { deviceApi } from '../services/device.service'
import type { Device } from '../types/device'

interface GroupDeviceManagerProps {
  groupId: number
  groupName: string
  onUpdate?: () => void
}

export default function GroupDeviceManager({ groupId, groupName, onUpdate }: GroupDeviceManagerProps) {
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [allDevices, setAllDevices] = useState<Device[]>([])
  const [transferVisible, setTransferVisible] = useState(false)
  const [targetKeys, setTargetKeys] = useState<string[]>([])

  const loadDevices = useCallback(async () => {
    setLoading(true)
    try {
      const result = await deviceApi.getList({ groupId })
      setDevices(result.data)
    } catch {
      message.error('加载分组设备失败')
    } finally {
      setLoading(false)
    }
  }, [groupId])

  const loadAllDevices = useCallback(async () => {
    try {
      const result = await deviceApi.getList()
      setAllDevices(result.data)
    } catch {
      // 忽略
    }
  }, [])

  useEffect(() => {
    loadDevices()
    loadAllDevices()
  }, [loadDevices, loadAllDevices])

  const handleOpenTransfer = () => {
    // 初始化当前分组的设备ID为已选
    setTargetKeys(devices.map((d) => d.id))
    setTransferVisible(true)
  }

  const handleTransferChange: TransferProps['onChange'] = (newTargetKeys) => {
    setTargetKeys(newTargetKeys as string[])
  }

  const handleSaveDevices = async () => {
    try {
      await groupApi.setDevices(groupId, targetKeys)
      message.success('设备分配成功')
      setTransferVisible(false)
      loadDevices()
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      const message_ = error instanceof Error ? error.message : '设备分配失败'
      message.error(message_)
    }
  }

  const handleRemoveDevice = (deviceId: string) => {
    Modal.confirm({
      title: '移除设备',
      content: `确定要从分组 "${groupName}" 中移除该设备吗？`,
      onOk: async () => {
        try {
          const newDeviceIds = devices.filter((d) => d.id !== deviceId).map((d) => d.id)
          await groupApi.setDevices(groupId, newDeviceIds)
          message.success('设备已移除')
          loadDevices()
          if (onUpdate) {
            onUpdate()
          }
        } catch (error) {
          const message_ = error instanceof Error ? error.message : '移除失败'
          message.error(message_)
        }
      },
    })
  }

  const dataSource = allDevices.map((d) => ({
    key: d.id,
    title: d.name || d.id,
    description: d.online ? '在线' : '离线',
    disabled: false,
  }))

  return (
    <Card
      title="设备管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenTransfer}>
          分配设备
        </Button>
      }
    >
      {loading ? (
        <Spin tip="加载设备..." style={{ display: 'block', margin: '20px auto' }} />
      ) : (
        <Table
          dataSource={devices}
          rowKey="id"
          pagination={false}
          size="small"
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
              width: 80,
              render: (_, record) => (
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveDevice(record.id)}
                >
                  移除
                </Button>
              ),
            },
          ]}
        />
      )}

      {devices.length === 0 && !loading && (
        <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
          该分组暂无设备，点击"分配设备"添加
        </div>
      )}

      <Modal
        title="分配设备到分组"
        open={transferVisible}
        onCancel={() => setTransferVisible(false)}
        onOk={handleSaveDevices}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Transfer
          dataSource={dataSource}
          titles={['可用设备', `${groupName} 的设备`]}
          targetKeys={targetKeys}
          onChange={handleTransferChange}
          render={(item) => `${item.title} (${item.description})`}
          listStyle={{ width: 350, height: 400 }}
          showSearch
          filterOption={(input, option) =>
            (option.title as string).toLowerCase().includes(input.toLowerCase()) ||
            (option.key as string).toLowerCase().includes(input.toLowerCase())
          }
        />
      </Modal>
    </Card>
  )
}