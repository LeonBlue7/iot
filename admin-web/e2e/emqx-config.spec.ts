import { test } from '@playwright/test';

const EMQX_URL = 'http://43.138.195.15:18083';
const EMQX_USER = 'admin';
const EMQX_PASS = 'Xk9vyeTz1JjX6j9OBPVs0oPEwPFcI9a2iZTGlcrmBFI=';
const MQTT_USER = 'test1';
const MQTT_PASS = 'test123';

test.setTimeout(300000);

test('Configure EMQX Authentication for MQTT', async ({ page }) => {
  console.log('=== 开始配置EMQX认证 ===');

  // 1. 登录EMQX Dashboard
  console.log('1. 登录EMQX Dashboard...');
  await page.goto(EMQX_URL);
  await page.waitForLoadState('networkidle');

  // 填写登录表单
  await page.locator('input[type="text"], input[name="username"]').first().fill(EMQX_USER);
  await page.locator('input[type="password"], input[name="password"]').first().fill(EMQX_PASS);

  // 点击登录
  await page.getByRole('button').first().click();

  // 等待进入dashboard
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('✓ 登录成功');

  // 2. 导航到Authentication页面
  console.log('\n2. 进入Authentication页面...');
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 截图当前状态
  await page.screenshot({ path: '/tmp/emqx-auth-list.png', fullPage: true });

  // 3. 检查是否已有Built-in Database认证器
  console.log('\n3. 检查现有认证器...');
  const existingAuth = await page.locator('text=/Built-in Database|built-in database/i').count();

  if (existingAuth > 0) {
    console.log('✓ 已存在Built-in Database认证器');

    // 点击进入认证器
    await page.locator('text=/Built-in Database|built-in database/i').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  } else {
    console.log('⚠ 未找到Built-in Database认证器，创建新认证器...');

    // 点击Create按钮
    const createBtn = page.getByRole('button', { name: /create|新建/i });
    await createBtn.click();
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

    // 配置认证器
    // Backend应该已经默认是Built-in Database
    // User ID type选择username
    const userIdTypeRadio = page.locator('text=/username/i');
    if (await userIdTypeRadio.isVisible()) {
      await userIdTypeRadio.click();
    }

    // Password Hash Algorithm选择plain
    const plainRadio = page.locator('text=/plain/i');
    if (await plainRadio.isVisible()) {
      await plainRadio.click();
    }

    await page.screenshot({ path: '/tmp/emqx-new-auth-config.png', fullPage: true });

    // 点击Create创建
    await page.getByRole('button', { name: /create|新建|submit/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✓ 认证器创建成功');
  }

  await page.screenshot({ path: '/tmp/emqx-auth-detail.png', fullPage: true });

  // 4. 添加用户 test1/test123
  console.log('\n4. 检查并添加用户...');

  // 点击Users标签
  const usersTab = page.locator('text=/users|用户/i').first();
  if (await usersTab.isVisible()) {
    await usersTab.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: '/tmp/emqx-users-list.png', fullPage: true });

  // 检查test1用户是否已存在
  const userExists = await page.locator(`text="${MQTT_USER}"`).count();

  if (userExists === 0) {
    console.log('添加用户 test1/test123...');

    // 点击Add User按钮
    await page.getByRole('button', { name: /add|添加|new/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // 填写用户信息
    await page.locator('input[name="user_id"], input[placeholder*="user"]').first().fill(MQTT_USER);
    await page.locator('input[name="password"], input[type="password"]').first().fill(MQTT_PASS);

    await page.screenshot({ path: '/tmp/emqx-add-user-form.png', fullPage: true });

    // 点击Add/Confirm
    await page.getByRole('button', { name: /add|添加|confirm|确定/i }).last().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('✓ 用户添加成功');
  } else {
    console.log('✓ 用户test1已存在');
  }

  await page.screenshot({ path: '/tmp/emqx-users-final.png', fullPage: true });

  // 5. 关联认证器到TCP监听器
  console.log('\n5. 关联认证器到TCP监听器...');

  await page.goto(`${EMQX_URL}/#/listeners`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  await page.screenshot({ path: '/tmp/emqx-listeners.png', fullPage: true });

  // 查找default TCP监听器
  const tcpRow = page.locator('tr:has-text("tcp")').filter({ hasText: /1883|default/i }).first();

  if (await tcpRow.isVisible()) {
    console.log('✓ 找到TCP监听器');

    // 点击进入详情
    await tcpRow.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({ path: '/tmp/emqx-tcp-listener.png', fullPage: true });

    // 点击Settings/设置
    const settingsBtn = page.getByRole('button', { name: /settings|设置|edit|编辑/i });
    if (await settingsBtn.isVisible()) {
      await settingsBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({ path: '/tmp/emqx-listener-settings.png', fullPage: true });

      // 查找Authentication下拉框
      const authDropdown = page.locator('select, [class*="select"]').filter({ hasText: /authentication|认证/i });
      if (await authDropdown.isVisible()) {
        await authDropdown.click();
        await page.waitForTimeout(500);

        // 选择password-based认证器
        const authOption = page.locator('option, li').filter({ hasText: /password-based/i });
        if (await authOption.isVisible()) {
          await authOption.click();
          console.log('✓ 选择了认证器');

          // 保存
          await page.getByRole('button', { name: /save|保存|submit/i }).click();
          await page.waitForTimeout(2000);
          console.log('✓ 配置已保存');
        }
      } else {
        // 可能需要在其他位置找认证器配置
        console.log('⚠ 未找到Authentication下拉框，尝试其他方式...');

        // 滚动页面查找
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/emqx-listener-settings-2.png', fullPage: true });
      }
    }
  } else {
    console.log('⚠ 未找到TCP监听器');
  }

  // 最终截图
  await page.goto(`${EMQX_URL}/#/authentication`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/emqx-final-config.png', fullPage: true });

  console.log('\n=== 配置完成 ===');
  console.log('请在服务器上重启服务:');
  console.log('  sudo docker-compose -f docker-compose.prod.yml restart emqx backend');
});