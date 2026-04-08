import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('深入诊断: Dashboard数据加载', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('  深入诊断: Dashboard数据加载问题');
  console.log('='.repeat(80) + '\n');

  // 登录
  console.log('[步骤 1] 登录');
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);

  // 捕获登录响应
  const [loginResponse] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/admin/auth/login')),
    page.locator('button').filter({ hasText: /登\s*录/ }).click()
  ]);

  const loginData = await loginResponse.json();
  console.log('  Token获取成功:', loginData.data?.token?.substring(0, 50) + '...');

  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('  登录成功，当前URL:', page.url());

  // 检查localStorage中的token
  const authStorage = await page.evaluate(() => localStorage.getItem('auth-storage'));
  console.log('\n[步骤 2] 检查localStorage');
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    console.log('  Token存在于localStorage:', parsed?.state?.token?.substring(0, 50) + '...');
  } else {
    console.log('  ✗ localStorage中无auth-storage');
  }

  // 导航到Dashboard，捕获所有API请求
  console.log('\n[步骤 3] 导航到Dashboard并捕获API请求');

  const apiRequests: { url: string; method: string; status: number; data?: any }[] = [];

  page.on('response', async (response) => {
    if (response.url().includes('/api/') && !response.url().includes('/login')) {
      const request = {
        url: response.url(),
        method: response.request().method(),
        status: response.status()
      };

      try {
        if (response.status() === 200) {
          const json = await response.json();
          request.data = json;
        }
      } catch (e) {
        // 忽略解析错误
      }

      apiRequests.push(request);
      console.log(`  API请求: ${request.method} ${response.url().split('/api/')[1]} -> ${request.status}`);
    }
  });

  await page.goto(`${PROD_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // 检查各个API响应
  console.log('\n[步骤 4] 分析API响应');

  for (const req of apiRequests) {
    console.log(`\n  === ${req.url.split('/api/')[1]} ===`);
    console.log('  状态码:', req.status);

    if (req.data) {
      if (req.url.includes('/devices')) {
        console.log('  设备总数:', req.data.total);
        console.log('  返回设备数:', req.data.data?.length);
        console.log('  第一页设备数:', req.data.data?.slice(0, 3).map(d => ({ id: d.id, temp: d.realtimeData?.temperature })));
      } else if (req.url.includes('/stats')) {
        console.log('  统计数据:', JSON.stringify(req.data.data));
      } else if (req.url.includes('/customers')) {
        console.log('  客户数:', req.data.data?.length);
      }
    }
  }

  // 检查页面实际显示的数值
  console.log('\n[步骤 5] 检查页面实际显示');

  await page.waitForTimeout(2000);

  // 等待Statistic组件加载
  const statCards = await page.locator('.ant-statistic').all();
  console.log('  统计卡片数量:', statCards.length);

  // 获取各个数值
  const values: Record<string, string> = {};

  for (const card of statCards) {
    const title = await card.locator('.ant-statistic-title').textContent();
    const value = await card.locator('.ant-statistic-content-value').textContent();
    if (title) {
      values[title.trim()] = value || 'null';
    }
  }

  console.log('\n  页面显示的统计值:');
  for (const [title, value] of Object.entries(values)) {
    console.log(`    ${title}: ${value}`);
  }

  // 截图
  await page.screenshot({ path: 'test-results/diagnostic-dashboard.png', fullPage: true });
  console.log('\n  截图保存: test-results/diagnostic-dashboard.png');

  // 对比API数据与页面显示
  console.log('\n[步骤 6] 问题分析');

  const devicesApi = apiRequests.find(r => r.url.includes('/devices'));
  if (devicesApi?.data) {
    const apiTotal = devicesApi.data.total || 0;
    const pageTotal = parseInt(values['设备总数'] || '0');

    if (apiTotal !== pageTotal) {
      console.log(`  ✗ 发现问题: API返回设备总数=${apiTotal}, 但页面显示=${pageTotal}`);
      console.log('  可能原因: 前端数据处理逻辑问题');
    } else {
      console.log(`  ✓ 数据一致: API和页面都显示设备总数=${apiTotal}`);
    }

    // 检查温度数据
    const devicesWithTemp = devicesApi.data.data?.filter(d =>
      d.realtimeData?.temperature !== null && d.realtimeData?.temperature !== undefined
    ) || [];

    console.log(`\n  有温度数据的设备数: ${devicesWithTemp.length}`);
    if (devicesWithTemp.length > 0) {
      console.log('  示例温度数据:');
      devicesWithTemp.slice(0, 5).forEach(d => {
        console.log(`    ${d.id}: temp=${d.realtimeData?.temperature}, acState=${d.realtimeData?.acState}`);
      });
    } else {
      console.log('  ✗ 所有设备温度数据为null');
    }
  }

  console.log('\n' + '='.repeat(80));
});

test('深入诊断: 设备管理温度列', async ({ page }) => {
  console.log('\n' + '='.repeat(80));
  console.log('  深入诊断: 设备管理温度列显示问题');
  console.log('='.repeat(80) + '\n');

  // 登录
  await page.goto(`${PROD_URL}/login`);
  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);
  await page.locator('button').filter({ hasText: /登\s*录/ }).click();
  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });

  // 导航到设备管理，捕获API请求
  console.log('[步骤 1] 导航到设备管理');

  const devicesResponse = await page.waitForResponse(r => r.url().includes('/api/devices'));
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');

  const devicesData = await devicesResponse.json();
  console.log('  API返回设备总数:', devicesData.total);
  console.log('  API返回设备数:', devicesData.data?.length);

  // 分析温度数据
  console.log('\n[步骤 2] 分析API温度数据');
  const devicesWithTemp = devicesData.data?.filter(d =>
    d.realtimeData?.temperature !== null && d.realtimeData?.temperature !== undefined
  ) || [];

  console.log('  有温度数据的设备:', devicesWithTemp.length);
  console.log('  无温度数据的设备:', (devicesData.data?.length || 0) - devicesWithTemp.length);

  if (devicesWithTemp.length > 0) {
    console.log('\n  有温度设备的详细信息:');
    devicesWithTemp.slice(0, 5).forEach(d => {
      console.log(`    ID: ${d.id}`);
      console.log(`    温度: ${d.realtimeData?.temperature} (类型: ${typeof d.realtimeData?.temperature})`);
      console.log(`    空调状态: ${d.realtimeData?.acState}`);
      console.log(`    lastSeenAt: ${d.lastSeenAt}`);
    });
  }

  // 检查表格显示
  console.log('\n[步骤 3] 检查表格显示');
  await page.waitForTimeout(2000);

  const tableHeaders = await page.locator('.ant-table-thead th').allTextContents();
  console.log('  表头:', tableHeaders);

  // 找到有温度数据的设备，检查表格中对应的行
  if (devicesWithTemp.length > 0) {
    const firstDeviceWithTemp = devicesWithTemp[0];
    console.log('\n  检查设备:', firstDeviceWithTemp.id);

    // 搜索该设备
    const searchInput = page.locator('input[placeholder*="搜索"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill(firstDeviceWithTemp.id);
      await page.waitForTimeout(2000);

      // 检查搜索结果
      const rows = await page.locator('.ant-table-tbody tr').count();
      console.log('  搜索结果行数:', rows);

      if (rows > 0) {
        const firstRow = page.locator('.ant-table-tbody tr').first();
        const cells = await firstRow.locator('td').allTextContents();
        console.log('  第一行内容:', cells);

        // 检查温度列
        const tempIndex = tableHeaders.findIndex(h => h.includes('温度'));
        if (tempIndex >= 0) {
          console.log('  温度列值:', cells[tempIndex]);

          if (cells[tempIndex] === '-' || cells[tempIndex] === '') {
            console.log('  ✗ Bug确认: API返回温度=', firstDeviceWithTemp.realtimeData?.temperature, '但表格显示="-"');
          } else {
            console.log('  ✓ 温度正确显示:', cells[tempIndex]);
          }
        }
      }
    } else {
      console.log('  未找到搜索框，直接检查第一页数据');

      // 检查表格中是否有温度数据显示
      const tempCells = await page.locator('.ant-table-tbody td').filter({ hasNotText: '-' }).count();
      console.log('  非空单元格数:', tempCells);
    }
  }

  await page.screenshot({ path: 'test-results/diagnostic-devices.png', fullPage: true });
  console.log('\n  截图保存: test-results/diagnostic-devices.png');

  console.log('\n' + '='.repeat(80));
});