export interface Device {
  id: string
  productId?: string
  name?: string
  simCard?: string
  online: boolean
  enabled: boolean // Enable/disable status
  lastSeenAt?: string
  createdAt: string
  groupId?: number | null
  params?: DeviceParams | null
  realtimeData?: SensorData | null // Backend-provided realtime sensor data
}

export interface DeviceParams {
  id: number
  deviceId: string
  mode: number
  summerTempOn?: number
  summerTempSet?: number
  summerTempOff?: number
  winterTempOn?: number
  winterTempSet?: number
  winterTempOff?: number
  winterStart?: number
  winterEnd?: number
  acOffInterval?: number
  workTime?: string
  overtime1?: string
  overtime2?: string
  overtime3?: string
  acCode?: number
  acMode?: number
  acFanSpeed?: number
  acDirection?: number
  acLight?: number
  minCurrent?: number
  alarmEnabled?: number
  tempHighLimit?: number
  tempLowLimit?: number
  humiHighLimit?: number
  humiLowLimit?: number
  uploadInterval?: number
  version: number
  resetTimes?: number
  updatedAt: string
}

export interface SensorData {
  id: number
  deviceId: string
  temperature?: number
  humidity?: number
  current?: number
  signalStrength?: number
  acState?: number
  acError?: number
  tempAlarm?: number
  humiAlarm?: number
  recordedAt: string
  createdAt: string
}

export type ControlAction = 'on' | 'off' | 'reset'
