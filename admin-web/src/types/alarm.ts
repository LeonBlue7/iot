export interface AlarmRecord {
  id: number
  deviceId: string
  alarmType: string
  alarmValue: number
  threshold: number
  status: number
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
}

export type AlarmStatus = 'unacknowledged' | 'acknowledged' | 'resolved'

// 告警状态映射
export const ALARM_STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '未处理', color: 'red' },
  1: { text: '已确认', color: 'blue' },
  2: { text: '已解决', color: 'green' },
}

// 告警类型映射
export const ALARM_TYPE_MAP: Record<string, string> = {
  TEMP_HIGH: '温度过高',
  TEMP_LOW: '温度过低',
  HUMI_HIGH: '湿度过高',
  HUMI_LOW: '湿度过低',
}
