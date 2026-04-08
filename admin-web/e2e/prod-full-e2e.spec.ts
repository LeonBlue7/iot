import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

// 设置较长的超时时间
test.setTimeout(300000);

interface BugReport {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  page: string;
  description: string;
  expected: string;
  actual: string;
  status: 'found' | 'fixed' | 'needs-investigation';
}

const bugsFound: BugReport[] = [];

// 登录辅助函数
async function login(page: any) {
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
}

test.describe.serial('生产环境全面E2E测试', () => {
  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('  生产环境全面E2E测试 - www.jxbonner.cloud');
    console.log('  测试时间: ' + new Date().toLocaleString('zh-CN'));
    console.log('='.repeat(80) + '\n');
  });

  test('1. 登录测试', async ({ page }) => {
    console.log('\n[测试 1] 登录功能');
    console.log('-'.repeat(60));

    // 访问登录页
    await page.goto(`${PROD_URL}/login`);
    await page.waitForLoadState('domcontentloaded');

    // 检查登录表单元素
    const usernameInput = page.getByPlaceholder('用户名');
    const passwordInput = page.getByPlaceholder('密码');
    const loginButton = page.locator('button').filter({ hasText: /登\s*录/ });

    await expect(usernameInput, '用户名输入框应存在').toBeVisible();
    await expect(passwordInput, '密码输入框应存在').toBeVisible();
    await expect(loginButton, '登录按钮应存在').toBeVisible();

    // 填写登录信息
    await usernameInput.fill(TEST_USER);
    await passwordInput.fill(TEST_PASS);

    // 点击登录并等待响应
    const [response] = await Promise.all([
      page.waitForResponse(r =>
        r.url().includes('/api/admin/auth/login') &&
        r.status() === 200,
        { timeout: 30000 }
      ),
      loginButton.click()
    ]);

    const loginData = await response.json();
    console.log('  登录响应:', JSON.stringify(loginData, null, 2).substring(0, 200));

    // 验证登录成功后跳转
    await page.waitForURL(/dashboard|devices/, { timeout: 30000 });

    const currentUrl = page.url();
    console.log('  当前URL:', currentUrl);

    if (currentUrl.includes('dashboard') || currentUrl.includes('devices')) {
      console.log('  ✓ 登录成功，跳转正确');
    } else {
      bugsFound.push({
        id: 'LOGIN-001',
        severity: 'critical',
        page: '登录页',
        description: '登录后未正确跳转',
        expected: '/dashboard 或 /devices',
        actual: currentUrl,
        status: 'found'
      });
    }

    // 截图
    await page.screenshot({ path: 'test-results/prod-01-login.png', fullPage: true });
    console.log('  截图保存: test-results/prod-01-login.png');
  });

  test('2. 仪表盘测试', async ({ page }) => {
    console.log('\n[测试 2] 仪表盘功能');
    console.log('-'.repeat(60));

    // 先登录
    await login(page);

    // 导航到仪表盘
    await page.goto(`${PROD_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 检查统计卡片
    console.log('\n  [统计卡片检查]');
    const statCards = await page.locator('.ant-statistic').all();
    console.log('  统计卡片数量:', statCards.length);

    // 获取各个统计值
    const stats = {
      totalDevices: '',
      onlineDevices: '',
      offlineDevices: '',
      acPowerOn: ''
    };

    // 设备总数
    const totalEl = page.locator('.ant-statistic').filter({ hasText: '设备总数' }).locator('.ant-statistic-content-value');
    if (await totalEl.count() > 0) {
      stats.totalDevices = await totalEl.textContent() || '';
      console.log('  设备总数:', stats.totalDevices);
    } else {
      console.log('  ✗ 未找到"设备总数"统计卡片');
      bugsFound.push({
        id: 'DASH-001',
        severity: 'high',
        page: '仪表盘',
        description: '缺少"设备总数"统计卡片',
        expected: '显示设备总数',
        actual: '未显示',
        status: 'found'
      });
    }

    // 在线设备
    const onlineEl = page.locator('.ant-statistic').filter({ hasText: '在线设备' }).locator('.ant-statistic-content-value');
    if (await onlineEl.count() > 0) {
      stats.onlineDevices = await onlineEl.textContent() || '';
      console.log('  在线设备:', stats.onlineDevices);
    } else {
      console.log('  ✗ 未找到"在线设备"统计卡片');
    }

    // 离线设备
    const offlineEl = page.locator('.ant-statistic').filter({ hasText: '离线设备' }).locator('.ant-statistic-content-value');
    if (await offlineEl.count() > 0) {
      stats.offlineDevices = await offlineEl.textContent() || '';
      console.log('  离线设备:', stats.offlineDevices);
    } else {
      console.log('  ✗ 未找到"离线设备"统计卡片');
    }

    // 空调开机数量（Bug 5）
    console.log('\n  [Bug 5 检查: 空调开机数量]');
    const acPowerEl = page.locator('.ant-statistic').filter({ hasText: '空调开机' });
    if (await acPowerEl.count() > 0) {
      stats.acPowerOn = await acPowerEl.locator('.ant-statistic-content-value').textContent() || '';
      console.log('  ✓ Bug 5修复: 空调开机数量 =', stats.acPowerOn);
    } else {
      console.log('  ✗ Bug 5未修复: 未找到"空调开机"统计卡片');
      bugsFound.push({
        id: 'DASH-002',
        severity: 'medium',
        page: '仪表盘',
        description: '缺少"空调开机数量"统计卡片',
        expected: '显示空调开机数量',
        actual: '未显示',
        status: 'found'
      });
    }

    // Bug 4: 在线+离线=总数，且在线不等于总数
    console.log('\n  [Bug 4 检查: 在线/离线设备数]');
    const total = parseInt(stats.totalDevices) || 0;
    const online = parseInt(stats.onlineDevices) || 0;
    const offline = parseInt(stats.offlineDevices) || 0;

    if (total > 0) {
      if (online + offline === total) {
        console.log(`  ✓ Bug 4修复: ${online} + ${offline} = ${total}`);
      } else {
        console.log(`  ✗ Bug 4未修复: ${online} + ${offline} ≠ ${total}`);
        bugsFound.push({
          id: 'DASH-003',
          severity: 'high',
          page: '仪表盘',
          description: '在线设备数不正确',
          expected: `在线 + 离线 = 总数 (${online} + ${offline} = ${total})`,
          actual: `在线 + 离线 ≠ 总数`,
          status: 'found'
        });
      }

      if (online === total && offline > 0) {
        console.log('  ✗ 错误: 在线设备数等于总数，但存在离线设备');
        bugsFound.push({
          id: 'DASH-004',
          severity: 'high',
          page: '仪表盘',
          description: '在线设备数等于总数，但存在离线设备',
          expected: '在线设备应排除离线设备',
          actual: `在线=${online}, 离线=${offline}`,
          status: 'found'
        });
      } else {
        console.log('  ✓ 在线设备数计算正确');
      }
    } else {
      console.log('  ! 警告: 设备总数为0，无法验证在线/离线计算逻辑');
      bugsFound.push({
        id: 'DASH-005',
        severity: 'high',
        page: '仪表盘',
        description: '仪表盘显示设备总数为0',
        expected: '显示实际设备数量',
        actual: '设备总数=0',
        status: 'needs-investigation'
      });
    }

    // 30分钟离线判断逻辑检查
    console.log('\n  [30分钟离线判断逻辑检查]');
    console.log('  注: 30分钟离线判断需要在API层面验证');

    await page.screenshot({ path: 'test-results/prod-02-dashboard.png', fullPage: true });
    console.log('  截图保存: test-results/prod-02-dashboard.png');
  });

  test('3. 设备管理测试', async ({ page }) => {
    console.log('\n[测试 3] 设备管理功能');
    console.log('-'.repeat(60));

    // 登录
    await login(page);

    // 导航到设备管理
    await page.goto(`${PROD_URL}/devices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 手动获取设备数据
    const devicesResponse = await page.request.get(`${PROD_URL}/api/devices?page=1&pageSize=50`);
    let devicesData = { data: [], pagination: { total: 0, pageSize: 50 } };
    try {
      devicesData = await devicesResponse.json();
    } catch (e) {
      console.log('  解析设备数据失败:', e);
    }

    const total = devicesData.pagination?.total || devicesData.data?.length || 0;
    const pageSize = devicesData.pagination?.pageSize || 50;

    console.log('  API响应设备总数:', total);
    console.log('  每页条数:', pageSize);

    // Bug 1: 分页功能
    console.log('\n  [Bug 1 检查: 分页功能]');
    const pagination = page.locator('.ant-pagination');

    if (total > pageSize) {
      const pageItems = await pagination.locator('.ant-pagination-item').count();
      const prevBtn = await pagination.locator('.ant-pagination-prev').count();
      const nextBtn = await pagination.locator('.ant-pagination-next').count();
      const quickJumper = await pagination.locator('.ant-pagination-options-quick-jumper').count();

      console.log('  分页页码数量:', pageItems);
      console.log('  上一页按钮:', prevBtn > 0 ? '有' : '无');
      console.log('  下一页按钮:', nextBtn > 0 ? '有' : '无');
      console.log('  快速跳转:', quickJumper > 0 ? '有' : '无');

      // 尝试点击下一页
      if (nextBtn > 0) {
        console.log('  尝试点击下一页...');
        await pagination.locator('.ant-pagination-next').click();
        await page.waitForTimeout(2000);

        // 检查URL是否变化
        const newUrl = page.url();
        if (newUrl.includes('page=2')) {
          console.log('  ✓ 分页功能正常，成功跳转到第2页');
        } else {
          console.log('  ? 分页可能正常，URL未显示页码参数');
        }

        // 返回第1页
        const firstPageBtn = pagination.locator('.ant-pagination-item').first();
        if (await firstPageBtn.count() > 0) {
          await firstPageBtn.click();
          await page.waitForTimeout(1000);
        }
      }

      if (pageItems >= 3 || quickJumper > 0) {
        console.log('  ✓ Bug 1修复: 分页页码显示正常');
      } else {
        console.log('  ✗ Bug 1未修复: 分页页码不完整');
        bugsFound.push({
          id: 'DEV-002',
          severity: 'medium',
          page: '设备管理',
          description: '分页页码显示不完整',
          expected: '显示所有页码或快速跳转',
          actual: `页码数=${pageItems}, 快速跳转=${quickJumper > 0}`,
          status: 'found'
        });
      }
    } else {
      console.log('  设备数量不足，无需分页 (总数:', total, ', 每页:', pageSize, ')');
    }

    // Bug 2: 温度列显示
    console.log('\n  [Bug 2 检查: 温度列显示]');
    await page.waitForTimeout(1000);
    const tableHeaders = await page.locator('.ant-table-thead th').allTextContents();
    console.log('  表头:', tableHeaders.join(' | '));

    const tempColumnIndex = tableHeaders.findIndex(h => h.includes('温度'));
    if (tempColumnIndex >= 0) {
      console.log('  ✓ 温度列存在，索引:', tempColumnIndex);

      // 检查温度数据
      const rows = await page.locator('.ant-table-tbody tr').all();
      console.log('  当前行数:', rows.length);

      let tempWithValue = 0;
      let tempWithDash = 0;

      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const row = rows[i];
        const cells = await row.locator('td').allTextContents();
        const tempValue = cells[tempColumnIndex]?.trim();

        if (tempValue && tempValue !== '-' && tempValue !== '' && !isNaN(parseFloat(tempValue))) {
          tempWithValue++;
        } else {
          tempWithDash++;
        }
      }

      console.log(`  温度有值: ${tempWithValue}, 温度为"-": ${tempWithDash}`);

      if (tempWithValue > 0) {
        console.log('  ✓ Bug 2修复: 温度列正确显示数值');
      } else {
        console.log('  ✗ Bug 2未修复: 温度列全部显示"-"');
        bugsFound.push({
          id: 'DEV-003',
          severity: 'high',
          page: '设备管理',
          description: '温度列全部显示"-"',
          expected: '显示实际温度数值',
          actual: '显示"-"',
          status: 'found'
        });
      }
    } else {
      console.log('  ✗ 未找到温度列');
      bugsFound.push({
        id: 'DEV-004',
        severity: 'high',
        page: '设备管理',
        description: '缺少温度列',
        expected: '存在温度列',
        actual: '温度列不存在',
        status: 'found'
      });
    }

    // Bug 3: 空调状态列
    console.log('\n  [Bug 3 检查: 空调状态列]');
    const acColumnIndex = tableHeaders.findIndex(h => h.includes('空调状态') || h.includes('空调'));
    if (acColumnIndex >= 0) {
      console.log('  ✓ 空调状态列存在，索引:', acColumnIndex);

      const openTags = await page.locator('.ant-tag').filter({ hasText: '开启' }).count();
      const closeTags = await page.locator('.ant-tag').filter({ hasText: '关闭' }).count();
      console.log(`  开启状态: ${openTags}台, 关闭状态: ${closeTags}台`);

      if (openTags + closeTags > 0) {
        console.log('  ✓ Bug 3修复: 空调状态列正确显示');
      } else {
        console.log('  ? 空调状态列存在但无数据显示');
      }
    } else {
      console.log('  ✗ 未找到空调状态列');
      bugsFound.push({
        id: 'DEV-005',
        severity: 'medium',
        page: '设备管理',
        description: '缺少空调状态列',
        expected: '显示空调开关状态',
        actual: '空调状态列不存在',
        status: 'found'
      });
    }

    await page.screenshot({ path: 'test-results/prod-03-devices.png', fullPage: true });
    console.log('  截图保存: test-results/prod-03-devices.png');
  });

  test('4. 设备详情页测试', async ({ page }) => {
    console.log('\n[测试 4] 设备详情页');
    console.log('-'.repeat(60));

    // 登录
    await login(page);

    // 获取设备列表
    await page.goto(`${PROD_URL}/devices`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 获取设备数据
    const devicesResponse = await page.request.get(`${PROD_URL}/api/devices?page=1&pageSize=10`);
    let devicesData = { data: [] };
    try {
      devicesData = await devicesResponse.json();
    } catch (e) {
      console.log('  解析设备数据失败');
    }

    // 点击第一个设备查看详情
    const firstDevice = devicesData.data?.[0];
    if (firstDevice) {
      console.log('  选择设备:', firstDevice.id, firstDevice.name);

      // 点击设备详情
      await page.locator('.ant-table-tbody tr').first().click();
      await page.waitForTimeout(2000);

      // 检查是否跳转到详情页
      const currentUrl = page.url();
      console.log('  当前URL:', currentUrl);

      if (currentUrl.includes('/devices/')) {
        console.log('  ✓ 成功进入设备详情页');

        // 检查实时数据卡片
        const realtimeCard = page.locator('.ant-card').filter({ hasText: '实时数据' });
        if (await realtimeCard.count() > 0) {
          console.log('  ✓ 实时数据卡片存在');

          // 检查温度显示
          const tempText = await realtimeCard.locator('.ant-statistic').filter({ hasText: '温度' }).textContent().catch(() => '');
          console.log('  温度显示:', tempText);
        } else {
          console.log('  ? 未找到实时数据卡片');
        }

        // 检查设备控制面板
        const controlPanel = page.locator('.ant-card').filter({ hasText: '控制' });
        if (await controlPanel.count() > 0) {
          console.log('  ✓ 控制面板存在');
        }

        await page.screenshot({ path: 'test-results/prod-04-device-detail.png', fullPage: true });
        console.log('  截图保存: test-results/prod-04-device-detail.png');
      } else {
        console.log('  ✗ 未跳转到设备详情页');
        bugsFound.push({
          id: 'DEV-006',
          severity: 'high',
          page: '设备详情',
          description: '点击设备无法进入详情页',
          expected: '跳转到设备详情页',
          actual: currentUrl,
          status: 'found'
        });
      }
    } else {
      console.log('  ✗ 未找到设备数据，跳过设备详情测试');
    }
  });

  test('5. 告警管理测试', async ({ page }) => {
    console.log('\n[测试 5] 告警管理');
    console.log('-'.repeat(60));

    // 登录
    await login(page);

    // 导航到告警管理
    await page.goto(`${PROD_URL}/alarms`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  当前URL:', page.url());

    // 检查告警列表
    const alarmTable = page.locator('.ant-table');
    if (await alarmTable.count() > 0) {
      console.log('  ✓ 告警列表表格存在');

      const rows = await page.locator('.ant-table-tbody tr').count();
      console.log('  告警记录数:', rows);

      // 检查表头
      const headers = await page.locator('.ant-table-thead th').allTextContents();
      console.log('  表头:', headers.join(' | '));
    } else {
      console.log('  ? 未找到告警列表表格');
    }

    await page.screenshot({ path: 'test-results/prod-05-alarms.png', fullPage: true });
    console.log('  截图保存: test-results/prod-05-alarms.png');
  });

  test('6. 统计分析测试', async ({ page }) => {
    console.log('\n[测试 6] 统计分析');
    console.log('-'.repeat(60));

    // 登录
    await login(page);

    // 导航到统计分析
    await page.goto(`${PROD_URL}/stats`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  当前URL:', page.url());

    // 检查统计图表
    const charts = await page.locator('.recharts-wrapper, .ant-card').count();
    console.log('  图表/卡片数量:', charts);

    await page.screenshot({ path: 'test-results/prod-06-stats.png', fullPage: true });
    console.log('  截图保存: test-results/prod-06-stats.png');
  });

  test('7. 层级管理测试', async ({ page }) => {
    console.log('\n[测试 7] 层级管理（客户/分区/分组）');
    console.log('-'.repeat(60));

    // 登录
    await login(page);

    // 测试客户管理
    console.log('\n  [客户管理]');
    await page.goto(`${PROD_URL}/customers`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const customersResponse = await page.request.get(`${PROD_URL}/api/customers`);
    try {
      const customersData = await customersResponse.json();
      console.log('  客户数量:', customersData.data?.length || 0);
    } catch (e) {
      console.log('  获取客户数据失败');
    }

    // 测试分区管理
    console.log('\n  [分区管理]');
    await page.goto(`${PROD_URL}/zones`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const zonesResponse = await page.request.get(`${PROD_URL}/api/zones`);
    try {
      const zonesData = await zonesResponse.json();
      console.log('  分区数量:', zonesData.data?.length || 0);
    } catch (e) {
      console.log('  获取分区数据失败');
    }

    // 测试分组管理
    console.log('\n  [分组管理]');
    await page.goto(`${PROD_URL}/groups`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const groupsResponse = await page.request.get(`${PROD_URL}/api/groups`);
    try {
      const groupsData = await groupsResponse.json();
      console.log('  分组数量:', groupsData.data?.length || 0);
    } catch (e) {
      console.log('  获取分组数据失败');
    }

    await page.screenshot({ path: 'test-results/prod-07-hierarchy.png', fullPage: true });
    console.log('  截图保存: test-results/prod-07-hierarchy.png');
  });

  test('8. 用户管理测试', async ({ page }) => {
    console.log('\n[测试 8] 用户管理');
    console.log('-'.repeat(60));

    // 登录
    await login(page);

    // 导航到用户管理
    await page.goto(`${PROD_URL}/users`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  当前URL:', page.url());

    const usersResponse = await page.request.get(`${PROD_URL}/api/admin/users`);
    try {
      const usersData = await usersResponse.json();
      console.log('  用户数量:', usersData.data?.length || usersData.length || 0);

      // 检查用户列表表格
      const userTable = page.locator('.ant-table');
      if (await userTable.count() > 0) {
        console.log('  ✓ 用户列表表格存在');
        const headers = await page.locator('.ant-table-thead th').allTextContents();
        console.log('  表头:', headers.join(' | '));
      }
    } catch (e) {
      console.log('  ? 未获取到用户数据');
    }

    await page.screenshot({ path: 'test-results/prod-08-users.png', fullPage: true });
    console.log('  截图保存: test-results/prod-08-users.png');
  });

  test('9. API响应检查', async ({ page }) => {
    console.log('\n[测试 9] API响应检查');
    console.log('-'.repeat(60));

    // 登录
    await login(page);

    // 检查设备API响应
    const devicesRes = await page.request.get(`${PROD_URL}/api/devices?page=1&pageSize=10`);
    const devicesJson = await devicesRes.json();

    console.log('\n  [设备API响应检查]');
    console.log('  设备总数:', devicesJson.pagination?.total);

    // 检查第一个设备的realtimeData
    const firstDevice = devicesJson.data?.[0];
    if (firstDevice) {
      console.log('  第一个设备ID:', firstDevice.id);
      console.log('  设备名称:', firstDevice.name);
      console.log('  实时数据:', JSON.stringify(firstDevice.realtimeData, null, 2));

      // 检查temperature是否为Decimal类型
      if (firstDevice.realtimeData?.temperature !== undefined) {
        const temp = firstDevice.realtimeData.temperature;
        console.log('  温度类型:', typeof temp, '值:', temp);

        if (typeof temp === 'object' && temp !== null) {
          console.log('  ✗ Bug: 温度返回对象而非数值');
          bugsFound.push({
            id: 'API-001',
            severity: 'critical',
            page: 'API',
            description: '温度API返回对象而非数值',
            expected: '返回数值类型',
            actual: JSON.stringify(temp),
            status: 'found'
          });
        } else if (typeof temp === 'number' || typeof temp === 'string') {
          console.log('  ✓ 温度格式正确');
        }
      }
    } else {
      console.log('  ! 警告: 设备列表为空');
      bugsFound.push({
        id: 'API-002',
        severity: 'high',
        page: 'API',
        description: '设备API返回空列表',
        expected: '返回设备数据',
        actual: 'data数组为空',
        status: 'needs-investigation'
      });
    }

    // 检查统计API
    const statsRes = await page.request.get(`${PROD_URL}/api/stats/overview`);
    const statsJson = await statsRes.json();

    console.log('\n  [统计API响应检查]');
    console.log('  统计数据:', JSON.stringify(statsJson, null, 2));

    // 验证统计数据
    if (statsJson.data) {
      const { totalDevices, onlineDevices, offlineDevices, acPowerOn } = statsJson.data;
      console.log('  设备总数:', totalDevices);
      console.log('  在线设备:', onlineDevices);
      console.log('  离线设备:', offlineDevices);
      console.log('  空调开机:', acPowerOn);

      if (totalDevices === 0) {
        console.log('  ! 统计数据显示设备总数为0');
        bugsFound.push({
          id: 'API-003',
          severity: 'high',
          page: 'API',
          description: '统计API返回设备总数为0',
          expected: '返回实际设备数量',
          actual: 'totalDevices=0',
          status: 'needs-investigation'
        });
      }
    }
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('  测试完成 - Bug汇总');
    console.log('='.repeat(80));

    if (bugsFound.length === 0) {
      console.log('\n  未发现新Bug\n');
    } else {
      console.log(`\n  发现 ${bugsFound.length} 个问题:\n`);

      const critical = bugsFound.filter(b => b.severity === 'critical');
      const high = bugsFound.filter(b => b.severity === 'high');
      const medium = bugsFound.filter(b => b.severity === 'medium');
      const low = bugsFound.filter(b => b.severity === 'low');

      if (critical.length > 0) {
        console.log(`  [严重] ${critical.length} 个:`);
        critical.forEach(b => console.log(`    - ${b.id}: ${b.description}`));
      }
      if (high.length > 0) {
        console.log(`  [高] ${high.length} 个:`);
        high.forEach(b => console.log(`    - ${b.id}: ${b.description}`));
      }
      if (medium.length > 0) {
        console.log(`  [中] ${medium.length} 个:`);
        medium.forEach(b => console.log(`    - ${b.id}: ${b.description}`));
      }
      if (low.length > 0) {
        console.log(`  [低] ${low.length} 个:`);
        low.forEach(b => console.log(`    - ${b.id}: ${b.description}`));
      }
    }

    console.log('\n' + '='.repeat(80));
  });
});