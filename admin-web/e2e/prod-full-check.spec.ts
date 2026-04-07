import { test, expect } from '@playwright/test';

const PROD_URL = 'https://www.jxbonner.cloud';
const TEST_USER = 'admin';
const TEST_PASS = 'OGhinH+f/Ey1Ysf+MRQ1qA==';

test.setTimeout(180000);

test('Production full verification', async ({ page }) => {
  console.log('\n' + '='.repeat(60));
  console.log('  生产环境全面验证测试');
  console.log('='.repeat(60) + '\n');

  // ========== 1. 登录 ==========
  console.log('[1] 登录系统...');
  await page.goto(`${PROD_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  await page.getByPlaceholder('用户名').fill(TEST_USER);
  await page.getByPlaceholder('密码').fill(TEST_PASS);

  const loginBtn = page.locator('button').filter({ hasText: /登\s*录/ });
  await loginBtn.click();

  await page.waitForURL(/dashboard|devices/, { timeout: 30000 });
  console.log('  ✓ 登录成功\n');

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // ========== 2. 仪表盘 ==========
  console.log('[2] 仪表盘统计...');
  await page.goto(`${PROD_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const statCards = await page.locator('.ant-statistic').all();
  console.log(`  统计卡片: ${statCards.length} 个`);

  for (const card of statCards) {
    try {
      const title = await card.locator('.ant-statistic-title').textContent({ timeout: 2000 });
      const value = await card.locator('.ant-statistic-content-value').textContent({ timeout: 2000 });
      console.log(`    • ${title}: ${value}`);
    } catch { /* skip */ }
  }
  console.log('');

  await page.screenshot({ path: 'test-results/01-dashboard.png', fullPage: true });

  // ========== 3. 设备管理 ==========
  console.log('[3] 设备管理...');
  await page.goto(`${PROD_URL}/devices`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const deviceRows = await page.locator('.ant-table-tbody tr').all();
  console.log(`  设备总数: ${deviceRows.length}`);

  // 检查表格内容
  if (deviceRows.length > 0) {
    const firstRow = deviceRows[0];
    const cells = await firstRow.locator('td').all();
    console.log(`  表格列数: ${cells.length}`);

    // 打印第一行的所有单元格内容
    for (let i = 0; i < cells.length; i++) {
      const text = await cells[i].textContent();
      console.log(`    列${i}: ${text?.trim().substring(0, 30)}`);
    }
  }
  console.log('');

  await page.screenshot({ path: 'test-results/02-devices.png', fullPage: true });

  // ========== 4. 设备详情 ==========
  console.log('[4] 设备详情页...');
  if (deviceRows.length > 0) {
    // 获取设备ID
    const firstRow = deviceRows[0];
    const deviceIdCell = await firstRow.locator('td').first().textContent();
    const deviceId = deviceIdCell?.trim();
    console.log(`  查看设备: ${deviceId}`);

    // 直接导航到设备详情页
    await page.goto(`${PROD_URL}/devices/${deviceId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 检查页面内容
    const pageContent = await page.textContent('body');

    // 实时数据
    const hasRealtimeSection = pageContent?.includes('实时数据') || pageContent?.includes('当前状态');
    console.log(`  实时数据区域: ${hasRealtimeSection ? '✓' : '✗'}`);

    // 检查温度值
    const tempMatch = pageContent?.match(/(\d+\.?\d*)\s*°C/);
    const hasTempValue = tempMatch && tempMatch[1] !== '--';
    console.log(`  温度数据: ${tempMatch ? tempMatch[0] : '未找到'}`);

    // 历史图表
    const hasHistory = pageContent?.includes('历史') || await page.locator('.recharts-wrapper').count() > 0;
    console.log(`  历史图表: ${hasHistory ? '✓' : '✗'}`);

    // 参数配置
    const hasParams = pageContent?.includes('参数');
    console.log(`  参数配置: ${hasParams ? '✓' : '✗'}`);

    // 设备控制
    const hasControl = pageContent?.includes('控制') || await page.locator('button:has-text("开启")').count() > 0;
    console.log(`  设备控制: ${hasControl ? '✓' : '✗'}`);

    await page.screenshot({ path: 'test-results/03-device-detail.png', fullPage: true });
  }
  console.log('');

  // ========== 5. 告警管理 ==========
  console.log('[5] 告警管理...');
  await page.goto(`${PROD_URL}/alarms`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const alarmRows = await page.locator('.ant-table-tbody tr').all();
  console.log(`  告警记录: ${alarmRows.length} 条`);

  const statusFilter = page.locator('.ant-select').first();
  const hasFilter = await statusFilter.count() > 0;
  console.log(`  状态筛选: ${hasFilter ? '✓' : '✗'}`);

  await page.screenshot({ path: 'test-results/04-alarms.png', fullPage: true });
  console.log('');

  // ========== 6. 统计分析 ==========
  console.log('[6] 统计分析...');
  await page.goto(`${PROD_URL}/stats`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const deviceSelector = page.locator('.ant-select');
  const hasDeviceSelector = await deviceSelector.count() > 0;
  console.log(`  设备选择器: ${hasDeviceSelector ? '✓' : '✗'}`);

  const trendChart = page.locator('.recharts-wrapper');
  const hasTrend = await trendChart.count() > 0;
  console.log(`  趋势图表: ${hasTrend ? '✓' : '✗'}`);

  await page.screenshot({ path: 'test-results/05-stats.png', fullPage: true });
  console.log('');

  // ========== 7. 层级管理 ==========
  console.log('[7] 层级管理...');

  await page.goto(`${PROD_URL}/customers`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const customerCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`  客户数量: ${customerCount}`);

  await page.goto(`${PROD_URL}/zones`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const zoneCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`  分区数量: ${zoneCount}`);

  await page.goto(`${PROD_URL}/groups`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const groupCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`  分组数量: ${groupCount}`);
  console.log('');

  // ========== 8. 用户管理 ==========
  console.log('[8] 用户管理...');
  await page.goto(`${PROD_URL}/users`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  const userCount = await page.locator('.ant-table-tbody tr').count();
  console.log(`  用户数量: ${userCount}`);
  console.log('');

  // ========== 总结 ==========
  console.log('='.repeat(60));
  console.log('  测试完成');
  console.log('='.repeat(60));
  console.log('\n截图保存在 test-results/ 目录\n');
});