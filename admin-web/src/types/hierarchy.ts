// admin-web/src/types/hierarchy.ts

// Re-export types from group.ts to avoid duplication
export type { Customer, Zone, DeviceGroup, Device, CreateGroupInput, UpdateGroupInput } from './group'

/**
 * Customer - First level of hierarchy
 */
export interface CreateCustomerInput {
  name: string
}

export interface UpdateCustomerInput {
  name?: string
}

/**
 * Zone - Second level of hierarchy (belongs to Customer)
 */
export interface CreateZoneInput {
  name: string
  customerId: number
}

export interface UpdateZoneInput {
  name?: string
  customerId?: number
}

/**
 * Hierarchy tree node for UI display
 */
export interface HierarchyTreeNode {
  key: string
  title: string
  level: 'customer' | 'zone' | 'group'
  id: number
  parentId?: number
  children?: HierarchyTreeNode[]
  deviceCount?: number
  onlineCount?: number
  icon?: React.ReactNode
}

/**
 * Hierarchy selection state - used when selecting a node in the tree
 */
export interface HierarchySelection {
  level: 'customer' | 'zone' | 'group'
  id: number
  parentId?: number
  name?: string
}

/**
 * Batch operation types
 */
export interface BatchControlInput {
  deviceIds: string[]
  action: 'on' | 'off' | 'reset'
}

export interface BatchParamsInput {
  deviceIds: string[]
  params: Record<string, unknown>
}

export interface BatchMoveInput {
  deviceIds: string[]
  targetGroupId: number
}

export interface BatchToggleInput {
  deviceIds: string[]
  enabled: boolean
}

export interface DeviceSearchParams {
  keyword?: string
  online?: boolean
  enabled?: boolean
  customerId?: number
  zoneId?: number
  groupId?: number
}

export interface BatchOperationResult {
  success: boolean
  successCount: number
  failCount: number
  failedDevices?: string[]
  errors?: string[]
}