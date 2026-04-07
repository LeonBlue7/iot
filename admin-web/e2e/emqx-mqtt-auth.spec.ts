import { test } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';

test.setTimeout(180000);

test('Setup EMQX MQTT Authentication', async ({ page, context }) => {
  console.log('=== EMQX MQTT认证配置 ===\n');

  // 1. 登录
  console.log('1. 登录EMQX Dashboard...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');

  // 等待登录表单
  await page.waitForSelector('input[type="text"], input[name="username"]', { timeout: 10000 });

  // 填写凭据
  await page.locator('input[type="text"], input[name="username"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"], input[name="password"]').first().fill(EMQX_PASS);

  // 点击登录
  await page.getByRole('button').first().click();

  // 等待进入Dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('✓ 登录成功\n');

  // 截图
  await page.screenshot({ path: '/tmp/iot-emqx-01-dashboard.png' });

  // 2. 创建API密钥（用于后续API调用）
  console.log('2. 创建API密钥...');
  await page.goto(`${EMQX_URL}/#/api-keys`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 检查是否已有API密钥
  const existingKeys = await page.locator('table tr').count();
  console.log(`当前API密钥数量: ${existingKeys}`);

  if (existingKeys <= 1) { // 只有表头
    console.log('创建新API密钥...');

    // 点击Create按钮
    await page.getByRole('button', { name: /create|new|新建/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写名称
    await page.locator('input[name="name"], input[placeholder*="name"]').first().fill('iot-backend');

    // 设置过期时间（可选，设为永不过期）
    const expireSelect = page.locator('select').first();
    if (await expireSelect.isVisible()) {
      await expireSelect.selectOption('never');
    }

    // 提交
    await page.getByRole('button', { name: /create|submit|确定|保存/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 获取API Key和Secret（重要！）
    const apiKey = await page.locator('text=/API Key|access key/i').locator('..').locator('input, code').first().textContent();
    const apiSecret = await page.locator('text=/Secret Key|secret key/i').locator('..').locator('input, code').first().textContent();

    console.log(`API Key: ${apiKey}`);
    console.log(`API Secret: ${apiSecret}`);

    await page.screenshot({ path: '/tmp/iot-emqx-02-api-key.png' });
  }

  // 3. 配置Authentication
  console.log('\n3. 配置MQTT认证...');

  // 访问Authentication页面
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/iot-emqx-03-auth-list.png' });

  // 检查是否已有Password-Based认证器
  const passwordAuth = await page.locator('text=/Password-Based|password-based/i').count();

  if (passwordAuth === 0) {
    console.log('创建Password-Based认证器...');

    // 点击Create
    await page.getByRole('button', { name: /create|new|新建/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 选择Password-Based
    await page.locator('text=/Password-Based/i').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/iot-emqx-04-auth-type.png' });

    // 选择Backend - Built-in Database
    await page.locator('text=/Built-in Database/i').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/iot-emqx-05-auth-backend.png' });

    // 配置参数
    // User ID Type: Username
    const userIdType = page.locator('input[value="username"], label:has-text("Username")');
    if (await userIdType.isVisible()) {
      await userIdType.click();
    }

    // Password Hash: Plain
    const plainHash = page.locator('label:has-text("plain"), input[value="plain"]');
    if (await plainHash.isVisible()) {
      await plainHash.click();
    }

    await page.screenshot({ path: '/tmp/iot-emqx-06-auth-config.png' });

    // 提交创建
    await page.getByRole('button', { name: /create|submit|创建/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✓ 认证器创建成功');
  } else {
    console.log('✓ Password-Based认证器已存在');
  }

  // 4. 添加用户
  console.log('\n4. 添加MQTT用户 test1/test123...');

  // 点击进入认证器详情
  await page.locator('text=/Password-Based|password-based/i').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 点击Users标签
  const usersTab = page.locator('button, a, [role="tab"]').filter({ hasText: /users|用户/i });
  if (await usersTab.isVisible()) {
    await usersTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: '/tmp/iot-emqx-07-users.png' });

  // 检查用户是否已存在
  const test1User = await page.locator('text="test1"').count();

  if (test1User === 0) {
    console.log('添加用户...');

    // 点击Add User
    await page.getByRole('button', { name: /add|new|添加/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写用户信息
    await page.locator('input[name="user_id"], input[placeholder*="User ID"]').first().fill('test1');
    await page.locator('input[name="password"], input[type="password"]').first().fill('test123');

    await page.screenshot({ path: '/tmp/iot-emqx-08-add-user.png' });

    // 提交
    await page.getByRole('button', { name: /add|confirm|添加|确定/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✓ 用户添加成功');
  } else {
    console.log('✓ 用户test1已存在');
  }

  await page.screenshot({ path: '/tmp/iot-emqx-09-users-final.png' });

  // 5. 关联认证器到监听器
  console.log('\n5. 关联认证器到TCP监听器...');

  await page.goto(`${EMQX_URL}/#/listeners`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/iot-emqx-10-listeners.png' });

  // 找到TCP default监听器
  const tcpListener = page.locator('tr:has-text("tcp")').filter({ hasText: /1883|default/i });
  if (await tcpListener.isVisible()) {
    await tcpListener.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/iot-emqx-11-tcp-detail.png' });

    // 点击Settings或Authentication设置
    const authSettings = page.locator('text=/Authentication|认证/i').first();
    if (await authSettings.isVisible()) {
      // 可能需要点击设置按钮
      const settingsBtn = page.getByRole('button', { name: /settings|edit|设置|编辑/i });
      if (await settingsBtn.isVisible()) {
        await settingsBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
      }

      // 找到认证器下拉框
      const authSelect = page.locator('select').filter({ hasText: /authentication|认证/i });
      if (await authSelect.isVisible()) {
        await authSelect.click();
        await page.waitForTimeout(500);

        // 选择password-based认证器
        await page.locator('option, li').filter({ hasText: /password/i }).click();
        await page.waitForTimeout(500);

        // 保存
        await page.getByRole('button', { name: /save|保存/i }).click();
        await page.waitForTimeout(2000);

        console.log('✓ 认证器已关联到TCP监听器');
      } else {
        console.log('⚠ 未找到认证器选择框，可能需要手动配置');
      }
    }

    await page.screenshot({ path: '/tmp/iot-emqx-12-auth-linked.png' });
  }

  console.log('\n=== 配置完成 ===');
  console.log('请在服务器上重启服务:');
  console.log('  sudo docker-compose -f docker-compose.prod.yml restart emqx backend');
  console.log('\n截图已保存到 /tmp/iot-emqx-*.png');
});