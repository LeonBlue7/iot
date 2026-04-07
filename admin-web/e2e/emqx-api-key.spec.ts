import { test } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';

test.setTimeout(60000);

test('Get EMQX API Key', async ({ page }) => {
  console.log('=== 创建EMQX API密钥 ===\n');

  // 登录
  console.log('登录...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"]').first().fill(EMQX_PASS);
  await page.getByRole('button').first().click();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('✓ 登录成功\n');

  // 访问API Keys页面
  console.log('访问API Keys页面...');
  await page.goto(`${EMQX_URL}/#/api-keys`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/iot-emqx-api-keys.png', fullPage: true });

  // 点击Create按钮
  const createBtn = page.getByRole('button').filter({ hasText: /create|new/i });
  if (await createBtn.count() > 0) {
    console.log('点击Create...');
    await createBtn.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写名称
    const nameInput = page.locator('input').first();
    await nameInput.fill('iot-backend-key');

    // 选择永不过期
    const expireSelect = page.locator('select').first();
    if (await expireSelect.isVisible()) {
      const options = await expireSelect.locator('option').allInnerTexts();
      console.log('过期选项:', options);
      await expireSelect.selectOption({ index: 0 }); // 通常是第一个是永不过期
    }

    await page.screenshot({ path: '/tmp/iot-emqx-create-api-key.png', fullPage: true });

    // 提交
    const submitBtn = page.getByRole('button').filter({ hasText: /confirm|create|submit/i }).last();
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: '/tmp/iot-emqx-api-key-created.png', fullPage: true });

    // 获取API Key和Secret
    const accessKey = await page.locator('[class*="key"], [class*="secret"]').first().textContent().catch(() => null);
    const secretKey = await page.locator('[class*="key"], [class*="secret"]').last().textContent().catch(() => null);

    console.log('\nAPI Key创建成功!');
    console.log('请将以下信息保存到.env文件:');
    console.log(`EMQX_API_KEY=${accessKey}`);
    console.log(`EMQX_API_SECRET=${secretKey}`);
  } else {
    console.log('未找到Create按钮，截图已保存');
  }
});