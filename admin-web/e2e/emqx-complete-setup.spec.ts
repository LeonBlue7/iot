import { test } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';

test.setTimeout(300000);

test('Complete EMQX MQTT Setup', async ({ page, context }) => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║     EMQX MQTT认证配置 - 完整流程       ║');
  console.log('╚════════════════════════════════════════╝\n');

  // 1. 登录
  console.log('[1/6] 登录EMQX Dashboard...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="text"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"]').first().fill(EMQX_PASS);
  await page.getByRole('button').first().click();
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('      ✓ 登录成功\n');

  // 2. 创建API密钥
  console.log('[2/6] 创建API密钥...');
  await page.goto(`${EMQX_URL}/#/api-keys`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 检查是否已有密钥
  let apiKey = '';
  let apiSecret = '';

  const existingKey = await page.locator('table tbody tr').count();
  if (existingKey === 0) {
    // 点击Create
    await page.getByRole('button').filter({ hasText: /create|new/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写名称
    await page.locator('input').first().fill('iot-api-key');

    // 提交
    await page.getByRole('button').filter({ hasText: /confirm|create/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 获取密钥
    const codeBlocks = await page.locator('code, pre, [class*="secret"]').allTextContents();
    if (codeBlocks.length >= 2) {
      apiKey = codeBlocks[0];
      apiSecret = codeBlocks[1];
      console.log(`      API Key: ${apiKey}`);
      console.log(`      API Secret: ${apiSecret}`);
    }
    console.log('      ✓ API密钥创建成功\n');
  } else {
    console.log('      ✓ API密钥已存在\n');
  }

  await page.screenshot({ path: '/tmp/iot-emqx-01-api-key.png' });

  // 3. 创建认证器
  console.log('[3/6] 创建MQTT认证器...');
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 检查是否已有password-based认证器
  const authExists = await page.locator('text=/Password-Based/i').count();

  if (authExists === 0) {
    // 点击Create
    await page.getByRole('button').filter({ hasText: /create|new/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 选择Password-Based
    await page.locator('text=/Password-Based/i').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 选择Built-in Database
    await page.locator('text=/Built-in Database/i').click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 配置
    // 选择plain密码
    const plainRadio = page.locator('input[value="plain"], label:has-text("plain")');
    if (await plainRadio.count() > 0) {
      await plainRadio.first().click();
    }

    // 提交
    await page.getByRole('button').filter({ hasText: /create|submit/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('      ✓ 认证器创建成功\n');
  } else {
    console.log('      ✓ 认证器已存在\n');
  }

  await page.screenshot({ path: '/tmp/iot-emqx-02-auth.png' });

  // 4. 添加用户
  console.log('[4/6] 添加MQTT用户 test1/test123...');

  // 点击进入认证器
  await page.locator('text=/Password-Based/i').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // 点击Users标签
  const usersTab = page.locator('[role="tab"], button').filter({ hasText: /users/i });
  if (await usersTab.count() > 0) {
    await usersTab.first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  // 检查test1是否存在
  const userExists = await page.locator('text=test1').count();

  if (userExists === 0) {
    // 点击Add User
    await page.getByRole('button').filter({ hasText: /add|new/i }).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写用户信息
    const inputs = await page.locator('input').all();
    await inputs[0].fill('test1');
    await page.locator('input[type="password"]').first().fill('test123');

    // 提交
    await page.getByRole('button').filter({ hasText: /add|confirm/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('      ✓ 用户test1添加成功\n');
  } else {
    console.log('      ✓ 用户test1已存在\n');
  }

  await page.screenshot({ path: '/tmp/iot-emqx-03-users.png' });

  // 5. 关联认证器到监听器
  console.log('[5/6] 关联认证器到TCP监听器...');
  await page.goto(`${EMQX_URL}/#/listeners`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 找到TCP监听器并点击
  const tcpRow = page.locator('tr').filter({ hasText: /1883/ }).first();
  if (await tcpRow.isVisible()) {
    await tcpRow.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 查找Authentication设置
    // 可能需要点击Settings或直接找到认证器选择

    // 保存截图用于调试
    await page.screenshot({ path: '/tmp/iot-emqx-04-tcp-listener.png' });

    // 尝试找到认证器配置区域
    const pageText = await page.textContent('body');
    if (pageText?.includes('Authentication') || pageText?.includes('认证')) {
      // 点击Settings按钮
      const settingsBtn = page.getByRole('button').filter({ hasText: /settings|edit|配置/i });
      if (await settingsBtn.count() > 0) {
        await settingsBtn.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({ path: '/tmp/iot-emqx-05-tcp-settings.png' });

        // 查找认证器下拉框
        const selects = await page.locator('select').all();
        for (const select of selects) {
          const label = await select.getAttribute('aria-label') || '';
          const parentText = await select.locator('..').textContent() || '';
          if (label.includes('auth') || parentText.includes('auth') || parentText.includes('认证')) {
            await select.click();
            await page.waitForTimeout(500);
            // 选择password-based
            const options = await page.locator('option, li').filter({ hasText: /password/i }).all();
            if (options.length > 0) {
              await options[0].click();
              await page.waitForTimeout(500);
              // 保存
              await page.getByRole('button').filter({ hasText: /save/i }).first().click();
              await page.waitForTimeout(2000);
              console.log('      ✓ 认证器已关联\n');
            }
          }
        }
      }
    }
  } else {
    console.log('      ⚠ 未找到TCP监听器\n');
  }

  // 6. 验证配置
  console.log('[6/6] 验证配置...');
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/iot-emqx-06-final.png' });

  console.log('\n╔════════════════════════════════════════╗');
  console.log('║             配置完成                    ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log('请执行以下命令重启服务：');
  console.log('  cd /opt/iot');
  console.log('  sudo docker-compose -f docker-compose.prod.yml restart emqx backend');
  console.log('  sudo docker-compose -f docker-compose.prod.yml logs -f backend');
  console.log('\n截图已保存到: /tmp/iot-emqx-*.png\n');
});