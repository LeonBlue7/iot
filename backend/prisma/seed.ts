// backend/prisma/seed.ts
// 初始化管理员账号和测试数据

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/services/admin/auth.service.js'

const prisma = new PrismaClient()

// 从环境变量读取初始密码，未设置时使用强随机密码
const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomUUID().slice(0, 16)

async function main() {
  console.log('开始初始化数据库...')

  // 创建管理员角色
  const adminRole = await prisma.adminRole.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: '系统管理员',
      permissions: ['*'],
      isSystem: true,
    },
  })

  console.log('创建/更新管理员角色:', adminRole.name)

  // 检查是否已存在管理员
  const existingAdmin = await prisma.adminUser.findFirst({
    where: { roleIds: { has: adminRole.id } },
  })

  if (existingAdmin) {
    console.log(`已存在管理员账号: ${existingAdmin.username}，跳过创建`)
  } else {
    // 创建默认管理员
    const passwordHash = await hashPassword(INITIAL_ADMIN_PASSWORD)

    await prisma.adminUser.create({
      data: {
        username: 'admin',
        email: 'admin@example.com',
        passwordHash,
        name: '系统管理员',
        enabled: true,
        roleIds: [adminRole.id],
        mustChangePassword: true, // 强制首次登录修改密码
      },
    })

    console.log('✅ 默认管理员账号创建成功')
    console.log('   用户名：admin')
    if (process.env.INITIAL_ADMIN_PASSWORD) {
      console.log('   密码：从环境变量 INITIAL_ADMIN_PASSWORD 读取')
    } else {
      console.log(`   临时密码：${INITIAL_ADMIN_PASSWORD}`)
    }
    console.log('')
    console.log('⚠️  首次登录时必须修改密码！')
  }

  // 创建测试设备（仅开发环境）
  if (process.env.NODE_ENV !== 'production') {
    const device = await prisma.device.upsert({
      where: { id: 'TEST001' },
      update: {},
      create: {
        id: 'TEST001',
        name: '测试设备',
        simCard: '12345678901',
        online: true,
        lastSeenAt: new Date(),
      },
    })

    console.log('创建/更新测试设备:', device.id)

    // 创建一些传感器数据
    await prisma.sensorData.createMany({
      data: [
        {
          deviceId: 'TEST001',
          temperature: 25.5,
          humidity: 60.0,
          recordedAt: new Date(),
        },
        {
          deviceId: 'TEST001',
          temperature: 26.0,
          humidity: 58.0,
          recordedAt: new Date(Date.now() - 3600000),
        },
      ],
      skipDuplicates: true,
    })

    console.log('创建测试传感器数据完成')
  }

  console.log('✅ 数据库初始化完成')
}

main()
  .catch((e) => {
    console.error('初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })