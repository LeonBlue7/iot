import { test, expect } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';

test.setTimeout(180000);

test('Configure EMQX Authentication for MQTT devices', async ({ page }) => {
  console.log('\n========================================');
  console.log('  EMQX MQTT认证配置');
  console.log('========================================\n');

  // Step 1: 登录EMQX Dashboard
  console.log('[Step 1] 登录EMQX Dashboard...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');

  // 等待登录表单
  await page.waitForSelector('input[type="text"]', { timeout: 10000 });
  await page.locator('input[type="text"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"]').first().fill(EMQX_PASS);
  await page.getByRole('button').first().click();

  // 等待登录成功
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('✓ 登录成功\n');

  // Step 2: 访问Authentication页面
  console.log('[Step 2] 访问认证管理页面...');
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/iot-emqx-auth.png', fullPage: true });

  // Step 3: 创建Password-Based认证器
  console.log('[Step 3] 创建Password-Based认证器...');

  // 检查是否已存在认证器
  const existingAuth = await page.locator('tr, [class*="card"]').filter({ hasText: /password-based/i }).count();

  if (existingAuth === 0) {
    // 点击Create按钮
    const createBtn = page.locator('button').filter({ hasText: /create|new|新建/i });
    await createBtn.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 选择Password-Based
    await page.locator('text=/password-based/i').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 选择Built-in Database
    await page.locator('text=/built-in database/i').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 配置参数 - 使用plain密码
    const plainOption = page.locator('label, input').filter({ hasText: /plain/i });
    if (await plainOption.count() > 0) {
      await plainOption.first().click();
    }

    await page.screenshot({ path: '/tmp/iot-emqx-create-auth.png', fullPage: true });

    // 提交创建
    const submitBtn = page.locator('button').filter({ hasText: /create|submit|创建/i });
    await submitBtn.last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✓ 认证器创建成功\n');
  } else {
    console.log('✓ 认证器已存在\n');
  }

  // Step 4: 添加用户
  console.log('[Step 4] 添加MQTT用户 test1/test123...');

  // 点击进入认证器详情
  const authCard = page.locator('tr, [class*="card"]').filter({ hasText: /password-based/i }).first();
  await authCard.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 点击Users标签
  const usersTab = page.locator('[role="tab"], button').filter({ hasText: /users|用户/i });
  if (await usersTab.count() > 0) {
    await usersTab.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: '/tmp/iot-emqx-users.png', fullPage: true });

  // 检查用户是否存在
  const test1Exists = await page.locator('text=test1').count();

  if (test1Exists === 0) {
    // 点击Add User
    const addBtn = page.locator('button').filter({ hasText: /add|new|添加/i });
    await addBtn.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写用户信息
    await page.locator('input').first().fill('test1');
    await page.locator('input[type="password"]').first().fill('test123');

    await page.screenshot({ path: '/tmp/iot-emqx-add-user.png', fullPage: true });

    // 提交
    const confirmBtn = page.locator('button').filter({ hasText: /add|confirm|submit|添加|确定/i });
    await confirmBtn.last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✓ 用户test1添加成功\n');
  } else {
    console.log('✓ 用户test1已存在\n');
  }

  // Step 5: 关联认证器到TCP监听器
  console.log('[Step 5] 关联认证器到TCP监听器...');

  await page.goto(`${EMQX_URL}/#/listeners`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/iot-emqx-listeners.png', fullPage: true });

  // 找到TCP监听器
  const tcpRow = page.locator('tr').filter({ hasText: /tcp.*1883|default.*1883/i });
  if (await tcpRow.count() > 0) {
    await tcpRow.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/iot-emqx-tcp-detail.png', fullPage: true });

    // 查找认证器设置
    const authSection = page.locator('[class*="authentication"], text=/认证|authentication/i').first();
    if (await authSection.isVisible()) {
      // 点击设置或编辑按钮
      const editBtn = page.locator('button').filter({ hasText: /settings|edit|设置|编辑/i });
      if (await editBtn.count() > 0) {
        await editBtn.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }

      // 查找认证器下拉框
      const authSelect = page.locator('select').first();
      if (await authSelect.isVisible()) {
        await authSelect.click();
        await page.waitForTimeout(500);

        // 选择password-based认证器
        const options = await page.locator('option, li').filter({ hasText: /password/i }).all();
        if (options.length > 0) {
          await options[0].click();
          await page.waitForTimeout(500);

          // 保存
          const saveBtn = page.locator('button').filter({ hasText: /save|保存/i });
          if (await saveBtn.count() > 0) {
            await saveBtn.first().click();
            await page.waitForTimeout(2000);
            console.log('✓ 认证器已关联到TCP监听器\n');
          }
        }
      }
    }
  }

  await page.screenshot({ path: '/tmp/iot-emqx-final.png', fullPage: true });

  console.log('========================================');
  console.log('  配置完成！');
  console.log('========================================');
  console.log('\n请在服务器上重启服务:');
  console.log('  sudo docker-compose -f docker-compose.prod.yml restart emqx backend');
  console.log('\n截图已保存到: /tmp/iot-emqx-*.png\n');
});