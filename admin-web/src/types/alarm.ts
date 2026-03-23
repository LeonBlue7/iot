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
