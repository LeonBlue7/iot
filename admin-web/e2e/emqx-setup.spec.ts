import { test, expect } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'public';
const MQTT_USER = 'test1';
const MQTT_PASS = 'test123';

test.setTimeout(120000);

test('Configure EMQX MQTT Authentication', async ({ page }) => {
  // 1. 登录EMQX Dashboard
  console.log('1. 登录EMQX Dashboard...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');

  // 填写登录表单
  await page.locator('input[type="text"], input[name="username"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"], input[name="password"]').first().fill(EMQX_PASS);

  // 点击登录
  await page.getByRole('button', { name: /login|登录|sign/i }).click();

  // 等待进入dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('登录成功');

  await page.screenshot({ path: '/tmp/emqx-01-dashboard.png' });

  // 2. 导航到Authentication页面
  console.log('2. 导航到Authentication页面...');
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/emqx-02-authentication.png' });

  // 3. 检查是否已有认证器
  console.log('3. 检查现有认证器...');
  const existingAuth = await page.locator('text=password-based', { exact: false }).count();

  if (existingAuth > 0) {
    console.log('已存在认证器，检查用户...');
    // 点击现有的认证器
    await page.locator('text=password-based').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/emqx-03-existing-auth.png' });

    // 检查用户列表
    const usersTab = page.locator('text=/users|用户/i');
    if (await usersTab.isVisible()) {
      await usersTab.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: '/tmp/emqx-04-users.png' });
    }
  } else {
    // 创建新认证器
    console.log('创建新认证器...');

    // 点击Create按钮
    await page.getByRole('button', { name: /create|新建/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 选择Password-Based
    await page.locator('text=password-based', { exact: false }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/emqx-03-create-auth.png' });

    // 选择Built-in Database
    await page.locator('text=built-in database', { exact: false }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/emqx-04-backend.png' });

    // 配置认证器
    // User ID type: username
    const userIdSelect = page.locator('select, [data-testid="user-id-type"]');
    if (await userIdSelect.isVisible()) {
      await userIdSelect.selectOption('username');
    }

    // Password Hash: plain
    const hashSelect = page.locator('select, [data-testid="password-hash"]');
    if (await hashSelect.isVisible()) {
      await hashSelect.selectOption('plain');
    }

    await page.screenshot({ path: '/tmp/emqx-05-config.png' });

    // 点击Create
    await page.getByRole('button', { name: /create|新建|submit/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('认证器创建成功');
  }

  // 4. 添加用户
  console.log('4. 添加用户 test1/test123...');

  // 确保在用户标签页
  const usersTabActive = await page.locator('[class*="active"], [aria-selected="true"]').filter({ hasText: /users|用户/i }).count();
  if (usersTabActive === 0) {
    const usersBtn = page.locator('text=/users|用户/i').first();
    if (await usersBtn.isVisible()) {
      await usersBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
  }

  await page.screenshot({ path: '/tmp/emqx-06-users-tab.png' });

  // 检查用户是否已存在
  const userExists = await page.locator(`text=${MQTT_USER}`).count();

  if (userExists === 0) {
    // 点击Add User
    await page.getByRole('button', { name: /add|添加|new|新建/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写用户信息
    await page.locator('input[name="user_id"], input[placeholder*="user"]').first().fill(MQTT_USER);
    await page.locator('input[name="password"], input[type="password"]').first().fill(MQTT_PASS);

    await page.screenshot({ path: '/tmp/emqx-07-add-user.png' });

    // 点击Add/Submit
    await page.getByRole('button', { name: /add|添加|submit|confirm/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('用户添加成功');
  } else {
    console.log('用户已存在');
  }

  await page.screenshot({ path: '/tmp/emqx-08-final.png' });

  console.log('配置完成！请查看截图确认。');
});