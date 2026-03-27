// admin-web/src/types/group.ts
export interface DeviceGroup {
  id: number
  name: string
  description?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: { devices: number }
  devices?: Device[]
}

export interface CreateGroupInput {
  name: string
  description?: string | null
  sortOrder?: number
}

export interface UpdateGroupInput {
  name?: string
  description?: string | null
  sortOrder?: number
}

export interface Device {
  id: string
  name?: string
  online: boolean
  groupId?: number | null
}