// admin-web/src/types/group.ts
export interface DeviceGroup {
  id: number
  name: string
  zoneId: number
  createdAt: string
  updatedAt: string
  zone?: Zone
  devices?: Device[]
  _count?: { devices: number }
}

export interface Zone {
  id: number
  name: string
  customerId: number
  createdAt: string
  updatedAt: string
  customer?: Customer
  groups?: DeviceGroup[]
  _count?: { groups: number }
}

export interface Customer {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  zones?: Zone[]
  _count?: { zones: number }
}

export interface CreateGroupInput {
  name: string
  zoneId: number
}

export interface UpdateGroupInput {
  name?: string
  zoneId?: number
}

export interface Device {
  id: string
  name?: string
  online: boolean
  enabled: boolean
  groupId?: number | null
}