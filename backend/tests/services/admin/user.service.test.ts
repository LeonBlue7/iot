// tests/services/admin/user.service.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import prisma from '../../../src/utils/database.js'
import {
  createUser,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
  assignCustomerToUser,
  removeCustomerFromUser,
  getUserCustomers,
} from '../../../src/services/admin/user.service.js'

describe('User Service', () => {
  let superAdminId: number
  let tenantAdminId: number
  let customerId1: number
  let customerId2: number

  beforeAll(async () => {
    // 创建测试客户
    const customer1 = await prisma.customer.create({
      data: { name: '测试客户1' },
    })
    const customer2 = await prisma.customer.create({
      data: { name: '测试客户2' },
    })
    customerId1 = customer1.id
    customerId2 = customer2.id
  })

  afterAll(async () => {
    // 清理测试数据
    await prisma.adminUserCustomer.deleteMany()
    await prisma.adminUser.deleteMany({
      where: { username: { startsWith: 'test_' } },
    })
    await prisma.customer.deleteMany({
      where: { name: { startsWith: '测试客户' } },
    })
    await prisma.$disconnect()
  })

  describe('createUser', () => {
    it('应该创建超级管理员', async () => {
      const user = await createUser({
        username: 'test_superadmin',
        email: 'super@test.com',
        password: 'Password123!',
        name: '超级管理员',
        isSuperAdmin: true,
      })

      expect(user).toBeDefined()
      expect(user.username).toBe('test_superadmin')
      expect(user.isSuperAdmin).toBe(true)
      expect(user.customerId).toBeNull()
      superAdminId = user.id
    })

    it('应该创建租户管理员并关联客户', async () => {
      const user = await createUser({
        username: 'test_tenant_admin',
        email: 'tenant@test.com',
        password: 'Password123!',
        name: '租户管理员',
        isSuperAdmin: false,
        customerId: customerId1,
      })

      expect(user).toBeDefined()
      expect(user.isSuperAdmin).toBe(false)
      expect(user.customerId).toBe(customerId1)
      tenantAdminId = user.id
    })

    it('应该拒绝重复的用户名', async () => {
      await expect(
        createUser({
          username: 'test_superadmin',
          email: 'another@test.com',
          password: 'Password123!',
          name: '重复用户',
        })
      ).rejects.toThrow()
    })

    it('应该拒绝重复的邮箱', async () => {
      await expect(
        createUser({
          username: 'test_unique_user',
          email: 'super@test.com',
          password: 'Password123!',
          name: '重复邮箱',
        })
      ).rejects.toThrow()
    })
  })

  describe('getUserById', () => {
    it('应该返回用户详情', async () => {
      const user = await getUserById(superAdminId)
      expect(user).toBeDefined()
      expect(user?.username).toBe('test_superadmin')
    })

    it('不存在的用户应返回null', async () => {
      const user = await getUserById(99999)
      expect(user).toBeNull()
    })
  })

  describe('getUsers', () => {
    it('超级管理员应该看到所有用户', async () => {
      const users = await getUsers({ requesterId: superAdminId })
      expect(users.length).toBeGreaterThanOrEqual(2)
    })

    it('租户管理员应该只看到自己客户的用户', async () => {
      const users = await getUsers({ requesterId: tenantAdminId })
      expect(users.every((u) => u.customerId === customerId1 || u.id === tenantAdminId)).toBe(true)
    })
  })

  describe('updateUser', () => {
    it('应该更新用户信息', async () => {
      const user = await updateUser(tenantAdminId, {
        name: '更新后的名称',
      })
      expect(user.name).toBe('更新后的名称')
    })

    it('不应该允许非超级管理员升级为超级管理员', async () => {
      await expect(
        updateUser(tenantAdminId, { isSuperAdmin: true }, { requesterId: tenantAdminId })
      ).rejects.toThrow()
    })
  })

  describe('assignCustomerToUser', () => {
    it('应该给用户分配客户', async () => {
      const assignment = await assignCustomerToUser(tenantAdminId, customerId2, 'viewer')
      expect(assignment.customerId).toBe(customerId2)
      expect(assignment.role).toBe('viewer')
    })

    it('应该拒绝重复分配', async () => {
      await expect(
        assignCustomerToUser(tenantAdminId, customerId2, 'editor')
      ).rejects.toThrow()
    })
  })

  describe('getUserCustomers', () => {
    it('应该返回用户分配的所有客户', async () => {
      const customers = await getUserCustomers(tenantAdminId)
      expect(customers.length).toBeGreaterThanOrEqual(2)
      expect(customers.map((c) => c.id)).toContain(customerId1)
      expect(customers.map((c) => c.id)).toContain(customerId2)
    })
  })

  describe('removeCustomerFromUser', () => {
    it('应该移除用户的客户分配', async () => {
      await removeCustomerFromUser(tenantAdminId, customerId2)
      const customers = await getUserCustomers(tenantAdminId)
      expect(customers.map((c) => c.id)).not.toContain(customerId2)
    })
  })

  describe('deleteUser', () => {
    it('应该删除用户', async () => {
      await deleteUser(tenantAdminId)
      const user = await getUserById(tenantAdminId)
      expect(user).toBeNull()
    })
  })
})