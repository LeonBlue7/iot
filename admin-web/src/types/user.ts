// admin-web/src/types/user.ts
export interface AdminUser {
  id: number
  username: string
  email: string
  name: string | null
  customerId: number | null
  isSuperAdmin: boolean
  roleIds: number[]
  enabled: boolean
  lastLoginAt: string | null
  createdAt: string
  customer?: {
    id: number
    name: string
  }
}

export interface UserCustomer {
  id: number
  name: string
  role: string
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  name?: string
  customerId?: number
  isSuperAdmin?: boolean
  roleIds?: number[]
}

export interface UpdateUserData {
  name?: string
  email?: string
  password?: string
  enabled?: boolean
  customerId?: number
  isSuperAdmin?: boolean
  roleIds?: number[]
}

export interface UserListParams {
  customerId?: number
  enabled?: boolean
  search?: string
}