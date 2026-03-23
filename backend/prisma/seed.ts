// backend/prisma/seed.ts
// 初始化管理员账号

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/services/admin/auth.service.js';

const prisma = new PrismaClient();

// 从环境变量读取初始密码，未设置时使用强随机密码
const INITIAL_ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || crypto.randomUUID().slice(0, 16);

async function main() {
  console.log('开始初始化管理员账号...');

  // 检查是否已存在管理员
  const existingAdmin = await prisma.adminUser.count();
  if (existingAdmin > 0) {
    console.log(`已存在 ${existingAdmin} 个管理员账号，跳过初始化`);
    return;
  }

  // 创建默认管理员
  const passwordHash = await hashPassword(INITIAL_ADMIN_PASSWORD);

  await prisma.adminUser.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash,
      name: '系统管理员',
      enabled: true,
      roleIds: [1], // 超级管理员角色
      mustChangePassword: true, // 强制首次登录修改密码
    },
  });

  console.log('✅ 默认管理员账号创建成功');
  console.log('   用户名：admin');
  if (process.env.INITIAL_ADMIN_PASSWORD) {
    console.log('   密码：从环境变量 INITIAL_ADMIN_PASSWORD 读取');
  } else {
    console.log(`   临时密码：${INITIAL_ADMIN_PASSWORD}`);
  }
  console.log('');
  console.log('⚠️  首次登录时必须修改密码！');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
