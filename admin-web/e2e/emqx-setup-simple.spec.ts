import { test } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';

test.setTimeout(120000);

test('Setup MQTT Authentication in EMQX', async ({ page }) => {
  console.log('=== 配置EMQX MQTT认证 ===\n');

  // 1. 登录
  console.log('1. 登录...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"]').first().fill(EMQX_PASS);
  await page.getByRole('button').first().click();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('✓ 登录成功\n');

  // 2. 直接访问Authentication页面
  console.log('2. 访问认证配置...');
  await page.goto(`${EMQX_URL}/#/authentication/password_based:built_in_database`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/iot-emqx-auth-page.png', fullPage: true });

  // 检查页面内容
  const pageContent = await page.textContent('body');
  console.log('页面是否包含Authentication:', pageContent.includes('Authentication'));

  // 3. 尝试添加用户
  console.log('\n3. 添加用户...');

  // 查找Users相关的按钮或标签
  const usersButton = page.locator('button, a, [role="tab"]').filter({ hasText: /user/i });
  if (await usersButton.count() > 0) {
    await usersButton.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: '/tmp/iot-emqx-users-page.png', fullPage: true });

  // 检查是否有Add User按钮
  const addUserBtn = page.getByRole('button').filter({ hasText: /add|create|new/i });
  if (await addUserBtn.count() > 0) {
    console.log('找到添加按钮，点击...');
    await addUserBtn.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写用户信息
    const userInput = page.locator('input').first();
    const passInput = page.locator('input[type="password"]').first();

    if (await userInput.isVisible()) {
      await userInput.fill('test1');
      await passInput.fill('test123');
      console.log('✓ 已填写用户信息');

      await page.screenshot({ path: '/tmp/iot-emqx-add-user-form.png', fullPage: true });

      // 提交
      const confirmBtn = page.getByRole('button').filter({ hasText: /confirm|submit|ok|save|add/i }).last();
      await confirmBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('✓ 用户添加成功');
    }
  }

  // 4. 检查监听器配置
  console.log('\n4. 检查监听器认证关联...');
  await page.goto(`${EMQX_URL}/#/listeners/tcp:default`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/iot-emqx-tcp-listener.png', fullPage: true });

  // 查找认证器配置
  const authSection = page.locator('[class*="authentication"], [class*="auth"]').first();
  if (await authSection.isVisible()) {
    console.log('找到认证配置区域');

    // 检查是否已关联认证器
    const linkedAuth = await page.locator('text=/password|built-in/i').count();
    if (linkedAuth > 0) {
      console.log('✓ TCP监听器已关联认证器');
    } else {
      console.log('⚠ TCP监听器未关联认证器');

      // 尝试点击设置
      const settingsBtn = page.getByRole('button').filter({ hasText: /setting|edit|config/i });
      if (await settingsBtn.count() > 0) {
        await settingsBtn.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: '/tmp/iot-emqx-listener-settings.png', fullPage: true });
      }
    }
  }

  console.log('\n=== 配置检查完成 ===');
  console.log('截图已保存到 /tmp/iot-emqx-*.png');

  // 输出所有截图
  const screenshots = await page.evaluate(() => {
    return document.title;
  });
  console.log('当前页面:', screenshots);
});