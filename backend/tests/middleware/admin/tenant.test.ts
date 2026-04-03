// tests/middleware/admin/tenant.test.ts
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import prisma from '../../../src/utils/database.js'
import {
  isSuperAdmin,
  getUserCustomerIds,
  filterByTenant,
  hasTenantAccess,
} from '../../../src/middleware/admin/tenant.js'

describe('Tenant Middleware', () => {
  let superAdminId: number
  let tenantAdminId: number
  let customerId1: number
  let customerId2: number

  beforeAll(async () => {
    // 创建测试客户
    const customer1 = await prisma.customer.create({
      data: { name: '租户测试客户1' },
    })
    const customer2 = await prisma.customer.create({
      data: { name: '租户测试客户2' },
    })
    customerId1 = customer1.id
    customerId2 = customer2.id

    // 创建超级管理员
    const superAdmin = await prisma.adminUser.create({
      data: {
        username: 'tenant_test_super',
        email: 'tenant_super@test.com',
        passwordHash: 'hash',
        name: '超级管理员',
        isSuperAdmin: true,
      },
    })
    superAdminId = superAdmin.id

    // 创建租户管理员
    const tenantAdmin = await prisma.adminUser.create({
      data: {
        username: 'tenant_test_admin',
        email: 'tenant_admin@test.com',
        passwordHash: 'hash',
        name: '租户管理员',
        isSuperAdmin: false,
        customerId: customerId1,
      },
    })
    tenantAdminId = tenantAdmin.id

    // 给租户管理员分配额外客户
    await prisma.adminUserCustomer.create({
      data: {
        adminUserId: tenantAdminId,
        customerId: customerId2,
        role: 'viewer',
      },
    })
  })

  afterAll(async () => {
    await prisma.adminUserCustomer.deleteMany()
    await prisma.adminUser.deleteMany({
      where: { username: { startsWith: 'tenant_test_' } },
    })
    await prisma.customer.deleteMany({
      where: { name: { startsWith: '租户测试客户' } },
    })
    await prisma.$disconnect()
  })

  describe('isSuperAdmin', () => {
    it('超级管理员应返回true', async () => {
      const result = await isSuperAdmin(superAdminId)
      expect(result).toBe(true)
    })

    it('普通用户应返回false', async () => {
      const result = await isSuperAdmin(tenantAdminId)
      expect(result).toBe(false)
    })
  })

  describe('getUserCustomerIds', () => {
    it('超级管理员应返回空数组（表示可访问所有）', async () => {
      const ids = await getUserCustomerIds(superAdminId)
      expect(ids).toEqual([])
    })

    it('租户管理员应返回分配的客户ID列表', async () => {
      const ids = await getUserCustomerIds(tenantAdminId)
      expect(ids).toHaveLength(2)
      expect(ids).toContain(customerId1)
      expect(ids).toContain(customerId2)
    })
  })

  describe('hasTenantAccess', () => {
    it('超级管理员应可访问任何客户', async () => {
      const result = await hasTenantAccess(superAdminId, customerId1)
      expect(result).toBe(true)
    })

    it('租户管理员应只能访问分配的客户', async () => {
      const result1 = await hasTenantAccess(tenantAdminId, customerId1)
      const result2 = await hasTenantAccess(tenantAdminId, customerId2)
      expect(result1).toBe(true)
      expect(result2).toBe(true)
    })

    it('租户管理员访问未分配客户应返回false', async () => {
      const otherCustomer = await prisma.customer.create({
        data: { name: '其他客户' },
      })
      const result = await hasTenantAccess(tenantAdminId, otherCustomer.id)
      expect(result).toBe(false)
      await prisma.customer.delete({ where: { id: otherCustomer.id } })
    })
  })

  describe('filterByTenant', () => {
    it('超级管理员查询不应添加客户过滤', async () => {
      const whereClause: Record<string, unknown> = {}
      await filterByTenant(whereClause, superAdminId)
      expect(whereClause.customerId).toBeUndefined()
    })

    it('租户管理员查询应添加客户过滤', async () => {
      const whereClause: Record<string, unknown> = {}
      await filterByTenant(whereClause, tenantAdminId)
      expect(whereClause.customerId).toBeDefined()
      expect((whereClause.customerId as { in: number[] }).in).toHaveLength(2)
    })
  })
})